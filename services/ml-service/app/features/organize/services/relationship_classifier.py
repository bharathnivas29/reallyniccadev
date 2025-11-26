import logging
from typing import List, Dict, Set, Optional, Tuple
from app.features.organize.schemas.extract import ExtractedEntity, ExtractedRelationship

logger = logging.getLogger(__name__)

class RelationshipClassifier:
    """
    Classifies relationships between entities based on co-occurrence in text chunks.
    """
    
    def find_entity_occurrences(
        self, 
        text_chunks: List[str], 
        entities: List[ExtractedEntity]
    ) -> Dict[str, Set[int]]:
        """
        Map each entity name to the set of chunk indices where it appears.
        
        Args:
            text_chunks: List of text chunks.
            entities: List of extracted entities.
            
        Returns:
            Dictionary mapping entity name to set of chunk indices.
        """
        occurrences: Dict[str, Set[int]] = {}
        
        for entity in entities:
            if entity.name not in occurrences:
                occurrences[entity.name] = set()
            
            # Add chunk indices from entity sources
            for source in entity.sources:
                occurrences[entity.name].add(source.chunkIndex)
                
        return occurrences

    def calculate_cooccurrence_weight(
        self, 
        chunks1: Set[int], 
        chunks2: Set[int]
    ) -> float:
        """
        Calculate relationship weight based on co-occurrence.
        Formula: shared_chunks / min(count1, count2)
        
        Args:
            chunks1: Set of chunk indices for first entity.
            chunks2: Set of chunk indices for second entity.
            
        Returns:
            Weight between 0.0 and 1.0.
        """
        if not chunks1 or not chunks2:
            return 0.0
            
        shared = chunks1.intersection(chunks2)
        if not shared:
            return 0.0
            
        # Weight is percentage of overlap relative to the smaller entity's footprint
        # This allows a small entity (appearing once) to be strongly related to a large entity
        # if it appears in that same chunk.
        weight = len(shared) / min(len(chunks1), len(chunks2))
        
        return min(1.0, weight)

    def build_cooccurrence_relationships(
        self, 
        text_chunks: List[str], 
        entities: List[ExtractedEntity], 
        min_weight: float = 0.3
    ) -> List[ExtractedRelationship]:
        """
        Build relationships between entities that co-occur in text chunks.
        
        Args:
            text_chunks: List of text chunks.
            entities: List of extracted entities.
            min_weight: Minimum weight threshold (0.0-1.0) to include relationship.
            
        Returns:
            List of extracted relationships.
        """
        if not entities:
            return []
            
        relationships: List[ExtractedRelationship] = []
        
        # Step 1: Track occurrences
        occurrences = self.find_entity_occurrences(text_chunks, entities)
        entity_names = list(occurrences.keys())
        
        # Step 2: Compare all pairs
        for i in range(len(entity_names)):
            name1 = entity_names[i]
            chunks1 = occurrences[name1]
            
            for j in range(i + 1, len(entity_names)):
                name2 = entity_names[j]
                chunks2 = occurrences[name2]
                
                # Calculate weight
                weight = self.calculate_cooccurrence_weight(chunks1, chunks2)
                
                # Filter by threshold
                if weight >= min_weight:
                    # Find shared chunks for examples
                    shared_indices = chunks1.intersection(chunks2)
                    examples = []
                    
                    # Add up to 3 examples
                    for idx in list(shared_indices)[:3]:
                        if 0 <= idx < len(text_chunks):
                            # Truncate if too long (keep first 200 chars)
                            snippet = text_chunks[idx]
                            if len(snippet) > 200:
                                snippet = snippet[:197] + "..."
                            examples.append(snippet)
                    
                    # Create relationship
                    rel = ExtractedRelationship(
                        sourceEntity=name1,
                        targetEntity=name2,
                        type="cooccurrence",
                        relationType="related_to", # Generic default for co-occurrence
                        weight=weight,
                        confidence=0.7, # Base confidence for co-occurrence
                        examples=examples
                    )
                    
                    relationships.append(rel)
                    logger.debug(f"Found relationship: {name1} <-> {name2} (weight: {weight:.2f})")
                    
        logger.info(f"Built {len(relationships)} co-occurrence relationships from {len(entities)} entities")
        return relationships

    def classify_relationships_with_llm(
        self,
        relationships: List[ExtractedRelationship],
        gemini_client,
        delay_ms: int = 500
    ) -> List[ExtractedRelationship]:
        """
        Enhance high-weight relationships with LLM-based classification.
        
        Args:
            relationships: List of relationships to classify.
            gemini_client: Instance of GeminiClient.
            delay_ms: Delay in milliseconds between API calls to avoid rate limiting.
            
        Returns:
            List of relationships with updated types.
        """
        import time
        
        enhanced_relationships = []
        total = len(relationships)
        classified_count = 0
        
        for idx, rel in enumerate(relationships):
            # Only classify strong relationships to save costs/time
            if rel.weight >= 0.0:
                try:
                    logger.info(f"Classifying relationship {idx + 1}/{total}: {rel.sourceEntity} <-> {rel.targetEntity}")
                    
                    classification = gemini_client.classify_relationship(
                        rel.sourceEntity,
                        rel.targetEntity,
                        rel.examples
                    )
                    
                    # Update relationship
                    rel.relationType = classification["type"]
                    rel.confidence = max(rel.confidence, classification["confidence"])
                    classified_count += 1
                    logger.info(f"✓ Classified as '{rel.relationType}' (confidence: {rel.confidence:.2f})")
                    
                    # Add delay to avoid rate limiting (except for last item)
                    if idx < total - 1 and delay_ms > 0:
                        time.sleep(delay_ms / 1000.0)
                    
                except Exception as e:
                    logger.warning(f"Failed to classify relationship {rel.sourceEntity}-{rel.targetEntity}: {e}")
            
            enhanced_relationships.append(rel)
        
        logger.info(f"Classification complete: {classified_count}/{total} relationships classified")
        return enhanced_relationships

