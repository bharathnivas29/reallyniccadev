import { Request, Response } from 'express';
import { fileParserService } from '../services/file-parser.service';
import { textProcessor } from '../services/text-processor.service';
import { mlClient } from '../../../core/ml/python-client.service';
import { graphBuilder } from '../services/graph-builder.service';
import { graphStorage } from '../../../core/storage/graph-storage.service';
import fs from 'fs/promises';

export class UploadController {
  /**
   * POST /api/organize/upload
   * Upload file and extract knowledge graph
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let filePath: string | undefined;

    try {
      // Step 1: Validate file upload
      if (!req.file) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
        return;
      }

      const file = req.file;
      filePath = file.path;

      console.log(`[Upload] Processing file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

      // Step 2: Parse file to extract text
      console.log('[Upload] Parsing file...');
      const text = await fileParserService.parseFile(file.path, file.mimetype);

      // Step 3: Validate extracted text
      const validation = textProcessor.validateText(text);
      if (!validation.valid) {
        // Clean up uploaded file
        await this.cleanupFile(filePath);
        
        res.status(400).json({
          error: 'Bad Request',
          message: validation.error
        });
        return;
      }

      // Step 4: Chunk text
      const chunks = textProcessor.chunkText(text);
      console.log(`[Upload] Created ${chunks.length} chunks from extracted text`);

      // Step 5: Call ML service
      console.log('[Upload] Calling ML service...');
      const mlResult = await mlClient.callExtractEndpoint(chunks, file.originalname);
      console.log(`[Upload] ML service returned ${mlResult.entities.length} entities, ${mlResult.relationships.length} relationships`);

      // Step 6: Build graph
      console.log('[Upload] Building graph...');
      const graph = graphBuilder.buildGraph(
        mlResult.entities,
        mlResult.relationships,
        text
      );

      // Step 7: Save graph
      console.log('[Upload] Saving graph...');
      const graphId = await graphStorage.saveGraph(graph);

      // Step 8: Clean up uploaded file
      await this.cleanupFile(filePath);

      // Step 9: Return response
      const duration = Date.now() - startTime;
      console.log(`[Upload] Complete in ${duration}ms - Graph ID: ${graphId}`);

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
      console.error(`[Upload] Failed after ${duration}ms:`, error.message);

      // Clean up file if it exists
      if (filePath) {
        await this.cleanupFile(filePath);
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
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`[Upload] Cleaned up file: ${filePath}`);
    } catch (error: any) {
      console.warn(`[Upload] Failed to cleanup file: ${error.message}`);
      // Don't throw - cleanup failure shouldn't break the request
    }
  }
}

export const uploadController = new UploadController();
