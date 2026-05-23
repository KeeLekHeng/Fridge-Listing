import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { ShortlistPage } from './pages/ShortlistPage'

// Placeholder stubs for routes not yet built — keeps routing wired without 404s
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-ink-3 text-[14px] font-mono">{label} — coming soon</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Buyer routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route path="/shortlist" element={<ShortlistPage />} />

        {/* Admin routes */}
        <Route path="/manage/login" element={<ComingSoon label="/manage/login" />} />
        <Route path="/manage" element={<ComingSoon label="/manage" />} />
        <Route path="/manage/listings/new" element={<ComingSoon label="/manage/listings/new" />} />
        <Route path="/manage/listings/:id/edit" element={<ComingSoon label="/manage/listings/:id/edit" />} />
      </Routes>
    </BrowserRouter>
  )
}
