import pytest
from app.features.organize.services.entity_extractor import extract_entities_spacy

def test_extract_entities_biology():
    """Verify entity extraction from biology text."""
    text_chunks = [
        "CRISPR-Cas9 is a revolutionary gene-editing technology.",
        "Jennifer Doudna and Emmanuelle Charpentier received the Nobel Prize in Chemistry for this discovery.",
        "The technique allows for precise editing of DNA in living organisms."
    ]
    doc_id = "bio_doc_1"
    
    entities = extract_entities_spacy(text_chunks, doc_id)
    
    print("\n--- Extracted Entities (Biology) ---")
    for entity in entities:
        print(f"Name: {entity.name}, Type: {entity.type}, Confidence: {entity.confidence:.2f}")
        
    # Assertions based on expected spaCy behavior (which might be imperfect for "CRISPR")
    # "Jennifer Doudna" -> PERSON
    doudna = next((e for e in entities if "Doudna" in e.name), None)
    assert doudna is not None
    assert doudna.type == "PERSON"
    
    # "Nobel Prize" -> WORK_OF_ART or EVENT -> PAPER or CONCEPT (depending on mapping)
    # Actually spaCy often tags "Nobel Prize" as WORK_OF_ART or EVENT
    nobel = next((e for e in entities if "Nobel" in e.name), None)
    if nobel:
        print(f"Found Nobel Prize as: {nobel.type}")

if __name__ == "__main__":
    # Allow running directly to see output
    test_extract_entities_biology()
