@"
#!/bin/bash
NAMESPACE="self-healing-app"

echo "======================================"
echo "  CLUSTER HEALTH REPORT"
echo "  Time: $(date)"
echo "======================================"

echo ""
echo "--- Pod Status ---"
kubectl get pods -n $NAMESPACE -o wide

echo ""
echo "--- Deployment Status ---"
kubectl get deployments -n $NAMESPACE

echo ""
echo "--- HPA Status ---"
kubectl get hpa -n $NAMESPACE

echo ""
echo "--- Service Status ---"
kubectl get services -n $NAMESPACE

echo ""
echo "--- Resource Usage ---"
kubectl top pods -n $NAMESPACE 2>/dev/null || echo "metrics-server not available"

echo ""
echo "--- Recent Events ---"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10

echo ""
echo "--- Rollout History ---"
kubectl rollout history deployment/self-healing-backend -n $NAMESPACE

echo ""
echo "======================================"
echo "  HEALTH CHECK COMPLETE"
echo "======================================"
"@ | Out-File -FilePath scripts\health-check.sh -Encoding utf8