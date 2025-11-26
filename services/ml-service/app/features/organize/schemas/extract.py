from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Shared Types (Mirroring packages/types/src/entity.ts and relationship.ts)
EntityType = Literal['PERSON', 'ORGANIZATION', 'CONCEPT', 'DATE', 'PAPER', 'LOCATION']
RelationshipType = Literal['cooccurrence', 'semantic', 'explicit']

class ExtractRequest(BaseModel):
    textChunks: List[str] = Field(..., description="List of text chunks to process")
    docId: str = Field(..., description="Unique identifier for the source document")

class EntitySourceSnippet(BaseModel):
    docId: str
    snippet: str
    chunkIndex: int

class ExtractedEntity(BaseModel):
    name: str
    type: EntityType
    confidence: float = Field(..., ge=0.0, le=1.0)
    sources: List[EntitySourceSnippet]
    aliases: List[str] = []

class ExtractedRelationship(BaseModel):
    sourceEntity: str
    targetEntity: str
    type: RelationshipType
    relationType: Optional[str] = None # e.g., "authored", "works_at"
    weight: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    examples: List[str] = []

class ExtractResponse(BaseModel):
    entities: List[ExtractedEntity]
    relationships: List[ExtractedRelationship]
