import pytest
from app.features.organize.services.entity_extractor import extract_entities_spacy
from app.features.organize.schemas.extract import ExtractedEntity

def test_extract_entities_spacy_basic():
    """Verify basic entity extraction from simple text."""
    text_chunks = [
        "Einstein developed the theory of relativity.",
        "Albert Einstein won the Nobel Prize in Physics."
    ]
    doc_id = "test_doc_1"
    
    entities = extract_entities_spacy(text_chunks, doc_id)
    
    # Check if entities were found
    assert len(entities) > 0
    
    # Find Einstein
    einstein = next((e for e in entities if "Einstein" in e.name), None)
    assert einstein is not None
    assert einstein.type == "PERSON"
    assert einstein.confidence > 0.6
    
    # Check source tracking
    # "Einstein" appears in both chunks (or variations of it)
    # Note: exact behavior depends on deduplication logic which merges by exact name match
    # "Einstein" and "Albert Einstein" might be separate entities initially
    
    albert = next((e for e in entities if e.name == "Albert Einstein"), None)
    assert albert is not None
    assert albert.type == "PERSON"
    assert len(albert.sources) == 1
    assert albert.sources[0].docId == doc_id
    assert "Nobel Prize" in albert.sources[0].snippet

def test_extract_entities_spacy_types():
    """Verify mapping of different entity types."""
    text_chunks = ["Apple Inc. is located in California."]
    doc_id = "test_doc_2"
    
    entities = extract_entities_spacy(text_chunks, doc_id)
    
    # Apple Inc. -> ORG -> ORGANIZATION
    org = next((e for e in entities if "Apple" in e.name), None)
    assert org is not None
    assert org.type == "ORGANIZATION"
    
    # California -> GPE -> LOCATION (updated mapping)
    loc = next((e for e in entities if "California" in e.name), None)
    assert loc is not None
    assert loc.type == "LOCATION"

def test_extract_entities_deduplication_in_chunk():
    """Verify that identical entities in the same chunk are merged."""
    text_chunks = ["Paris is beautiful. I love Paris."]
    doc_id = "test_doc_3"
    
    entities = extract_entities_spacy(text_chunks, doc_id)
    
    paris = next((e for e in entities if e.name == "Paris"), None)
    assert paris is not None
    # Should be one entity object
    assert len([e for e in entities if e.name == "Paris"]) == 1
    # Should have 2 sources (or 1 if logic merges sources too, but current logic appends)
    assert len(paris.sources) == 2
