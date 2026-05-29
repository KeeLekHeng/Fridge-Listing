import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
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

const STATUS_DOT: Record<ListingStatus, string> = {
  available: 'bg-st-avail',
  reserved: 'bg-st-resv',
  rented: 'bg-st-rent',
  sold: 'bg-st-sold',
  unavailable: 'bg-st-unav',
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AdminDashboardPage() {
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

  const counts = useMemo(() => {
    const c: Partial<Record<ListingStatus, number>> = {}
    LISTING_STATUS.forEach(s => { c[s] = listings.filter(l => l.status === s).length })
    return c
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

  const hasFilters = !!statusFilter || !!locationFilter || !!search

  return (
    <div className="min-h-full">
      {statusError && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-btn bg-red-600 text-white text-[13.5px] font-medium shadow-pop whitespace-nowrap"
        >
          {statusError}
        </div>
      )}

      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-line px-6 h-[55px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-ink-3">Inventory</span>
          <span className="text-ink-4">/</span>
          <span className="text-ink font-medium">Listings</span>
        </div>
        <Link
          to="/manage/listings/new"
          className="px-3 py-1.5 rounded-btn bg-ink text-white text-[13px] font-medium hover:bg-ink-2 transition-colors"
        >
          + New listing
        </Link>
      </div>

      <div className="px-6 pt-5 pb-8">
        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-[20px] font-semibold text-ink tracking-[-0.02em]">Listings</h1>
          {!loading && (
            <p className="text-[13px] text-ink-3 mt-0.5">
              {listings.length} fridges · {counts.available ?? 0} available now
            </p>
          )}
        </div>

        {/* Stat cards */}
        {!loading && (
          <div className="grid grid-cols-5 gap-3 mb-5">
            {LISTING_STATUS.map(s => {
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(active ? '' : s)}
                  className={`text-left p-4 rounded-[12px] border transition-all ${
                    active
                      ? 'border-ink bg-ink'
                      : 'border-line bg-white hover:border-line-strong'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 text-[12px] mb-2 ${active ? 'text-white/70' : 'text-ink-3'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-white/60' : STATUS_DOT[s]}`} />
                    {STATUS_LABELS[s]}
                  </div>
                  <div className={`text-[26px] font-semibold leading-none tracking-[-0.02em] ${active ? 'text-white' : 'text-ink'}`}>
                    {counts[s] ?? 0}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <SearchIcon />
            <input
              type="text"
              placeholder="Filter by code or brand…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-[8px] border border-line bg-white text-[13px] text-ink placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Location chip */}
          <FilterChip
            label="Location"
            value={locationFilter}
            options={locations.map(l => ({ value: l, label: l }))}
            onSelect={setLocationFilter}
            icon={<PinIcon />}
          />

          {/* Status chip */}
          <FilterChip
            label="Status"
            value={statusFilter}
            options={LISTING_STATUS.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
            onSelect={v => setStatusFilter(v as ListingStatus | '')}
            icon={<FilterIcon />}
          />

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setLocationFilter('') }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[13px] text-ink-3 hover:text-ink hover:bg-surface border border-line transition-colors"
            >
              <CloseIcon /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-line bg-white">
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
                      No listings match your filters.
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
            Showing {filtered.length} of {listings.length} listing{listings.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Filter chip with dropdown
// ─────────────────────────────────────────────
function FilterChip({
  label, value, options, onSelect, icon,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onSelect: (v: string) => void
  icon?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium border transition-all whitespace-nowrap ${
          value
            ? 'bg-ink text-white border-ink'
            : 'bg-white text-ink-2 border-line hover:border-line-strong'
        }`}
      >
        {icon && <span className="opacity-70 shrink-0">{icon}</span>}
        {selected ? selected.label : label}
        <ChevronDownIcon color={value ? '#fff' : '#6B7280'} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-line rounded-[10px] shadow-pop z-40 min-w-[160px] py-1 overflow-hidden">
          <div className="px-3 py-1.5 text-[10.5px] font-semibold text-ink-4 uppercase tracking-wider">{label}</div>
          <button
            onClick={() => { onSelect(''); setOpen(false) }}
            className={`flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-surface ${!value ? 'font-medium text-ink' : 'text-ink-2'}`}
          >
            All {label.toLowerCase()}s
            {!value && <span className="ml-auto"><SmallCheck /></span>}
          </button>
          <div className="h-px bg-line my-1" />
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value === value ? '' : opt.value); setOpen(false) }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-surface ${opt.value === value ? 'font-medium text-ink' : 'text-ink-2'}`}
            >
              {opt.label}
              {opt.value === value && <span className="ml-auto"><SmallCheck /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Table row
// ─────────────────────────────────────────────
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
  listing, changingStatus, onStatusChange,
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
            ? <img src={coverImage} alt={listing.brand} className="w-full h-full object-contain" />
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
          ? <span className="font-semibold text-ink">${listing.buyPrice}</span>
          : <span className="text-ink-5">—</span>
        }
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {listing.rentEnabled
          ? <span className="font-semibold text-ink">${listing.rentPrice}<span className="font-normal text-ink-4 text-[11px]">/sem</span></span>
          : <span className="text-ink-5">—</span>
        }
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-ink-3">
        {listing.rentEnabled ? `$${listing.depositPrice}` : <span className="text-ink-5">—</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={listing.status} />
      </td>
      <td className="px-4 py-3 text-ink-3 whitespace-nowrap text-[12px]">
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
    <div className="rounded-[12px] border border-line bg-white overflow-hidden animate-pulse">
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

// ─────────────────────────────────────────────
// Inline icons
// ─────────────────────────────────────────────
function SearchIcon() {
  return (
    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="5.5" cy="5.5" r="4" stroke="#9CA3AF" strokeWidth="1.4" />
        <path d="M9 9l2.5 2.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M6 1.2c-2 0-3.6 1.6-3.6 3.6 0 2.5 3.6 6 3.6 6s3.6-3.5 3.6-6c0-2-1.6-3.6-3.6-3.6z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="4.8" r="1.2" fill="currentColor" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M1.5 3h11M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 4l3 3 3-3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function SmallCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6.5l2.5 2.5L10 3" stroke="oklch(0.55 0.13 155)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
