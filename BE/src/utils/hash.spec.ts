/**
 * TDD: RED Phase - Tests for Hash Utility
 */
import { generateContentHash, isValidHash } from './hash.js';

describe('generateContentHash', () => {
  it('should generate consistent SHA-256 hash for same input', () => {
    const resume = 'Software Engineer with 5 years experience';
    const jd = 'Looking for a Senior Developer';
    
    const hash1 = generateContentHash(resume, jd);
    const hash2 = generateContentHash(resume, jd);
    
    expect(hash1).toBe(hash2);
  });

  it('should generate 64 character hex string (SHA-256)', () => {
    const hash = generateContentHash('resume', 'jd');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should generate different hash for different inputs', () => {
    const hash1 = generateContentHash('resume1', 'jd1');
    const hash2 = generateContentHash('resume2', 'jd2');
    
    expect(hash1).not.toBe(hash2);
  });

  it('should be order-sensitive (resume + jd !== jd + resume)', () => {
    const hash1 = generateContentHash('A', 'B');
    const hash2 = generateContentHash('B', 'A');
    
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty strings', () => {
    const hash = generateContentHash('', '');
    expect(hash).toHaveLength(64);
  });

  it('should handle unicode characters', () => {
    const hash = generateContentHash('日本語', '한국어');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('isValidHash', () => {
  it('should return true for valid 64-char hex string', () => {
    const validHash = 'a'.repeat(64);
    expect(isValidHash(validHash)).toBe(true);
  });

  it('should return false for hash with wrong length', () => {
    expect(isValidHash('abc')).toBe(false);
    expect(isValidHash('a'.repeat(63))).toBe(false);
    expect(isValidHash('a'.repeat(65))).toBe(false);
  });

  it('should return false for non-hex characters', () => {
    expect(isValidHash('g'.repeat(64))).toBe(false);
    expect(isValidHash('Z'.repeat(64))).toBe(false);
  });
});
