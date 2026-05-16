'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { backendGet, backendPost } from '@/lib/backend'

const DEMO_USERS = [
  { username: 'teamlead', password: 'lead-demo', role: 'Team Lead' },
  { username: 'agent1', password: 'agent-demo', role: 'Support Agent' },
]

export default function AppShell({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    backendGet('/api/auth/me')
      .then((data) => {
        if (mounted) setSession(data.user)
      })
      .catch(() => {
        if (mounted) setSession(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  async function login(username) {
    const selected = DEMO_USERS.find((user) => user.username === username) || DEMO_USERS[0]
    setError('')
    try {
      const data = await backendPost('/api/auth/login', { username: selected.username, password: selected.password })
      setSession(data.user)
    } catch (err) {
      setError(err.message)
    }
  }

  async function logout() {
    setError('')
    try {
      await backendPost('/api/auth/logout')
      setSession(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="eyebrow">Lumen Support AI</div>
          <h1>Operations Console</h1>
          <p className="muted">Queue triage, grounded drafts, human review, and trace inspection in one place.</p>
        </div>

        <nav className="nav-stack">
          <Link href="/" className="nav-link">Queue</Link>
          <Link href="/admin" className="nav-link">Eval report</Link>
          <Link href="/login" className="nav-link">Auth</Link>
        </nav>

        <div className="session-card">
          <div className="label">Current session</div>
          {loading ? (
            <div className="muted">Loading session…</div>
          ) : session ? (
            <>
              <strong>{session.username}</strong>
              <span className="chip">{session.role}</span>
              <button className="secondary-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <div className="muted">Cookie-backed demo auth. Use the two role buttons or the login page.</div>
              <div className="login-choices">
                <button className="secondary-button" onClick={() => login('teamlead')}>Login as Team Lead</button>
                <button className="secondary-button" onClick={() => login('agent1')}>Login as Agent</button>
              </div>
            </>
          )}
          {error ? <div className="action-status">{error}</div> : null}
        </div>
      </aside>

      <main className="main-stage">
        {children}
      </main>
    </div>
  )
}
