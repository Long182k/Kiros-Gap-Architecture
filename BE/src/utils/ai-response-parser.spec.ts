/**
 * TDD: RED Phase - Tests for AI Response Parser
 * Handles Gemini API responses which may be malformed JSON or wrapped in markdown
 */
import { 
  parseAIResponse, 
  extractJSONFromMarkdown,
  sanitizeAIOutput 
} from './ai-response-parser.js';
import { GapAnalysisResultSchema } from '../schemas/analysis.schema.js';

describe('extractJSONFromMarkdown', () => {
  it('should extract JSON from ```json code block', () => {
    const markdown = `
Here is the analysis:

\`\`\`json
{"missingSkills": ["Docker"]}
\`\`\`

That's all!
    `;
    
    const result = extractJSONFromMarkdown(markdown);
    expect(result).toBe('{"missingSkills": ["Docker"]}');
  });

  it('should extract JSON from ``` code block without language specifier', () => {
    const markdown = `
\`\`\`
{"status": "COMPLETED"}
\`\`\`
    `;
    
    const result = extractJSONFromMarkdown(markdown);
    expect(result).toBe('{"status": "COMPLETED"}');
  });

  it('should return original string if no code block found', () => {
    const plainJson = '{"key": "value"}';
    const result = extractJSONFromMarkdown(plainJson);
    expect(result).toBe(plainJson);
  });

  it('should handle multiple code blocks and return the first JSON', () => {
    const markdown = `
\`\`\`json
{"first": true}
\`\`\`

\`\`\`json
{"second": true}
\`\`\`
    `;
    
    const result = extractJSONFromMarkdown(markdown);
    expect(result).toBe('{"first": true}');
  });
});

describe('sanitizeAIOutput', () => {
  it('should remove potential XSS from strings', () => {
    const result = sanitizeAIOutput({
      missingSkills: ['Docker', '<script>alert("xss")</script>']
    });
    
    expect(result.missingSkills[1]).not.toContain('<script>');
  });

  it('should trim whitespace from skill names', () => {
    const result = sanitizeAIOutput({
      missingSkills: ['  Docker  ', ' GraphQL ']
    });
    
    expect(result.missingSkills[0]).toBe('Docker');
    expect(result.missingSkills[1]).toBe('GraphQL');
  });

  it('should preserve valid content', () => {
    const input = {
      missingSkills: ['Docker', 'Kubernetes'],
      learningPath: [{ step: 'Learn Docker basics' }],
      interviewQuestions: ['What is Docker?']
    };
    
    const result = sanitizeAIOutput(input);
    expect(result.missingSkills).toEqual(['Docker', 'Kubernetes']);
  });
});

describe('parseAIResponse', () => {
  const validResult = {
    missingSkills: ['Docker', 'GraphQL'],
    learningPath: [
      { step: 'Build a CRUD app using Docker', resource: 'https://docker.com' },
      { step: 'Create a GraphQL API' },
      { step: 'Deploy to production' }
    ],
    interviewQuestions: [
      'Explain container orchestration',
      'How does GraphQL differ from REST?',
      'What is a Dockerfile?'
    ],
    status: 'COMPLETED'
  };

  it('should parse valid JSON response', () => {
    const jsonString = JSON.stringify(validResult);
    const { success, data } = parseAIResponse(jsonString, GapAnalysisResultSchema);
    
    expect(success).toBe(true);
    expect(data?.missingSkills).toContain('Docker');
  });

  it('should parse JSON wrapped in markdown code block', () => {
    const markdown = `
Here's your analysis:

\`\`\`json
${JSON.stringify(validResult)}
\`\`\`

Good luck!
    `;
    
    const { success, data } = parseAIResponse(markdown, GapAnalysisResultSchema);
    expect(success).toBe(true);
    expect(data?.learningPath).toHaveLength(3);
  });

  it('should return error for completely invalid JSON', () => {
    const { success, error } = parseAIResponse('not json at all', GapAnalysisResultSchema);
    
    expect(success).toBe(false);
    expect(error).toBeDefined();
  });

  it('should return error for JSON that fails schema validation', () => {
    const invalidResult = {
      missingSkills: [], // Empty - should fail
      learningPath: [{ step: 'Only one step' }], // Less than 3
      interviewQuestions: ['One question'],
      status: 'COMPLETED'
    };
    
    const { success, error } = parseAIResponse(
      JSON.stringify(invalidResult), 
      GapAnalysisResultSchema
    );
    
    expect(success).toBe(false);
    expect(error).toContain('validation');
  });

  it('should handle JSON with extra whitespace', () => {
    const jsonWithWhitespace = `
    
    ${JSON.stringify(validResult)}
    
    `;
    
    const { success } = parseAIResponse(jsonWithWhitespace, GapAnalysisResultSchema);
    expect(success).toBe(true);
  });
});
