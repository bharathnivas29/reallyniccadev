import * as fs from 'fs';
import * as path from 'path';
import { Graph } from '@really-nicca/types';
import { logger } from '../../shared/utils/logger';

const log = logger.child('GraphStorageService');

export class GraphStorageService {
  private readonly storageDir: string;

  constructor(storageDir: string = 'data/graphs') {
    this.storageDir = path.resolve(storageDir);
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Save a graph to file system
   * Returns the graphId
   */
  async saveGraph(graph: Graph): Promise<string> {
    const graphId = graph.meta.graphId;
    const filePath = path.join(this.storageDir, `${graphId}.json`);

    try {
      const jsonData = JSON.stringify(graph, null, 2);
      fs.writeFileSync(filePath, jsonData, 'utf-8');
      return graphId;
    } catch (error: any) {
      log.error('Failed to save graph', { graphId, error: error.message });
      throw new Error(`Failed to save graph ${graphId}: ${error.message}`);
    }
  }

  /**
   * Load a graph from file system
   */
  async loadGraph(graphId: string): Promise<Graph> {
    const filePath = path.join(this.storageDir, `${graphId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Graph not found: ${graphId}`);
    }

    try {
      const jsonData = fs.readFileSync(filePath, 'utf-8');
      const graph = JSON.parse(jsonData) as Graph;
      
      // Basic validation
      if (!graph.nodes || !graph.edges || !graph.meta) {
        throw new Error('Invalid graph structure');
      }

      return graph;
    } catch (error: any) {
      log.error('Failed to load graph', { graphId, error: error.message });
      throw new Error(`Failed to load graph ${graphId}: ${error.message}`);
    }
  }

  /**
   * List all stored graphs with metadata
   */
  async listGraphs(): Promise<Array<{
    graphId: string;
    createdAt: Date;
    nodeCount: number;
    edgeCount: number;
  }>> {
    try {
      const files = fs.readdirSync(this.storageDir);
      const graphFiles = files.filter(f => f.endsWith('.json'));

      const graphs = [];
      for (const file of graphFiles) {
        try {
          const filePath = path.join(this.storageDir, file);
          const jsonData = fs.readFileSync(filePath, 'utf-8');
          const graph = JSON.parse(jsonData) as Graph;

          graphs.push({
            graphId: graph.meta.graphId,
            createdAt: graph.meta.createdAt,
            nodeCount: graph.nodes.length,
            edgeCount: graph.edges.length,
          });
        } catch (error) {
          // Skip invalid files
          log.warn('Skipping invalid graph file', { file });
        }
      }

      return graphs;
    } catch (error: any) {
      log.error('Failed to list graphs', { error: error.message });
      throw new Error(`Failed to list graphs: ${error.message}`);
    }
  }

  /**
   * Delete a graph
   */
  async deleteGraph(graphId: string): Promise<void> {
    const filePath = path.join(this.storageDir, `${graphId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Graph not found: ${graphId}`);
    }

    try {
      fs.unlinkSync(filePath);
    } catch (error: any) {
      log.error('Failed to delete graph', { graphId, error: error.message });
      throw new Error(`Failed to delete graph ${graphId}: ${error.message}`);
    }
  }
}

// Export singleton instance
export const graphStorage = new GraphStorageService();
