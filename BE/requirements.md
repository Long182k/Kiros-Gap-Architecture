Project Spec: Career Gap Architect (Backend)
1. Context & Objective
We are building the backend for "Career Gap Architect", an MVP that ingests a User's Resume and a Target Job Description (JD), utilizing Generative AI (Gemini) to perform a "Gap Analysis."

The system must identify missing skills, generate concrete learning steps, and create targeted interview questions. The architecture must be robust, scalable, and follow strict engineering constraints (Caching, Validation, Queues).

2. Technical Stack
Runtime: Node.js (v20+)

Framework: Express.js

Language: TypeScript (Strict Mode)

Database: PostgreSQL

Caching/Queue: Redis (via BullMQ)

AI Provider: Google Gemini API

Validation: Zod

Testing: Jest + Supertest (TDD Approach)

3. Architecture Patterns
Follow the Antigravity Backend Specialist guidelines. The code must be modularized into three distinct layers:

Controller Layer (/controllers): Handles HTTP requests, validates DTOs using Zod, and sends responses. No business logic here.

Service Layer (/services): Contains business logic, interacts with AI providers, handles Caching strategies, and orchestrates calls to the Repository.

Repository Layer (/repositories): Direct abstraction over the ORM/Database. No complex logic, just data access.

Additional Patterns
Queue/Worker: Heavy AI computation must be offloaded to a background worker (BullMQ).

Factory Pattern: For initializing the AI Provider (allow easy switching of models later, though Gemini is hardcoded for now).

Dependency Injection: Ensure services are injectable for easier mocking in TDD.

4. Core Features & Logic
A. The "Semantic Diff" & Validation Engine
Endpoint: POST /api/v1/analysis

Input: Accepts JSON { resumeText: string, jobDescription: string }.

Validation (Zod):

Ensure inputs are strings and not empty.

Sanitize inputs to prevent injection or excessive token usage.

Hashed Caching (The "Gap Architect" Constraint):

Generate a SHA-256 hash of resumeText + jobDescription.

Check Redis: If key analysis:${hash} exists, return the cached JSON immediately.

Check DB: If a record exists with this hash, return it.

Queue Dispatch:

If no cache, create a Job in analysisQueue.

Return 202 Accepted with a jobId for polling (or 200 if we decide to await the worker for simplicity, but Queue is preferred for scalability).

B. Background Worker (The AI Logic)
Worker: AnalysisWorker

AI Integration (Gemini):

System Prompt: * "You are a senior technical career coach. Analyze the gap between the provided Resume and Job Description."*

Output Enforcement: The AI must return strict JSON.

The "Validation Layer" (Crucial):

Parse the AI response.

Validate against the Output Schema using Zod.

Retry Logic: If Zod validation fails (malformed JSON or missing keys), the Worker should retry the AI call up to 3 times with a higher "temperature" or a correction prompt.

Fallback: If all retries fail, mark the Job as Failed with a graceful error message.

Persistence:

Save valid results to PostgreSQL.

Cache valid results to Redis (TTL: 24 hours).

C. The Output Schema
The AI output and API response must strictly adhere to:

TypeScript
interface GapAnalysisResult {
  missingSkills: string[]; // e.g., ["Docker", "GraphQL"]
  learningPath: {
    step: string; // "Build a CRUD app..."
    resource?: string;
  }[];
  interviewQuestions: string[]; // 3 targeted questions
  status: 'COMPLETED' | 'FAILED';
}
5. Database Schema (Draft)
users
(Import standard Auth schema from existing auth folder reference)

analyses
id: UUID (PK)

userId: UUID (FK)

contentHash: String (Unique, Indexed) - For caching check

resumeText: Text

jobDescription: Text

status: Enum (PENDING, COMPLETED, FAILED)

result: JSONB (Stores the GapAnalysisResult)

createdAt: Timestamp

6. Testing Strategy (TDD)
Write Tests First: Create analysis.service.spec.ts.

Mocking:

Mock GeminiClient to return both valid JSON and malformed JSON (to test the Validation Layer).

Mock Redis to test the Caching hit/miss logic.

Integration: Use Supertest to verify the POST /analysis endpoint creates a job/returns a result.

7. Instructions for AI (Brainstorming)
When running /brainstorm on this file, focus on:

Edge Cases: How to handle PDF parsing if we move beyond text copy-paste?

Prompt Engineering: Optimizing the Gemini prompt to ensure the "Steps" are actionable (not generic).

Security: Rate limiting per user to prevent API cost spikes.

Scalability: How to handle the Queue if 1000 users submit simultaneously.

Action:

Read src/auth (if available) and replicate the error handling middleware.

Scaffold the project using the 3-layer architecture.

Implement zod schemas first.