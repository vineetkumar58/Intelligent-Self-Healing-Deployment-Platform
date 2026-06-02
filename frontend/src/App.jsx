import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const API = import.meta.env.VITE_API_URL || ''

const statusColor = (s) =>
  s === 'Running' ? '#22c55e' :
  s === 'Pending' ? '#f59e0b' : '#ef4444'

function StatCard({ title, value, unit, color }) {
  return (
    <div style={{
      background: '#1e293b', borderRadius: 12, padding: '20px 24px',
      borderLeft: `4px solid ${color}`, flex: 1, minWidth: 140
    }}>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700 }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span style={{ fontSize: 14, color: '#64748b', marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  )
}

function PodBadge({ pod }) {
  const phase = pod.status?.phase || 'Unknown'
  const name = pod.metadata?.name || 'unknown'
  const ready = pod.status?.containerStatuses?.[0]?.ready
  return (
    <div style={{
      background: '#0f172a', borderRadius: 8, padding: '12px 16px',
      border: `1px solid ${statusColor(phase)}33`, marginBottom: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' }}>
          {name.length > 40 ? name.slice(0, 40) + '...' : name}
        </span>
        <span style={{
          background: statusColor(phase) + '22',
          color: statusColor(phase),
          borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600
        }}>{phase}</span>
      </div>
      <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
        Ready: {ready ? 'Yes' : 'No'} &nbsp;|&nbsp;
        Restarts: {pod.status?.containerStatuses?.[0]?.restartCount ?? 0}
      </div>
    </div>
  )
}

export default function App() {
  const [metrics, setMetrics] = useState([])
  const [current, setCurrent] = useState(null)
  const [pods, setPods] = useState([])
  const [alerts, setAlerts] = useState([])
  const [status, setStatus] = useState(null)
  const [healing, setHealing] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, pRes, sRes] = await Promise.allSettled([
        axios.get(`${API}/api/metrics-summary`),
        axios.get(`${API}/api/pods`),
        axios.get(`${API}/api/status`)
      ])

      if (mRes.status === 'fulfilled') {
        const m = { ...mRes.value.data, time: new Date().toLocaleTimeString() }
        setCurrent(m)
        setMetrics(prev => [...prev.slice(-20), m])

        if (m.error_rate > 30) {
          setAlerts(prev => [{
            id: Date.now(),
            type: 'critical',
            msg: `High error rate: ${m.error_rate.toFixed(1)}% — self-healing triggered`,
            time: new Date().toLocaleTimeString()
          }, ...prev.slice(0, 9)])
        }
      }

      if (pRes.status === 'fulfilled') {
        const data = pRes.value.data
        setPods(data.items || [])
      }

      if (sRes.status === 'fulfilled') {
        setStatus(sRes.value.data)
      }
    } catch (e) {
      console.error('Fetch error:', e)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 3000)
    return () => clearInterval(id)
  }, [fetchAll])

  const triggerHeal = async () => {
    setHealing(true)
    setAlerts(prev => [{
      id: Date.now(), type: 'warning',
      msg: 'Failure injected — Kubernetes liveness probe will detect and restart pod',
      time: new Date().toLocaleTimeString()
    }, ...prev])
    await axios.post(`${API}/simulate-error`).catch(() => {})
    setTimeout(() => {
      setHealing(false)
      setAlerts(prev => [{
        id: Date.now(), type: 'success',
        msg: 'Self-healing complete — pod restarted and health restored',
        time: new Date().toLocaleTimeString()
      }, ...prev])
    }, 32000)
  }

  const clearHeal = async () => {
    await axios.delete(`${API}/simulate-error`).catch(() => {})
    setAlerts(prev => [{
      id: Date.now(), type: 'success',
      msg: 'Error mode cleared manually',
      time: new Date().toLocaleTimeString()
    }, ...prev])
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '24px 32px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
            Self-Healing Deployment Platform
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Live monitoring dashboard — updates every 3s
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            background: status?.status === 'healthy' ? '#166534' : '#7f1d1d',
            color: status?.status === 'healthy' ? '#86efac' : '#fca5a5',
            borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 600
          }}>
            {status?.status === 'healthy' ? 'System Healthy' : 'Degraded — Healing...'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard title="CPU Usage" value={current?.cpu_percent ?? 0} unit="%" color="#3b82f6" />
        <StatCard title="Memory" value={current?.memory_percent ?? 0} unit="%" color="#8b5cf6" />
        <StatCard title="Request Rate" value={current?.request_rate ?? 0} unit="req/s" color="#10b981" />
        <StatCard title="Error Rate" value={current?.error_rate ?? 0} unit="%" color={current?.error_rate > 10 ? '#ef4444' : '#22c55e'} />
        <StatCard title="Latency" value={current?.latency_ms ?? 0} unit="ms" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>CPU &amp; Memory over time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="cpu_percent" stroke="#3b82f6" fill="#3b82f620" name="CPU %" />
              <Area type="monotone" dataKey="memory_percent" stroke="#8b5cf6" fill="#8b5cf620" name="Mem %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Error rate &amp; latency</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="error_rate" stroke="#ef4444" dot={false} name="Error %" />
              <Line type="monotone" dataKey="latency_ms" stroke="#f59e0b" dot={false} name="Latency ms" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Pod status</h3>
          {pods.length === 0
            ? <p style={{ color: '#475569', fontSize: 13 }}>No pods found or kubectl not available in browser context</p>
            : pods.map(p => <PodBadge key={p.metadata?.uid} pod={p} />)
          }
          <p style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>Run: kubectl get pods -n self-healing-app</p>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Self-healing controls</h3>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
            Inject a failure to watch Kubernetes detect it via liveness probe and automatically restart the pod.
          </p>
          <button onClick={triggerHeal} disabled={healing} style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: healing ? 'not-allowed' : 'pointer',
            background: healing ? '#374151' : '#dc2626', color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 10
          }}>
            {healing ? 'Healing in progress...' : 'Inject failure'}
          </button>
          <button onClick={clearHeal} style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#1e3a2e', color: '#4ade80', fontWeight: 600, fontSize: 13
          }}>
            Clear error manually
          </button>
          <div style={{ marginTop: 14, fontSize: 11, color: '#475569' }}>
            After inject: watch pods restart in ~15-30s
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Alert feed</h3>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {alerts.length === 0
              ? <p style={{ color: '#475569', fontSize: 12 }}>No alerts — system healthy</p>
              : alerts.map(a => (
                <div key={a.id} style={{
                  background: a.type === 'critical' ? '#450a0a' : a.type === 'success' ? '#052e16' : '#431407',
                  borderLeft: `3px solid ${a.type === 'critical' ? '#ef4444' : a.type === 'success' ? '#22c55e' : '#f59e0b'}`,
                  borderRadius: '0 6px 6px 0', padding: '8px 12px', marginBottom: 8, fontSize: 11
                }}>
                  <div style={{ color: a.type === 'critical' ? '#fca5a5' : a.type === 'success' ? '#86efac' : '#fed7aa' }}>
                    {a.msg}
                  </div>
                  <div style={{ color: '#475569', marginTop: 2 }}>{a.time}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: '14px 20px', fontSize: 12, color: '#475569' }}>
        Platform: Minikube + Kubernetes + Prometheus + Grafana &nbsp;|&nbsp;
        Backend: Flask + prometheus-client &nbsp;|&nbsp;
        IaC: Terraform (local provider) &nbsp;|&nbsp;
        CI/CD: GitHub Actions + Docker Hub
      </div>
    </div>
  )
}