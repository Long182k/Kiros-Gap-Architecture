/**
 * TDD: GREEN Phase - Hash utility implementation
 */
import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of resume + job description
 * Used for content-based caching (deduplication)
 */
export function generateContentHash(
  resumeText: string, 
  jobDescription: string
): string {
  const content = `${resumeText}|||${jobDescription}`;
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Validate if a string is a valid SHA-256 hash
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}
