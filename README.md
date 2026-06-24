# Intelligent Self-Healing Deployment Platform

A production-grade DevOps platform that automatically deploys, monitors, detects failures, and self-heals without manual intervention.

![Platform Status](https://img.shields.io/badge/status-active-success)
![Kubernetes](https://img.shields.io/badge/kubernetes-v1.35-blue)
![Terraform](https://img.shields.io/badge/terraform-v1.15-purple)
![Docker](https://img.shields.io/badge/docker-v29.5-blue)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Containerization | Docker |
| Orchestration | Kubernetes (Minikube) |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Alerting | Alertmanager + Slack + Email |
| Backend | Python Flask |
| Frontend | React + Recharts |

## Prerequisites

- Docker Desktop
- Minikube
- kubectl
- Helm
- Terraform

## Quick Start

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=6144 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Provision infrastructure with Terraform

```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

### 3. Deploy the application

```bash
kubectl apply -f k8s/
kubectl apply -f monitoring/
```

### 4. Wait for pods to be ready

```bash
kubectl get pods -n self-healing-app
```

All pods should show `1/1 Running`.

### 5. Access the dashboard

```bash
minikube service self-healing-frontend-svc -n self-healing-app
```

### 6. Access Grafana

```bash
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
```

Open `http://localhost:3000` - username: `admin` password: `admin123`

### 7. Run self-healing demo

```bash
bash scripts/demo-self-heal.sh
```

This script deletes a pod to prove auto-recovery, deploys a bad image to prove auto-rollback, and shows HPA status. Or click **Inject failure** on the dashboard for a manual demo.

### 8. Run HPA auto-scaling load test

```bash
bash scripts/load-test.sh
```

### 9. Run health check or log aggregation anytime

```bash
bash scripts/health-check.sh
bash scripts/log-aggregation.sh
```

## Project Structure

```
app/                  Flask backend
frontend/             React monitoring dashboard
terraform/            Infrastructure as Code
k8s/                  Kubernetes manifests
monitoring/           Prometheus, Grafana and Alertmanager config
scripts/              Self-healing, rollback, load test and log aggregation scripts
docs/                 Architecture, guides and procedures
.github/workflows/    CI/CD pipeline
```

## Documentation

| Document | Description |
|----------|-------------|
| docs/architecture.md | System architecture overview |
| docs/deployment-guide.md | Step by step deployment instructions |
| docs/monitoring-guide.md | Prometheus and Grafana usage guide |
| docs/incident-response.md | Incident detection and response workflows |
| docs/recovery-procedures.md | Manual recovery steps for all failure scenarios |
| docs/cost-analysis.md | Infrastructure cost breakdown and optimization |
| docs/security-hardening.md | Security controls and production recommendations |

## Scripts

| Script | Description |
|--------|-------------|
| scripts/health-check.sh | Full cluster health report |
| scripts/auto-rollback.sh | Continuous monitoring with automatic rollback |
| scripts/demo-self-heal.sh | Live self-healing and rollback demonstration |
| scripts/load-test.sh | HPA auto-scaling load test |
| scripts/log-aggregation.sh | Collects logs from all pods into local files |

## Features

### Phase 1 - Deployment Infrastructure

- Terraform provisions namespaces, network policies, and monitoring stack
- Docker images built and pushed via GitHub Actions CI/CD
- Kubernetes deployments with rolling updates
- Liveness and readiness probes on all containers
- Prometheus metrics collection from Flask backend
- Grafana dashboards with real-time cluster monitoring

### Phase 2 - Self-Healing Automation

- Automatic pod restart on health check failure - proven live
- HPA auto-scaling based on CPU and memory - proven live, scales 2 to 8 replicas
- Automated rollback on deployment failure - proven live
- Alertmanager integration with Slack and Email notifications - proven live
- PrometheusRules for pod crash, error rate, CPU, memory and security event detection
- Log aggregation script for centralized troubleshooting
- Infrastructure cost analysis and security hardening documentation

## CI/CD Pipeline

Every push to `main` branch triggers:

1. Python dependency install and import test
2. Docker image build for backend and frontend
3. Push to Docker Hub with commit SHA tag
4. Slack notification on success or failure

## Docker Images

- `vineetkumar11/self-healing-backend:latest`
- `vineetkumar11/self-healing-frontend:latest`

## Monitoring Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Application status |
| `/health` | Health check |
| `/metrics` | Prometheus metrics |
| `/api/status` | Detailed status |
| `/simulate-error` | Inject failure for demo |
