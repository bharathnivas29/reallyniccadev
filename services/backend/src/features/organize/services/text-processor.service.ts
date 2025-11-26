export class TextProcessorService {
  private readonly maxChunkSize: number;
  private readonly minChunkSize: number;

  constructor(maxChunkSize: number = 4000, minChunkSize: number = 100) {
    this.maxChunkSize = maxChunkSize;
    this.minChunkSize = minChunkSize;
  }

  /**
   * Clean and normalize text
   * - Remove excessive whitespace
   * - Normalize line breaks
   * - Trim leading/trailing whitespace
   */
  cleanText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/\r\n/g, '\n')           // Normalize line breaks
      .replace(/\t/g, ' ')              // Replace tabs with spaces
      .replace(/ +/g, ' ')              // Collapse multiple spaces
      .replace(/\n{3,}/g, '\n\n')       // Max 2 consecutive newlines
      .trim();                          // Remove leading/trailing whitespace
  }

  /**
   * Split text into chunks while preserving sentence boundaries
   * - Splits by paragraphs first
   * - Then by sentences if needed
   * - Ensures chunks don't exceed maxChunkSize
   */
  chunkText(text: string): string[] {
    const cleanedText = this.cleanText(text);
    
    if (!cleanedText) {
      return [];
    }

    // If text is small enough, return as single chunk
    if (cleanedText.length <= this.maxChunkSize) {
      console.debug(`Text fits in single chunk (${cleanedText.length} chars)`);
      return [cleanedText];
    }

    console.debug(`Chunking text: ${cleanedText.length} chars, max chunk size: ${this.maxChunkSize}`);
    const chunks: string[] = [];
    
    // Split by paragraphs (double newline)
    const paragraphs = cleanedText.split(/\n\n+/);
    console.debug(`Split into ${paragraphs.length} paragraphs`);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (!trimmedParagraph) {
        continue;
      }

      // If paragraph itself is too large, split by sentences
      if (trimmedParagraph.length > this.maxChunkSize) {
        // Save current chunk if exists
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          console.debug(`Saved chunk ${chunks.length}: ${currentChunk.length} chars`);
          currentChunk = '';
        }
        
        // Split large paragraph into sentences
        const sentences = this.splitIntoSentences(trimmedParagraph);
        console.debug(`Large paragraph split into ${sentences.length} sentences`);
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 > this.maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              console.debug(`Saved chunk ${chunks.length}: ${currentChunk.length} chars`);
            }
            currentChunk = sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        // Check if adding this paragraph exceeds limit
        if (currentChunk.length + trimmedParagraph.length + 2 > this.maxChunkSize) {
          // Save current chunk and start new one
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            console.debug(`Saved chunk ${chunks.length}: ${currentChunk.length} chars`);
          }
          currentChunk = trimmedParagraph;
        } else {
          // Add to current chunk
          currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
        }
      }
    }
    
    // Add final chunk
    if (currentChunk && currentChunk.trim().length >= this.minChunkSize) {
      chunks.push(currentChunk.trim());
      console.debug(`Saved final chunk ${chunks.length}: ${currentChunk.length} chars`);
    }
    
    const filteredChunks = chunks.filter(chunk => chunk.length >= this.minChunkSize);
    console.debug(`Chunking complete: ${filteredChunks.length} chunks (filtered from ${chunks.length})`);
    
    return filteredChunks;
  }

  /**
   * Split text into sentences using basic punctuation rules
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space or newline
    const sentenceRegex = /([.!?]+)(\s+|$)/g;
    const sentences: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentence = text.substring(lastIndex, match.index + match[1].length).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text if any
    const remaining = text.substring(lastIndex).trim();
    if (remaining) {
      sentences.push(remaining);
    }

    return sentences;
  }

  /**
   * Validate text input
   */
  validateText(text: string): { valid: boolean; error?: string } {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'Text must be a non-empty string' };
    }

    const cleaned = this.cleanText(text);
    
    if (cleaned.length === 0) {
      return { valid: false, error: 'Text is empty after cleaning' };
    }

    if (cleaned.length < 10) {
      return { valid: false, error: 'Text must be at least 10 characters long' };
    }

    if (cleaned.length > 100000) {
      return { valid: false, error: 'Text exceeds maximum length of 100,000 characters' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const textProcessor = new TextProcessorService();
