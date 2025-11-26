import pytest
from app.features.organize.services.entity_extractor import extract_entities_spacy

def test_extract_entities_biology():
    """Verify entity extraction for Biology domain."""
    text = [
        "CRISPR-Cas9 is a gene-editing tool.",
        "Jennifer Doudna won the Nobel Prize for Chemistry.",
        "DNA replication occurs in the nucleus."
    ]
    doc_id = "bio_001"
    entities = extract_entities_spacy(text, doc_id)
    
    print("\n[Biology] Extracted:", [e.name for e in entities])
    
    # Check for expected entities
    names = [e.name for e in entities]
    assert "Jennifer Doudna" in names
    # "Nobel Prize" might be WORK_OF_ART or EVENT, mapped to PAPER or CONCEPT
    assert any("Nobel" in name for name in names)

def test_extract_entities_tech():
    """Verify entity extraction for Technology domain."""
    text = [
        "Google released Gemini 1.5 Pro yesterday.",
        "Python is a popular language for Machine Learning.",
        "Microsoft Azure competes with AWS in cloud computing."
    ]
    doc_id = "tech_001"
    entities = extract_entities_spacy(text, doc_id)
    
    print("\n[Tech] Extracted:", [e.name for e in entities])
    
    names = [e.name for e in entities]
    assert "Google" in names
    assert "Python" in names or "Gemini" in names # spaCy might miss Gemini as it's new, but should get Google/Python
    assert "Microsoft Azure" in names or "Microsoft" in names

def test_extract_entities_marketing():
    """Verify entity extraction for Marketing domain."""
    text = [
        "SEO strategies improve ROI for B2B companies.",
        "Nike launched a new campaign with Michael Jordan.",
        "Content marketing drives organic traffic."
    ]
    doc_id = "mkt_001"
    entities = extract_entities_spacy(text, doc_id)
    
    print("\n[Marketing] Extracted:", [e.name for e in entities])
    
    names = [e.name for e in entities]
    assert "Nike" in names
    assert "Michael Jordan" in names
    # SEO/ROI might be missed by standard spaCy model without custom training or Gemini, 
    # but let's see what it catches (likely ORG or nothing)
