import pytest
from unittest.mock import MagicMock, patch
from app.shared.utils.gemini_client import GeminiClient
from google.api_core import exceptions

def test_gemini_client_init_no_key():
    """Verify initialization handles missing API key gracefully."""
    with patch.dict('os.environ', {}, clear=True):
        client = GeminiClient(api_key=None)
        assert client.model is None

def test_gemini_client_init_with_key():
    """Verify initialization with API key."""
    with patch('google.generativeai.configure') as mock_config:
        with patch('google.generativeai.GenerativeModel') as mock_model:
            client = GeminiClient(api_key="test_key")
            mock_config.assert_called_with(api_key="test_key")
            assert client.model is not None

def test_call_with_retry_success():
    """Verify retry logic succeeds on first try."""
    client = GeminiClient(api_key="test")
    mock_func = MagicMock(return_value="success")
    
    result = client._call_with_retry(mock_func)
    assert result == "success"
    assert mock_func.call_count == 1

def test_call_with_retry_fail_then_success():
    """Verify retry logic handles transient errors."""
    client = GeminiClient(api_key="test")
    mock_func = MagicMock(side_effect=[
        exceptions.ResourceExhausted("Rate limit"),
        "success"
    ])
    
    # Patch time.sleep to speed up test
    with patch('time.sleep'):
        result = client._call_with_retry(mock_func)
        assert result == "success"
        assert mock_func.call_count == 2

def test_call_with_retry_max_retries():
    """Verify retry logic gives up after max retries."""
    client = GeminiClient(api_key="test")
    mock_func = MagicMock(side_effect=exceptions.ServiceUnavailable("Down"))
    
    with patch('time.sleep'):
        with pytest.raises(Exception) as excinfo:
            client._call_with_retry(mock_func)
        assert "failed after 3 retries" in str(excinfo.value)
        assert mock_func.call_count == 3
