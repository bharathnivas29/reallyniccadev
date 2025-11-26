import { mlClient } from '../src/core/ml/python-client.service';

async function testMLClient() {
  console.log('Testing ML Client Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const isHealthy = await mlClient.healthCheck();
    console.log(`   ML Service healthy: ${isHealthy}\n`);

    if (!isHealthy) {
      console.error('   ❌ ML service is not running. Start it with:');
      console.error('   cd services/ml-service && python -m uvicorn app.main:app --reload\n');
      return;
    }

    // Test 2: Extract Endpoint
    console.log('2. Testing extract endpoint...');
    const result = await mlClient.callExtractEndpoint(
      ['Google released Gemini 1.5 Pro yesterday. Python is popular for Machine Learning.'],
      'test_001'
    );

    console.log(`   ✅ Extracted ${result.entities.length} entities`);
    console.log(`   ✅ Found ${result.relationships.length} relationships\n`);

    // Display entities
    console.log('3. Entities:');
    result.entities.slice(0, 5).forEach(entity => {
      console.log(`   - ${entity.name} (${entity.type}) - confidence: ${entity.confidence.toFixed(2)}`);
    });

    // Display relationships
    if (result.relationships.length > 0) {
      console.log('\n4. Relationships:');
      result.relationships.slice(0, 3).forEach(rel => {
        console.log(`   - ${rel.sourceEntity} --[${rel.relationType || rel.type}]--> ${rel.targetEntity}`);
      });
    }

    console.log('\n✅ All tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testMLClient();
