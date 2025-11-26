import pytest
from app.features.organize.schemas.extract import ExtractedEntity, EntitySourceSnippet
from app.features.organize.services.deduplication_engine import (
    should_merge,
    deduplicate_entities
)

# Helper to create test entities
def create_entity(name: str, entity_type: str = "CONCEPT", confidence: float = 0.8) -> ExtractedEntity:
    """Helper to create test entities."""
    return ExtractedEntity(
        name=name,
        type=entity_type,
        confidence=confidence,
        sources=[EntitySourceSnippet(docId="test", snippet=f"Context for {name}", chunkIndex=0)],
        aliases=[]
    )

# Test should_merge
def test_should_merge_same_type_high_string_similarity():
    """Test merging with high string similarity."""
    e1 = create_entity("AI", "CONCEPT")
    e2 = create_entity("A.I.", "CONCEPT")
    
    assert should_merge(e1, e2, None, None) is True

def test_should_merge_different_types():
    """Test that different types never merge."""
    e1 = create_entity("Apple", "ORGANIZATION")
    e2 = create_entity("Apple", "CONCEPT")  # Different type
    
    assert should_merge(e1, e2, None, None) is False

def test_should_merge_abbreviation():
    """Test merging with abbreviation detection."""
    e1 = create_entity("AI", "CONCEPT")
    e2 = create_entity("Artificial Intelligence", "CONCEPT")
    
    assert should_merge(e1, e2, None, None) is True

def test_should_merge_with_embeddings():
    """Test merging with high cosine similarity."""
    e1 = create_entity("AI", "CONCEPT")
    e2 = create_entity("Artificial Intelligence", "CONCEPT")
    
    # Similar embeddings (cosine sim > 0.90)
    emb1 = [1.0, 0.0, 0.0]
    emb2 = [0.95, 0.05, 0.0]  # Very similar direction
    
    assert should_merge(e1, e2, emb1, emb2) is True

def test_should_merge_low_similarity():
    """Test that low similarity doesn't merge."""
    e1 = create_entity("AI", "CONCEPT")
    e2 = create_entity("Machine Learning", "CONCEPT")
    
    # Different embeddings
    emb1 = [1.0, 0.0]
    emb2 = [0.0, 1.0]
    
    assert should_merge(e1, e2, emb1, emb2) is False

# Test deduplicate_entities
def test_deduplicate_entities_basic():
    """Test basic deduplication."""
    entities = [
        create_entity("AI", "CONCEPT", 0.8),
        create_entity("A.I.", "CONCEPT", 0.85),
        create_entity("ML", "CONCEPT", 0.9),
    ]
    embeddings = [None, None, None]
    
    result = deduplicate_entities(entities, embeddings)
    
    # AI and A.I. should merge, ML stays separate
    assert len(result) == 2
    
    # Find the AI entity
    ai_entity = next(e for e in result if e.name == "AI")
    assert "A.I." in ai_entity.aliases or ai_entity.name == "A.I."

def test_deduplicate_entities_abbreviations():
    """Test deduplication with abbreviations."""
    entities = [
        create_entity("AI", "CONCEPT", 0.8),
        create_entity("Artificial Intelligence", "CONCEPT", 0.85),
        create_entity("ML", "CONCEPT", 0.9),
        create_entity("Machine Learning", "CONCEPT", 0.88),
    ]
    embeddings = [None, None, None, None]
    
    result = deduplicate_entities(entities, embeddings)
    
    # Should have 2 groups: AI group and ML group
    assert len(result) == 2
    
    # Check aliases
    for entity in result:
        if entity.name in ["AI", "Artificial Intelligence"]:
            # Should have the other as alias
            assert len(entity.aliases) >= 1
        elif entity.name in ["ML", "Machine Learning"]:
            # Should have the other as alias
            assert len(entity.aliases) >= 1

def test_deduplicate_entities_different_types():
    """Test that different types don't merge."""
    entities = [
        create_entity("Apple", "ORGANIZATION", 0.9),
        create_entity("Apple", "CONCEPT", 0.85),  # Same name, different type
    ]
    embeddings = [None, None]
    
    result = deduplicate_entities(entities, embeddings)
    
    # Should NOT merge (different types)
    assert len(result) == 2

def test_deduplicate_entities_confidence_averaging():
    """Test that confidence scores are averaged."""
    entities = [
        create_entity("AI", "CONCEPT", 0.8),
        create_entity("A.I.", "CONCEPT", 0.9),
    ]
    embeddings = [None, None]
    
    result = deduplicate_entities(entities, embeddings)
    
    assert len(result) == 1
    # Confidence should be average of 0.8 and 0.9 = 0.85
    assert abs(result[0].confidence - 0.85) < 0.01

def test_deduplicate_entities_sources_merged():
    """Test that sources are merged."""
    e1 = ExtractedEntity(
        name="AI",
        type="CONCEPT",
        confidence=0.8,
        sources=[EntitySourceSnippet(docId="doc1", snippet="AI is cool", chunkIndex=0)],
        aliases=[]
    )
    e2 = ExtractedEntity(
        name="A.I.",
        type="CONCEPT",
        confidence=0.9,
        sources=[EntitySourceSnippet(docId="doc2", snippet="A.I. is awesome", chunkIndex=1)],
        aliases=[]
    )
    
    result = deduplicate_entities([e1, e2], [None, None])
    
    assert len(result) == 1
    # Should have sources from both
    assert len(result[0].sources) == 2

def test_deduplicate_entities_empty():
    """Test with empty input."""
    result = deduplicate_entities([], [])
    assert len(result) == 0

def test_deduplicate_entities_length_mismatch():
    """Test error on length mismatch."""
    entities = [create_entity("AI", "CONCEPT")]
    embeddings = [None, None]  # Wrong length
    
    with pytest.raises(ValueError, match="same length"):
        deduplicate_entities(entities, embeddings)
