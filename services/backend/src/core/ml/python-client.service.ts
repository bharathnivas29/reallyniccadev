import axios, { AxiosInstance } from 'axios';

interface ExtractRequest {
  textChunks: string[];
  docId: string;
}

interface EntitySourceSnippet {
  docId: string;
  snippet: string;
  chunkIndex: number;
}

interface ExtractedEntity {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'CONCEPT' | 'DATE' | 'PAPER' | 'LOCATION';
  confidence: number;
  sources: EntitySourceSnippet[];
  aliases: string[];
}

interface ExtractedRelationship {
  sourceEntity: string;
  targetEntity: string;
  type: string;
  relationType?: string;
  weight: number;
  confidence: number;
  examples: string[];
}

interface ExtractResponse {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

export class PythonMLClient {
  private client: AxiosInstance;
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  constructor() {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: mlServiceUrl,
      timeout: 120000, // 120 seconds (increased for Gemini API calls)
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Call ML service to extract entities and relationships from text chunks.
   * Includes retry logic for transient failures.
   */
  async callExtractEndpoint(
    textChunks: string[],
    docId: string
  ): Promise<ExtractResponse> {
    const request: ExtractRequest = { textChunks, docId };
    console.debug(`Calling ML service with ${textChunks.length} chunks for docId: ${docId}`);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.client.post<ExtractResponse>(
          '/organize/extract',
          request
        );
        const duration = Date.now() - startTime;
        console.debug(`ML service responded in ${duration}ms`);
        console.debug(`Extracted ${response.data.entities.length} entities, ${response.data.relationships.length} relationships`);
        
        return response.data;
      } catch (error: any) {
        const isLastAttempt = attempt === this.maxRetries - 1;
        
        // Don't retry on client errors (400)
        if (error.response?.status === 400) {
          console.error(`ML service rejected request: ${error.response.data.detail || error.message}`);
          throw new Error(`Invalid request to ML service: ${error.response.data.detail || error.message}`);
        }
        
        // Handle timeout errors explicitly
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          console.warn(`ML service timeout (attempt ${attempt + 1}/${this.maxRetries})`);
          if (isLastAttempt) {
            throw new Error(`ML service timeout after ${this.maxRetries} attempts. Consider increasing timeout or reducing text size.`);
          }
        }
        
        // Retry on server errors (500, 503) or network errors
        if (error.response?.status >= 500 || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          if (isLastAttempt) {
            console.error(`ML service unavailable after ${this.maxRetries} attempts`);
            console.error(`Error details:`, {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.message
            });
            throw new Error(`ML service unavailable after ${this.maxRetries} attempts: ${error.message}`);
          }
          
          // Exponential backoff
          const delay = this.baseDelay * Math.pow(2, attempt);
          console.log(`ML service error (attempt ${attempt + 1}/${this.maxRetries}), retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }
        
        // Unknown error, don't retry
        console.error(`ML service error: ${error.message}`);
        throw new Error(`ML service error: ${error.message}`);
      }
    }
    
    throw new Error('ML service call failed unexpectedly');
  }

  /**
   * Check if ML service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      const isHealthy = response.data.status === 'ok';
      console.debug(`ML service health check: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      return isHealthy;
    } catch (error) {
      console.warn('ML service health check failed:', error);
      return false;
    }
  }

  /**
   * Sleep for specified milliseconds (used for retry backoff)
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const mlClient = new PythonMLClient();
