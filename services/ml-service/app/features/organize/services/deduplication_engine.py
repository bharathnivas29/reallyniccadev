import logging
from typing import List, Optional, Dict
from app.features.organize.schemas.extract import ExtractedEntity
from app.shared.utils.similarity import (
    string_similarity,
    cosine_similarity,
    is_abbreviation
)

logger = logging.getLogger(__name__)

# Thresholds from ALGORITHMS.md
STRING_SIMILARITY_THRESHOLD = 0.85
COSINE_SIMILARITY_THRESHOLD = 0.90

def should_merge(
    entity1: ExtractedEntity,
    entity2: ExtractedEntity,
    emb1: Optional[List[float]],
    emb2: Optional[List[float]]
) -> bool:
    """
    Determine if two entities should be merged based on multi-signal matching.
    
    Merge criteria (ALL must be true):
    1. Same entity type (NEVER merge across types)
    2. At least ONE of:
       - String similarity ≥ 0.85
       - Cosine similarity ≥ 0.90 (only if both have embeddings)
       - Is abbreviation (one is abbreviation of the other)
    
    Args:
        entity1: First entity.
        entity2: Second entity.
        emb1: Embedding for entity1 (None if not available).
        emb2: Embedding for entity2 (None if not available).
        
    Returns:
        True if entities should be merged, False otherwise.
    """
    # Rule 1: Must be same type (NEVER merge across types)
    if entity1.type != entity2.type:
        return False
    
    # Rule 2: Check similarity signals
    
    # Signal 1: String similarity
    str_sim = string_similarity(entity1.name, entity2.name)
    if str_sim >= STRING_SIMILARITY_THRESHOLD:
        logger.debug(f"Merge '{entity1.name}' and '{entity2.name}': string similarity {str_sim:.2f}")
        return True
    
    # Signal 2: Semantic similarity (only if BOTH have embeddings)
    if emb1 is not None and emb2 is not None:
        try:
            cos_sim = cosine_similarity(emb1, emb2)
            if cos_sim >= COSINE_SIMILARITY_THRESHOLD:
                logger.debug(f"Merge '{entity1.name}' and '{entity2.name}': cosine similarity {cos_sim:.2f}")
                return True
        except ValueError as e:
            logger.warning(f"Failed to compute cosine similarity: {e}")
    
    # Signal 3: Abbreviation detection
    if is_abbreviation(entity1.name, entity2.name) or is_abbreviation(entity2.name, entity1.name):
        logger.debug(f"Merge '{entity1.name}' and '{entity2.name}': abbreviation detected")
        return True
    
    return False

def deduplicate_entities(
    entities: List[ExtractedEntity],
    embeddings: List[Optional[List[float]]]
) -> List[ExtractedEntity]:
    """
    Deduplicate entities using multi-signal matching.
    
    Strategy:
    1. Group entities by type for efficiency
    2. Within each type, compare all pairs
    3. Merge entities that match criteria
    4. Keep first occurrence as canonical
    5. Add variants to aliases
    6. Merge all sources
    7. Average confidence scores
    
    Args:
        entities: List of extracted entities.
        embeddings: List of embeddings (parallel to entities, None if not available).
        
    Returns:
        Deduplicated list of entities with aliases populated.
    """
    if len(entities) != len(embeddings):
        raise ValueError(f"Entities and embeddings must have same length: {len(entities)} vs {len(embeddings)}")
    
    if len(entities) == 0:
        return []
    
    # Group entities by type for efficiency
    type_groups: Dict[str, List[int]] = {}
    for i, entity in enumerate(entities):
        if entity.type not in type_groups:
            type_groups[entity.type] = []
        type_groups[entity.type].append(i)
    
    # Track which entities have been merged (index -> canonical index)
    merge_map: Dict[int, int] = {}
    
    # Process each type group
    for entity_type, indices in type_groups.items():
        # Compare all pairs within this type
        for i in range(len(indices)):
            idx_i = indices[i]
            
            # Skip if already merged
            if idx_i in merge_map:
                continue
            
            for j in range(i + 1, len(indices)):
                idx_j = indices[j]
                
                # Skip if already merged
                if idx_j in merge_map:
                    continue
                
                # Check if should merge
                if should_merge(
                    entities[idx_i],
                    entities[idx_j],
                    embeddings[idx_i],
                    embeddings[idx_j]
                ):
                    # Merge idx_j into idx_i (keep first as canonical)
                    merge_map[idx_j] = idx_i
    
    # Build deduplicated entities
    deduplicated: List[ExtractedEntity] = []
    processed: set = set()
    
    for i, entity in enumerate(entities):
        # Skip if this entity was merged into another
        if i in merge_map:
            continue
        
        # Skip if already processed
        if i in processed:
            continue
        
        # Find all entities merged into this one
        merged_indices = [i]
        for j, canonical_idx in merge_map.items():
            if canonical_idx == i:
                merged_indices.append(j)
        
        # Create canonical entity
        canonical = ExtractedEntity(
            name=entity.name,
            type=entity.type,
            confidence=entity.confidence,
            sources=entity.sources.copy(),
            aliases=entity.aliases.copy()
        )
        
        # Merge all variants
        confidences = [entity.confidence]
        for idx in merged_indices[1:]:  # Skip first (canonical)
            merged_entity = entities[idx]
            
            # Add name as alias if not already present
            if merged_entity.name != canonical.name and merged_entity.name not in canonical.aliases:
                canonical.aliases.append(merged_entity.name)
            
            # Merge sources (avoid duplicates)
            existing_snippets = {s.snippet for s in canonical.sources}
            for source in merged_entity.sources:
                if source.snippet not in existing_snippets:
                    canonical.sources.append(source)
                    existing_snippets.add(source.snippet)
            
            # Collect confidence for averaging
            confidences.append(merged_entity.confidence)
            
            # Merge aliases from merged entity
            for alias in merged_entity.aliases:
                if alias not in canonical.aliases and alias != canonical.name:
                    canonical.aliases.append(alias)
        
        # Average confidence scores
        canonical.confidence = sum(confidences) / len(confidences)
        
        deduplicated.append(canonical)
        processed.add(i)
    
    logger.info(f"Deduplication: {len(entities)} entities → {len(deduplicated)} deduplicated ({len(entities) - len(deduplicated)} merged)")
    
    return deduplicated
