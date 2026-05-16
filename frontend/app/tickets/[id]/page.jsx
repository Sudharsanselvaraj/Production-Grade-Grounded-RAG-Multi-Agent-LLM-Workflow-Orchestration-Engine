import { backendGet } from '@/lib/backend'
import TicketActions from '@/components/TicketActions'
import TracePanel from '@/components/TracePanel'

export default async function TicketPage({ params }) {
  const { id } = params
  const [ticket, tracePayload] = await Promise.all([
    backendGet(`/api/tickets/${id}`).catch(() => null),
    backendGet(`/api/traces/${id}`).catch(() => ({ traces: [] })),
  ])

  if (!ticket) {
    return <div className="panel">Ticket not found.</div>
  }

  let citations = []
  if (ticket.ai_citations) {
    try {
      citations = JSON.parse(ticket.ai_citations)
    } catch {
      citations = []
    }
  }

  return (
    <div className="ticket-detail-layout">
      <section className="panel ticket-main-panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Ticket detail</div>
            <h2>#{ticket.id} · {ticket.subject}</h2>
          </div>
          <div className="stack-right">
            <span className="chip chip-soft">{ticket.status}</span>
            <span className="chip chip-outline">{ticket.ai_decision || 'untriaged'}</span>
          </div>
        </div>

        <div className="two-column-summary">
          <div>
            <div className="label">Customer message</div>
            <p className="body-copy">{ticket.body}</p>
          </div>
          <div className="summary-box">
            <div><span className="label">AI confidence</span><strong>{ticket.ai_confidence || '—'}</strong></div>
            <div><span className="label">Spam</span><strong>{ticket.is_spam ? 'yes' : 'no'}</strong></div>
            <div><span className="label">Draft exists</span><strong>{ticket.ai_draft ? 'yes' : 'no'}</strong></div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="panel inner-panel">
            <div className="eyebrow">Proposed response</div>
            <h3>Grounded draft</h3>
            {ticket.ai_draft ? <p className="draft-copy">{ticket.ai_draft}</p> : <p className="muted">No draft yet. Use the buttons below to generate one.</p>}
            <div className="citation-list">
              {citations.length ? citations.map((citation, index) => (
                <div className="citation-card" key={index}>
                  <strong>{citation.source}:{citation.id}</strong>
                  <p>{citation.snippet}</p>
                </div>
              )) : <div className="empty-state">No citations stored yet.</div>}
            </div>
          </div>

          <div className="panel inner-panel">
            <div className="eyebrow">Operator actions</div>
            <h3>Take over or progress the workflow</h3>
            <TicketActions ticketId={ticket.id} />
            <div className="action-note">Buttons trigger backend classify, decide, and draft endpoints, then refresh the view.</div>
          </div>
        </div>
      </section>

      <div className="side-stack">
        <TracePanel traces={tracePayload.traces || []} />
      </div>
    </div>
  )
}
