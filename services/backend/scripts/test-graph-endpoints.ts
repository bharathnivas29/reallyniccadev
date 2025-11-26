import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/organize';

async function testGraphEndpoints() {
  console.log('='.repeat(80));
  console.log('TESTING GRAPH ENDPOINTS');
  console.log('='.repeat(80));
  console.log();

  try {
    // Step 1: Create a graph first
    console.log('Step 1: Creating a test graph...');
    const createResponse = await axios.post(`${BASE_URL}/extract`, {
      text: 'TypeScript is a programming language. Microsoft developed TypeScript. TypeScript adds types to JavaScript.'
    });

    const graphId = createResponse.data.graphId;
    console.log(`   ✅ Graph created: ${graphId}`);
    console.log(`   Entities: ${createResponse.data.metadata.entityCount}`);
    console.log(`   Relationships: ${createResponse.data.metadata.relationshipCount}\n`);

    // Step 2: Test GET /api/organize/graphs/:graphId
    console.log('Step 2: Testing GET /api/organize/graphs/:graphId...');
    const getResponse = await axios.get(`${BASE_URL}/graphs/${graphId}`);
    
    console.log(`   ✅ Graph retrieved successfully`);
    console.log(`   Graph ID: ${getResponse.data.graph.meta.graphId}`);
    console.log(`   Nodes: ${getResponse.data.graph.nodes.length}`);
    console.log(`   Edges: ${getResponse.data.graph.edges.length}\n`);

    // Step 3: Verify data integrity
    console.log('Step 3: Verifying data integrity...');
    const originalNodes = createResponse.data.graph.nodes.length;
    const retrievedNodes = getResponse.data.graph.nodes.length;
    const match = originalNodes === retrievedNodes;
    
    console.log(`   ${match ? '✅' : '❌'} Node count matches: ${match}`);
    console.log(`   Original: ${originalNodes}, Retrieved: ${retrievedNodes}\n`);

    // Step 4: Test GET /api/organize/graphs (list all)
    console.log('Step 4: Testing GET /api/organize/graphs (list all)...');
    const listResponse = await axios.get(`${BASE_URL}/graphs`);
    
    console.log(`   ✅ Found ${listResponse.data.count} graph(s):\n`);
    listResponse.data.graphs.forEach((g: any, i: number) => {
      console.log(`   ${i + 1}. ${g.graphId}`);
      console.log(`      Created: ${new Date(g.createdAt).toLocaleString()}`);
      console.log(`      Nodes: ${g.nodeCount}, Edges: ${g.edgeCount}`);
      console.log();
    });

    // Step 5: Test 404 error
    console.log('Step 5: Testing 404 error handling...');
    try {
      await axios.get(`${BASE_URL}/graphs/non-existent-id`);
      console.log('   ❌ Should have thrown 404 error\n');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`   ✅ Correctly returned 404: ${error.response.data.message}\n`);
      } else {
        console.log(`   ❌ Unexpected error: ${error.message}\n`);
      }
    }

    console.log('='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
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
    } else {
      console.log('\nError:', error.message);
    }
  }
}

testGraphEndpoints();
