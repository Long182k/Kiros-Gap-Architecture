# 🎬 GapAnalyzer Video Walkthrough Script (Loom, Max 5 Mins)

---

## 1. App Demo (2 Minutes)

**[Screen: Open the live app at `https://resume-gap-analysis.connected-social-media.online`]**

> "Hi, this is GapAnalyzer — an AI-powered tool that analyzes the gap between a resume and a job description."

**[Action: Upload a sample PDF resume]**

> "I'll upload my resume here..."

**[Action: Paste a job description into the text area]**

> "...and paste the target job description."

**[Action: Click 'Analyze' and show the loading state]**

> "Notice the loading indicator. The analysis takes about 10-20 seconds because we're doing heavy processing in the background — I'll explain how that works in a moment."

**[Screen: Show the results page]**

> "Here are the results:
> - **Match Score**: Shows how well the resume fits the JD.
> - **Missing Skills**: Categorized by importance (High, Medium, Low).
> - **Learning Path**: Step-by-step recommendations.
> - **Interview Questions**: AI-generated questions to prepare for."

---

## 2. Engineering Constraints Explained (2 Minutes)

### How I Handled Background Processing

> "A key challenge was handling heavy AI processing without blocking the main server."

> "Here's how I solved it:
> 1. When a user submits a resume, the **API Controller** doesn't call the AI directly.
> 2. Instead, it pushes a **job to a Redis Queue** using **BullMQ**.
> 3. A completely **separate Worker process** picks up the job, parses the PDF, calls **Google Gemini AI**, and saves the result.
> 4. The frontend **polls** the status endpoint every 2 seconds until the result is ready."

> "This architecture means I can scale workers independently. If traffic spikes, I just spin up more worker containers — the API server stays fast and responsive."

### Caching Strategy

> "I also implemented **content-based caching**. Before processing, I hash the resume + JD content using SHA-256. If the same combination was analyzed before, I return the cached result instantly from Redis — saving API costs and time."

---

## 3. AI Tooling & Workflow (1 Minute)

> "Finally, I want to mention how AI coding assistants changed my workflow."

> "I used **AI-assisted coding** (like Cursor/Windsurf/Gemini Code Assist) throughout this project. Here's a specific example:"

> "**Bug I solved with AI**: The Traefik reverse proxy was returning 404 errors for my domain. After debugging, AI helped me realize the issue: my router was configured for HTTPS-only (`tls=true`), but Cloudflare was connecting via HTTP (Flexible SSL mode). AI suggested splitting the router configuration into separate HTTP and HTTPS routes — which fixed it immediately."

> "Using AI didn't just speed things up — it helped me understand **why** things work, not just copy-paste solutions."

---

## 4. Closing

> "That's GapAnalyzer. A scalable, production-ready MVP built with Next.js, Express, BullMQ, and Google Gemini — deployed with Docker and GitHub Actions CI/CD."

> "Thanks for watching!"
