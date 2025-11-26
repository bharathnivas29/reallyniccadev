import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/organize';

// Example 1: Technology/AI Domain
const EXAMPLE_1 = `
Artificial Intelligence (AI) has revolutionized technology in the 21st century. Machine Learning, 
a subset of AI, enables computers to learn from data without explicit programming. Deep Learning, 
which uses neural networks, has achieved remarkable results in image recognition and natural language 
processing. Google developed TensorFlow in 2015, an open-source framework for machine learning. 
OpenAI, founded in 2015, created GPT (Generative Pre-trained Transformer) models that can generate 
human-like text. Python has become the dominant programming language for AI development due to its 
simplicity and extensive libraries like NumPy and PyTorch.
`;

// Example 2: Science/Physics Domain
const EXAMPLE_2 = `
Albert Einstein developed the theory of relativity in the early 20th century, fundamentally changing 
our understanding of space and time. His famous equation E=mc² established the relationship between 
mass and energy. Einstein received the Nobel Prize in Physics in 1921 for his work on the photoelectric 
effect. Quantum mechanics, developed by scientists including Niels Bohr and Werner Heisenberg, describes 
the behavior of matter at atomic scales. The Large Hadron Collider at CERN discovered the Higgs boson 
in 2012, confirming a key prediction of the Standard Model of particle physics.
`;

interface TestResult {
  example: number;
  title: string;
  graphId: string;
  processingTime: number;
  entityCount: number;
  relationshipCount: number;
  topEntities: string[];
  success: boolean;
  error?: string;
}

