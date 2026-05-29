import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, type AdminMe } from '../lib/api'

export function AdminLayout() {
  const navigate = useNavigate()
  const [me, setMe] = useState<AdminMe | null>(null)

  useEffect(() => {
    api.admin.me().then(setMe).catch(() => {})
  }, [])

  async function handleLogout() {
    await api.admin.logout()
    navigate('/manage/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar me={me} onLogout={handleLogout} />
      <div className="flex-1 min-w-0 overflow-y-auto bg-[#F5F5F7]">
        <Outlet />
      </div>
    </div>
  )
}

function AdminSidebar({ me, onLogout }: { me: AdminMe | null; onLogout: () => void }) {
  return (
    <aside className="w-[216px] shrink-0 bg-white border-r border-line flex flex-col h-full">
      {/* Brand */}
      <div className="h-[55px] px-5 flex items-center gap-2 border-b border-line shrink-0">
        <LogoMark />
        <span className="font-semibold text-[15px] tracking-[-0.03em]">Chillix</span>
        <span className="ml-auto text-[10px] font-semibold text-ink-4 bg-surface px-1.5 py-0.5 rounded-[4px] tracking-wide uppercase">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[10.5px] font-semibold text-ink-4 uppercase tracking-wider">
          Inventory
        </p>
        <SideNavItem to="/manage" end icon={<GridIcon />} label="Listings" />
        <SideNavItem to="/manage/activities" icon={<HistoryNavIcon />} label="All Activities" />
      </nav>

      {/* Account footer */}
      <div className="border-t border-line p-3 flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-[11px] font-bold shrink-0">
          {me?.username?.slice(0, 2).toUpperCase() ?? 'AD'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-ink truncate">{me?.username ?? '—'}</div>
          <div className="text-[11px] text-ink-4">Admin</div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="p-1.5 rounded-[6px] text-ink-3 hover:text-ink hover:bg-surface transition-colors shrink-0"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  )
}

function SideNavItem({ to, end, icon, label }: { to: string; end?: boolean; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-colors w-full text-left ${
          isActive ? 'bg-ink text-white' : 'text-ink-2 hover:bg-surface hover:text-ink'
        }`
      }
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </NavLink>
  )
}

function LogoMark() {
  return (
    <span style={{ display: 'inline-block', width: 20, height: 20, borderRadius: 6, background: 'oklch(0.55 0.13 155)', position: 'relative', flexShrink: 0 }}>
      <span style={{ position: 'absolute', right: 3, top: 3, width: 2, height: 2, background: 'white', borderRadius: '50%' }} />
      <span style={{ position: 'absolute', left: 3, right: 3, top: 9, height: 1.5, background: 'white', borderRadius: 2 }} />
    </span>
  )
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function HistoryNavIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2.5 4.5A5.5 5.5 0 1 0 4.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M1.5 1.5v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 5v2.8l2 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M9 2H3.5A1.5 1.5 0 0 0 2 3.5v8A1.5 1.5 0 0 0 3.5 13H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 5l2.5 2.5L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
