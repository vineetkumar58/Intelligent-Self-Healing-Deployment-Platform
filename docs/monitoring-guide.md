@"
# Monitoring Guide

## Overview
The platform uses Prometheus and Grafana for real-time monitoring of all application and infrastructure metrics.

## Architecture

Application --> /metrics endpoint --> Prometheus --> Grafana Dashboards
                                           |
                                           v
                                     Alertmanager --> Slack + Email

## Accessing Monitoring Tools

### Grafana Dashboard
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
Open http://localhost:3000
Username: admin
Password: admin123

### Prometheus UI
kubectl port-forward svc/monitoring-prometheus 9090:9090 -n monitoring
Open http://localhost:9090

### Alertmanager UI
kubectl port-forward svc/monitoring-kube-prometheus-alertmanager 9093:9093 -n monitoring
Open http://localhost:9093

## Application Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| app_requests_total | Total HTTP requests | - |
| app_request_latency_seconds | Request latency histogram | > 2s |
| app_error_rate | Current error rate | > 10% |
| app_active_requests | Active concurrent requests | > 100 |

## Kubernetes Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| kube_pod_container_status_restarts_total | Pod restart count | > 0 in 15m |
| container_cpu_usage_seconds_total | CPU usage | > 80% |
| container_memory_usage_bytes | Memory usage | > 70% |
| kube_deployment_status_replicas_unavailable | Unavailable replicas | > 0 |

## Alert Rules

### PodCrashLooping
Fires when a pod restarts more than once in 15 minutes.
Severity: Critical
Action: Automatic pod restart + Slack notification

### HighErrorRate
Fires when error rate exceeds 5% for 1 minute.
Severity: Critical
Action: Auto-rollback triggered + Slack notification

### HighCPU
Fires when CPU usage exceeds 40% for 5 minutes.
Severity: Warning
Action: HPA scales up pods + Slack notification

### DeploymentUnavailable
Fires when deployment has unavailable replicas for 2 minutes.
Severity: Critical
Action: Auto-rollback triggered + Slack notification

## Grafana Dashboards

### Dashboard 1: Kubernetes Cluster Overview (ID: 15661)
Shows:
- Node resource overview
- Pod count and status
- CPU and memory usage
- Network traffic
- Namespace resource statistics

### Dashboard 2: Application Metrics
Shows:
- Request rate
- Error rate
- Latency percentiles
- Active requests

## Viewing Logs

### Backend logs
kubectl logs -l app=self-healing-backend -n self-healing-app --tail=100

### Frontend logs
kubectl logs -l app=self-healing-frontend -n self-healing-app --tail=100

### All namespace events
kubectl get events -n self-healing-app --sort-by='.lastTimestamp'
"@ | Out-File -FilePath docs\monitoring-guide.md -Encoding utf8