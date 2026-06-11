@"
# Deployment Guide

## Overview
This guide covers the complete deployment of the Intelligent Self-Healing Deployment Platform on any local machine.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | 29.x+ | https://www.docker.com/products/docker-desktop |
| Minikube | 1.38+ | https://minikube.sigs.k8s.io/docs/start |
| kubectl | 1.36+ | https://kubernetes.io/docs/tasks/tools |
| Helm | 4.x+ | https://helm.sh/docs/intro/install |
| Terraform | 1.15+ | https://developer.hashicorp.com/terraform/install |

## Step 1: Start Minikube

minikube start --cpus=4 --memory=6144 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server

Verify cluster is running:
kubectl get nodes

## Step 2: Provision Infrastructure with Terraform

cd terraform
terraform init
terraform apply -auto-approve
cd ..

This creates:
- Namespace: self-healing-app (Development)
- Namespace: staging
- Namespace: production
- Namespace: vpc-network (VPC simulation)
- NetworkPolicies (Security Groups simulation)
- ConfigMap for app configuration
- Prometheus + Grafana via Helm

## Step 3: Deploy Application

kubectl apply -f k8s/

This deploys:
- Flask backend (2 replicas)
- React frontend (1 replica)
- Services (ClusterIP + LoadBalancer)
- HPA autoscaler (min 2, max 8)
- Ingress controller
- ConfigMap and Secrets
- PrometheusRules

## Step 4: Apply Monitoring Configuration

kubectl apply -f monitoring/

This configures:
- ServiceMonitor for Prometheus scraping
- Alertmanager for Slack and email alerts

## Step 5: Verify Deployment

kubectl get pods -n self-healing-app
kubectl get hpa -n self-healing-app
kubectl get services -n self-healing-app

All pods should show 1/1 Running.

## Step 6: Access the Dashboard

minikube service self-healing-frontend-svc -n self-healing-app

Dashboard opens automatically in browser showing:
- Live CPU and memory metrics
- Error rate and latency charts
- Pod status
- Self-healing controls
- Alert feed

## Step 7: Access Grafana

kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring

Open http://localhost:3000
Username: admin
Password: admin123

Import dashboard ID 15661 for Kubernetes cluster monitoring.

## Step 8: Run Self-Healing Demo

bash scripts/demo-self-heal.sh

## Step 9: Run Health Check

bash scripts/health-check.sh

## Step 10: Test Auto-Scaling

bash scripts/load-test.sh

## Cleanup

To stop the platform:
minikube stop

To destroy everything:
minikube delete
cd terraform
terraform destroy -auto-approve
"@ | Out-File -FilePath docs\deployment-guide.md -Encoding utf8