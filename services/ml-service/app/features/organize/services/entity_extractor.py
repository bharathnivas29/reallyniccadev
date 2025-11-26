import logging
from typing import List, Dict, Any
from app.shared.utils.spacy_loader import get_nlp
from app.features.organize.schemas.extract import ExtractedEntity, EntitySourceSnippet

logger = logging.getLogger(__name__)

# Map spaCy labels to our project schema
LABEL_MAP = {
    "PERSON": "PERSON",
    "ORG": "ORGANIZATION",
    "GPE": "LOCATION",  # Geopolitical entity -> Location
    "LOC": "LOCATION",  # Location -> Location
    "DATE": "DATE",
    "WORK_OF_ART": "PAPER", # Approximate mapping for papers/books
    "PRODUCT": "CONCEPT",
    "EVENT": "CONCEPT",
    "LAW": "CONCEPT",
    "LANGUAGE": "CONCEPT",
}

BASE_CONFIDENCE = 0.6

def extract_entities_spacy(text_chunks: List[str], doc_id: str) -> List[ExtractedEntity]:
    """
    Extracts entities from text chunks using spaCy.
    
    Args:
        text_chunks: List of text strings to process.
        doc_id: Identifier for the source document.
        
    Returns:
        List of ExtractedEntity objects.
    """
    nlp = get_nlp()
    entities_map: Dict[str, ExtractedEntity] = {}

    for chunk_index, chunk in enumerate(text_chunks):
        doc = nlp(chunk)
        
        for ent in doc.ents:
            if ent.label_ not in LABEL_MAP:
                continue
                
            mapped_type = LABEL_MAP[ent.label_]
            clean_name = ent.text.strip()
            
            # Skip very short entities that are likely noise
            if len(clean_name) < 2:
                continue

            # Calculate confidence
            # Boost confidence for longer entities as they are usually more specific
            length_boost = min(0.2, len(clean_name) * 0.01)
            confidence = min(0.95, BASE_CONFIDENCE + length_boost)
            
            # Create source snippet
            # Get a window of text around the entity
            start = max(0, ent.start_char - 50)
            end = min(len(chunk), ent.end_char + 50)
            snippet_text = chunk[start:end].replace("\n", " ").strip()
            
            source = EntitySourceSnippet(
                docId=doc_id,
                snippet=snippet_text,
                chunkIndex=chunk_index
            )

            if clean_name in entities_map:
                # Merge with existing entity
                existing = entities_map[clean_name]
                existing.sources.append(source)
                # Boost confidence slightly if found multiple times
                existing.confidence = min(0.99, existing.confidence + 0.05)
            else:
                # Create new entity
                entities_map[clean_name] = ExtractedEntity(
                    name=clean_name,
                    type=mapped_type,
                    confidence=confidence,
                    sources=[source],
                    aliases=[]
                )

    return list(entities_map.values())

def extract_entities_with_gemini(
    text_chunks: List[str], 
    doc_id: str, 
    use_gemini: bool = True
) -> List[ExtractedEntity]:
    """
    Hybrid entity extraction using spaCy baseline + Gemini enhancement.
    
    Args:
        text_chunks: List of text strings to process.
        doc_id: Identifier for the source document.
        use_gemini: Whether to use Gemini enhancement (default: True).
        
    Returns:
        List of ExtractedEntity objects with merged results.
    """
    import json
    from app.shared.utils.gemini_client import GeminiClient
    from app.features.organize.prompts import ENTITY_EXTRACTION_PROMPT
    
    # Step 1: Get spaCy baseline
    spacy_entities = extract_entities_spacy(text_chunks, doc_id)
    
    # If Gemini disabled or unavailable, return spaCy-only
    if not use_gemini:
        logger.info("Gemini disabled, using spaCy-only extraction")
        return spacy_entities
    
    try:
        client = GeminiClient()
        if not client.model:
            logger.warning("Gemini model not available, falling back to spaCy-only")
            return spacy_entities
        
        # Step 2: Send to Gemini for enhancement
        gemini_entities_map: Dict[str, ExtractedEntity] = {}
        
        for chunk_index, chunk in enumerate(text_chunks):
            full_prompt = f"{ENTITY_EXTRACTION_PROMPT}\n{chunk}"
            
            try:
                response = client._call_with_retry(
                    client.model.generate_content,
                    full_prompt
                )
                
                # Parse JSON response
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)
                
                # Process Gemini entities
                for ent_data in data.get("entities", []):
                    name = ent_data.get("name", "").strip()
                    entity_type = ent_data.get("type", "CONCEPT")
                    confidence = min(0.92, float(ent_data.get("confidence", 0.7)))  # Cap at 0.92
                    
                    if not name or len(name) < 2:
                        continue
                    
                    # Create source snippet
                    source = EntitySourceSnippet(
                        docId=doc_id,
                        snippet=chunk[:200],  # First 200 chars as snippet
                        chunkIndex=chunk_index
                    )
                    
                    if name in gemini_entities_map:
                        gemini_entities_map[name].sources.append(source)
                        gemini_entities_map[name].confidence = min(0.92, gemini_entities_map[name].confidence + 0.02)
                    else:
                        gemini_entities_map[name] = ExtractedEntity(
                            name=name,
                            type=entity_type,
                            confidence=confidence,
                            sources=[source],
                            aliases=[]
                        )
                        
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse Gemini JSON for chunk {chunk_index}: {e}")
                continue
            except Exception as e:
                logger.warning(f"Gemini extraction failed for chunk {chunk_index}: {e}")
                continue
        
        # Step 3: Merge spaCy and Gemini results
        merged_entities: Dict[str, ExtractedEntity] = {}
        
        # Add all spaCy entities
        for entity in spacy_entities:
            merged_entities[entity.name] = entity
        
        # Merge Gemini entities
        for name, gemini_entity in gemini_entities_map.items():
            if name in merged_entities:
                # Found by both - boost confidence
                merged_entities[name].confidence = min(0.98, merged_entities[name].confidence + 0.05)
                # Merge sources (avoid duplicates)
                existing_snippets = {s.snippet for s in merged_entities[name].sources}
                for source in gemini_entity.sources:
                    if source.snippet not in existing_snippets:
                        merged_entities[name].sources.append(source)
                logger.debug(f"Entity '{name}' found by both spaCy and Gemini, boosted confidence")
            else:
                # Gemini-only entity - add if confidence sufficient
                if gemini_entity.confidence >= 0.55:
                    merged_entities[name] = gemini_entity
                    logger.debug(f"Entity '{name}' added from Gemini (confidence: {gemini_entity.confidence})")
        
        logger.info(f"Hybrid extraction: {len(spacy_entities)} from spaCy, {len(gemini_entities_map)} from Gemini, {len(merged_entities)} merged")
        return list(merged_entities.values())
        
    except Exception as e:
        logger.error(f"Gemini enhancement failed, falling back to spaCy-only: {e}")
        return spacy_entities

