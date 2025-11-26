import logging
import time
from fastapi import APIRouter, HTTPException
from app.features.organize.schemas.extract import ExtractRequest, ExtractResponse
from app.features.organize.services.entity_extractor import extract_entities_with_gemini
from app.features.organize.services.embedding_service import EmbeddingService
from app.features.organize.services.deduplication_engine import deduplicate_entities
from app.features.organize.services.relationship_classifier import RelationshipClassifier

from app.shared.utils.gemini_client import GeminiClient

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/extract", response_model=ExtractResponse)
async def extract_graph(request: ExtractRequest):
    """
    Extracts a knowledge graph (entities and relationships) from text chunks.
    
    Pipeline:
    1. Extract entities using hybrid approach (spaCy + Gemini)
    2. Generate embeddings for entities
    3. Deduplicate entities using multi-signal matching
    4. Build relationships using co-occurrence
    5. Classify high-confidence relationships using Gemini
    6. Return deduplicated entities and relationships
    """
    try:
        pipeline_start = time.time()
        
        logger.info(f"Received extraction request for docId: {request.docId} with {len(request.textChunks)} chunks")
        
        # Stage 1: Extract entities using hybrid approach (spaCy + Gemini)
        stage_start = time.time()
        logger.info("[STAGE 1] Entity extraction - Gemini ENABLED")
        entities = extract_entities_with_gemini(
            request.textChunks, 
            request.docId,
            use_gemini=True  # Re-enabled with correct model
        )
        stage_duration = (time.time() - stage_start) * 1000
        logger.info(f"Stage 1 (Entity Extraction): {len(entities)} entities in {stage_duration:.0f}ms")
        
        logger.info(f"Extracted {len(entities)} entities (before deduplication) for docId: {request.docId}")
        
        # Stage 2: Generate embeddings for entities
        stage_start = time.time()
        embedding_service = EmbeddingService()
        entity_names = [entity.name for entity in entities]
        embeddings = embedding_service.generate_embeddings(entity_names)
        stage_duration = (time.time() - stage_start) * 1000
        
        successful_embeddings = sum(1 for emb in embeddings if emb is not None)
        logger.info(f"Stage 2 (Embeddings): {successful_embeddings}/{len(entities)} successful in {stage_duration:.0f}ms")
        
        # Stage 3: Deduplicate entities using multi-signal matching
        stage_start = time.time()
        deduplicated_entities = deduplicate_entities(entities, embeddings)
        stage_duration = (time.time() - stage_start) * 1000
        
        merged_count = len(entities) - len(deduplicated_entities)
        logger.info(f"Stage 3 (Deduplication): {len(entities)} → {len(deduplicated_entities)} entities (merged {merged_count}) in {stage_duration:.0f}ms")
        
        # Stage 4: Build relationships using co-occurrence
        stage_start = time.time()
        relationship_classifier = RelationshipClassifier()
        relationships = relationship_classifier.build_cooccurrence_relationships(
            request.textChunks,
            deduplicated_entities,
            min_weight=0.3
        )
        stage_duration = (time.time() - stage_start) * 1000
        
        logger.info(f"Stage 4 (Co-occurrence): {len(relationships)} relationships detected in {stage_duration:.0f}ms")
        
        # Stage 5: Classify high-confidence relationships using Gemini
        stage_start = time.time()
        logger.info("[STAGE 5] Relationship classification ENABLED")
        
        # Limit the number of relationships to classify to prevent timeout
        # Sort by weight (highest first) and take top 20
        relationships.sort(key=lambda x: x.weight, reverse=True)
        top_relationships = relationships[:20]
        remaining_relationships = relationships[20:]
        
        logger.info(f"Classifying top {len(top_relationships)}/{len(relationships)} relationships")
        
        # Classify top relationships
        classified_relationships = relationship_classifier.classify_relationships_with_llm(
            top_relationships,
            request.textChunks
        )
        
        # Combine classified and remaining (unclassified) relationships
        final_relationships = classified_relationships + remaining_relationships
        
        stage_duration = (time.time() - stage_start) * 1000
        logger.info(f"Stage 5 (LLM Classification): Processed {len(top_relationships)} in {stage_duration:.0f}ms")
        
        pipeline_duration = (time.time() - pipeline_start) * 1000
        logger.info(f"Pipeline complete: {len(deduplicated_entities)} entities, {len(final_relationships)} relationships in {pipeline_duration:.0f}ms")
        
        return ExtractResponse(
            entities=deduplicated_entities,
            relationships=final_relationships
        )
    except Exception as e:
        logger.error(f"Extraction failed for docId {request.docId}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
