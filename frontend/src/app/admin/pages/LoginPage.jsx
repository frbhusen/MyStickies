import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../../lib/api/client'
import { endpoints } from '../../../lib/api/endpoints'
import { saveAdminTokens, isAdminAuthenticated } from '../../../lib/auth/adminAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await apiRequest(endpoints.adminLogin, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      saveAdminTokens(result)
      navigate('/admin', { replace: true })
    } catch (submitError) {
      setError('Sign in failed. Check username/password and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell" style={{ paddingTop: 48 }}>
      <section className="hero-card" style={{ maxWidth: 520, margin: '48px auto 0' }}>
        <h1 className="section-title">Admin login</h1>
        <form className="stack" onSubmit={onSubmit}>
          <label className="muted">Username</label>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <label className="muted">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="muted" style={{ color: '#a32626', margin: 0 }}>{error}</p> : null}
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