async function runComprehensiveTest() {
  console.log('='.repeat(100));
  console.log('COMPREHENSIVE END-TO-END TEST - STAGES 0-5');
  console.log('='.repeat(100));
  console.log();
  console.log('Testing complete pipeline:');
  console.log('  Stage 0-4: ML Service (Entity Extraction, Embeddings, Deduplication, Relationships)');
  console.log('  Stage 5.1-5.3: Backend (Server, ML Client, Text Processing)');
  console.log('  Stage 5.4: Graph Builder');
  console.log('  Stage 5.5: Graph Storage');
  console.log('  Stage 5.6: Text-to-Graph Endpoint');
  console.log('  Stage 5.7-5.8: Graph Retrieval Endpoints');
  console.log();
  console.log('='.repeat(100));
  console.log();

  const results: TestResult[] = [];

  // Test Example 1
  console.log('📝 EXAMPLE 1: Technology/AI Domain');
  console.log('-'.repeat(100));
  console.log(`Input: ${EXAMPLE_1.trim().substring(0, 100)}...`);
  console.log(`Length: ${EXAMPLE_1.trim().length} characters`);
  console.log();

  try {
    const start1 = Date.now();
    const response1 = await axios.post(`${BASE_URL}/extract`, { text: EXAMPLE_1 });
    const duration1 = Date.now() - start1;

    const topEntities1 = response1.data.graph.nodes
      .slice(0, 5)
      .map((n: any) => `${n.label} (${n.type})`);

    results.push({
      example: 1,
      title: 'Technology/AI Domain',
      graphId: response1.data.graphId,
      processingTime: duration1,
      entityCount: response1.data.metadata.entityCount,
      relationshipCount: response1.data.metadata.relationshipCount,
      topEntities: topEntities1,
      success: true
    });

    console.log('✅ EXAMPLE 1 - SUCCESS');
    console.log(`   Graph ID: ${response1.data.graphId}`);
    console.log(`   Processing Time: ${duration1}ms`);
    console.log(`   Entities: ${response1.data.metadata.entityCount}`);
    console.log(`   Relationships: ${response1.data.metadata.relationshipCount}`);
    console.log(`   Top Entities:`);
    topEntities1.forEach((e: string, i: number) => console.log(`      ${i + 1}. ${e}`));
    console.log();

    // Verify retrieval
    console.log('   Verifying graph retrieval...');
    const retrieved1 = await axios.get(`${BASE_URL}/graphs/${response1.data.graphId}`);
    console.log(`   ✅ Graph retrieved successfully (${retrieved1.data.graph.nodes.length} nodes)`);
    console.log();

  } catch (error: any) {
    console.log('❌ EXAMPLE 1 - FAILED');
    console.log(`   Error: ${error.message}`);
    results.push({
      example: 1,
      title: 'Technology/AI Domain',
      graphId: '',
      processingTime: 0,
      entityCount: 0,
      relationshipCount: 0,
      topEntities: [],
      success: false,
      error: error.message
    });
  }

  console.log('='.repeat(100));
  console.log();

  // Test Example 2
  console.log('📝 EXAMPLE 2: Science/Physics Domain');
  console.log('-'.repeat(100));
  console.log(`Input: ${EXAMPLE_2.trim().substring(0, 100)}...`);
  console.log(`Length: ${EXAMPLE_2.trim().length} characters`);
  console.log();

  try {
    const start2 = Date.now();
    const response2 = await axios.post(`${BASE_URL}/extract`, { text: EXAMPLE_2 });
    const duration2 = Date.now() - start2;

    const topEntities2 = response2.data.graph.nodes
      .slice(0, 5)
      .map((n: any) => `${n.label} (${n.type})`);

    results.push({
      example: 2,
      title: 'Science/Physics Domain',
      graphId: response2.data.graphId,
      processingTime: duration2,
      entityCount: response2.data.metadata.entityCount,
      relationshipCount: response2.data.metadata.relationshipCount,
      topEntities: topEntities2,
      success: true
    });

    console.log('✅ EXAMPLE 2 - SUCCESS');
    console.log(`   Graph ID: ${response2.data.graphId}`);
    console.log(`   Processing Time: ${duration2}ms`);
    console.log(`   Entities: ${response2.data.metadata.entityCount}`);
    console.log(`   Relationships: ${response2.data.metadata.relationshipCount}`);
    console.log(`   Top Entities:`);
    topEntities2.forEach((e: string, i: number) => console.log(`      ${i + 1}. ${e}`));
    console.log();

    // Verify retrieval
    console.log('   Verifying graph retrieval...');
    const retrieved2 = await axios.get(`${BASE_URL}/graphs/${response2.data.graphId}`);
    console.log(`   ✅ Graph retrieved successfully (${retrieved2.data.graph.nodes.length} nodes)`);
    console.log();

  } catch (error: any) {
    console.log('❌ EXAMPLE 2 - FAILED');
    console.log(`   Error: ${error.message}`);
    results.push({
      example: 2,
      title: 'Science/Physics Domain',
      graphId: '',
      processingTime: 0,
      entityCount: 0,
      relationshipCount: 0,
      topEntities: [],
      success: false,
      error: error.message
    });
  }

  console.log('='.repeat(100));
  console.log();

  // Test list all graphs
  console.log('📋 Testing List All Graphs Endpoint...');
  console.log('-'.repeat(100));
  try {
    const listResponse = await axios.get(`${BASE_URL}/graphs`);
    console.log(`✅ Found ${listResponse.data.count} total graphs in storage`);
    console.log();
  } catch (error: any) {
    console.log(`❌ List graphs failed: ${error.message}`);
    console.log();
  }

  // Summary
  console.log('='.repeat(100));
  console.log('TEST SUMMARY');
  console.log('='.repeat(100));
  console.log();

  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;

  console.log(`Overall: ${successCount}/${totalTests} tests passed`);
  console.log();

  results.forEach(result => {
    console.log(`Example ${result.example}: ${result.title}`);
    console.log(`  Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    if (result.success) {
      console.log(`  Graph ID: ${result.graphId}`);
      console.log(`  Processing Time: ${result.processingTime}ms`);
      console.log(`  Entities: ${result.entityCount}`);
      console.log(`  Relationships: ${result.relationshipCount}`);
    } else {
      console.log(`  Error: ${result.error}`);
    }
    console.log();
  });

  if (successCount === totalTests) {
    console.log('='.repeat(100));
    console.log('🎉 ALL TESTS PASSED! COMPLETE PIPELINE WORKING END-TO-END!');
    console.log('='.repeat(100));
  } else {
    console.log('='.repeat(100));
    console.log('⚠️  SOME TESTS FAILED');
    console.log('='.repeat(100));
  }
}

runComprehensiveTest();
