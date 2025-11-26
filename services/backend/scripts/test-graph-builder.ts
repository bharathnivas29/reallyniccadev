import { graphBuilder } from '../src/features/organize/services/graph-builder.service';

const mockMLEntities = [
  {
    name: 'Elon Musk',
    type: 'PERSON',
    confidence: 0.99,
    sources: [
      { docId: 'test_001', snippet: 'Elon Musk is the CEO...', chunkIndex: 0 }
    ],
    aliases: []
  },
  {
    name: 'Tesla',
    type: 'ORGANIZATION',
    confidence: 0.98,
    sources: [
      { docId: 'test_001', snippet: 'Tesla is an electric vehicle company...', chunkIndex: 0 }
    ],
    aliases: ['Tesla Inc.']
  },
  {
    name: 'SpaceX',
    type: 'ORGANIZATION',
    confidence: 0.98,
    sources: [
      { docId: 'test_001', snippet: 'SpaceX develops rockets...', chunkIndex: 0 }
    ],
    aliases: []
  },
  {
    name: 'Austin',
    type: 'LOCATION',
    confidence: 0.95,
    sources: [
      { docId: 'test_001', snippet: 'Tesla is headquartered in Austin...', chunkIndex: 0 }
    ],
    aliases: []
  }
];

const mockMLRelationships = [
  {
    sourceEntity: 'Elon Musk',
    targetEntity: 'Tesla',
    type: 'cooccurrence',
    relationType: 'founded',
    weight: 0.9,
    confidence: 0.95,
    examples: ['Elon Musk founded Tesla']
  },
  {
    sourceEntity: 'Elon Musk',
    targetEntity: 'SpaceX',
    type: 'cooccurrence',
    relationType: 'founded',
    weight: 0.9,
    confidence: 0.95,
    examples: ['Elon Musk founded SpaceX']
  },
  {
    sourceEntity: 'Tesla',
    targetEntity: 'Austin',
    type: 'cooccurrence',
    relationType: 'located_in',
    weight: 0.8,
    confidence: 0.9,
    examples: ['Tesla is located in Austin']
  }
];

console.log('Testing Graph Builder Service...\n');

const graph = graphBuilder.buildGraph(
  mockMLEntities,
  mockMLRelationships,
  'Sample text about Elon Musk, Tesla, SpaceX, and Austin'
);

console.log('✅ Graph Built Successfully!\n');
console.log('Graph ID:', graph.meta.graphId);
console.log('Created At:', graph.meta.createdAt);
console.log('Source Text Preview:', graph.meta.sourceText);
console.log('\n📊 Statistics:');
console.log(`   Nodes: ${graph.nodes.length}`);
console.log(`   Edges: ${graph.edges.length}`);

console.log('\n🔵 Nodes:');
graph.nodes.forEach(node => {
  console.log(`   • ${node.label} (${node.type})`);
  console.log(`     ID: ${node.id}`);
  console.log(`     Confidence: ${node.confidence.toFixed(2)}`);
  console.log(`     Importance: ${node.metadata?.importance?.toFixed(2)}`);
  if (node.aliases.length > 0) {
    console.log(`     Aliases: ${node.aliases.join(', ')}`);
  }
  console.log();
});

console.log('🔗 Edges:');
graph.edges.forEach(edge => {
  const source = graph.nodes.find(n => n.id === edge.sourceId);
  const target = graph.nodes.find(n => n.id === edge.targetId);
  console.log(`   • ${source?.label} --[${edge.relationType}]--> ${target?.label}`);
  console.log(`     ID: ${edge.id}`);
  console.log(`     Weight: ${edge.weight.toFixed(2)}, Confidence: ${edge.confidence.toFixed(2)}`);
  console.log();
});

console.log('✅ All tests completed!');
