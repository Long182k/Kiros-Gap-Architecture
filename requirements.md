# Deployment Requirements & Infrastructure

## 1. Overview
The application is deployed on a **VPS (Virtual Private Server)** using **Docker Compose** for orchestration and **GitHub Actions** for CI/CD.

## 2. Infrastructure Stack
*   **OS:** Ubuntu 22.04 LTS (or compatible Linux)
*   **Container Runtime:** Docker Engine + Docker Compose
*   **Reverse Proxy:** Traefik v2.11
*   **SSL/TLS:** Let's Encrypt (Automated via Traefik HTTP Challenge)
*   **Registry:** GitHub Container Registry (GHCR)

## 3. Services Architecture
The deployment consists of the following containerized services:

| Service | Description | Port (Internal) |
| :--- | :--- | :--- |
| `traefik` | Reverse Proxy, SSL Termination, Routing | 80/443 |
| `frontend` | Next.js Application | 3000 |
| `backend` | Express API | 3001 |
| `worker` | Background Job Processor (Node.js) | - |
| `postgres` | Primary Database | 5432 |
| `redis` | Cache & Job Queue | 6379 |
| `prometheus`| Metrics Collection | 9090 |
| `loki` | Log Aggregation | 3100 |
| `grafana` | Monitoring Dashboard | 3000 |

## 4. Deployment Workflow (CI/CD)
Managed by `.github/workflows/deploy.yml`.

### Triggers
*   Push to `master` branch.

### Pipeline Steps
1.  **Checkout Code:** Fetch latest commit.
2.  **Build Images:** Build Docker images for `frontend`, `backend`, `worker`.
3.  **Push to GHCR:** Tag and push images to GitHub Container Registry.
4.  **Deploy to VPS:**
    *   Connect via SSH.
    *   Copy `docker-compose.yml` and `docker-compose.prod.yml`.
    *   Pull new images.
    *   Run `docker compose up -d` (Zero-downtime recreation).
    *   Prune unused images.

## 5. Environment Variables (Required on VPS)
These variables must be set in the `.env` file on the server or passed via CI/CD secrets:

*   `DOMAIN`: The root domain (e.g., `example.com`).
*   `ACME_EMAIL`: Email for Let's Encrypt registration.
*   `DATABASE_URL`: Full connection string for Postgres.
*   `REDIS_URL`: Connection string for Redis.
*   `GEMINI_API_KEY`: API Key for Google Gemini.
*   `VPS_HOST`, `VPS_USER`, `SSH_PRIVATE_KEY`: CI/CD Secrets.

## 6. Zero-Downtime Strategy
*   Traefik handles traffic routing.
*   Docker Compose recreates containers one by one (or overlapping).
*   Healthchecks ensure new containers are ready before traffic is routed.
