import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { ShortlistPage } from './pages/ShortlistPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminListingFormPage } from './pages/AdminListingFormPage'
import { AdminHistoryPage } from './pages/AdminHistoryPage'
import { RequireAuth } from './components/RequireAuth'
import { AdminLayout } from './components/AdminLayout'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Buyer routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route path="/shortlist" element={<ShortlistPage />} />

        {/* Admin — public */}
        <Route path="/manage/login" element={<AdminLoginPage />} />

        {/* Admin — protected (auth-gated) */}
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/manage" element={<AdminDashboardPage />} />
            <Route path="/manage/listings/new" element={<AdminListingFormPage />} />
            <Route path="/manage/listings/:id/edit" element={<AdminListingFormPage />} />
            <Route path="/manage/listings/:id/history" element={<AdminHistoryPage />} />
            <Route path="/manage/activities" element={<AdminHistoryPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
