import { v4 as uuidv4 } from 'uuid';
import { Graph, GraphMetadata, Entity, Relationship } from '@really-nicca/types';

interface MLEntity {
  name: string;
  type: string;
  confidence: number;
  sources: Array<{
    docId: string;
    snippet: string;
    chunkIndex: number;
  }>;
  aliases: string[];
}

interface MLRelationship {
  sourceEntity: string;
  targetEntity: string;
  type: string;
  relationType?: string;
  weight: number;
  confidence: number;
  examples: string[];
}

export class GraphBuilderService {
  /**
   * Build a complete graph from ML service output
   */
  buildGraph(
    mlEntities: MLEntity[],
    mlRelationships: MLRelationship[],
    sourceText?: string
  ): Graph {
    // Generate graph ID
    const graphId = uuidv4();

    // Map entities to nodes with UUIDs
    const entityIdMap = new Map<string, string>();
    const nodes: Entity[] = mlEntities.map(entity => {
      const id = uuidv4();
      entityIdMap.set(entity.name, id);
      
      return {
        id,
        label: entity.name,
        type: entity.type as any, // Type assertion for EntityType
        confidence: entity.confidence,
        sources: entity.sources,
        aliases: entity.aliases,
        hasEmbedding: false,
        metadata: {
          importance: 0, // Will be calculated later
        },
      };
    });

    // Map relationships to edges with UUIDs
    const edges: Relationship[] = [];
    
    for (const rel of mlRelationships) {
      const sourceId = entityIdMap.get(rel.sourceEntity);
      const targetId = entityIdMap.get(rel.targetEntity);

      // Skip if entities not found
      if (!sourceId || !targetId) {
        console.warn(`Skipping relationship: ${rel.sourceEntity} -> ${rel.targetEntity} (entity not found)`);
        continue;
      }

      edges.push({
        id: uuidv4(),
        sourceId: sourceId,
        targetId: targetId,
        type: 'cooccurrence' as any, // Default type
        relationType: rel.relationType || rel.type,
        weight: rel.weight,
        confidence: rel.confidence,
        examples: rel.examples,
      });
    }

    // Calculate node importance (degree centrality)
    this.calculateNodeImportance(nodes, edges);

    // Build metadata
    const meta: GraphMetadata = {
      graphId,
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceText: sourceText?.substring(0, 200), // First 200 chars
    };

    return {
      nodes,
      edges,
      meta,
    };
  }

  /**
   * Calculate node importance using degree centrality
   * Importance = (in-degree + out-degree) / (total nodes - 1)
   */
  private calculateNodeImportance(nodes: Entity[], edges: Relationship[]): void {
    const degreeMap = new Map<string, number>();

    // Initialize all nodes with degree 0
    nodes.forEach(node => degreeMap.set(node.id, 0));

    // Count degrees
    edges.forEach(edge => {
      degreeMap.set(edge.sourceId, (degreeMap.get(edge.sourceId) || 0) + 1);
      degreeMap.set(edge.targetId, (degreeMap.get(edge.targetId) || 0) + 1);
    });

    // Calculate normalized importance
    const maxDegree = nodes.length - 1 || 1; // Avoid division by zero
    nodes.forEach(node => {
      const degree = degreeMap.get(node.id) || 0;
      if (node.metadata) {
        node.metadata.importance = maxDegree > 0 ? degree / maxDegree : 0;
      }
    });
  }
}

// Export singleton instance
export const graphBuilder = new GraphBuilderService();
