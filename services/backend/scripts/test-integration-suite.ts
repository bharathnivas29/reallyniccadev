import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/organize';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

async function runIntegrationTests() {
  console.log('='.repeat(100));
  console.log('INTEGRATION TEST SUITE - E2E GRAPH EXTRACTION');
  console.log('='.repeat(100));
  console.log();

  const results: TestResult[] = [];

  // Test 1: Simple Text → Graph
  console.log('Test 1: Simple Text → Graph');
  console.log('-'.repeat(100));
  try {
    const text = 'Apple Inc. was founded by Steve Jobs in California.';
    const response = await axios.post(`${BASE_URL}/extract`, { text });
    
    const passed = response.status === 200 &&
                   response.data.success === true &&
                   response.data.graph.nodes.length > 0;
    
    const labels = response.data.graph.nodes.map((n: any) => n.label);
    const hasApple = labels.some((l: string) => l.includes('Apple'));
    const hasSteve = labels.some((l: string) => l.includes('Steve') || l.includes('Jobs'));
    
    if (passed && hasApple && hasSteve) {
      console.log('✅ PASS - Extracted entities from simple text');
      console.log(`   Entities found: ${response.data.graph.nodes.length}`);
      console.log(`   Sample entities: ${labels.slice(0, 3).join(', ')}`);
      results.push({ name: 'Simple Text → Graph', passed: true });
    } else {
      throw new Error('Expected entities not found');
    }
  } catch (error: any) {
    console.log(`❌ FAIL - ${error.message}`);
    results.push({ name: 'Simple Text → Graph', passed: false, error: error.message });
  }
  console.log();

  // Test 2: Technical Text with Entities
  console.log('Test 2: Technical Text with Entities');
  console.log('-'.repeat(100));
  try {
    const text = 'Machine Learning uses neural networks for pattern recognition. Deep Learning is a subset of AI.';
    const response = await axios.post(`${BASE_URL}/extract`, { text });
    
    const concepts = response.data.graph.nodes.filter((n: any) => n.type === 'CONCEPT');
    
    if (response.status === 200 && concepts.length > 0) {
      console.log('✅ PASS - Extracted and typed technical entities');
      console.log(`   Total entities: ${response.data.graph.nodes.length}`);
      console.log(`   CONCEPT entities: ${concepts.length}`);
      results.push({ name: 'Technical Text with Entities', passed: true });
    } else {
      throw new Error('No CONCEPT entities found');
    }
  } catch (error: any) {
    console.log(`❌ FAIL - ${error.message}`);
    results.push({ name: 'Technical Text with Entities', passed: false, error: error.message });
  }
  console.log();

  // Test 3: Text with Relationships
  console.log('Test 3: Text with Relationships');
  console.log('-'.repeat(100));
  try {
    const text = 'Google developed TensorFlow. OpenAI created GPT. Microsoft owns GitHub.';
    const response = await axios.post(`${BASE_URL}/extract`, { text });
    
    if (response.status === 200 && response.data.graph.edges.length > 0) {
      console.log('✅ PASS - Detected relationships between entities');
      console.log(`   Relationships found: ${response.data.graph.edges.length}`);
      results.push({ name: 'Text with Relationships', passed: true });
    } else {
      throw new Error('No relationships detected');
    }
  } catch (error: any) {
    console.log(`❌ FAIL - ${error.message}`);
    results.push({ name: 'Text with Relationships', passed: false, error: error.message });
  }
  console.log();

  // Test 4: Deduplication Works
  console.log('Test 4: Deduplication Works');
  console.log('-'.repeat(100));
  try {
    const text = 'AI is powerful. Artificial Intelligence is the future. A.I. will change everything. AI systems are advancing.';
    const response = await axios.post(`${BASE_URL}/extract`, { text });
    
    const aiEntities = response.data.graph.nodes.filter((n: any) => 
      n.label.toLowerCase().includes('artificial') || 
      n.label.toLowerCase() === 'ai' ||
      n.label.toLowerCase() === 'a.i.'
    );
    
    if (response.status === 200 && aiEntities.length <= 2) {
      console.log('✅ PASS - Deduplication working');
      console.log(`   AI-related entities merged to: ${aiEntities.length}`);
      console.log(`   Entities: ${aiEntities.map((e: any) => e.label).join(', ')}`);
      results.push({ name: 'Deduplication Works', passed: true });
    } else {
      throw new Error(`Too many AI entities: ${aiEntities.length}`);
    }
  } catch (error: any) {
    console.log(`❌ FAIL - ${error.message}`);
    results.push({ name: 'Deduplication Works', passed: false, error: error.message });
  }
  console.log();

  // Test 5: Error Handling - Empty Text
  console.log('Test 5: Error Handling - Empty Text');
  console.log('-'.repeat(100));
  try {
    await axios.post(`${BASE_URL}/extract`, { text: '' });
    console.log('❌ FAIL - Should have rejected empty text');
    results.push({ name: 'Error Handling - Empty', passed: false, error: 'Did not reject empty text' });
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      console.log('✅ PASS - Correctly rejected empty text');
      results.push({ name: 'Error Handling - Empty', passed: true });
    } else {
      console.log(`❌ FAIL - Wrong error: ${error.message}`);
      results.push({ name: 'Error Handling - Empty', passed: false, error: error.message });
    }
  }
  console.log();

  // Test 6: Error Handling - Too Short
  console.log('Test 6: Error Handling - Too Short');
  console.log('-'.repeat(100));
  try {
    await axios.post(`${BASE_URL}/extract`, { text: 'Hi' });
    console.log('❌ FAIL - Should have rejected short text');
    results.push({ name: 'Error Handling - Short', passed: false, error: 'Did not reject short text' });
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      console.log('✅ PASS - Correctly rejected short text');
      results.push({ name: 'Error Handling - Short', passed: true });
    } else {
      console.log(`❌ FAIL - Wrong error: ${error.message}`);
      results.push({ name: 'Error Handling - Short', passed: false, error: error.message });
    }
  }
  console.log();

  // Test 7: Error Handling - Missing Field
  console.log('Test 7: Error Handling - Missing Field');
  console.log('-'.repeat(100));
  try {
    await axios.post(`${BASE_URL}/extract`, {});
    console.log('❌ FAIL - Should have rejected missing text field');
    results.push({ name: 'Error Handling - Missing', passed: false, error: 'Did not reject missing field' });
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      console.log('✅ PASS - Correctly rejected missing text field');
      results.push({ name: 'Error Handling - Missing', passed: true });
    } else {
      console.log(`❌ FAIL - Wrong error: ${error.message}`);
      results.push({ name: 'Error Handling - Missing', passed: false, error: error.message });
    }
  }
  console.log();

  // Summary
  console.log('='.repeat(100));
  console.log('TEST SUMMARY');
  console.log('='.repeat(100));
  console.log();

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`         ${result.error}`);
    }
  });

  console.log();
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log();

  if (passed === total) {
    console.log('='.repeat(100));
    console.log('🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('='.repeat(100));
  } else {
    console.log('='.repeat(100));
    console.log('⚠️  SOME TESTS FAILED');
    console.log('='.repeat(100));
  }
}

runIntegrationTests();
