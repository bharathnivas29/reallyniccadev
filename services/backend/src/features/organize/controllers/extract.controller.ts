import { Request, Response } from 'express';
import { textProcessor } from '../services/text-processor.service';
import { mlClient } from '../../../core/ml/python-client.service';
import { graphBuilder } from '../services/graph-builder.service';
import { graphStorage } from '../../../core/storage/graph-storage.service';
import { logger } from '../../../shared/utils/logger';

const log = logger.child('ExtractController');

export class ExtractController {
  /**
   * POST /api/organize/extract
   * Extract knowledge graph from text
   */
  async extractGraph(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = req.requestId;
    
    try {
      // Step 1: Validate request
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        log.warn('Invalid request body', { requestId, error: 'Missing text field' });
        res.status(400).json({
          error: 'Bad Request',
          message: 'Request body must contain a "text" field (string)'
        });
        return;
      }

      log.info('Processing extraction request', { 
        requestId, 
        textLength: text.length 
      });

      // Step 2: Validate text
      const validation = textProcessor.validateText(text);
      if (!validation.valid) {
        log.warn('Text validation failed', { requestId, error: validation.error });
        res.status(400).json({
          error: 'Bad Request',
          message: validation.error
        });
        return;
      }

      // Step 3: Chunk text
      const chunks = textProcessor.chunkText(text);
      log.debug('Text chunked', { requestId, chunkCount: chunks.length });

      // Step 4: Call ML service
      log.debug('Calling ML service', { requestId });
      const mlResult = await mlClient.callExtractEndpoint(chunks, 'web_request');
      
      log.info('ML service response received', { 
        requestId,
        entityCount: mlResult.entities.length,
        relationshipCount: mlResult.relationships.length
      });

      // Step 5: Build graph
      log.debug('Building graph structure', { requestId });
      const graph = graphBuilder.buildGraph(
        mlResult.entities,
        mlResult.relationships,
        text
      );

      // Step 6: Save graph
      log.debug('Saving graph to storage', { requestId });
      const graphId = await graphStorage.saveGraph(graph);

      // Step 7: Return response
      const duration = Date.now() - startTime;
      
      log.info('Extraction completed successfully', {
        requestId,
        graphId,
        duration: `${duration}ms`,
        stats: {
          nodes: graph.nodes.length,
          edges: graph.edges.length
        }
      });

      res.status(200).json({
        success: true,
        graphId,
        graph,
        metadata: {
          processingTimeMs: duration,
          textLength: text.length,
          chunkCount: chunks.length,
          entityCount: graph.nodes.length,
          relationshipCount: graph.edges.length
        }
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      log.error('Extraction failed', {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to extract graph from text',
        details: error.message
      });
    }
  }
}

export const extractController = new ExtractController();
