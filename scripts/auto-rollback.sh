@"
#!/bin/bash
set -e

DEPLOYMENT="self-healing-backend"
NAMESPACE="self-healing-app"
MAX_FAILURES=3
CHECK_INTERVAL=10
failures=0

echo "======================================"
echo "  AUTO-ROLLBACK MONITOR"
echo "  Watching: $DEPLOYMENT"
echo "  Namespace: $NAMESPACE"
echo "======================================"

while true; do
  AVAILABLE=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE \
    -o jsonpath='{.status.availableReplicas}' 2>/dev/null || echo "0")
  DESIRED=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE \
    -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
  AVAILABLE=${AVAILABLE:-0}

  if [ "$AVAILABLE" -lt "$DESIRED" ]; then
    failures=$((failures + 1))
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $AVAILABLE/$DESIRED replicas available (failure $failures/$MAX_FAILURES)"

    if [ "$failures" -ge "$MAX_FAILURES" ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL: Threshold reached! Initiating automatic rollback..."
      echo "--- Current deployment state ---"
      kubectl get pods -n $NAMESPACE
      echo "--- Rolling back ---"
      kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
      echo "--- Waiting for rollback to complete ---"
      kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=120s
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: Rollback complete!"
      echo "--- Rollback audit log ---"
      kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE
      echo "--- Current healthy state ---"
      kubectl get pods -n $NAMESPACE
      failures=0
    fi
  else
    if [ "$failures" -gt 0 ]; then
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] RECOVERED: Deployment healthy ($AVAILABLE/$DESIRED replicas)"
    fi
    failures=0
  fi

  sleep $CHECK_INTERVAL
done
"@ | Out-File -FilePath scripts\auto-rollback.sh -Encoding utf8