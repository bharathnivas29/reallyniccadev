import pytest
from app.features.organize.schemas.extract import ExtractedEntity, EntitySourceSnippet
from app.features.organize.services.relationship_classifier import RelationshipClassifier

# Helper to create test entities
def create_entity(name: str, chunk_indices: list) -> ExtractedEntity:
    sources = [
        EntitySourceSnippet(docId="test", snippet="...", chunkIndex=idx)
        for idx in chunk_indices
    ]
    return ExtractedEntity(
        name=name,
        type="CONCEPT",
        confidence=0.9,
        sources=sources,
        aliases=[]
    )

@pytest.fixture
def classifier():
    return RelationshipClassifier()

def test_find_entity_occurrences(classifier):
    """Test mapping entities to chunk indices."""
    entities = [
        create_entity("A", [0, 1]),
        create_entity("B", [1, 2]),
        create_entity("C", [0])
    ]
    
    occurrences = classifier.find_entity_occurrences([], entities)
    
    assert occurrences["A"] == {0, 1}
    assert occurrences["B"] == {1, 2}
    assert occurrences["C"] == {0}

def test_calculate_cooccurrence_weight(classifier):
    """Test weight calculation formula."""
    # Case 1: Perfect overlap
    # A: {1, 2}, B: {1, 2} -> shared {1, 2} -> 2 / min(2, 2) = 1.0
    w1 = classifier.calculate_cooccurrence_weight({1, 2}, {1, 2})
    assert w1 == 1.0
    
    # Case 2: Partial overlap
    # A: {0, 1, 2}, B: {1, 2, 3, 4} -> shared {1, 2} -> 2 / min(3, 4) = 2/3 = 0.66...
    w2 = classifier.calculate_cooccurrence_weight({0, 1, 2}, {1, 2, 3, 4})
    assert abs(w2 - 0.666) < 0.01
    
    # Case 3: No overlap
    w3 = classifier.calculate_cooccurrence_weight({0}, {1})
    assert w3 == 0.0
    
    # Case 4: Subset (Small entity fully contained in large entity's chunks)
    # A: {1}, B: {0, 1, 2} -> shared {1} -> 1 / min(1, 3) = 1.0
    # This ensures strong relationship even if one entity is rare
    w4 = classifier.calculate_cooccurrence_weight({1}, {0, 1, 2})
    assert w4 == 1.0

def test_build_cooccurrence_relationships(classifier):
    """Test building relationships from entities."""
    text_chunks = ["Chunk 0", "Chunk 1", "Chunk 2"]
    entities = [
        create_entity("A", [0, 1]), # In chunks 0 and 1
        create_entity("B", [1, 2]), # In chunks 1 and 2
        create_entity("C", [0])     # In chunk 0
    ]
    
    # Expected:
    # A-B: share chunk 1. Weight = 1 / min(2, 2) = 0.5
    # A-C: share chunk 0. Weight = 1 / min(2, 1) = 1.0
    # B-C: no shared chunks. Weight = 0.0
    
    rels = classifier.build_cooccurrence_relationships(text_chunks, entities, min_weight=0.3)
    
    assert len(rels) == 2
    
    # Check A-B relationship
    ab = next((r for r in rels if (r.sourceEntity == "A" and r.targetEntity == "B") or (r.sourceEntity == "B" and r.targetEntity == "A")), None)
    assert ab is not None
    assert ab.weight == 0.5
    assert "Chunk 1" in ab.examples
    
    # Check A-C relationship
    ac = next((r for r in rels if (r.sourceEntity == "A" and r.targetEntity == "C") or (r.sourceEntity == "C" and r.targetEntity == "A")), None)
    assert ac is not None
    assert ac.weight == 1.0
    assert "Chunk 0" in ac.examples

def test_build_relationships_threshold(classifier):
    """Test filtering by min_weight."""
    text_chunks = ["Chunk 0", "Chunk 1", "Chunk 2", "Chunk 3"]
    entities = [
        create_entity("A", [0, 1, 2, 3]),
        create_entity("B", [0])
    ]
    
    # Shared: {0}. Weight = 1 / min(4, 1) = 1.0. Should pass.
    rels = classifier.build_cooccurrence_relationships(text_chunks, entities, min_weight=0.5)
    assert len(rels) == 1
    
    # Now test a weak relationship
    # A: {0, 1, 2, 3}, C: {0, 4, 5, 6} -> shared {0} -> 1 / min(4, 4) = 0.25
    entities.append(create_entity("C", [0, 4, 5, 6]))
    
    # With threshold 0.3, A-C (0.25) should be filtered out
    rels = classifier.build_cooccurrence_relationships(text_chunks, entities, min_weight=0.3)
    
    # Should still only have A-B (and maybe B-C? B:{0}, C:{0...} -> 1/1=1.0)
    # B-C share chunk 0. Weight = 1 / min(1, 4) = 1.0. So B-C should exist.
    # A-C should NOT exist.
    
    pairs = set()
    for r in rels:
        pairs.add(tuple(sorted([r.sourceEntity, r.targetEntity])))
        
    assert ("A", "B") in pairs
    assert ("B", "C") in pairs
    assert ("A", "C") not in pairs
