import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/organize';

describe('E2E Graph Extraction Integration Tests', () => {
  
  describe('Test 1: Simple Text → Graph', () => {
    it('should extract entities from simple text', async () => {
      const text = 'Apple Inc. was founded by Steve Jobs in California.';
      const response = await axios.post(`${BASE_URL}/extract`, { text });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.graph.nodes.length).toBeGreaterThan(0);
      
      // Should extract: Apple Inc., Steve Jobs, California
      const labels = response.data.graph.nodes.map((n: any) => n.label);
      expect(labels.some((l: string) => l.includes('Apple'))).toBe(true);
      expect(labels.some((l: string) => l.includes('Steve') || l.includes('Jobs'))).toBe(true);
    });
  });

  describe('Test 2: Technical Text with Entities', () => {
    it('should extract and type technical entities', async () => {
      const text = 'Machine Learning uses neural networks for pattern recognition. Deep Learning is a subset of AI.';
      const response = await axios.post(`${BASE_URL}/extract`, { text });
      
      expect(response.status).toBe(200);
      expect(response.data.graph.nodes.length).toBeGreaterThan(0);
      
      // Should have CONCEPT type entities
      const concepts = response.data.graph.nodes.filter((n: any) => n.type === 'CONCEPT');
      expect(concepts.length).toBeGreaterThan(0);
    });
  });

  describe('Test 3: Text with Relationships', () => {
    it('should detect relationships between entities', async () => {
      const text = 'Google developed TensorFlow. OpenAI created GPT. Microsoft owns GitHub.';
      const response = await axios.post(`${BASE_URL}/extract`, { text });
      
      expect(response.status).toBe(200);
      expect(response.data.graph.edges.length).toBeGreaterThan(0);
      
      // Should have relationships
      expect(response.data.metadata.relationshipCount).toBeGreaterThan(0);
    });
  });

  describe('Test 4: Deduplication Works', () => {
    it('should merge similar entities', async () => {
      const text = 'AI is powerful. Artificial Intelligence is the future. A.I. will change everything. AI systems are advancing.';
      const response = await axios.post(`${BASE_URL}/extract`, { text });
      
      expect(response.status).toBe(200);
      
      // Should deduplicate AI/A.I./Artificial Intelligence
      const aiEntities = response.data.graph.nodes.filter((n: any) => 
        n.label.toLowerCase().includes('artificial') || 
        n.label.toLowerCase() === 'ai' ||
        n.label.toLowerCase() === 'a.i.'
      );
      
      // Should be merged into 1-2 entities max (deduplication working)
      expect(aiEntities.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Test 5: Error Handling', () => {
    it('should reject empty text', async () => {
      try {
        await axios.post(`${BASE_URL}/extract`, { text: '' });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Bad Request');
      }
    });

    it('should reject text that is too short', async () => {
      try {
        await axios.post(`${BASE_URL}/extract`, { text: 'Hi' });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject missing text field', async () => {
      try {
        await axios.post(`${BASE_URL}/extract`, {});
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('text');
      }
    });
  });
});
