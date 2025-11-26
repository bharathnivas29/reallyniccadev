import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.features.organize.schemas.extract import ExtractedEntity, ExtractedRelationship

client = TestClient(app)

@pytest.fixture
def mock_gemini_client():
    with patch("app.features.organize.routes.GeminiClient") as mock:
        yield mock

@pytest.fixture
def mock_extract_entities():
    with patch("app.features.organize.routes.extract_entities_with_gemini") as mock:
        yield mock

@pytest.fixture
def mock_embedding_service():
    with patch("app.features.organize.routes.EmbeddingService") as mock:
        yield mock

def test_extract_endpoint_with_relationships(
    mock_extract_entities,
    mock_embedding_service,
    mock_gemini_client
):
    # 1. Mock Entity Extraction
    # 1. Mock Entity Extraction
    from app.features.organize.schemas.extract import EntitySourceSnippet
    
    mock_extract_entities.return_value = [
        ExtractedEntity(
            name="Elon Musk", 
            type="PERSON", 
            confidence=0.99, 
            sources=[
                EntitySourceSnippet(docId="test_doc_1", snippet="Elon Musk is the CEO of Tesla.", chunkIndex=0),
                EntitySourceSnippet(docId="test_doc_1", snippet="Elon Musk founded SpaceX in 2002.", chunkIndex=1)
            ], 
            aliases=[]
        ),
        ExtractedEntity(
            name="Tesla", 
            type="ORGANIZATION", 
            confidence=0.99, 
            sources=[
                EntitySourceSnippet(docId="test_doc_1", snippet="Elon Musk is the CEO of Tesla.", chunkIndex=0)
            ], 
            aliases=[]
        ),
        ExtractedEntity(
            name="SpaceX", 
            type="ORGANIZATION", 
            confidence=0.99, 
            sources=[
                EntitySourceSnippet(docId="test_doc_1", snippet="Elon Musk founded SpaceX in 2002.", chunkIndex=1)
            ], 
            aliases=[]
        )
    ]

    # 2. Mock Embeddings (return orthogonal vectors to avoid deduplication)
    mock_embedding_instance = mock_embedding_service.return_value
    mock_embedding_instance.generate_embeddings.return_value = [
        [1.0] + [0.0] * 767,
        [0.0, 1.0] + [0.0] * 766,
        [0.0, 0.0, 1.0] + [0.0] * 765
    ]

    # 3. Mock Gemini Relationship Classification
    mock_gemini_instance = mock_gemini_client.return_value
    mock_gemini_instance.classify_relationship.side_effect = [
        {"type": "ceo_of", "confidence": 0.95},
        {"type": "founded", "confidence": 0.90}
    ]

    # 4. Input Data (Text that would generate co-occurrences)
    payload = {
        "textChunks": [
            "Elon Musk is the CEO of Tesla.",
            "Elon Musk founded SpaceX in 2002."
        ],
        "docId": "test_doc_1"
    }

    # 5. Call Endpoint
    response = client.post("/organize/extract", json=payload)

    # 6. Verify Response
    assert response.status_code == 200
    data = response.json()
    
    # Check Entities
    assert len(data["entities"]) == 3
    entity_names = {e["name"] for e in data["entities"]}
    assert "Elon Musk" in entity_names
    assert "Tesla" in entity_names
    
    # Check Relationships
    # Note: Co-occurrence depends on the actual text chunks and entity finding. 
    # Since we mocked extract_entities, the co-occurrence detector will look for "Elon Musk", "Tesla" in the text chunks.
    # "Elon Musk" is in chunk 0 and 1. "Tesla" is in chunk 0. "SpaceX" is in chunk 1.
    # Expected: (Elon Musk, Tesla) in chunk 0. (Elon Musk, SpaceX) in chunk 1.
    
    relationships = data["relationships"]
    assert len(relationships) >= 2
    
    # Verify Classification happened
    # We can't guarantee order, so check existence
    types = {r["relationType"] for r in relationships}
    assert "ceo_of" in types or "founded" in types
    
    # Verify Gemini was called
    assert mock_gemini_instance.classify_relationship.called
