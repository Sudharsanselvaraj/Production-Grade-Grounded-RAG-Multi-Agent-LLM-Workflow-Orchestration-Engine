'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { backendPost } from '@/lib/backend'

const USERS = [
  { username: 'teamlead', role: 'Team Lead' },
  { username: 'agent1', role: 'Support Agent' },
]

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('teamlead')
  const [password, setPassword] = useState('lead-demo')
  const [error, setError] = useState('')

  async function login() {
    setError('')
    try {
      await backendPost('/api/auth/login', { username, password })
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }

  function onUsernameChange(nextUsername) {
    setUsername(nextUsername)
    const selected = USERS.find((user) => user.username === nextUsername) || USERS[0]
    setPassword(selected.username === 'teamlead' ? 'lead-demo' : 'agent-demo')
  }

  return (
    <div className="auth-layout panel">
      <div className="auth-copy">
        <div className="eyebrow">Demo auth</div>
        <h2>Sign in to the operator console</h2>
        <p className="muted">Hardcoded demo identities are enough for the take-home: two roles, visible difference, and a local browser session.</p>
      </div>

      <div className="auth-form">
        <label className="field">
          <span>Username</span>
          <select value={username} onChange={(event) => onUsernameChange(event.target.value)}>
            {USERS.map((user) => <option value={user.username} key={user.username}>{user.username} · {user.role}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        <button className="primary-button login-button" onClick={login}>Continue</button>
        {error ? <div className="action-status">{error}</div> : null}

        <div className="help-card">
          <strong>Role behavior</strong>
          <p>Team Leads can review eval reports and trace data. Agents can inspect tickets and drafts, but the view keeps the same operational structure.</p>
        </div>
      </div>
    </div>
  )
}
