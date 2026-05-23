import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.admin.login(username, password)
      navigate('/manage', { replace: true })
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-5">
      <div className="w-full max-w-[360px]">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink mb-1">
          Admin login
        </h1>
        <p className="text-[13px] text-ink-3 mb-6">Chillix management console</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            autoComplete="username"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 rounded-input border border-line bg-white text-[14px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 rounded-input border border-line bg-white text-[14px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          />

          {error && (
            <p role="alert" className="text-[13px] text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-3 rounded-btn bg-ink text-white text-[14px] font-semibold disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
