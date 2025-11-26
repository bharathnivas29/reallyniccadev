import pytest
from unittest.mock import MagicMock, patch
from app.features.organize.services.embedding_service import EmbeddingService

def test_embedding_service_init():
    """Test EmbeddingService initialization."""
    service = EmbeddingService()
    assert service.BATCH_SIZE == 10
    assert service.EMBEDDING_DIMENSIONS == 768

def test_generate_embeddings_success():
    """Test successful embedding generation."""
    # Mock successful response - returns list of embeddings
    mock_embeddings = [
        [0.1] * 768,  # First embedding
        [0.2] * 768,  # Second embedding
    ]
    
    with patch('app.features.organize.services.embedding_service.GeminiClient') as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.model = MagicMock()
        mock_instance._call_with_retry = MagicMock(return_value=mock_embeddings)
        
        service = EmbeddingService()
        texts = ["AI", "Machine Learning"]
        embeddings = service.generate_embeddings(texts)
        
        assert len(embeddings) == 2
        assert embeddings[0] is not None
        assert embeddings[1] is not None
        assert len(embeddings[0]) == 768
        assert len(embeddings[1]) == 768

def test_generate_embeddings_failure():
    """Test embedding generation with API failure."""
    with patch('app.features.organize.services.embedding_service.GeminiClient') as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.model = MagicMock()
        mock_instance._call_with_retry = MagicMock(side_effect=Exception("API Error"))
        
        service = EmbeddingService()
        texts = ["AI", "ML"]
        embeddings = service.generate_embeddings(texts)
        
        # Should return None for failed embeddings (NO zero vectors)
        assert len(embeddings) == 2
        assert embeddings[0] is None
        assert embeddings[1] is None

def test_generate_embeddings_batch_processing():
    """Test batch processing with >10 texts."""
    # Mock response for batches - returns list of embeddings
    def mock_embed(*args, **kwargs):
        content = kwargs.get('content', [])
        return [[0.1] * 768 for _ in content]
    
    with patch('app.features.organize.services.embedding_service.GeminiClient') as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.model = MagicMock()
        mock_instance._call_with_retry = MagicMock(side_effect=mock_embed)
        
        service = EmbeddingService()
        texts = [f"text_{i}" for i in range(25)]  # 25 texts = 3 batches
        embeddings = service.generate_embeddings(texts)
        
        assert len(embeddings) == 25
        # All should succeed
        assert all(e is not None for e in embeddings)

def test_validate_embedding():
    """Test embedding validation."""
    with patch('app.features.organize.services.embedding_service.GeminiClient'):
        service = EmbeddingService()
        
        # Valid embedding
        valid = [0.1] * 768
        assert service.validate_embedding(valid) is True
        
        # None
        assert service.validate_embedding(None) is False
        
        # Wrong dimensions
        invalid = [0.1] * 512
        assert service.validate_embedding(invalid) is False
        
        # Not a list
        assert service.validate_embedding("not a list") is False
