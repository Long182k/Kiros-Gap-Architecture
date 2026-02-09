# 🚀 GapAnalyzer - Resume vs Job Description Analysis

> **Live Demo:** [https://resume-gap-analysis.connected-social-media.online/](https://resume-gap-analysis.connected-social-media.online/)

GapAnalyzer is an AI-powered tool that analyzes the gap between a candidate's resume and a specific job description. It identifies missing skills, provides actionable recommendations, and scores the candidate's fit using Google Gemini AI.

---

## 🛠 Tech Stack

### Frontend (FE)
*   **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
*   **UI Library:** [Shadcn/UI](https://ui.shadcn.com/) (Radix Primitives)
*   **State Management:** React Query (TanStack Query)
*   **Data Visualization:** Recharts
*   **Validation:** Zod

### Backend (BE)
*   **Runtime:** Node.js 20
*   **Framework:** Express.js + TypeScript
*   **Database:** PostgreSQL (with Prisma/TypeORM)
*   **Caching & Queues:** Redis
*   **Async Processing:** [BullMQ](https://docs.bullmq.io/) (for heavy analysis jobs)
*   **AI Integration:** Google Gemini Pro (`@google/generative-ai`)
*   **PDF Processing:** `pdf-parse`, `pdf2pic` (OCR/Image conversion)

### Infrastructure & Deployment
*   **Containerization:** Docker & Docker Compose
*   **Reverse Proxy:** [Traefik](https://traefik.io/) (Handling SSL/TLS & Routing)
*   **Registry:** GitHub Container Registry (GHCR)
*   **CI/CD:** GitHub Actions (Automated build & deploy to VPS)
*   **SSL:** Let's Encrypt (Automated via Traefik)

### Monitoring Stack
*   **Grafana:** Dashboard for visualizing metrics & logs
*   **Prometheus:** Metrics collection
*   **Loki:** Log aggregation
*   **Promtail:** Log shipping

---

## 🏗 Architecture Overview

The system is designed for scalability and responsiveness, handling heavy AI processing asynchronously.

1.  **Client (Next.js)**: Uploads Resume & Job Description.
2.  **API Gateway (Traefik)**: Routes requests to Frontend or Backend services. 
3.  **Backend (Express)**:
    *   Receives upload requests.
    *   Validates input.
    *   **Producers**: Pushes analysis jobs into a **Redis Queue (BullMQ)**.
    *   Returns a `jobId` immediately to the client.
4.  **Worker Service**:
    *   **Consumers**: Listens to the queue.
    *   Processes PDF extraction & OCR.
    *   Calls Gemini AI for analysis.
    *   Updates job status and result in Redis/Database.
5.  **Polling/Websockets**: Client polls for job status until complete.

---

## 🚀 Deployment (CI/CD)

The project uses a fully automated CI/CD pipeline defined in `.github/workflows/deploy.yml`.

### Workflow Steps:
1.  **Build**: Docker images for Frontend, Backend, and Worker are built.
2.  **Push**: Images are pushed to GitHub Container Registry (GHCR).
3.  **Deploy**:
    *   SSH into the VPS.
    *   Pull latest images.
    *   Update `docker-compose` configuration.
    *   Restart services with **Zero-Downtime** (rolling updates).
    *   Prune old images.

### Key Scripts
*   `scripts/vps-setup.sh`: Initial server setup script (installs Docker, specific user permissions).
*   `docker-compose.yml`: Core service definition.
*   `docker-compose.prod.yml`: Production overrides (using GHCR images).
*   `docker-compose.monitoring.yml`: Monitoring stack definition.

---

## 📊 Monitoring

Monitoring is available via Grafana.

*   **URL:** `https://grafana.resume-gap-analysis.connected-social-media.online` (or configured domain)
*   **Data Sources:**
    *   **Prometheus**: Scrapes metrics from Backend and Traefik.
    *   **Loki**: Collects logs from all containers via Promtail.

---

## 🏃‍♂️ Running Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Long182k/Kiros-Gap-Architecture.git
    cd Kiros-Gap-Architecture
    ```

2.  **Environment Setup**:
    Copy `.env.example` to `.env` in `BE` and `FE` directories.

3.  **Start with Docker Compose**:
    ```bash
    docker compose up -d --build
    ```

4.  **Access**:
    *   Frontend: `http://localhost:3000`
    *   Backend: `http://localhost:3001`
    *   Traefik Dashboard: `http://localhost:8080`
