import { Request, Response } from 'express';
import { fileParserService } from '../services/file-parser.service';
import { textProcessor } from '../services/text-processor.service';
import { mlClient } from '../../../core/ml/python-client.service';
import { graphBuilder } from '../services/graph-builder.service';
import { graphStorage } from '../../../core/storage/graph-storage.service';
import fs from 'fs/promises';
import { logger } from '../../../shared/utils/logger';

const log = logger.child('UploadController');

export class UploadController {
  /**
   * POST /api/organize/upload
   * Upload file and extract knowledge graph
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = req.requestId;
    let filePath: string | undefined;

    try {
      // Step 1: Validate file upload
      if (!req.file) {
        log.warn('No file uploaded', { requestId });
        res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
        return;
      }

      const file = req.file;
      filePath = file.path;

      log.info('Processing file upload', {
        requestId,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      // Step 2: Parse file to extract text
      log.debug('Parsing file', { requestId });
      const text = await fileParserService.parseFile(file.path, file.mimetype);

      // Step 3: Validate extracted text
      const validation = textProcessor.validateText(text);
      if (!validation.valid) {
        log.warn('Extracted text invalid', { requestId, error: validation.error });
        
        // Clean up uploaded file
        await this.cleanupFile(filePath, requestId);
        
        res.status(400).json({
          error: 'Bad Request',
          message: validation.error
        });
        return;
      }

      // Step 4: Chunk text
      const chunks = textProcessor.chunkText(text);
      log.debug('Text extracted and chunked', { 
        requestId, 
        textLength: text.length,
        chunkCount: chunks.length 
      });

      // Step 5: Call ML service
      log.debug('Calling ML service', { requestId });
      const mlResult = await mlClient.callExtractEndpoint(chunks, file.originalname);
      
      log.info('ML service response received', { 
        requestId,
        entityCount: mlResult.entities.length,
        relationshipCount: mlResult.relationships.length
      });

      // Step 6: Build graph
      log.debug('Building graph structure', { requestId });
      const graph = graphBuilder.buildGraph(
        mlResult.entities,
        mlResult.relationships,
        text
      );

      // Step 7: Save graph
      log.debug('Saving graph to storage', { requestId });
      const graphId = await graphStorage.saveGraph(graph);

      // Step 8: Clean up uploaded file
      await this.cleanupFile(filePath, requestId);

      // Step 9: Return response
      const duration = Date.now() - startTime;
      
      log.info('File processing completed successfully', {
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
          relationshipCount: graph.edges.length,
          filename: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        }
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      log.error('File processing failed', {
        requestId,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });

      // Clean up file if it exists
      if (filePath) {
        await this.cleanupFile(filePath, requestId);
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process uploaded file',
        details: error.message
      });
    }
  }

  /**
   * Clean up uploaded file
   */
  private async cleanupFile(filePath: string, requestId?: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      log.debug('Cleaned up uploaded file', { requestId, filePath });
    } catch (error: any) {
      log.warn('Failed to cleanup file', { 
        requestId, 
        filePath, 
        error: error.message 
      });
      // Don't throw - cleanup failure shouldn't break the request
    }
  }
}

export const uploadController = new UploadController();
