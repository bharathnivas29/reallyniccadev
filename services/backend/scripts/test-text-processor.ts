import { textProcessor } from '../src/features/organize/services/text-processor.service';

const sampleText = `
This is the first paragraph. It contains multiple sentences. Each sentence should be preserved.

This is the second paragraph. It's separated by a blank line.

This is a very long paragraph that might need to be split into multiple chunks if it exceeds the maximum chunk size limit. ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}
`;

console.log('Testing Text Processor Service...\n');

// Test 1: Clean Text
console.log('1. Clean Text:');
const cleaned = textProcessor.cleanText(sampleText);
console.log(`   Original length: ${sampleText.length} chars`);
console.log(`   Cleaned length: ${cleaned.length} chars\n`);

// Test 2: Chunk Text
console.log('2. Chunk Text:');
const chunks = textProcessor.chunkText(sampleText);
console.log(`   Number of chunks: ${chunks.length}`);
chunks.forEach((chunk, i) => {
  console.log(`   Chunk ${i + 1}: ${chunk.length} chars`);
  console.log(`   Preview: ${chunk.substring(0, 80)}...\n`);
});

// Test 3: Validate Text
console.log('3. Validate Text:');
const validation = textProcessor.validateText(sampleText);
console.log(`   Valid: ${validation.valid}`);
if (!validation.valid) {
  console.log(`   Error: ${validation.error}`);
}

// Test 4: Edge Cases
console.log('\n4. Edge Cases:');

// Empty text
const emptyValidation = textProcessor.validateText('');
console.log(`   Empty text valid: ${emptyValidation.valid}`);

// Very long text
const longText = 'A'.repeat(100001);
const longValidation = textProcessor.validateText(longText);
console.log(`   Text > 100k chars valid: ${longValidation.valid}`);

console.log('\n✅ All tests completed!');
