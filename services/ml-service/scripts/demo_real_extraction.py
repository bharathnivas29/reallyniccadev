import os
import sys
import json
import logging

# Add project root to sys.path
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from app.main import app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_demo():
    print("Initializing Demo with Real Input...")
    
    # Check API Key
    if not os.getenv("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY not found in environment. LLM features may fail or be skipped.")
    
    client = TestClient(app)
    
    # Sample Text
    text = (
        "Elon Musk is the CEO of Tesla, Inc. He co-founded the company in 2003. "
        "Musk is also the founder of SpaceX, which designs rockets. "
        "Tesla is headquartered in Austin, Texas."
    )
    
    payload = {
        "textChunks": [text],
        "docId": "demo_doc_001"
    }
    
    print(f"\nSending Request with text:\n'{text}'\n")
    
    try:
        response = client.post("/organize/extract", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            
            # Save to file
            with open("demo_output.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
                
            print("\n=== EXTRACTION RESULT SAVED TO demo_output.json ===\n")
            print(json.dumps(data, indent=2))
            
            # Summary
            print("\n=== SUMMARY ===")
            print(f"Entities Found: {len(data['entities'])}")
            print(f"Relationships Found: {len(data['relationships'])}")
            
            print("\nEntities:")
            for e in data['entities']:
                print(f"- {e['name']} ({e['type']})")
                
            print("\nRelationships:")
            for r in data['relationships']:
                rel_type = r.get('relationType', 'cooccurrence')
                print(f"- {r['sourceEntity']} --[{rel_type}]--> {r['targetEntity']} (Confidence: {r.get('confidence', 'N/A')})")
                
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Failed to run demo: {e}")

if __name__ == "__main__":
    run_demo()
