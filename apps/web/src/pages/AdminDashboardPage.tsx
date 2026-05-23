import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AdminListingDTO, ListingStatus } from '@fridge/shared'
import { LISTING_STATUS } from '@fridge/shared'
import { api } from '../lib/api'
import { FridgePlaceholder } from '../components/FridgePlaceholder'

const STATUS_LABELS: Record<ListingStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  rented: 'Rented',
  sold: 'Sold',
  unavailable: 'Unavailable',
}

const STATUS_BADGE_CLASS: Record<ListingStatus, string> = {
  available: 'bg-st-avail-bg text-st-avail',
  reserved: 'bg-st-resv-bg text-st-resv',
  rented: 'bg-st-rent-bg text-st-rent',
  sold: 'bg-st-sold-bg text-st-sold',
  unavailable: 'bg-st-unav-bg text-st-unav',
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<AdminListingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ListingStatus | ''>('')
  const [locationFilter, setLocationFilter] = useState('')
  const [changingStatus, setChangingStatus] = useState<Record<string, boolean>>({})
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    api.admin.listings.list({ limit: 1000 })
      .then(res => setListings(res.data))
      .finally(() => setLoading(false))
  }, [])

  const locations = useMemo(() => {
    const set = new Set(listings.map(l => l.location))
    return [...set].sort()
  }, [listings])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return listings.filter(l => {
      if (q && !l.listingCode.toLowerCase().includes(q) && !l.brand.toLowerCase().includes(q)) return false
      if (statusFilter && l.status !== statusFilter) return false
      if (locationFilter && l.location !== locationFilter) return false
      return true
    })
  }, [listings, search, statusFilter, locationFilter])

  async function handleLogout() {
    await api.admin.logout()
    navigate('/manage/login', { replace: true })
  }

  async function handleStatusChange(id: string, newStatus: ListingStatus) {
    setChangingStatus(prev => ({ ...prev, [id]: true }))
    setStatusError(null)
    try {
      await api.admin.listings.updateStatus(id, newStatus)
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    } catch {
      setStatusError('Failed to update status — please try again')
    } finally {
      setChangingStatus(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {statusError && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-btn bg-red-600 text-white text-[13.5px] font-medium shadow-pop whitespace-nowrap"
        >
          {statusError}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-line px-5 h-14 flex items-center justify-between gap-3">
        <h1 className="text-[16px] font-semibold text-ink tracking-[-0.015em] shrink-0">
          Fridge Management
        </h1>
        <div className="flex items-center gap-2 ml-auto">
          <Link
            to="/manage/listings/new"
            className="px-3 py-1.5 rounded-btn bg-ink text-white text-[13px] font-medium whitespace-nowrap hover:bg-ink-2 transition-colors"
          >
            + Create listing
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-btn border border-line text-[13px] text-ink-3 whitespace-nowrap hover:text-ink hover:border-line-strong transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Search code or brand…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 rounded-input border border-line bg-white text-[13px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ListingStatus | '')}
            className="px-3 py-2 rounded-input border border-line bg-white text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All statuses</option>
            {LISTING_STATUS.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="px-3 py-2 rounded-input border border-line bg-white text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-white">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-4 py-3 font-medium text-ink-3 w-[52px]">Img</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Code</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Brand</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Location</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Buy</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Rent</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Deposit</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Status</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Updated</th>
                  <th className="px-4 py-3 font-medium text-ink-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-ink-3">
                      No listings found
                    </td>
                  </tr>
                ) : filtered.map(listing => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    changingStatus={!!changingStatus[listing.id]}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <p className="mt-2 text-[12px] text-ink-4">
            {filtered.length} listing{filtered.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status as ListingStatus
  const cls = STATUS_BADGE_CLASS[s] ?? 'bg-surface text-ink-3'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${cls}`}>
      {STATUS_LABELS[s] ?? status}
    </span>
  )
}

function ListingRow({
  listing,
  changingStatus,
  onStatusChange,
}: {
  listing: AdminListingDTO
  changingStatus: boolean
  onStatusChange: (id: string, status: ListingStatus) => Promise<void>
}) {
  const coverImage = listing.images[0]?.imageUrl

  return (
    <tr className="border-b border-line last:border-b-0 hover:bg-row-hover transition-colors">
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-[8px] overflow-hidden bg-surface flex-none">
          {coverImage
            ? <img src={coverImage} alt={listing.brand} className="w-full h-full object-cover" />
            : <FridgePlaceholder label={listing.listingCode} />
          }
        </div>
      </td>

      <td className="px-4 py-3 font-mono text-[11.5px] text-ink-3 tracking-wide whitespace-nowrap">
        {listing.listingCode}
      </td>

      <td className="px-4 py-3 text-ink font-medium whitespace-nowrap">{listing.brand}</td>

      <td className="px-4 py-3 text-ink-3 whitespace-nowrap">{listing.location}</td>

      <td className="px-4 py-3 whitespace-nowrap">
        {listing.buyEnabled && listing.buyPrice != null
          ? `$${listing.buyPrice}`
          : <span className="text-ink-5">—</span>
        }
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {listing.rentEnabled
          ? `$${listing.rentPrice}/sem`
          : <span className="text-ink-5">—</span>
        }
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        {listing.rentEnabled
          ? `$${listing.depositPrice}`
          : <span className="text-ink-5">—</span>
        }
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={listing.status} />
      </td>

      <td className="px-4 py-3 text-ink-3 whitespace-nowrap">
        {formatDate(listing.updatedAt)}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Link
            to={`/manage/listings/${listing.id}/edit`}
            className="px-2.5 py-1 rounded-[8px] border border-line text-ink text-[12px] hover:bg-surface transition-colors whitespace-nowrap"
          >
            Edit
          </Link>
          <select
            value={listing.status}
            onChange={e => onStatusChange(listing.id, e.target.value as ListingStatus)}
            disabled={changingStatus}
            aria-label="Change status"
            className="px-2 py-1 rounded-[8px] border border-line text-[12px] text-ink bg-white focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 cursor-pointer"
          >
            {LISTING_STATUS.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <Link
            to={`/manage/listings/${listing.id}/history`}
            className="px-2.5 py-1 rounded-[8px] border border-line text-ink text-[12px] hover:bg-surface transition-colors whitespace-nowrap"
          >
            History
          </Link>
        </div>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-card border border-line bg-white overflow-hidden animate-pulse">
      <div className="h-11 bg-surface border-b border-line" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-[60px] border-b border-line last:border-b-0 flex items-center px-4 gap-4">
          <div className="w-10 h-10 bg-surface rounded-[8px] flex-none" />
          <div className="flex-1 flex gap-4">
            <div className="h-3 bg-surface rounded w-16" />
            <div className="h-3 bg-surface rounded w-24" />
            <div className="h-3 bg-surface rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
