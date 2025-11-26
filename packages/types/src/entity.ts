export type EntityType = 'PERSON' | 'ORGANIZATION' | 'CONCEPT' | 'DATE' | 'PAPER';

export interface EntitySource {
  docId: string;
  snippet: string;
  chunkIndex: number;
}

export interface Entity {
  id: string;                    // UUID
  label: string;                 // Canonical name
  type: EntityType;              // PERSON | ORGANIZATION | CONCEPT | DATE | PAPER
  aliases: string[];             // Alternative names
  confidence: number;            // 0.0 - 1.0
  sources: EntitySource[];       // Origin snippets
  hasEmbedding?: boolean;        // Track if embedding was successfully generated
  metadata?: {
    importance?: number;         // Degree centrality (0-1)
  };
}
