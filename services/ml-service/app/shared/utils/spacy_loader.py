import spacy
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_nlp_instance: Optional[spacy.language.Language] = None

def get_nlp() -> spacy.language.Language:
    """
    Singleton function to load and return the spaCy NLP model.
    Loads 'en_core_web_sm' if not already loaded.
    """
    global _nlp_instance
    
    if _nlp_instance is None:
        try:
            logger.info("Loading spaCy model 'en_core_web_sm'...")
            _nlp_instance = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded successfully.")
        except OSError:
            logger.error("spaCy model 'en_core_web_sm' not found. Please run 'python -m spacy download en_core_web_sm'")
            raise
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
            raise

    return _nlp_instance
