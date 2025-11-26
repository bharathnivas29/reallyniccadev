import pytest
from unittest.mock import MagicMock, patch
from app.features.organize.services.entity_extractor import extract_entities_with_gemini
from app.features.organize.schemas.extract import ExtractedEntity

def test_hybrid_extractor_with_gemini():
    """Test hybrid extraction with mocked Gemini API."""
    text_chunks = [
        "Google released Gemini 1.5 Pro yesterday. Python is a popular language for Machine Learning."
    ]
    doc_id = "test_hybrid"
    
    # Mock Gemini response
    mock_gemini_response = MagicMock()
    mock_gemini_response.text = '''
    {
      "entities": [
        {"name": "Google", "type": "ORGANIZATION", "confidence": 0.99},
        {"name": "Gemini 1.5 Pro", "type": "CONCEPT", "confidence": 0.95},
        {"name": "Python", "type": "CONCEPT", "confidence": 0.97},
        {"name": "Machine Learning", "type": "CONCEPT", "confidence": 0.96}
      ]
    }
    '''
    
    with patch('app.shared.utils.gemini_client.GeminiClient') as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.model = MagicMock()
        mock_instance.model.generate_content.return_value = mock_gemini_response
        mock_instance._call_with_retry = lambda func, *args, **kwargs: func(*args, **kwargs)
        
        entities = extract_entities_with_gemini(text_chunks, doc_id, use_gemini=True)
        
        print(f"\n✅ Extracted {len(entities)} entities:")
        for ent in entities:
            print(f"  • {ent.name:30} ({ent.type:15}) [confidence: {ent.confidence}]")
        
        # Verify we got entities
        assert len(entities) > 0
        
        # Check for key entities
        entity_names = [e.name for e in entities]
        assert "Google" in entity_names
        assert "Gemini 1.5 Pro" in entity_names or "Python" in entity_names

def test_hybrid_extractor_fallback():
    """Test fallback to spaCy when Gemini fails."""
    text_chunks = ["Google released a new product in 2024. Microsoft Azure competes with AWS."]
    doc_id = "test_fallback"
    
    with patch('app.shared.utils.gemini_client.GeminiClient') as MockClient:
        mock_instance = MockClient.return_value
        mock_instance.model = None  # Simulate Gemini unavailable
        
        entities = extract_entities_with_gemini(text_chunks, doc_id, use_gemini=True)
        
        print(f"\n✅ Fallback test: Extracted {len(entities)} entities (spaCy only)")
        for ent in entities:
            print(f"  • {ent.name:30} ({ent.type:15}) [confidence: {ent.confidence}]")
        
        # Should still get spaCy entities (Google, Microsoft, AWS, 2024)
        assert len(entities) >= 2  # At least a couple entities

def test_hybrid_extractor_gemini_disabled():
    """Test with Gemini explicitly disabled."""
    text_chunks = ["Test text"]
    doc_id = "test_disabled"
    
    entities = extract_entities_with_gemini(text_chunks, doc_id, use_gemini=False)
    
    print(f"\n✅ Gemini disabled: Extracted {len(entities)} entities")
    # Should work without errors
    assert isinstance(entities, list)
