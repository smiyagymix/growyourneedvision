# Production Testing Infrastructure

This document describes how to run the E2E test suite in a production-like environment using a live backend instead of mocks.

## Prerequisites
- Docker & Docker Compose
- Node.js & pnpm

## Setup Test Environment
To start the dedicated test database and seed it with all required data:

```bash
node scripts/setup-test-env.js
```

This will:
1. Spin up a PocketBase instance on `http://localhost:8091` using Docker.
2. Initialize the schema and seed it with test users and data.
3. Configure the environment for live interactions.

## Running Tests
Once the environment is set up, run the Playwright tests:

```bash
# Set VITE_E2E_MOCK=false to disable mocks and use real API
$env:VITE_E2E_MOCK="false"; pnpm test:e2e
```

## Teardown
To stop the test environment and remove data:

```bash
docker-compose -f docker-compose.test.yml down -v
```

## Key Changes for Production Readiness
- **No Mocks**: Tests now interact with a real SQL/PocketBase backend.
- **Data Persistence**: State persists between test runs until the container is destroyed.
- **Concurrency**: Dedicated port (8091) prevents conflict with development database (8090).
