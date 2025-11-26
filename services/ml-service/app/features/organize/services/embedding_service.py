import logging
from typing import List, Optional
import google.generativeai as genai
from app.shared.utils.gemini_client import GeminiClient

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Service for generating text embeddings using Gemini API.
    Uses text-embedding-004 model (768 dimensions).
    """
    
    EMBEDDING_MODEL = "models/text-embedding-004"
    BATCH_SIZE = 10
    EMBEDDING_DIMENSIONS = 768
    
    def __init__(self):
        """Initialize the embedding service with Gemini client."""
        self.client = GeminiClient()
        if not self.client.model:
            logger.warning("Gemini client not initialized. Embeddings will fail.")
    
    def generate_embeddings(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed.
            
        Returns:
            List of embedding vectors (or None if failed).
        """
        if not texts:
            return []
            
        if not self.client.model:
            logger.warning("Gemini client not initialized - returning None for embeddings")
            return [None] * len(texts)
            
        results: List[Optional[List[float]]] = [None] * len(texts)
        
        # Process in batches
        for i in range(0, len(texts), self.BATCH_SIZE):
            batch_end = min(i + self.BATCH_SIZE, len(texts))
            batch = texts[i:batch_end]
            
            try:
                # Call Gemini embedding API
                # Note: embed_content is a module-level function in genai, not a model method
                response = genai.embed_content(
                    model=self.EMBEDDING_MODEL,
                    content=batch,
                    task_type="semantic_similarity"
                )
                
                # Extract embeddings from response
                if 'embedding' in response:
                    # Single embedding or batch depending on input
                    # For batch input, response['embedding'] is usually a list of embeddings
                    embeddings = response['embedding']
                    
                    # Verify we got a list of lists (batch response)
                    if isinstance(embeddings, list) and len(embeddings) > 0:
                        # Check if it's a single vector (list of floats) or list of vectors
                        if isinstance(embeddings[0], float):
                            # Single vector - shouldn't happen for batch > 1 but possible for batch=1
                            results[i] = embeddings
                        else:
                            # List of vectors
                            for j, emb in enumerate(embeddings):
                                if i + j < len(results):
                                    results[i + j] = emb
                    
                else:
                    logger.warning(f"Unexpected embedding response format: {response.keys()}")
                    
            except Exception as e:
                logger.error(f"Embedding generation failed for batch {i}-{batch_end}: {str(e)}")
                # Continue to next batch, leaving these as None
                continue
        
        # Log summary
        successful = sum(1 for r in results if r is not None)
        logger.info(f"Generated embeddings: {successful}/{len(texts)} successful")
        
        return results
    
    def validate_embedding(self, embedding: Optional[List[float]]) -> bool:
        """
        Validate that an embedding is valid (not None, correct dimensions).
        
        Args:
            embedding: The embedding vector to validate.
            
        Returns:
            True if valid, False otherwise.
        """
        if embedding is None:
            return False
        
        if not isinstance(embedding, list):
            return False
        
        if len(embedding) != self.EMBEDDING_DIMENSIONS:
            logger.warning(f"Invalid embedding dimensions: {len(embedding)} (expected {self.EMBEDDING_DIMENSIONS})")
            return False
        
        return True
