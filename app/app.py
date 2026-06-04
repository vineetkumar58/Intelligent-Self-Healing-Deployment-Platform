from flask import Flask, jsonify, request
from flask_cors import CORS
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time, random, os, threading

app = Flask(__name__)
CORS(app)

REQUEST_COUNT    = Counter('app_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY  = Histogram('app_request_latency_seconds', 'Request latency', ['endpoint'])
ERROR_RATE       = Gauge('app_error_rate', 'Current error rate')
ACTIVE_REQUESTS  = Gauge('app_active_requests', 'Active requests')

error_mode = {"enabled": False}

@app.before_request
def before():
    ACTIVE_REQUESTS.inc()
    request._start = time.time()

@app.after_request
def after(response):
    ACTIVE_REQUESTS.dec()
    latency = time.time() - request._start
    REQUEST_LATENCY.labels(endpoint=request.path).observe(latency)
    REQUEST_COUNT.labels(method=request.method, endpoint=request.path,
                         status=response.status_code).inc()
    return response

@app.route('/')
def home():
    return jsonify({
        "status": "ok",
        "version": os.getenv("APP_VERSION", "v1"),
        "pod": os.getenv("HOSTNAME", "local"),
        "message": "Self-Healing Platform running"
    })

@app.route('/health')
def health():
    if error_mode["enabled"]:
        return jsonify({"status": "unhealthy", "reason": "simulated failure"}), 500
    return jsonify({"status": "healthy"}), 200

@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.route('/api/pods')
def pods():
    import subprocess
    try:
        result = subprocess.run(
            ['kubectl', 'get', 'pods', '-n', 'self-healing-app', '-o', 'json'],
            capture_output=True, text=True, timeout=5
        )
        return result.stdout, 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({"error": str(e), "items": []}), 200

@app.route('/api/status')
def status():
    return jsonify({
        "status": "healthy" if not error_mode["enabled"] else "degraded",
        "error_mode": error_mode["enabled"],
        "version": os.getenv("APP_VERSION", "v1"),
        "pod": os.getenv("HOSTNAME", "local"),
        "uptime": time.time()
    })

@app.route('/simulate-error', methods=['POST'])
def simulate_error():
    error_mode["enabled"] = True
    def reset():
        time.sleep(30)
        error_mode["enabled"] = False
    threading.Thread(target=reset, daemon=True).start()
    return jsonify({"message": "Error mode ON for 30s — watch Kubernetes heal it!"}), 200

@app.route('/simulate-error', methods=['DELETE'])
def clear_error():
    error_mode["enabled"] = False
    return jsonify({"message": "Error cleared"}), 200

@app.route('/api/metrics-summary')
def metrics_summary():
    return jsonify({
        "cpu_percent": random.uniform(20, 80),
        "memory_percent": random.uniform(30, 70),
        "request_rate": random.uniform(5, 50),
        "error_rate": random.uniform(0, 5) if not error_mode["enabled"] else random.uniform(40, 90),
        "latency_ms": random.uniform(10, 200)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)