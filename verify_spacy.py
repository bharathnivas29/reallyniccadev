import spacy
import sys

try:
    nlp = spacy.load("en_core_web_sm")
    print("✅ spaCy model loaded successfully")
    print(f"spaCy version: {spacy.__version__}")
    print(f"Model path: {nlp.path}")
except Exception as e:
    print(f"❌ Failed to load spaCy model: {e}")
    sys.exit(1)
