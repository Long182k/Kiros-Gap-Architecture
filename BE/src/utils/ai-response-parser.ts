/**
 * TDD: GREEN Phase - AI Response Parser implementation
 * Handles malformed AI responses gracefully
 */
import { z, ZodSchema } from 'zod';

/**
 * Extract JSON from markdown code blocks
 * AI often wraps JSON in ```json or ``` blocks
 */
export function extractJSONFromMarkdown(text: string): string {
  const trimmed = text.trim();
  
  // Try to find JSON in code blocks: ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = trimmed.match(codeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return trimmed;
}

/**
 * Sanitize AI output to prevent XSS and clean data
 */
export function sanitizeAIOutput<T extends Record<string, unknown>>(data: T): T {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  };

  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return sanitizeString(value);
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      return sanitizeAIOutput(value as Record<string, unknown>);
    }
    return value;
  };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = sanitizeValue(value);
  }
  
  return result as T;
}

interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Parse and validate AI response with Zod schema
 * Handles markdown wrapping, malformed JSON, and validation errors
 */
export function parseAIResponse<T>(
  response: string,
  schema: ZodSchema<T>
): ParseResult<T> {
  try {
    // Step 1: Extract JSON from markdown if present
    const jsonString = extractJSONFromMarkdown(response);
    
    // Step 2: Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return {
        success: false,
        error: `JSON parse error: Invalid JSON syntax`
      };
    }
    
    // Step 3: Sanitize the output
    if (parsed && typeof parsed === 'object') {
      parsed = sanitizeAIOutput(parsed as Record<string, unknown>);
    }
    
    // Step 4: Validate against schema
    const validationResult = schema.safeParse(parsed);
    
    if (!validationResult.success) {
      const issues = validationResult.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      return {
        success: false,
        error: `Schema validation failed: ${issues}`
      };
    }
    
    return {
      success: true,
      data: validationResult.data
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected parsing error: ${err instanceof Error ? err.message : 'Unknown'}`
    };
  }
}

/**
 * Generate a correction prompt for retrying with AI
 * Used when initial response fails validation
 */
export function generateCorrectionPrompt(
  originalPrompt: string,
  error: string
): string {
  return `
Your previous response was invalid. Error: ${error}

Please provide a corrected response following the EXACT JSON format:
{
  "missingSkills": ["skill1", "skill2", ...],
  "learningPath": [
    { "step": "concrete action step 1", "resource": "optional url" },
    { "step": "concrete action step 2", "resource": "optional url" },
    { "step": "concrete action step 3" }
  ],
  "interviewQuestions": [
    "question 1 targeting the gap",
    "question 2 targeting the gap", 
    "question 3 targeting the gap"
  ],
  "status": "COMPLETED"
}

IMPORTANT:
- missingSkills: At least 1 skill
- learningPath: EXACTLY 3 steps with concrete actions
- interviewQuestions: EXACTLY 3 questions
- status: Must be "COMPLETED" or "FAILED"
- Return ONLY valid JSON, no markdown or explanation

Original request:
${originalPrompt}
  `.trim();
}
