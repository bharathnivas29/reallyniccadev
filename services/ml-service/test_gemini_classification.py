"""
Test script to verify Gemini relationship classification is working
"""
import sys
sys.path.append('app')

from app.shared.utils.gemini_client import GeminiClient

# Initialize client
client = GeminiClient()

# Test classification
result = client.classify_relationship(
    "Steve Jobs",
    "Apple",
    ["Steve Jobs founded Apple in California in 1989"]
)

print(f"Classification result: {result}")
print(f"Type: {result['type']}")
print(f"Confidence: {result['confidence']}")
