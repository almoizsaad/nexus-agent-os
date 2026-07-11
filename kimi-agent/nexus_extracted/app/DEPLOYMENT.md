# Deployment Guide — Nexus Agent OS

This guide provides instructions for deploying Nexus Agent OS to production environments.

## Prerequisites

- Node.js 20+ (for local builds)
- Docker (for containerized deployments)
- A Moonshot AI API Key (or other configured LLM provider)

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

```env
VITE_API_KEY=your_api_key
VITE_API_BASE_URL=https://api.moonshot.cn/v1
```

In production, ensure these are set via your CI/CD pipeline or container orchestrator.

## Docker Deployment

The project includes an optimized multi-stage Dockerfile.

### 1. Build the image
```bash
docker build -t nexus-agent-os:latest .
```

### 2. Run the container
```bash
docker run -d -p 8080:80 \
  -e VITE_API_KEY=your_api_key \
  nexus-agent-os:latest
```

The application will be available at `http://localhost:8080`.

## CI/CD Pipeline

Nexus uses GitHub Actions for continuous integration. The pipeline includes:
- **Linting**: Ensures code style consistency.
- **Testing**: Runs the Vitest suite.
- **Building**: Verifies the production build.

The workflow is defined in `.github/workflows/ci.yml`.

## Monitoring and Health Checks

The `AgentRuntime` includes a `healthCheck()` method that can be used for monitoring:

```typescript
const health = runtime.healthCheck();
if (health.status === 'unhealthy') {
  // Handle unhealthy state
}
```

Structured logging is enabled in production, outputting logs in JSON format for easy ingestion by monitoring tools (e.g., ELK, CloudWatch).

## Scaling Considerations

Nexus is primarily a frontend application. Scaling involves:
1. **CDN Delivery**: Serve static assets via a global CDN.
2. **API Rate Limiting**: Ensure your LLM provider key has sufficient quota for your user base.
3. **Session Persistence**: If running multiple instances, ensure that state (if any) is managed appropriately (e.g., via backend persistence if needed).
