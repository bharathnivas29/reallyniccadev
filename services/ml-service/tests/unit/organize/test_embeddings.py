import pytest
from unittest.mock import Mock, patch, MagicMock
from app.features.organize.services.embedding_service import EmbeddingService

class TestEmbeddingService:
    @pytest.fixture
    def mock_gemini_client(self):
        with patch("app.features.organize.services.embedding_service.GeminiClient") as MockClient:
            mock_instance = MockClient.return_value
            mock_instance.model = MagicMock()
            yield mock_instance

    def test_generate_embeddings_success(self, mock_gemini_client):
        # Setup mock to return embeddings as a list
        mock_gemini_client._call_with_retry.return_value = [
            [0.1] * 768,
            [0.2] * 768
        ]
        
        service = EmbeddingService()
        texts = ["Hello", "World"]
        embeddings = service.generate_embeddings(texts)

        # Verify
        assert len(embeddings) == 2
        assert embeddings[0] is not None
        assert embeddings[1] is not None
        assert len(embeddings[0]) == 768
        assert len(embeddings[1]) == 768

    def test_generate_embeddings_failure_handling(self, mock_gemini_client):
        # Setup mock to raise exception
        mock_gemini_client._call_with_retry.side_effect = Exception("API Error")

        service = EmbeddingService()
        texts = ["Hello"]
        embeddings = service.generate_embeddings(texts)

        # Verify - should return None for failed items
        assert len(embeddings) == 1
        assert embeddings[0] is None

    def test_validate_embedding(self, mock_gemini_client):
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
