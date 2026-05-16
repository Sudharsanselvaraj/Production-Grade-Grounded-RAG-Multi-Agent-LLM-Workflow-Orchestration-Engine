import Link from 'next/link'
import { backendGet } from '@/lib/backend'
import { getLatestEvalReport } from '@/lib/reports'
import EvalReportCard from '@/components/EvalReportCard'

function statusTone(status) {
  if (!status) return 'chip'
  const map = {
    open: 'chip chip-open',
    closed: 'chip chip-closed',
    eval: 'chip chip-eval',
  }
  return map[status] || 'chip'
}

export default async function Page() {
  const [queue, latest] = await Promise.all([
    backendGet('/api/tickets').catch(() => ({ tickets: [] })),
    Promise.resolve(getLatestEvalReport()),
  ])
  const tickets = queue.tickets || []
  const top = tickets.slice(0, 8)

  const metrics = {
    total: tickets.length,
    withDecision: tickets.filter((ticket) => ticket.ai_decision).length,
    withDraft: tickets.filter((ticket) => ticket.ai_draft).length,
    spam: tickets.filter((ticket) => ticket.is_spam).length,
  }

  return (
    <div className="dashboard-grid">
      <section className="hero panel">
        <div className="eyebrow">Queue overview</div>
        <div className="hero-head">
          <div>
            <h2>Ticket queue</h2>
            <p className="muted">A skeptical operator should be able to see what the agent thinks, what it retrieved, and what needs human attention in one glance.</p>
          </div>
          <div className="hero-badge">{tickets.length} tickets</div>
        </div>

        <div className="metric-row">
          <div className="metric-card"><span className="metric-label">Queued</span><strong className="metric-value">{metrics.total}</strong></div>
          <div className="metric-card"><span className="metric-label">Decided</span><strong className="metric-value">{metrics.withDecision}</strong></div>
          <div className="metric-card"><span className="metric-label">Drafted</span><strong className="metric-value">{metrics.withDraft}</strong></div>
          <div className="metric-card"><span className="metric-label">Spam</span><strong className="metric-value">{metrics.spam}</strong></div>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel queue-panel">
          <div className="section-head">
            <div>
              <div className="eyebrow">Incoming tickets</div>
              <h3>Review queue</h3>
            </div>
            <span className="chip chip-quiet">priority first</span>
          </div>

          {!top.length ? <div className="empty-state">No tickets found. Seed the database and refresh.</div> : null}

          <div className="ticket-list">
            {top.map((ticket) => (
              <Link href={`/tickets/${ticket.id}`} key={ticket.id} className="ticket-row">
                <div className="ticket-main">
                  <div className="ticket-title">{ticket.subject}</div>
                  <div className="ticket-subtitle">{ticket.body.slice(0, 120)}{ticket.body.length > 120 ? '…' : ''}</div>
                </div>
                <div className="ticket-meta">
                  <span className={statusTone(ticket.status)}>{ticket.status}</span>
                  <span className="chip chip-soft">{ticket.ai_decision || 'untriaged'}</span>
                  <span className="chip chip-outline">conf {ticket.ai_confidence || '—'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <EvalReportCard latest={latest} />

          <section className="panel">
            <div className="eyebrow">Trust signals</div>
            <h3>What the operator sees</h3>
            <ul className="bullets">
              <li>Decision + confidence chip per ticket</li>
              <li>Retrieval evidence with source ids</li>
              <li>Trace timeline of every workflow step</li>
              <li>Latest offline eval with judge calibration</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
