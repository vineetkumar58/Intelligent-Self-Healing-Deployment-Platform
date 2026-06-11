@"
#!/bin/bash
NAMESPACE="self-healing-app"
DEPLOYMENT="self-healing-backend"

echo "======================================"
echo "  SELF-HEALING LIVE DEMO"
echo "======================================"

echo ""
echo "STEP 1: Current healthy state"
echo "------------------------------"
kubectl get pods -n $NAMESPACE
sleep 3

echo ""
echo "STEP 2: Checking deployment history"
echo "------------------------------"
kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE
sleep 2

echo ""
echo "STEP 3: Simulating pod crash by deleting a pod"
echo "------------------------------"
POD=$(kubectl get pods -n $NAMESPACE -l app=self-healing-backend -o jsonpath='{.items[0].metadata.name}')
echo "Deleting pod: $POD"
kubectl delete pod $POD -n $NAMESPACE
sleep 2

echo ""
echo "STEP 4: Watching Kubernetes self-heal (30 seconds)"
echo "------------------------------"
echo "Kubernetes is automatically recreating the pod..."
for i in $(seq 1 6); do
  sleep 5
  echo "--- Check $i/6 ---"
  kubectl get pods -n $NAMESPACE
done

echo ""
echo "STEP 5: Simulating bad deployment for rollback demo"
echo "------------------------------"
echo "Deploying bad image..."
kubectl set image deployment/$DEPLOYMENT backend=nginx:badtag -n $NAMESPACE 2>/dev/null || true
sleep 10
echo "Pods after bad deployment:"
kubectl get pods -n $NAMESPACE
sleep 5

echo ""
echo "STEP 6: Triggering automatic rollback"
echo "------------------------------"
kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --t