# Production Deployment Guide (Kubernetes)

This directory contains standard Kubernetes manifests for deploying the "Grow Your Need" platform in a professional production environment.

## Manifests

- `frontend-deployment.yaml`: Replicated frontend deployment with liveness probes.
- `ai-deployment.yaml`: AI Service deployment with health checks and resource limits.
- `pocketbase-deployment.yaml`: PocketBase with Persistent Volume for data durability.

## Setup Instructions

1. **Namespace**:
   ```bash
   kubectl create namespace grow-your-need
   ```

2. **Secrets & Config**:
   Create a `secrets.yaml` (not committed) with your API keys and apply it.
   ```bash
   kubectl apply -f k8s/configmap.yaml -n grow-your-need
   ```

3. **Deploy**:
   ```bash
   kubectl apply -f k8s/ -n grow-your-need
   ```

4. **Verify**:
   ```bash
   kubectl get pods -n grow-your-need
   ```

## Pre-Deployment Verification

Before going live, run the automated health check to verify your environment and connectivity:
```bash
npm run prod:check
```

This will validate:
- Essential environment variables.
- Connectivity to PocketBase, AI Service, and Payment Server.
- Security mode (Mock vs. Real).

## Monitoring
