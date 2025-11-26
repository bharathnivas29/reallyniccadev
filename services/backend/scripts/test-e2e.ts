import { textProcessor } from '../src/features/organize/services/text-processor.service';
import { mlClient } from '../src/core/ml/python-client.service';

const sampleText = `
Elon Musk is the CEO and founder of several groundbreaking companies. In 2003, he co-founded Tesla, Inc., 
an electric vehicle and clean energy company headquartered in Austin, Texas. Tesla has revolutionized the 
automotive industry with innovations in battery technology and autonomous driving.

In 2002, Musk founded SpaceX (Space Exploration Technologies Corp.), an aerospace manufacturer based in 
Hawthorne, California. SpaceX has achieved numerous milestones, including the first privately funded 
spacecraft to reach orbit and the development of reusable rocket technology. The company's Starship 
project aims to enable human colonization of Mars.

Musk also co-founded Neuralink in 2016, a neurotechnology company developing brain-computer interfaces. 
The company is working on implantable brain-machine interfaces to help people with paralysis and 
eventually enhance human cognitive abilities.

In addition to his business ventures, Musk acquired Twitter (now X) in 2022 for approximately $44 billion. 
He has been instrumental in advancing artificial intelligence research and has warned about the potential 
risks of uncontrolled AI development.

Born in Pretoria, South Africa in 1971, Musk moved to the United States to attend the University of 
Pennsylvania, where he earned degrees in economics and physics. His vision extends beyond Earth, with 
plans to establish a self-sustaining city on Mars by 2050.
`;

async function runEndToEndTest() {
  console.log('='.repeat(80));
  console.log('END-TO-END APPLICATION TEST');
  console.log('='.repeat(80));
  console.log('\n📝 Input Text:');
  console.log(`   Length: ${sampleText.length} characters`);
  console.log(`   Preview: ${sampleText.substring(0, 100).trim()}...\n`);

  try {
    // Step 1: Validate Text
    console.log('Step 1: Validating Text...');
    const validation = textProcessor.validateText(sampleText);
    if (!validation.valid) {
      console.error(`   ❌ Validation failed: ${validation.error}`);
      return;
    }
    console.log('   ✅ Text is valid\n');

    // Step 2: Clean Text
    console.log('Step 2: Cleaning Text...');
    const cleanedText = textProcessor.cleanText(sampleText);
    console.log(`   ✅ Cleaned: ${sampleText.length} → ${cleanedText.length} chars\n`);

    // Step 3: Chunk Text
    console.log('Step 3: Chunking Text...');
    const chunks = textProcessor.chunkText(sampleText);
    console.log(`   ✅ Created ${chunks.length} chunks`);
    chunks.forEach((chunk, i) => {
      console.log(`      Chunk ${i + 1}: ${chunk.length} chars`);
    });
    console.log();

    // Step 4: Check ML Service Health
    console.log('Step 4: Checking ML Service...');
    const isHealthy = await mlClient.healthCheck();
    if (!isHealthy) {
      console.error('   ❌ ML service is not running');
      console.error('   Start it with: cd services/ml-service && python -m uvicorn app.main:app --reload');
      return;
    }
    console.log('   ✅ ML service is healthy\n');

    // Step 5: Extract Entities and Relationships
    console.log('Step 5: Extracting Entities & Relationships...');
    const result = await mlClient.callExtractEndpoint(chunks, 'e2e_test_001');
    console.log(`   ✅ Extracted ${result.entities.length} entities`);
    console.log(`   ✅ Found ${result.relationships.length} relationships\n`);

    // Step 6: Display Results
    console.log('='.repeat(80));
    console.log('EXTRACTION RESULTS');
    console.log('='.repeat(80));

    // Display Entities by Type
    console.log('\n📊 ENTITIES BY TYPE:\n');
    const entitiesByType = result.entities.reduce((acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, typeof result.entities>);

    Object.entries(entitiesByType).forEach(([type, entities]) => {
      console.log(`   ${type} (${entities.length}):`);
      entities.slice(0, 5).forEach(entity => {
        console.log(`      • ${entity.name} (confidence: ${entity.confidence.toFixed(2)})`);
        if (entity.aliases.length > 0) {
          console.log(`        Aliases: ${entity.aliases.join(', ')}`);
        }
      });
      if (entities.length > 5) {
        console.log(`      ... and ${entities.length - 5} more`);
      }
      console.log();
    });

    // Display Top Relationships
    console.log('🔗 TOP RELATIONSHIPS:\n');
    result.relationships.slice(0, 10).forEach((rel, i) => {
      console.log(`   ${i + 1}. ${rel.sourceEntity} --[${rel.relationType || rel.type}]--> ${rel.targetEntity}`);
      console.log(`      Confidence: ${rel.confidence.toFixed(2)}, Weight: ${rel.weight.toFixed(2)}`);
      if (rel.examples.length > 0) {
        console.log(`      Example: "${rel.examples[0].substring(0, 80)}..."`);
      }
    });

    if (result.relationships.length > 10) {
      console.log(`\n   ... and ${result.relationships.length - 10} more relationships`);
    }

    // Summary Statistics
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY STATISTICS');
    console.log('='.repeat(80));
    console.log(`\n   Input:          ${sampleText.length} characters`);
    console.log(`   Chunks:         ${chunks.length}`);
    console.log(`   Entities:       ${result.entities.length}`);
    console.log(`   Relationships:  ${result.relationships.length}`);
    console.log(`   Entity Types:   ${Object.keys(entitiesByType).length}`);
    
    const avgConfidence = result.entities.reduce((sum, e) => sum + e.confidence, 0) / result.entities.length;
    console.log(`   Avg Confidence: ${avgConfidence.toFixed(2)}`);

    console.log('\n✅ END-TO-END TEST COMPLETED SUCCESSFULLY!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError Details:', error);
  }
}

runEndToEndTest();
