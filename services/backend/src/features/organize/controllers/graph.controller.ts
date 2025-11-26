import { Request, Response } from 'express';
import { graphStorage } from '../../../core/storage/graph-storage.service';

export class GraphController {
  /**
   * GET /api/organize/graphs/:graphId
   * Retrieve a saved graph by ID
   */
  async getGraph(req: Request, res: Response): Promise<void> {
    try {
      const { graphId } = req.params;

      if (!graphId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Graph ID is required'
        });
        return;
      }

      console.log(`[GetGraph] Loading graph: ${graphId}`);

      const graph = await graphStorage.loadGraph(graphId);

      console.log(`[GetGraph] Graph loaded successfully: ${graphId}`);

      res.status(200).json({
        success: true,
        graph
      });

    } catch (error: any) {
      console.error(`[GetGraph] Error:`, error.message);

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not Found',
          message: `Graph with ID '${req.params.graphId}' not found`
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to retrieve graph',
          details: error.message
        });
      }
    }
  }

  /**
   * GET /api/organize/graphs
   * List all saved graphs
   */
  async listGraphs(req: Request, res: Response): Promise<void> {
    try {
      console.log('[ListGraphs] Fetching all graphs...');

      const graphs = await graphStorage.listGraphs();

      console.log(`[ListGraphs] Found ${graphs.length} graphs`);

      res.status(200).json({
        success: true,
        count: graphs.length,
        graphs
      });

    } catch (error: any) {
      console.error('[ListGraphs] Error:', error.message);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list graphs',
        details: error.message
      });
    }
  }
}

export const graphController = new GraphController();
