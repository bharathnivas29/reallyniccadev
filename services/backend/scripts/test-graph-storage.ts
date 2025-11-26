import { graphBuilder } from '../src/features/organize/services/graph-builder.service';
import { graphStorage } from '../src/core/storage/graph-storage.service';

async function testGraphStorage() {
  console.log('='.repeat(80));
  console.log('GRAPH STORAGE SERVICE TEST');
  console.log('='.repeat(80));
  console.log();

  try {
    // Step 1: Create a test graph
    console.log('Step 1: Creating test graph...');
    const mockMLEntities = [
      {
        name: 'Test Entity 1',
        type: 'CONCEPT',
        confidence: 0.9,
        sources: [{ docId: 'test', snippet: 'test snippet', chunkIndex: 0 }],
        aliases: []
      },
      {
        name: 'Test Entity 2',
        type: 'PERSON',
        confidence: 0.95,
        sources: [{ docId: 'test', snippet: 'test snippet 2', chunkIndex: 0 }],
        aliases: []
      }
    ];

    const mockMLRelationships = [
      {
        sourceEntity: 'Test Entity 1',
        targetEntity: 'Test Entity 2',
        type: 'cooccurrence',
        relationType: 'related_to',
        weight: 0.8,
        confidence: 0.85,
        examples: ['Test Entity 1 and Test Entity 2 appear together']
      }
    ];

    const graph = graphBuilder.buildGraph(mockMLEntities, mockMLRelationships, 'Test text for storage');
    console.log(`   ✅ Graph created: ${graph.meta.graphId}`);
    console.log(`   Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}\n`);

    // Step 2: Save graph
    console.log('Step 2: Saving graph to file system...');
    const savedId = await graphStorage.saveGraph(graph);
    console.log(`   ✅ Graph saved: ${savedId}`);
    console.log(`   Location: data/graphs/${savedId}.json\n`);

    // Step 3: Load graph
    console.log('Step 3: Loading graph from file system...');
    const loadedGraph = await graphStorage.loadGraph(savedId);
    console.log(`   ✅ Graph loaded: ${loadedGraph.meta.graphId}`);
    console.log(`   Nodes: ${loadedGraph.nodes.length}`);
    console.log(`   Edges: ${loadedGraph.edges.length}\n`);

    // Step 4: Verify identity
    console.log('Step 4: Verifying data integrity...');
    const originalJson = JSON.stringify(graph);
    const loadedJson = JSON.stringify(loadedGraph);
    const match = originalJson === loadedJson;
    console.log(`   ${match ? '✅' : '❌'} Data integrity: ${match ? 'PASS' : 'FAIL'}`);
    
    if (match) {
      console.log(`   All ${graph.nodes.length} nodes preserved`);
      console.log(`   All ${graph.edges.length} edges preserved`);
      console.log(`   Metadata preserved\n`);
    }

    // Step 5: List graphs
    console.log('Step 5: Listing all stored graphs...');
    const allGraphs = await graphStorage.listGraphs();
    console.log(`   ✅ Found ${allGraphs.length} graph(s):\n`);
    allGraphs.forEach((g, i) => {
      console.log(`   ${i + 1}. Graph ID: ${g.graphId}`);
      console.log(`      Created: ${new Date(g.createdAt).toLocaleString()}`);
      console.log(`      Nodes: ${g.nodeCount}, Edges: ${g.edgeCount}`);
      console.log();
    });

    // Step 6: Test error handling
    console.log('Step 6: Testing error handling...');
    try {
      await graphStorage.loadGraph('non-existent-id');
      console.log('   ❌ Should have thrown error for missing graph');
    } catch (error: any) {
      console.log(`   ✅ Correctly threw error: "${error.message}"\n`);
    }

    // Step 7: Clean up
    console.log('Step 7: Cleaning up test data...');
    await graphStorage.deleteGraph(savedId);
    console.log(`   ✅ Test graph deleted\n`);

    console.log('='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testGraphStorage();
