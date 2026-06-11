@"
# Recovery Procedures

## Overview
Step-by-step recovery procedures for all failure scenarios.

## Procedure 1: Complete Platform Recovery

Use when: Platform is completely down or Minikube was restarted.

Step 1: Start Minikube
minikube start --cpus=4 --memory=6144 --driver=docker

Step 2: Verify cluster
kubectl get nodes

Step 3: Check pod status
kubectl get pods -n self-healing-app

Step 4: If pods are in Error state, restart deployments
kubectl rollout restart deployment/self-healing-backend -n self-healing-app
kubectl rollout restart deployment/self-healing-frontend -n self-healing-app

Step 5: If pods are missing, redeploy
kubectl apply -f k8s/
kubectl apply -f monitoring/

Step 6: Verify recovery
bash scripts/health-check.sh

Step 7: Restart dashboard
minikube service self-healing-frontend-svc -n self-healing-app

## Procedure 2: Backend Recovery

Use when: Backend pods are failing.

Step 1: Check pod status
kubectl get pods -n self-healing-app -l app=self-healing-backend

Step 2: Check logs
kubectl logs -l app=self-healing-backend -n self-healing-app --tail=50

Step 3: Check events
kubectl get events -n self-healing-app --sort-by='.lastTimestamp'

Step 4: Restart backend
kubectl rollout restart deployment/self-healing-backend -n self-healing-app

Step 5: If restart fails, rollback
kubectl rollout undo deployment/self-healing-backend -n self-healing-app

Step 6: Verify
kubectl get pods -n self-healing-app -l app=self-healing-backend

## Procedure 3: Rollback Procedure

Use when: New deployment is causing failures.

Step 1: Check rollout history
kubectl rollout history deployment/self-healing-backend -n self-healing-app

Step 2: Check current status
kubectl get pods -n self-healing-app

Step 3: Rollback to previous version
kubectl rollout undo deployment/self-healing-backend -n self-healing-app

Step 4: Rollback to specific version
kubectl rollout undo deployment/self-healing-backend -n self-healing-app --to-revision=2

Step 5: Monitor rollback
kubectl rollout status deployment/self-healing-backend -n self-healing-app

Step 6: Validate rollback
kubectl get pods -n self-healing-app
curl http://localhost:5000/health

## Procedure 4: Monitoring Recovery

Use when: Grafana or Prometheus is not accessible.

Step 1: Check monitoring pods
kubectl get pods -n monitoring

Step 2: Restart monitoring stack
kubectl rollout restart deployment/monitoring-grafana -n monitoring

Step 3: Reconnect to Grafana
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring

Step 4: Reconnect to Prometheus
kubectl port-forward svc/monitoring-prometheus 9090:9090 -n monitoring

## Procedure 5: HPA Recovery

Use when: Auto-scaling is not working.

Step 1: Check HPA status
kubectl get hpa -n self-healing-app
kubectl describe hpa backend-hpa -n self-healing-app

Step 2: Check metrics server
kubectl get pods -n kube-system | grep metrics-server

Step 3: Enable metrics server if missing
minikube addons enable metrics-server

Step 4: Reapply HPA
kubectl apply -f k8s/hpa.yaml

Step 5: Verify scaling
kubectl get hpa -n self-healing-app -w
"@ | Out-File -FilePath docs\recovery-procedures.md -Encoding utf8