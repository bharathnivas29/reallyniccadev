export type RelationshipType = 'cooccurrence' | 'semantic' | 'explicit';

export interface Relationship {
  id: string;                    // UUID
  sourceId: string;              // Entity UUID
  targetId: string;              // Entity UUID
  type: RelationshipType;        // cooccurrence | semantic | explicit
  relationType?: string;         // Optional: "authored", "uses", etc.
  weight: number;                // Strength (0.0 - 1.0)
  confidence: number;            // Certainty (0.0 - 1.0)
  examples?: string[];           // Context snippets
}
