export default function TracePanel({ traces = [] }) {
  function readStage(summary) {
    if (!summary) return 'observed'
    try {
      return JSON.parse(summary).stage || 'observed'
    } catch {
      return 'observed'
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <div className="eyebrow">Trace debug</div>
          <h3>Reasoning timeline</h3>
        </div>
        <div className="muted">{traces.length} trace run(s)</div>
      </div>

      {!traces.length ? <div className="empty-state">No traces recorded yet. Run classify / decide / draft to inspect the workflow timeline.</div> : null}

      <div className="timeline">
        {traces.map((trace) => (
          <article key={trace.trace.id} className="trace-card">
            <div className="trace-head">
              <strong>Run #{trace.trace.id}</strong>
              <span className="chip">{readStage(trace.trace.summary)}</span>
            </div>
            <div className="muted">Started {trace.trace.start_time}</div>
            <ul className="event-list">
              {trace.events.map((event) => (
                <li key={event.id}>
                  <span className="event-step">{event.step}</span>
                  <span className="event-detail">{event.detail}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
