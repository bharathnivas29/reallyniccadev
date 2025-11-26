import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { Graph } from '@really-nicca/types';

// Define response types
interface ExtractResponse {
  graphId: string;
  graph: Graph;
}

interface GraphListResponse {
  graphId: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
  metadata?: any;
}

class OrganizeApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/organize', // Proxied by Vite to backend
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60s timeout for long extractions
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      if (import.meta.env.DEV) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ? { data: config.data } : '');
      }
      return config;
    });

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        if (import.meta.env.DEV) {
          console.log(`[API] Success ${response.status}`, response.data);
        }
        return response;
      },
      (error: AxiosError) => {
        // Always log errors, but maybe less verbose in prod
        console.error('[API] Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Extract a knowledge graph from raw text
   */
  async extractGraph(text: string): Promise<ExtractResponse> {
    try {
      const response: AxiosResponse<any> = await this.client.post('/extract', { text });
      // Backend returns: { success: true, graphId: string, graph: Graph, metadata: {...} }
      return {
        graphId: response.data.graphId || 'unknown',
        graph: response.data.graph
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific graph by ID
   */
  async getGraph(id: string): Promise<Graph> {
    try {
      const response: AxiosResponse<Graph> = await this.client.get(`/graphs/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List all saved graphs
   */
  async listGraphs(): Promise<GraphListResponse[]> {
    try {
      const response: AxiosResponse<GraphListResponse[]> = await this.client.get('/graphs');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload a file and extract graph
   */
  async uploadFile(file: File): Promise<ExtractResponse> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Send to backend /upload endpoint
      const response: AxiosResponse<any> = await this.client.post(
        '/upload', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000 // 2 minutes for file processing
        }
      );
      
      // Backend returns: { success: true, graphId: string, graph: Graph, metadata: {...} }
      return {
        graphId: response.data.graphId || 'unknown',
        graph: response.data.graph
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An unknown error occurred';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}

export const apiClient = new OrganizeApiClient();
