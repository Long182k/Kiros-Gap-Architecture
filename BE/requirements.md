# Backend Requirements: Career Gap Architect

## 1. Overview
The backend provides APIs for analyzing the gap between a candidate's resume and a target job description. It utilizes **Google Gemini AI** for semantic analysis and **BullMQ** for asynchronous processing to handle heavy workloads efficiently.

## 2. Technical Stack
*   **Runtime:** Node.js (v20+)
*   **Framework:** Express.js
*   **Language:** TypeScript (Strict Mode)
*   **Database:** PostgreSQL (via `pg` driver)
*   **Queue System:** Redis (BullMQ)
*   **AI Provider:** Google Gemini API (`gemini-1.5-flash` / `gemini-pro`)
*   **File Processing:** `multer` (Uploads), `pdf-parse` (Text extraction), `pdf2pic` (OCR readiness)
*   **Validation:** Zod
*   **Logging:** Winston (JSON format for production)

## 3. Architecture
The system follows a modular 3-layer architecture:

### A. API Layer (`src/controllers`)
*   Handles HTTP requests & responses.
*   Performs input validation using Zod schemas.
*   Delegates business logic to Services.
*   **No database access** directly in controllers.

### B. Service Layer (`src/services`)
*   Contains core business logic.
*   Orchestrates AI calls, Queue interactions, and Caching strategies.
*   Calls Repositories for data persistence.

### C. Repository Layer (`src/repositories`)
*   Abstracts database interactions.
*   Executes SQL queries via `pg` pool.
*   Returns domain objects/DTOs.

### D. Worker Service (`src/workers`)
*   Runs as a separate process (or thread).
*   Consumes jobs from `analysis-queue`.
*   Performs heavy PDF parsing and AI generation.
*   Updates job status in Redis/DB.

## 4. Key Features & Logic

### A. Semantic Gap Analysis
*   **Endpoint:** `POST /api/v1/analysis`
*   **Logic:**
    1.  Accepts Resume (PDF/Text) and Job Description.
    2.  Generates a **SHA-256 hash** of the content to check for existing results (Caching).
    3.  If cached (Redis/DB), returns result immediately.
    4.  If new, pushes a job to `analysis-queue` and returns `jobId`.

### B. Asynchronous Processing
*   **Queue:** `analysis-queue` (BullMQ)
*   **Worker:**
    1.  Extracts text from PDF (handling OCR if needed).
    2.  Prompts Gemini AI with strict JSON output requirement.
    3.  Validates AI response against `GapAnalysisResult` schema.
    4.  Saves result to DB and Redis.

### C. Result Schema
The AI output strictly adheres to:
```typescript
interface GapAnalysisResult {
  matchScore: number;
  missingSkills: Array<{
    skill: string;
    importance: "HIGH" | "MEDIUM" | "LOW";
  }>;
  learningPath: Array<{
    step: string;
    resource: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  interviewQuestions: string[];
}
```

## 5. Database Schema
### `users` (If Auth enabled)
*   Standard user credentials and profile.

### `analyses`
*   `id`: UUID (Primary Key)
*   `contentHash`: String (Indexed, Unique) - For duplicate detection.
*   `resumeText`: Text (Encrypted/Stored)
*   `jobDescription`: Text
*   `status`: Enum (`PENDING`, `COMPLETED`, `FAILED`)
*   `result`: JSONB (Stores `GapAnalysisResult`)
*   `createdAt`: Timestamp

## 6. Environment Variables
*   `PORT`: Server port (default 3001)
*   `DATABASE_URL`: PostgreSQL connection string
*   `REDIS_URL`: Redis connection string
*   `GEMINI_API_KEY`: Google AI Studio Key
*   `CORS_ORIGIN`: Frontend URL