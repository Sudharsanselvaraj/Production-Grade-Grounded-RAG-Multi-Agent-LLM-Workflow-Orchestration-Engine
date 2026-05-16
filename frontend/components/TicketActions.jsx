'use client'

import { useState } from 'react'
import { backendPost } from '@/lib/backend'

export default function TicketActions({ ticketId }) {
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState('')

  async function run(action) {
    setBusy(action)
    setMessage('')
    try {
      if (action === 'classify') await backendPost(`/api/tickets/${ticketId}/classify`)
      if (action === 'decide') await backendPost(`/api/tickets/${ticketId}/decide`)
      if (action === 'draft') await backendPost(`/api/tickets/${ticketId}/draft`)
      setMessage(`${action} completed`)
      window.location.reload()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="action-row">
      <button className="primary-button" disabled={busy} onClick={() => run('classify')}>{busy === 'classify' ? 'Classifying…' : 'Classify'}</button>
      <button className="primary-button" disabled={busy} onClick={() => run('decide')}>{busy === 'decide' ? 'Routing…' : 'Decide'}</button>
      <button className="primary-button" disabled={busy} onClick={() => run('draft')}>{busy === 'draft' ? 'Drafting…' : 'Draft reply'}</button>
      {message ? <div className="action-status">{message}</div> : null}
    </div>
  )
}
