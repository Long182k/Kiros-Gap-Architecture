/**
 * Gemini AI Provider - Factory Pattern
 * Gap Analysis Prompt Engineering
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// Interface for AI Provider (Dependency Inversion)
// ============================================

export interface AIProvider {
  analyze(resumeText: string, jobDescription: string): Promise<string>;
}

// ============================================
// System Prompts
// ============================================

export const SYSTEM_PROMPT = `You are a senior technical career coach and expert recruiter. Your task is to perform a precise "Gap Analysis" between a candidate's Resume and a Target Job Description.

INSTRUCTIONS:
1. Carefully analyze both the Resume and Job Description
2. Identify missing skills: Technical skills/technologies mentioned in the JD but NOT present in the Resume
3. Create 3 CONCRETE, ACTIONABLE learning steps to acquire the missing skills
4. Generate 3 targeted interview questions that could expose the identified gaps

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no explanation):
{
  "missingSkills": ["skill1", "skill2", "skill3"],
  "learningPath": [
    { "step": "Build a specific project using X", "resource": "https://example.com" },
    { "step": "Complete Y certification or tutorial", "resource": "optional url" },
    { "step": "Practice Z through hands-on exercises" }
  ],
  "interviewQuestions": [
    "Technical question targeting gap 1",
    "Technical question targeting gap 2",
    "Technical question targeting gap 3"
  ],
  "status": "COMPLETED"
}

RULES:
- missingSkills: List ALL skills from JD not found in Resume
- learningPath: EXACTLY 3 steps, each must be concrete (not generic like "learn Docker")
- interviewQuestions: EXACTLY 3 questions, targeting the specific gaps
- status: Always "COMPLETED" for successful analysis
- Resource URLs are optional but recommended`;

export const CORRECTION_PROMPT = (error: string) => `
Your previous response was invalid. Error: ${error}

Please provide a corrected response following the EXACT JSON format:
{
  "missingSkills": ["skill1", "skill2"],
  "learningPath": [
    { "step": "concrete action", "resource": "optional url" },
    { "step": "concrete action" },
    { "step": "concrete action" }
  ],
  "interviewQuestions": ["question1", "question2", "question3"],
  "status": "COMPLETED"
}

CRITICAL REQUIREMENTS:
- missingSkills: At least 1 skill (array of strings)
- learningPath: EXACTLY 3 objects with "step" key
- interviewQuestions: EXACTLY 3 strings
- status: Must be "COMPLETED"
- Return ONLY valid JSON, no markdown blocks
`;

// ============================================
// Gemini Provider Implementation
// ============================================

export class GeminiProvider implements AIProvider {
  private genAI?: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-2.5-flash') {
    this.model = model;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  private getClient(): GoogleGenerativeAI {
    if (this.genAI) return this.genAI;
    
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(key);
    return this.genAI;
  }

  async analyze(resumeText: string, jobDescription: string): Promise<string> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: this.model });

    const prompt = `${SYSTEM_PROMPT}

===== RESUME =====
${resumeText}

===== JOB DESCRIPTION =====
${jobDescription}

Analyze and return the JSON response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async analyzeWithCorrection(
    resumeText: string, 
    jobDescription: string,
    previousError: string
  ): Promise<string> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: this.model });

    const prompt = `${CORRECTION_PROMPT(previousError)}

===== RESUME =====
${resumeText}

===== JOB DESCRIPTION =====
${jobDescription}

Return ONLY the JSON:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

// ============================================
// Factory Function (allows easy switching)
// ============================================

export type AIProviderType = 'gemini';

export function createAIProvider(type: AIProviderType = 'gemini'): AIProvider {
  switch (type) {
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unknown AI provider type: ${type}`);
  }
}

// Export default provider
export const aiProvider = createAIProvider('gemini');
