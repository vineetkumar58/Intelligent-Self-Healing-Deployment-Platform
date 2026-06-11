@"
# Incident Response Workflow

## Overview
This document describes how the platform automatically detects and responds to incidents without manual intervention.

## Incident Detection Flow

1. Prometheus scrapes metrics every 15 seconds
2. PrometheusRules evaluate alert conditions
3. Alertmanager receives firing alerts
4. Slack notification sent to #k8s-alerts channel
5. Automated recovery action triggered

## Incident Types and Responses

### Incident 1: Pod Crash Loop

Detection:
- Prometheus detects pod restart rate > 0 in 15 minutes
- Alert: PodCrashLooping fires

Automatic Response:
1. Kubernetes liveness probe detects unhealthy pod
2. Pod automatically restarted by Kubernetes
3. If restarts exceed threshold, rollback triggered
4. Slack alert sent with pod name and restart count

Manual Response if needed:
kubectl describe pod POD_NAME -n self-healing-app
kubectl logs POD_NAME -n self-healing-app --previous
kubectl rollout undo deployment/self-healing-backend -n self-healing-app

### Incident 2: High Error Rate

Detection:
- Error rate exceeds 5% for 1 minute
- Alert: HighErrorRate fires

Automatic Response:
1. Alertmanager sends Slack notification
2. Auto-rollback script triggers if error persists
3. Previous stable version restored
4. Health check confirms recovery

Manual Response if needed:
bash scripts/auto-rollback.sh
kubectl rollout history deployment/self-healing-backend -n self-healing-app
kubectl rollout undo deployment/self-healing-backend -n self-healing-app

### Incident 3: High Resource Usage

Detection:
- CPU usage exceeds 40% for 5 minutes
- Alert: HighCPU fires

Automatic Response:
1. HPA detects high CPU utilization
2. Additional pods scaled up automatically
3. Load distributed across new pods
4. Slack notification sent

Manual Response if needed:
kubectl get hpa -n self-healing-app
kubectl top pods -n self-healing-app
kubectl scale deployment/self-healing-backend --replicas=5 -n self-healing-app

### Incident 4: Deployment Failure

Detection:
- New deployment has unavailable replicas for 2 minutes
- Alert: DeploymentUnavailable fires

Automatic Response:
1. GitHub Actions detects failed rollout
2. Automatic rollback to previous version
3. Deployment history logged
4. Slack notification sent

Manual Response if needed:
kubectl rollout status deployment/self-healing-backend -n self-healing-app
kubectl rollout undo deployment/self-healing-backend -n self-healing-app
kubectl rollout history deployment/self-healing-backend -n self-healing-app

## Escalation Procedure

Level 1 - Automatic (0-2 minutes):
- Kubernetes self-healing
- HPA scaling
- Alertmanager notification

Level 2 - Script-assisted (2-5 minutes):
- Run bash scripts/auto-rollback.sh
- Run bash scripts/health-check.sh

Level 3 - Manual intervention (5+ minutes):
- Check logs and events
- Manual rollback
- Scale adjustments

## Recovery Validation

After any incident run:
bash scripts/health-check.sh

Verify:
- All pods showing 1/1 Running
- No recent crash events
- HPA showing correct replica count
- Error rate back to normal in Grafana
"@ | Out-File -FilePath docs\incident-response.md -Encoding utf8