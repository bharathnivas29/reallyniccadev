import { Request, Response } from 'express';
import { graphStorage } from '../../../core/storage/graph-storage.service';
import { logger } from '../../../shared/utils/logger';

const log = logger.child('GraphController');

export class GraphController {
  /**
   * GET /api/organize/graphs/:graphId
   * Retrieve a saved graph by ID
   */
  async getGraph(req: Request, res: Response): Promise<void> {
    const requestId = req.requestId;
    try {
      const { graphId } = req.params;

      if (!graphId) {
        log.warn('Missing graph ID in request', { requestId });
        res.status(400).json({
          error: 'Bad Request',
          message: 'Graph ID is required'
        });
        return;
      }

      log.debug('Loading graph', { requestId, graphId });

      const graph = await graphStorage.loadGraph(graphId);

      log.info('Graph loaded successfully', { requestId, graphId });

      res.status(200).json({
        success: true,
        graph
      });

    } catch (error: any) {
      const { graphId } = req.params;
      
      if (error.message.includes('not found')) {
        log.warn('Graph not found', { requestId, graphId });
        res.status(404).json({
          error: 'Not Found',
          message: `Graph with ID '${graphId}' not found`
        });
      } else {
        log.error('Failed to retrieve graph', { 
          requestId, 
          graphId, 
          error: error.message,
          stack: error.stack 
        });
        
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
    const requestId = req.requestId;
    try {
      log.debug('Fetching all graphs', { requestId });

      const graphs = await graphStorage.listGraphs();

      log.info('Graphs listed successfully', { requestId, count: graphs.length });

      res.status(200).json({
        success: true,
        count: graphs.length,
        graphs
      });

    } catch (error: any) {
      log.error('Failed to list graphs', { 
        requestId, 
        error: error.message,
        stack: error.stack 
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list graphs',
        details: error.message
      });
    }
  }
}

export const graphController = new GraphController();
