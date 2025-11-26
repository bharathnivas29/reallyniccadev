import axios from 'axios';

const API_URL = 'http://localhost:3000/api/organize/extract';

const testText = `
Artificial Intelligence (AI) is transforming technology. Machine Learning is a subset of AI.
Deep Learning uses neural networks. Google developed TensorFlow for ML applications.
OpenAI created GPT models for natural language processing. Python is the most popular language for AI.
`;

async function testExtractEndpoint() {
  console.log('='.repeat(80));
  console.log('TESTING EXTRACT ENDPOINT');
  console.log('='.repeat(80));
  console.log();
  console.log(`Input text: ${testText.trim().length} characters\n`);

  try {
    console.log('Sending POST request to', API_URL);
    console.log();

    const response = await axios.post(API_URL, { text: testText });

    console.log('✅ SUCCESS!\n');
    console.log('='.repeat(80));
    console.log('RESPONSE METADATA');
    console.log('='.repeat(80));
    console.log(`  Graph ID:         ${response.data.graphId}`);
    console.log(`  Processing Time:  ${response.data.metadata.processingTimeMs}ms`);
    console.log(`  Text Length:      ${response.data.metadata.textLength} chars`);
    console.log(`  Chunks:           ${response.data.metadata.chunkCount}`);
    console.log(`  Entities:         ${response.data.metadata.entityCount}`);
    console.log(`  Relationships:    ${response.data.metadata.relationshipCount}`);

    console.log('\n' + '='.repeat(80));
    console.log('TOP ENTITIES');
    console.log('='.repeat(80));
    response.data.graph.nodes.slice(0, 10).forEach((node: any, i: number) => {
      console.log(`  ${i + 1}. ${node.label} (${node.type})`);
      console.log(`     Confidence: ${node.confidence.toFixed(2)}, Importance: ${node.metadata?.importance?.toFixed(2) || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('TOP RELATIONSHIPS');
    console.log('='.repeat(80));
    response.data.graph.edges.slice(0, 10).forEach((edge: any, i: number) => {
      const source = response.data.graph.nodes.find((n: any) => n.id === edge.sourceId);
      const target = response.data.graph.nodes.find((n: any) => n.id === edge.targetId);
      console.log(`  ${i + 1}. ${source?.label} --[${edge.relationType || edge.type}]--> ${target?.label}`);
      console.log(`     Weight: ${edge.weight.toFixed(2)}, Confidence: ${edge.confidence.toFixed(2)}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(80));
    
    if (error.response) {
      console.log('\nServer Response:');
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Error: ${error.response.data.error}`);
      console.log(`  Message: ${error.response.data.message}`);
      if (error.response.data.details) {
        console.log(`  Details: ${error.response.data.details}`);
      }
    } else {
      console.log('\nError:', error.message);
      console.log('\nMake sure:');
      console.log('  1. Backend server is running (npm run dev)');
      console.log('  2. ML service is running (python -m uvicorn app.main:app --reload)');
    }
  }
}

testExtractEndpoint();
