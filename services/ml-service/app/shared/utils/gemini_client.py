import os
import time
import logging
import google.generativeai as genai
from typing import Optional, Any, Callable, List, Dict
from google.api_core import exceptions

logger = logging.getLogger(__name__)

class GeminiClient:
    """
    Wrapper for Google Gemini API with robustness features.
    Handles initialization, retries, and error mapping.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        print(f"\n{'='*60}")
        print("GeminiClient Initialization")
        print(f"{'='*60}")
        
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            print("✗ GEMINI_API_KEY not found!")
            print("  Checked: api_key parameter and GEMINI_API_KEY env var")
            logger.warning("GEMINI_API_KEY not found. Gemini features will be disabled.")
            self.model = None
            print(f"{'='*60}\n")
            return

        print(f"✓ GEMINI_API_KEY found (length: {len(self.api_key)})")
        print(f"  First 10 chars: {self.api_key[:10]}...")
        
        try:
            print("  Configuring Gemini API...")
            genai.configure(api_key=self.api_key)
            print("  Creating GenerativeModel...")
            # Use available model found during testing
            self.model = genai.GenerativeModel('gemini-2.0-flash-lite-preview-02-05')
            print("✓ GeminiClient initialized successfully!")
            logger.info("GeminiClient initialized successfully.")
        except Exception as e:
            print(f"✗ Failed to initialize GeminiClient: {e}")
            logger.error(f"Failed to initialize GeminiClient: {e}")
            self.model = None
        
        print(f"{'='*60}\n")

    def _call_with_retry(self, func: Callable, *args, **kwargs) -> Any:
        """
        Executes a function with retry logic for transient errors.
        Retries on 429 (Resource Exhausted) and 503 (Service Unavailable).
        """
        max_retries = 3
        base_delay = 1.0
        
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except exceptions.ResourceExhausted:
                wait_time = base_delay * (2 ** attempt)
                logger.warning(f"Gemini rate limit hit. Retrying in {wait_time}s (Attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            except exceptions.ServiceUnavailable:
                wait_time = base_delay * (2 ** attempt)
                logger.warning(f"Gemini service unavailable. Retrying in {wait_time}s (Attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            except Exception as e:
                # For other errors, log and re-raise immediately
                logger.error(f"Gemini API error: {e}")
                raise
        
        raise Exception(f"Gemini API failed after {max_retries} retries")

    def extract_entities(self, text: str, existing_entities: List[Dict] = []) -> Dict:
        """
        Placeholder for entity extraction using Gemini.
        
        Args:
            text: The text chunk to analyze.
            existing_entities: List of entities already found (e.g., by spaCy).
            
        Returns:
            Dict containing extracted entities (structure to be defined in Stage 2.2).
        """
        if not self.model:
            logger.warning("Gemini model not initialized. Skipping extraction.")
            return {}

        # Implementation will be added in Stage 2.3 after Prompt Engineering (Stage 2.2)
        logger.info(f"Gemini extraction requested for text length {len(text)}")
        return {}

    def classify_relationship(
        self,
        entity1: str,
        entity2: str,
        snippets: List[str]
    ) -> dict:
        """
        Classify the relationship between two entities using Gemini.
        
        Args:
            entity1: First entity name.
            entity2: Second entity name.
            snippets: Text snippets showing the relationship context.
            
        Returns:
            Dict with 'type' and 'confidence' keys.
        """
        # Check if model is available
        if not self.model:
            logger.error("GeminiClient model is None - API key may not be loaded. Returning default 'related_to'.")
            return {"type": "related_to", "confidence": 0.5}
        
        if not snippets:
            logger.warning(f"No snippets provided for {entity1}-{entity2}, returning default")
            return {"type": "related_to", "confidence": 0.5}

        # Safety check for snippets
        safe_snippets = snippets if snippets else []
        snippet_text = "\\n".join([f"- {s}" for s in safe_snippets[:5]])

        prompt = f"""
        Analyze the relationship between these two entities based on the text snippets.
        
        Entity 1: {entity1}
        Entity 2: {entity2}
        
        Context Snippets:
        {snippet_text}
        
        Classify the relationship into one of these types:
        - WORKS_AT (person works at organization)
        - FOUNDED (person founded organization)
        - LOCATED_IN (entity located in place)
        - USES (entity uses technology/concept)
        - PART_OF (entity is part of another)
        - AUTHORED (person wrote paper/book)
        - CREATED (entity created another entity)
        - STUDIED_AT (person studied at institution)
        - COLLEAGUE_OF (person works with person)
        - FAMILY_OF (person related to person)
        - RELATED_TO (Use ONLY if absolutely no other type fits)
        
        IMPORTANT: Prefer specific types over RELATED_TO. If the relationship is implied, infer the specific type.
        
        Return JSON only:
        {{
            "type": "RELATION_TYPE",
            "confidence": 0.0 to 1.0
        }}
        """
        
        try:
            logger.info(f"Classifying relationship: {entity1} <-> {entity2}")
            logger.debug(f"Snippets: {snippets[:2]}")  # Log first 2 snippets
            
            response = self._call_with_retry(
                self.model.generate_content,
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            logger.info(f"Gemini response received: {response.text[:200]}")  # Log first 200 chars
            
            import json
            result = json.loads(response.text)
            classification = {
                "type": result.get("type", "related_to").lower(),
                "confidence": float(result.get("confidence", 0.5))
            }
            logger.info(f"Classification result: {classification}")
            return classification
        except Exception as e:
            logger.warning(f"Relationship classification failed for {entity1}-{entity2}: {e}")
            return {"type": "related_to", "confidence": 0.5}
