/**
 * PDF Service with OCR Fallback
 * - First tries text extraction (fast)
 * - Falls back to OCR for image-based PDFs using ImageMagick + Tesseract
 */
import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { fromBuffer } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import logger from '../utils/logger.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMETYPES = ['application/pdf'];

export class PDFService {
  /**
   * Validate file mimetype is PDF
   */
  validateFileType(mimetype: string): boolean {
    return ALLOWED_MIMETYPES.includes(mimetype);
  }

  /**
   * Validate file size
   */
  validateFileSize(sizeInBytes: number): boolean {
    return sizeInBytes <= MAX_FILE_SIZE;
  }

  /**
   * Extract text from PDF - tries text extraction first, then OCR
   */
  async extractText(buffer: Buffer): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty PDF buffer provided');
    }

    // Step 1: Try direct text extraction (fast)
    try {
      const data = await pdf(buffer);
      const extractedText = this.cleanExtractedText(data.text || '');
      
      if (extractedText.length >= 50) {
        logger.info('PDF text extracted directly', { textLength: extractedText.length });
        return extractedText;
      }
      logger.warn('Direct extraction returned insufficient text, trying OCR', { textLength: extractedText.length });
    } catch (error) {
      logger.warn('Direct text extraction failed, trying OCR', { error: (error as Error).message });
    }

    // Step 2: Fall back to OCR for image-based PDFs
    logger.info('Starting OCR extraction');
    return this.extractTextWithOCR(buffer);
  }

  /**
   * Convert PDF to images using ImageMagick and run OCR
   */
  private async extractTextWithOCR(buffer: Buffer): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `pdf-ocr-${Date.now()}`);
    
    try {
      // Create temp directory
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Convert PDF to images using pdf2pic (uses ImageMagick)
      const converter = fromBuffer(buffer, {
        density: 200,           // DPI for quality
        saveFilename: 'page',
        savePath: tempDir,
        format: 'png',
        width: 1600,
        height: 2200
      });

      // Convert first 3 pages max
      const pagesToProcess = 3;
      const allText: string[] = [];
      
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        logger.debug('Processing PDF page', { pageNum });
        
        try {
          const result = await converter(pageNum, { responseType: 'image' });
          
          if (!result.path) {
            logger.debug('Page not found, stopping', { pageNum });
            break;
          }
          
          // Run OCR on the image
          const ocrResult = await Tesseract.recognize(result.path, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text' && m.progress > 0) {
                logger.debug('OCR progress', { pageNum, progress: Math.round(m.progress * 100) });
              }
            }
          });
          
          allText.push(ocrResult.data.text);
          
          // Clean up the image file
          if (fs.existsSync(result.path)) {
            fs.unlinkSync(result.path);
          }
        } catch (pageError) {
          // Page doesn't exist, we've processed all pages
          logger.debug('Finished OCR at page', { lastPage: pageNum - 1 });
          break;
        }
      }

      const extractedText = this.cleanExtractedText(allText.join('\n\n'));

      if (extractedText.length < 50) {
        throw new Error(
          'OCR could not extract sufficient text. The PDF may be too low quality ' +
          'or contain non-text content. Please paste the text manually.'
        );
      }

      logger.info('OCR extraction successful', { textLength: extractedText.length });
      return extractedText;
    } catch (error) {
      logger.error('OCR Error', { error: (error as Error).message });
      if (error instanceof Error && error.message.includes('OCR could not')) {
        throw error;
      }
      throw new Error(
        'Failed to process the PDF. Please try uploading a clearer document ' +
        'or paste the text manually.'
      );
    } finally {
      // Cleanup temp directory
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')      // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
      .replace(/[ \t]+/g, ' ')     // Reduce multiple spaces
      .trim();
  }

  /**
   * Full validation before processing
   */
  validate(mimetype: string, sizeInBytes: number): { valid: boolean; error?: string } {
    if (!this.validateFileType(mimetype)) {
      return { valid: false, error: 'Only PDF files are accepted' };
    }

    if (!this.validateFileSize(sizeInBytes)) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const pdfService = new PDFService();
