import re
import math
from difflib import SequenceMatcher
from typing import List, Optional

def normalize_text(text: str) -> str:
    """
    Normalize text for comparison by converting to lowercase and removing punctuation.
    
    Args:
        text: Input text string.
        
    Returns:
        Normalized text (lowercase, no punctuation, trimmed).
        
    Example:
        >>> normalize_text("A.I.")
        'ai'
        >>> normalize_text("Machine Learning!")
        'machine learning'
    """
    # Remove all non-alphanumeric characters except spaces
    normalized = re.sub(r'[^\w\s]', '', text.lower())
    return normalized.strip()

def string_similarity(text1: str, text2: str) -> float:
    """
    Calculate string similarity using SequenceMatcher (Levenshtein-like ratio).
    
    Args:
        text1: First text string.
        text2: Second text string.
        
    Returns:
        Similarity ratio between 0.0 and 1.0.
        
    Example:
        >>> string_similarity("AI", "A.I.")
        0.6666666666666666
        >>> string_similarity("ai", "AI")
        1.0
    """
    # Normalize both texts
    norm1 = normalize_text(text1)
    norm2 = normalize_text(text2)
    
    # Calculate similarity ratio
    return SequenceMatcher(None, norm1, norm2).ratio()

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector (list of floats).
        vec2: Second vector (list of floats).
        
    Returns:
        Cosine similarity between -1.0 and 1.0.
        
    Raises:
        ValueError: If vectors have different dimensions or are empty.
        
    Example:
        >>> cosine_similarity([1, 0, 0], [1, 0, 0])
        1.0
        >>> cosine_similarity([1, 0], [0, 1])
        0.0
    """
    if len(vec1) != len(vec2):
        raise ValueError(f"Vectors must have same dimensions: {len(vec1)} vs {len(vec2)}")
    
    if len(vec1) == 0:
        raise ValueError("Vectors cannot be empty")
    
    # Calculate dot product
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    
    # Calculate magnitudes
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    
    # Avoid division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    # Calculate cosine similarity
    return dot_product / (magnitude1 * magnitude2)

def is_abbreviation(short: str, long: str, max_length: int = 5) -> bool:
    """
    Check if one string is an abbreviation of another.
    
    Checks two patterns:
    1. Substring match: normalized short appears in normalized long
    2. Initials match: short matches first letters of words in long
    
    Args:
        short: Potential abbreviation.
        long: Full form.
        max_length: Maximum length for abbreviation (default: 5).
        
    Returns:
        True if short is an abbreviation of long, False otherwise.
        
    Example:
        >>> is_abbreviation("AI", "Artificial Intelligence")
        True  # Initials match
        >>> is_abbreviation("ML", "Machine Learning")
        True  # Initials match
        >>> is_abbreviation("GPT", "Generative Pre-trained Transformer")
        True  # Initials match
        >>> is_abbreviation("Python", "Python Programming")
        False  # Too long to be abbreviation
    """
    norm_short = normalize_text(short)
    norm_long = normalize_text(long)
    
    # Check if short is actually short enough
    if len(norm_short) > max_length:
        return False
    
    # Pattern 1: Substring match
    # Check if normalized short appears in normalized long
    if norm_short in norm_long:
        return True
    
    # Pattern 2: Initials match
    # Extract first letters of each word in long
    words = norm_long.split()
    if len(words) > 0:
        initials = ''.join(word[0] for word in words if len(word) > 0)
        if norm_short == initials:
            return True
    
    return False

