# 🎙️ GapAnalyzer Technical Presentation (5-7 Minutes)

## 1. Introduction (30 Seconds)
*   **Problem:** Job seekers often apply blindly without knowing exactly why they aren't getting interviews. "Gap Analysis" is tedious.
*   **Solution:** **GapAnalyzer** is an AI-powered tool that acts as a technical career coach. It reads your Resume and the Job Description, then performs a deep semantic analysis to find missing skills and creates a learning plan.
*   **Goal:** To build a **scalable, production-grade MVP** using modern TypeScript stack.

---

## 2. Frontend Architecture (1.5 Minutes)
*   **Tech:** **Next.js 16** (App Router), **Tailwind CSS 4**, **Typescript**.
*   **Why Next.js?** For server-side rendering (SEO) and modern React features like Server Components.
*   **UX Pattern:**
    *   Since AI analysis takes time (10-30 seconds), we can't just wait for a standard HTTP request.
    *   **Solution:** We use **Polling**. The frontend submits the file, gets a `jobId`, and then polls the status endpoint every 2 seconds until the result is ready.
*   **UI Library:** **Shadcn/UI** (based on Radix Primitives) for accessible, high-quality components without the bloat of heavy 3rd party libraries.

---

## 3. Backend Architecture (2 Minutes)
*   **Tech:** **Node.js (Express)**, **PostgreSQL**, **Redis**.
*   **Core Challenge:** Heavy AI processing (PDF parsing + LLM generation) blocks the main thread.
*   **Solution: Event-Driven Architecture**
    1.  **Controller:** Receives request, hashes content (SHA-256) to check **Cache** (Redis/DB). If cached, returns instantly.
    2.  **Producer:** If new, pushes a job to **BullMQ (Redis Queue)**.
    3.  **Worker:** A completely separate process picks up the job, extracts text from PDF, and calls **Google Gemini AI**.
*   **Why this setup?**
    *   **Scalability:** We can run 1 worker or 100 workers depending on load, without changing the API server.
    *   **Reliability:** If the API crashes, the job is still in Redis. If Gemini fails, BullMQ handles retries automatically.

---

## 4. Infrastructure & Deployment (1.5 Minutes)
*   **Strategy:** Dockerized Microservices on a VPS (Virtual Private Server).
*   **Orchestration:** **Docker Compose**.
    *   Services: `frontend`, `backend`, `worker`, `postgres`, `redis`, `traefik`.
*   **Reverse Proxy: Traefik**
    *   Acts as the entry point (Edge Router).
    *   **Automated SSL:** Automatically handles Let's Encrypt certificates for HTTPS.
    *   **Routing:** Routes `resume-gap...` to Frontend and `/api` to Backend.
*   **CI/CD Pipeline (GitHub Actions):**
    *   **Push-to-Deploy:** When we push to `master`, it builds Docker images, pushes to **GitHub Container Registry (GHCR)**, then SSHs into the VPS to pull and restart containers with **Zero Downtime**.

---

## 5. Monitoring & Observability (1 Minute)
*   **"You can't fix what you can't see."**
*   **Stack:** **Grafana** (Dashboard), **Prometheus** (Metrics), **Loki** (Logs).
*   **What we track:**
    *   **API Latency:** How fast are requests?
    *   **Queue Health:** How many jobs are waiting? (If queue grows, we add workers).
    *   **Error Rates:** Alerting on 5xx errors.

---

## 6. Project Links
*   **Live Demo:** `https://resume-gap-analysis.connected-social-media.online`
*   **Documentation:** `README.md` in root (Documentation covers setup & architecture).
