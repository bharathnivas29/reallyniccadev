import { Request, Response } from 'express';
import { textProcessor } from '../services/text-processor.service';
import { mlClient } from '../../../core/ml/python-client.service';
import { graphBuilder } from '../services/graph-builder.service';
import { graphStorage } from '../../../core/storage/graph-storage.service';

export class ExtractController {
  /**
   * POST /api/organize/extract
   * Extract knowledge graph from text
   */
  async extractGraph(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate request
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Request body must contain a "text" field (string)'
        });
        return;
      }

      console.log(`[Extract] Processing text (${text.length} chars)...`);

      // Step 2: Validate text
      const validation = textProcessor.validateText(text);
      if (!validation.valid) {
        res.status(400).json({
          error: 'Bad Request',
          message: validation.error
        });
        return;
      }

      // Step 3: Chunk text
      const chunks = textProcessor.chunkText(text);
      console.log(`[Extract] Created ${chunks.length} chunks`);

      // Step 4: Call ML service
      console.log('[Extract] Calling ML service...');
      const mlResult = await mlClient.callExtractEndpoint(chunks, 'web_request');
      console.log(`[Extract] ML service returned ${mlResult.entities.length} entities, ${mlResult.relationships.length} relationships`);

      // Step 5: Build graph
      console.log('[Extract] Building graph...');
      const graph = graphBuilder.buildGraph(
        mlResult.entities,
        mlResult.relationships,
        text
      );

      // Step 6: Save graph
      console.log('[Extract] Saving graph...');
      const graphId = await graphStorage.saveGraph(graph);

      // Step 7: Return response
      const duration = Date.now() - startTime;
      console.log(`[Extract] Complete in ${duration}ms - Graph ID: ${graphId}`);

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
      console.error(`[Extract] Failed after ${duration}ms:`, error.message);

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to extract graph from text',
        details: error.message
      });
    }
  }
}

export const extractController = new ExtractController();
