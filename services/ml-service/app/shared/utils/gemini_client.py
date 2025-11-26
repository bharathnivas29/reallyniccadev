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
        logger.info("GeminiClient Initialization")
        
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found! Checked: api_key parameter and GEMINI_API_KEY env var")
            logger.warning("Gemini features will be disabled.")
            self.model = None
            return

        logger.info(f"GEMINI_API_KEY found (length: {len(self.api_key)})")
        logger.debug(f"First 10 chars: {self.api_key[:10]}...")
        
        try:
            logger.debug("Configuring Gemini API...")
            genai.configure(api_key=self.api_key)
            logger.debug("Creating GenerativeModel...")
            # Use available model found during testing
            self.model = genai.GenerativeModel('gemini-2.0-flash-lite-preview-02-05')
            logger.info("GeminiClient initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize GeminiClient: {e}")
            self.model = None

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
        snippets: List[str],
        source_type: str = None,
        target_type: str = None
    ) -> dict:
        """
        Classify the relationship between two entities using Gemini.
        
        Args:
            entity1: First entity name.
            entity2: Second entity name.
            snippets: Text snippets showing the relationship context.
            source_type: Optional type of first entity (PERSON, ORGANIZATION, etc.)
            target_type: Optional type of second entity
            
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
        snippet_text = "\n".join([f"- {s}" for s in safe_snippets[:5]])
        
        # Build entity type context
        type_info = ""
        if source_type and target_type:
            type_info = f" (TYPE: {source_type})" if source_type else ""
            type_info2 = f" (TYPE: {target_type})" if target_type else ""
            entity_type_context = f"\n\nEntity Types: {source_type} + {target_type}"
        else:
            type_info = ""
            type_info2 = ""
            entity_type_context = ""

        prompt = f"""
        Analyze the relationship between these two entities based on the text snippets.
        
        Entity 1: {entity1}{type_info}
        Entity 2: {entity2}{type_info2}{entity_type_context}
        
        Context Snippets:
        {snippet_text}
        
        Classify the relationship into ONE of these types (use EXACT lowercase format):
        - founded (person founded organization, or founded in year/location)
        - works_at (person works at organization)
        - ceo_of (person is CEO of organization)
        - located_in (entity located in place)
        - headquartered_in (organization HQ in location)
        - uses (entity uses technology/concept)
        - part_of (entity is part of another)
        - authored (person wrote paper/book)
        - created (entity created another)
        - developed (entity developed concept/technology)
        - studied_at (person studied at institution)
        - colleague_of (person works with person)
        - collaborated_with (entities worked together)
        - acquired_by (organization acquired by another)
        - born_in (person born in location)
        - lives_in (person lives in location)
        - related_to (ONLY if no specific type fits)
        
        CRITICAL INSTRUCTIONS:
        1. Look at the TEXT CAREFULLY - if it says "founded", use "founded"
        2. Consider entity types - PERSON+ORGANIZATION often means founded/works_at/ceo_of
        3. ORGANIZATION+LOCATION means located_in or headquartered_in
        4. PREFER SPECIFIC TYPES - only use "related_to" if truly unclear
        5. Return relationship type in LOWERCASE
        
        Return JSON only (no markdown, no extra text):
        {{
            "type": "relationship_type",
            "confidence": 0.8
        }}
        """
        
        try:
            logger.info(f"Classifying: {entity1} ({source_type or '?'}) <-> {entity2} ({target_type or '?'})")
            logger.debug(f"Snippets: {snippets[:1]}")  # Log first snippet
            
            response = self._call_with_retry(
                self.model.generate_content,
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            logger.info(f"Gemini response: {response.text}")
            
            import json
            result = json.loads(response.text)
            classification = {
                "type": result.get("type", "related_to").lower(),
                "confidence": float(result.get("confidence", 0.5))
            }
            logger.info(f"✓ Classified as '{classification['type']}' (confidence: {classification['confidence']:.2f})")
            return classification
        except Exception as e:
            logger.error(f"Classification failed for {entity1}-{entity2}: {e}", exc_info=True)
            return {"type": "related_to", "confidence": 0.5}
