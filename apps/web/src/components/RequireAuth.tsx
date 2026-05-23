import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { api } from '../lib/api'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function RequireAuth() {
  const [state, setState] = useState<AuthState>('loading')

  useEffect(() => {
    api.admin.me()
      .then(() => setState('authenticated'))
      .catch(() => setState('unauthenticated'))
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-ink/20 border-t-ink animate-spin" />
      </div>
    )
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/manage/login" replace />
  }

  return <Outlet />
}
