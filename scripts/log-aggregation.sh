#!/bin/bash
NAMESPACE="self-healing-app"
OUTPUT_DIR="logs/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo "Aggregating logs from all pods in $NAMESPACE..."

for pod in $(kubectl get pods -n $NAMESPACE -o jsonpath="{.items[*].metadata.name}"); do
  echo "Collecting logs from $pod"
  kubectl logs $pod -n $NAMESPACE --all-containers=true > "$OUTPUT_DIR/$pod.log" 2>&1
done

echo "Logs aggregated in $OUTPUT_DIR"
ls -la $OUTPUT_DIR
