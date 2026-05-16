export default function EvalReportCard({ latest }) {
  const report = latest?.report
  if (!report) {
    return (
      <section className="panel">
        <div className="eyebrow">Eval report</div>
        <h3>No report found</h3>
        <p className="muted">Run <code>python backend/evals/run_evals.py</code> to generate the latest report.</p>
      </section>
    )
  }

  const m = report.metrics
  return (
    <section className="panel admin-report">
      <div className="section-head">
        <div>
          <div className="eyebrow">Eval report</div>
          <h3>Latest offline evaluation</h3>
        </div>
        <span className="chip chip-quiet">{latest.fileName}</span>
      </div>

      <div className="metric-grid">
        <Metric label="Accuracy" value={m.classification_accuracy} />
        <Metric label="Retrieval P@k" value={m.retrieval_precision_at_k} />
        <Metric label="Citation rate" value={m.draft_citation_rate} />
        <Metric label="Judge exact" value={m.judge_exact_match} />
      </div>

      <div className="calibration-box">
        <strong>Judge calibration</strong>
        <p>MAE {m.judge_mae.toFixed(2)} • bias {m.judge_bias.toFixed(2)}</p>
        <p className="muted">{m.judge_note}</p>
      </div>

      <div className="summary-list">
        <div><span>Items</span><strong>{report.summary.num_items}</strong></div>
        <div><span>Errors</span><strong>{report.summary.classification_errors}</strong></div>
        <div><span>Retrieval misses</span><strong>{report.summary.retrieval_misses}</strong></div>
        <div><span>Drafts with citations</span><strong>{report.summary.drafts_with_citations}</strong></div>
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)))
  return (
    <div className="metric-card compact">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{(value || 0).toFixed(2)}</div>
      <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
