import pytest
from app.shared.utils.similarity import (
    normalize_text,
    string_similarity,
    cosine_similarity,
    is_abbreviation
)

# Test normalize_text
def test_normalize_text():
    """Test text normalization."""
    assert normalize_text("A.I.") == "ai"
    assert normalize_text("Machine Learning!") == "machine learning"
    assert normalize_text("GPT-4") == "gpt4"
    assert normalize_text("  Hello World  ") == "hello world"

def test_normalize_text_empty():
    """Test normalization with empty string."""
    assert normalize_text("") == ""
    assert normalize_text("   ") == ""

# Test string_similarity
def test_string_similarity_identical():
    """Test similarity of identical strings."""
    assert string_similarity("AI", "AI") == 1.0
    assert string_similarity("ai", "AI") == 1.0  # Case insensitive

def test_string_similarity_with_punctuation():
    """Test similarity with punctuation."""
    # "AI" vs "A.I." -> normalized to "ai" vs "ai"
    sim = string_similarity("AI", "A.I.")
    assert sim > 0.6  # Should be similar after normalization

def test_string_similarity_different():
    """Test similarity of different strings."""
    sim = string_similarity("AI", "Machine Learning")
    assert sim < 0.5  # Should be low

def test_string_similarity_partial():
    """Test partial similarity."""
    sim = string_similarity("Artificial Intelligence", "Artificial")
    assert 0.5 < sim < 1.0  # Partial match

# Test cosine_similarity
def test_cosine_similarity_identical():
    """Test cosine similarity of identical vectors."""
    assert cosine_similarity([1, 0, 0], [1, 0, 0]) == 1.0
    assert cosine_similarity([1, 2, 3], [1, 2, 3]) == 1.0

def test_cosine_similarity_orthogonal():
    """Test cosine similarity of orthogonal vectors."""
    assert cosine_similarity([1, 0], [0, 1]) == 0.0

def test_cosine_similarity_opposite():
    """Test cosine similarity of opposite vectors."""
    assert cosine_similarity([1, 0], [-1, 0]) == -1.0

def test_cosine_similarity_high():
    """Test high cosine similarity."""
    # Vectors pointing in similar direction
    sim = cosine_similarity([1, 1], [1.1, 0.9])
    assert sim > 0.95

def test_cosine_similarity_dimension_mismatch():
    """Test error on dimension mismatch."""
    with pytest.raises(ValueError, match="same dimensions"):
        cosine_similarity([1, 2], [1, 2, 3])

def test_cosine_similarity_empty():
    """Test error on empty vectors."""
    with pytest.raises(ValueError, match="cannot be empty"):
        cosine_similarity([], [])

def test_cosine_similarity_zero_vector():
    """Test zero vector handling."""
    assert cosine_similarity([0, 0], [1, 1]) == 0.0

# Test is_abbreviation
def test_is_abbreviation_true():
    """Test abbreviation detection."""
    assert is_abbreviation("AI", "Artificial Intelligence") is True
    assert is_abbreviation("ML", "Machine Learning") is True
    assert is_abbreviation("GPT", "Generative Pre-trained Transformer") is True

def test_is_abbreviation_case_insensitive():
    """Test case insensitivity."""
    assert is_abbreviation("ai", "Artificial Intelligence") is True
    assert is_abbreviation("AI", "artificial intelligence") is True

def test_is_abbreviation_with_punctuation():
    """Test with punctuation."""
    assert is_abbreviation("A.I.", "Artificial Intelligence") is True

def test_is_abbreviation_too_long():
    """Test that long strings are not abbreviations."""
    assert is_abbreviation("Python", "Python Programming") is False
    assert is_abbreviation("Machine", "Machine Learning") is False

def test_is_abbreviation_not_contained():
    """Test when short is not in long."""
    assert is_abbreviation("XYZ", "Artificial Intelligence") is False

def test_is_abbreviation_max_length():
    """Test custom max length."""
    assert is_abbreviation("ABC", "ABCDEF", max_length=3) is True
    assert is_abbreviation("ABCD", "ABCDEF", max_length=3) is False
