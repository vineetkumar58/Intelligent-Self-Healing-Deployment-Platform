@"
# Architecture Overview

## System Architecture

Developer pushes code to GitHub, GitHub Actions builds and pushes Docker images to Docker Hub, Kubernetes pulls and deploys to Minikube cluster.

## Terraform Provisioned Resources

| Resource | Type | Purpose |
|----------|------|---------|
| self-healing-app | Namespace | Application workloads |
| monitoring | Namespace | Observability stack |
| staging | Namespace | Staging environment |
| vpc-network | Namespace | Network simulation |
| vpc-development | NetworkPolicy | Simulates AWS VPC |
| security-group-internal | NetworkPolicy | Simulates Security Group |
| security-group-monitoring | NetworkPolicy | Allows Prometheus scraping |
| app-config | ConfigMap | App configuration |
| kube-prometheus-stack | Helm Release | Prometheus and Grafana |

## Kubernetes Resources

| Resource | Kind | Description |
|----------|------|-------------|
| self-healing-backend | Deployment | Flask API 2 replicas |
| self-healing-frontend | Deployment | React dashboard |
| self-healing-backend-svc | Service | ClusterIP port 5000 |
| self-healing-frontend-svc | Service | NodePort port 80 |
| backend-hpa | HPA | Min 2 Max 8 replicas |
| app-ingress | Ingress | Traffic routing |
| app-config | ConfigMap | Environment variables |
| app-secrets | Secret | Sensitive credentials |
| self-healing-rules | PrometheusRule | Alert definitions |
| backend-monitor | ServiceMonitor | Prometheus scraping |

## CI/CD Pipeline Flow

1. Developer pushes code to main branch
2. GitHub Actions workflow triggers automatically
3. Python tests run on backend code
4. Docker images built for backend and frontend
5. Images pushed to Docker Hub with latest and commit SHA tags
6. Slack notification sent on success or failure

## Self-Healing Flow

1. Pod fails health check at /health endpoint
2. Kubernetes liveness probe detects 3 consecutive failures
3. Kubernetes automatically restarts the failed pod
4. New pod starts and passes health check
5. Alertmanager fires alert to Slack
6. Dashboard shows recovery in real time

## Monitoring Flow

1. Prometheus scrapes /metrics every 15 seconds
2. Grafana queries Prometheus and renders dashboards
3. PrometheusRules evaluate alert conditions continuously
4. Alertmanager routes critical alerts to Slack and email
"@ | Out-File -FilePath docs\architecture.md -Encoding utf8