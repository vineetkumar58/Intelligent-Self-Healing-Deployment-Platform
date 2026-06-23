# Security Hardening

## Overview
This document describes the security measures implemented in the Self-Healing Deployment Platform.

## Implemented Security Controls

### Network Security
- NetworkPolicies restrict pod-to-pod traffic (vpc-development, security-group-internal, security-group-monitoring)
- Only required ports (5000, 80) are exposed between application tiers
- Monitoring namespace traffic is explicitly allowlisted, not open by default

### Secrets Management
- Sensitive values stored in Kubernetes Secrets, not ConfigMaps or environment variables in plain YAML
- GitHub repository secrets used for CI/CD credentials (DOCKERHUB_TOKEN, SLACK_WEBHOOK_URL)
- GitHub push protection enabled - blocks accidental secret commits automatically
- Application secrets (APP_SECRET_KEY, API_KEY) injected via secretKeyRef, never hardcoded

### Container Security
- Minimal base images used (python:3.11-slim, nginx:alpine, node:20-alpine)
- Multi-stage Docker builds reduce final image attack surface
- Resource limits prevent a single compromised pod from exhausting node resources

### Access Control
- Liveness and readiness probes prevent traffic routing to unhealthy or compromised pods
- RBAC relies on Kubernetes default namespace isolation
- Docker Hub access token scoped to read-write only, not admin

### CI/CD Security
- All secrets injected via GitHub encrypted secrets, never committed to source control
- Build pipeline runs in isolated GitHub-hosted runners
- Docker images tagged with commit SHA for full traceability and rollback capability

## Security Monitoring

- PrometheusRule UnauthorizedAccessAttempt monitors unusual secret access patterns
- Alertmanager routes critical security alerts to Slack immediately
- Audit trail maintained via kubectl rollout history for all deployment changes

## Recommendations for Production Hardening

1. Enable Kubernetes RBAC with least-privilege service accounts per workload
2. Implement Pod Security Standards (restricted profile) at namespace level
3. Use a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault) instead of native Kubernetes Secrets for production
4. Enable mutual TLS between services using a service mesh (Istio or Linkerd)
5. Run regular container image vulnerability scans (Trivy, Docker Scout) in the CI/CD pipeline
6. Enable audit logging at the Kubernetes API server level for compliance tracking
