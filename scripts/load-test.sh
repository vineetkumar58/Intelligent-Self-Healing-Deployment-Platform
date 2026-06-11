@"
#!/bin/bash
NAMESPACE="self-healing-app"
DEPLOYMENT="self-healing-backend"
BACKEND_URL="http://localhost:5000"

echo "======================================"
echo "  HPA LOAD TEST - AUTO SCALING DEMO"
echo "======================================"

echo ""
echo "STEP 1: Current pod count before load"
echo "------------------------------"
kubectl get pods -n $NAMESPACE
kubectl get hpa -n $NAMESPACE
sleep 3

echo ""
echo "STEP 2: Starting load test (60 seconds)"
echo "------------------------------"
echo "Sending requests to backend..."

START_TIME=$(date +%s)
REQUEST_COUNT=0

while [ $(($(date +%s) - START_TIME)) -lt 60 ]; do
  curl -s $BACKEND_URL/api/metrics-summary > /dev/null 2>&1 &
  curl -s $BACKEND_URL/ > /dev/null 2>&1 &
  curl -s $BACKEND_URL/health > /dev/null 2>&1 &
  REQUEST_COUNT=$((REQUEST_COUNT + 3))
  sleep 0.1
done

wait
echo "Sent $REQUEST_COUNT requests"

echo ""
echo "STEP 3: Checking HPA scaling response"
echo "------------------------------"
kubectl get hpa -n $NAMESPACE
kubectl get pods -n $NAMESPACE

echo ""
echo "STEP 4: Waiting for scale down (2 minutes)"
echo "------------------------------"
echo "Load stopped - watching scale down..."
sleep 120
kubectl get hpa -n $NAMESPACE
kubectl get pods -n $NAMESPACE

echo ""
echo "======================================"
echo "  LOAD TEST COMPLETE"
echo "======================================"
"@ | Out-File -FilePath scripts\load-test.sh -Encoding utf8