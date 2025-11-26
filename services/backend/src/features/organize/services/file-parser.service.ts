import fs from 'fs/promises';
import mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

/**
 * Service for parsing different file types and extracting text content
 */
class FileParserService {
  /**
   * Parse a file and extract text content based on its MIME type
   * @param filePath - Absolute path to the uploaded file
   * @param mimetype - MIME type of the file
   * @returns Extracted text content
   */
  async parseFile(filePath: string, mimetype: string): Promise<string> {
    console.log(`[FileParser] Parsing file: ${filePath}, type: ${mimetype}`);

    switch (mimetype) {
      case 'application/pdf':
        return await this.parsePDF(filePath);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.parseDOCX(filePath);
      
      case 'text/plain':
        return await this.parseTXT(filePath);
      
      default:
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
  }

  /**
   * Extract text from PDF file using pdf-parse
   */
  private async parsePDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF contains no extractable text. It may be scanned or image-based.');
      }

      console.log(`[FileParser] Extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error: any) {
      console.error('[FileParser] PDF parsing error:', error.message);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX file using mammoth
   */
  private async parseDOCX(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no extractable text');
      }

      // Log any warnings from mammoth
      if (result.messages && result.messages.length > 0) {
        console.warn('[FileParser] DOCX parsing warnings:', result.messages);
      }

      console.log(`[FileParser] Extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error: any) {
      console.error('[FileParser] DOCX parsing error:', error.message);
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Read plain text file
   */
  private async parseTXT(filePath: string): Promise<string> {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      
      if (!text || text.trim().length === 0) {
        throw new Error('Text file is empty');
      }

      console.log(`[FileParser] Read ${text.length} characters from TXT file`);
      return text;
    } catch (error: any) {
      console.error('[FileParser] TXT reading error:', error.message);
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }
}

export const fileParserService = new FileParserService();
