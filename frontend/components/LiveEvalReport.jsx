'use client'

import { useEffect, useState } from 'react'

function Metric({ label, value }) {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)))
  return (
    <div className="metric-card compact">
      <div className="metric-label">{label}</div>
      <strong className="metric-value">{(value || 0).toFixed(2)}</strong>
      <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function LiveEvalReport({ initialLatest }) {
  const [latest, setLatest] = useState(initialLatest)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/eval-report', { cache: 'no-store' })
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`)
      const data = await res.json()
      setLatest(data.latest)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(refresh, 20000)
    return () => clearInterval(timer)
  }, [])

  if (!latest?.report) {
    return (
      <section className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Admin / evals</div>
            <h3>No eval report available</h3>
          </div>
          <button className="secondary-button" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh now'}</button>
        </div>
        <p className="muted">Run <code>python backend/evals/run_evals.py</code> to create the latest offline evaluation report.</p>
        {error ? <p className="action-status">{error}</p> : null}
      </section>
    )
  }

  const report = latest.report
  const m = report.metrics

  return (
    <div className="admin-layout">
      <section className="panel admin-hero">
        <div>
          <div className="eyebrow">Admin / evals</div>
          <h2>Offline evaluation, latest run</h2>
          <p className="muted">This view reads the generated JSON report and distills the headline metrics for a support lead or reviewer.</p>
        </div>
        <div className="hero-stats">
          <div className="metric-card"><span className="metric-label">Items</span><strong className="metric-value">{report.summary.num_items}</strong></div>
          <div className="metric-card"><span className="metric-label">Judge MAE</span><strong className="metric-value">{m.judge_mae.toFixed(2)}</strong></div>
          <div className="metric-card"><span className="metric-label">Bias</span><strong className="metric-value">{m.judge_bias.toFixed(2)}</strong></div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Metrics</div>
            <h3>Summary scores</h3>
          </div>
          <div className="action-row" style={{gridAutoFlow:'column', alignItems:'center'}}>
            <span className="chip chip-quiet">{latest.fileName}</span>
            <button className="secondary-button" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh now'}</button>
          </div>
        </div>

        {error ? <p className="action-status">{error}</p> : null}

        <div className="metric-grid">
          <Metric label="Classification accuracy" value={m.classification_accuracy} />
          <Metric label="Retrieval P@k" value={m.retrieval_precision_at_k} />
          <Metric label="Citation rate" value={m.draft_citation_rate} />
          <Metric label="Judge exact" value={m.judge_exact_match} />
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Calibration</div>
            <h3>LLM-judge alignment</h3>
          </div>
        </div>
        <div className="calibration-box">
          <strong>What this says</strong>
          <p>Smaller MAE indicates the judge’s scores are closer to the proxy rubric; bias near zero indicates it is not systematically too generous or too strict.</p>
          <p className="muted">{m.judge_note}</p>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Confusion matrix</div>
            <h3>Classification errors</h3>
          </div>
        </div>
        {matrixTable(report.confusion_matrix)}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Per-ticket breakdown</div>
            <h3>Examples and failure modes</h3>
          </div>
        </div>
        <div className="report-list">
          {report.items.map((item) => (
            <article className="report-row" key={item.ticket_id}>
              <div>
                <strong>#{item.ticket_id}</strong>
                <p className="muted">{item.subject}</p>
              </div>
              <div className="report-grid-cell">
                <span className="chip chip-soft">expected {item.expected_category}</span>
                <span className="chip chip-outline">pred {item.predicted_category || '—'}</span>
                <span className="chip chip-quiet">judge {item.judge_score || '—'}</span>
              </div>
              <div className="muted report-error">{item.error || (item.draft_has_citations ? 'citations present' : 'no citations')}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function matrixTable(matrix) {
  const labels = Object.keys(matrix || {})
  if (!labels.length) return <div className="empty-state">No confusion matrix available.</div>

  return (
    <table className="matrix-table">
      <thead>
        <tr>
          <th>Actual \ Predicted</th>
          {labels.map((label) => <th key={label}>{label}</th>)}
        </tr>
      </thead>
      <tbody>
        {labels.map((actual) => (
          <tr key={actual}>
            <th>{actual}</th>
            {labels.map((pred) => <td key={pred}>{matrix[actual]?.[pred] || 0}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
