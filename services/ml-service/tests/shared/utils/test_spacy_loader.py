import pytest
from app.shared.utils.spacy_loader import get_nlp

def test_get_nlp_singleton():
    """Verify get_nlp returns the same instance on multiple calls."""
    nlp1 = get_nlp()
    nlp2 = get_nlp()
    
    assert nlp1 is not None
    assert nlp2 is not None
    assert nlp1 is nlp2  # Same object reference
    
    # Verify it's the correct model
    assert nlp1.meta["lang"] == "en"
    assert nlp1.meta["name"] == "core_web_sm"
