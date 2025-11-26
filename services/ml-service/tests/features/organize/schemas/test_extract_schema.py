import pytest
from pydantic import ValidationError
from app.features.organize.schemas.extract import (
    ExtractRequest, 
    ExtractedEntity, 
    ExtractedRelationship, 
    EntitySourceSnippet,
    ExtractResponse
)

def test_extract_request_valid():
    """Verify valid request payload."""
    payload = {
        "textChunks": ["Chunk 1", "Chunk 2"],
        "docId": "doc_123"
    }
    req = ExtractRequest(**payload)
    assert req.textChunks == ["Chunk 1", "Chunk 2"]
    assert req.docId == "doc_123"

def test_extract_request_invalid():
    """Verify invalid request payload (missing required field)."""
    payload = {
        "docId": "doc_123"
        # Missing textChunks
    }
    with pytest.raises(ValidationError):
        ExtractRequest(**payload)

def test_extracted_entity_valid():
    """Verify valid entity model."""
    source = EntitySourceSnippet(docId="d1", snippet="test", chunkIndex=0)
    entity = ExtractedEntity(
        name="Test Entity",
        type="PERSON",
        confidence=0.95,
        sources=[source],
        aliases=["Test"]
    )
    assert entity.name == "Test Entity"
    assert entity.type == "PERSON"

def test_extracted_entity_invalid_type():
    """Verify invalid entity type."""
    source = EntitySourceSnippet(docId="d1", snippet="test", chunkIndex=0)
    payload = {
        "name": "Test",
        "type": "INVALID_TYPE", # Should fail
        "confidence": 0.9,
        "sources": [source]
    }
    with pytest.raises(ValidationError):
        ExtractedEntity(**payload)

def test_extracted_relationship_valid():
    """Verify valid relationship model."""
    rel = ExtractedRelationship(
        sourceEntity="A",
        targetEntity="B",
        type="semantic",
        weight=0.8,
        confidence=0.9
    )
    assert rel.type == "semantic"
    assert rel.weight == 0.8

def test_extract_response_structure():
    """Verify full response structure."""
    source = EntitySourceSnippet(docId="d1", snippet="s", chunkIndex=0)
    entity = ExtractedEntity(name="E1", type="CONCEPT", confidence=0.8, sources=[source])
    
    resp = ExtractResponse(
        entities=[entity],
        relationships=[]
    )
    assert len(resp.entities) == 1
    assert len(resp.relationships) == 0
