import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { AdminListingDTO } from '@fridge/shared'
import type { ActionHistoryRecord } from '../lib/api'
import { api } from '../lib/api'

const STATUS_LABELS: Record<string, string> = {
  available: 'Available', reserved: 'Reserved', rented: 'Rented',
  sold: 'Sold', unavailable: 'Unavailable',
}
const STATUS_BADGE: Record<string, string> = {
  available: 'bg-st-avail-bg text-st-avail',
  reserved: 'bg-st-resv-bg text-st-resv',
  rented: 'bg-st-rent-bg text-st-rent',
  sold: 'bg-st-sold-bg text-st-sold',
  unavailable: 'bg-st-unav-bg text-st-unav',
}
const STATUS_DOT: Record<string, string> = {
  available: 'bg-st-avail', reserved: 'bg-st-resv', rented: 'bg-st-rent',
  sold: 'bg-st-sold', unavailable: 'bg-st-unav',
}

const ACTOR_LABELS: Record<string, string> = {
  admin_web: 'Admin',
  telegram_bot: 'Telegram Bot',
}

const ACTION_VERB: Record<string, string> = {
  status_change: 'changed the status',
  price_update: 'updated the price',
  note_update: 'updated the note',
  image_upload: 'uploaded an image',
  image_delete: 'deleted an image',
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function AdminHistoryPage() {
  const { id } = useParams<{ id?: string }>()
  const isGlobal = !id

  const [listing, setListing] = useState<AdminListingDTO | null>(null)
  const [listingsMap, setListingsMap] = useState<Record<string, string>>({})
  const [records, setRecords] = useState<ActionHistoryRecord[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.admin.listings.get(id).then(setListing).catch(() => null)
  }, [id])

  useEffect(() => {
    if (!isGlobal) return
    api.admin.listings.list({ limit: 1000 }).then(res => {
      const map: Record<string, string> = {}
      res.data.forEach(l => { map[l.id] = l.listingCode })
      setListingsMap(map)
    }).catch(() => {})
  }, [isGlobal])

  useEffect(() => {
    setPageLoading(true)
    setFetchError(null)
    api.admin.history.list(id, page)
      .then(h => {
        setRecords(h.data)
        setTotal(h.total)
        setTotalPages(h.totalPages)
      })
      .catch(() => setFetchError('Failed to load history — please try again'))
      .finally(() => { setLoading(false); setPageLoading(false) })
  }, [id, page])

  return (
    <div className="min-h-full">
      {/* Topbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-line px-6 h-[55px] flex items-center gap-2">
        <Link to="/manage" className="text-ink-3 text-[13px] hover:text-ink transition-colors">Inventory</Link>
        <span className="text-ink-4">/</span>
        {isGlobal ? (
          <span className="text-[13px] font-semibold text-ink">All Activities</span>
        ) : (
          <>
            <Link to="/manage" className="text-ink-3 text-[13px] hover:text-ink transition-colors">Listings</Link>
            <span className="text-ink-4">/</span>
            {listing && (
              <>
                <Link to={`/manage/listings/${id}/edit`} className="text-ink-3 text-[13px] hover:text-ink transition-colors">
                  {listing.listingCode}
                </Link>
                <span className="text-ink-4">/</span>
              </>
            )}
            <span className="text-[13px] font-semibold text-ink">History</span>
          </>
        )}
      </div>

      <div className="max-w-[680px] mx-auto px-6 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-[20px] font-semibold text-ink tracking-[-0.02em]">
            {isGlobal ? 'All Activities' : 'Action History'}
          </h1>
          {!loading && (
            <p className="text-[13px] text-ink-3 mt-0.5">
              {isGlobal
                ? `${total} event${total === 1 ? '' : 's'} across all listings`
                : listing
                  ? `${listing.brand} · ${listing.listingCode} · ${total} event${total === 1 ? '' : 's'}`
                  : `${total} event${total === 1 ? '' : 's'}`
              }
            </p>
          )}
        </div>

        {fetchError && (
          <div role="alert" className="px-4 py-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13px] mb-5">
            {fetchError}
          </div>
        )}

        {loading ? (
          <TimelineSkeleton />
        ) : records.length === 0 && !fetchError ? (
          <div className="bg-white rounded-[12px] border border-line px-6 py-14 text-center">
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
              <HistoryIcon />
            </div>
            <p className="text-[14px] font-medium text-ink">No activity yet</p>
            <p className="text-[13px] text-ink-3 mt-1">Events will appear here as changes are made.</p>
          </div>
        ) : !fetchError ? (
          <>
            {/* Timeline */}
            <div className={`relative transition-opacity ${pageLoading ? 'opacity-50' : ''}`}>
              {/* Vertical connector line */}
              {records.length > 1 && (
                <div className="absolute left-[10px] top-[22px] bottom-[22px] w-px bg-line" />
              )}

              {records.map(rec => {
                const code = isGlobal
                  ? (listingsMap[rec.listingId] ?? rec.listingId.slice(0, 8))
                  : (listing?.listingCode ?? '—')
                return (
                  <TimelineItem
                    key={rec.id}
                    rec={rec}
                    listingCode={code}
                    listingId={rec.listingId}
                    isGlobal={isGlobal}
                  />
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-line">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || pageLoading}
                  className="px-4 py-2 rounded-btn border border-line text-[13px] text-ink disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[12px] text-ink-3">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || pageLoading}
                  className="px-4 py-2 rounded-btn border border-line text-[13px] text-ink disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Single timeline event
// ─────────────────────────────────────────────
function TimelineItem({ rec, listingCode, listingId, isGlobal }: {
  rec: ActionHistoryRecord
  listingCode: string
  listingId: string
  isGlobal: boolean
}) {
  const isStatus = rec.actionType === 'status_change'
  const isImageDel = rec.actionType === 'image_delete'

  const dotCls = isStatus
    ? 'border-accent bg-accent-soft'
    : isImageDel
      ? 'border-st-unav bg-st-unav-bg'
      : 'border-st-rent bg-st-rent-bg'

  return (
    <div className="flex gap-3.5 py-3.5">
      {/* Dot */}
      <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 relative z-10 bg-white ${dotCls}`}>
        {isStatus && <DotCheckIcon />}
        {(rec.actionType === 'price_update' || rec.actionType === 'note_update') && <DotEditIcon />}
        {rec.actionType === 'image_upload' && <DotImageIcon />}
        {isImageDel && <DotCloseIcon />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        {/* Actor + verb */}
        <div className="text-[13px] text-ink leading-snug">
          <span className="font-semibold">{ACTOR_LABELS[rec.performedBy] ?? rec.performedBy}</span>
          {' '}
          <span className="text-ink-2">{ACTION_VERB[rec.actionType] ?? rec.actionType}</span>
        </div>

        {/* Meta row: listing code + datetime */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {isGlobal ? (
            <Link
              to={`/manage/listings/${listingId}/history`}
              className="font-mono text-[10.5px] bg-surface px-1.5 py-0.5 rounded-[4px] text-ink-2 hover:text-accent transition-colors"
            >
              {listingCode}
            </Link>
          ) : (
            <span className="font-mono text-[10.5px] bg-surface px-1.5 py-0.5 rounded-[4px] text-ink-3">
              {listingCode}
            </span>
          )}
          <span className="text-ink-5">·</span>
          <span className="text-[11.5px] text-ink-3">{formatDateTime(rec.createdAt)}</span>
        </div>

        {/* Change: from → to */}
        {(rec.oldValue || rec.newValue) && (
          <div className="mt-2 px-2.5 py-2 bg-surface rounded-[8px] flex items-center gap-2 flex-wrap">
            {rec.oldValue && (
              <>
                {isStatus ? (
                  <span style={{ filter: 'grayscale(0.4) opacity(0.65)' }}>
                    <StatusPill status={rec.oldValue} />
                  </span>
                ) : (
                  <span className="text-[12px] text-ink-3 line-through">{rec.oldValue}</span>
                )}
                <span className="text-ink-4 text-[12px]">→</span>
              </>
            )}
            {rec.newValue && (
              isStatus
                ? <StatusPill status={rec.newValue} />
                : <span className="text-[12.5px] font-medium text-ink">{rec.newValue}</span>
            )}
          </div>
        )}

        {/* Note */}
        {rec.note && (
          <div className="mt-2 pl-3 border-l-2 border-line-strong text-[12.5px] text-ink-2 italic leading-snug">
            "{rec.note}"
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const badgeCls = STATUS_BADGE[status] ?? 'bg-surface text-ink-3'
  const dotCls = STATUS_DOT[status] ?? 'bg-ink-4'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-[11px] font-medium ${badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-3.5 py-3.5 animate-pulse">
          <div className="w-[22px] h-[22px] rounded-full bg-surface shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-surface rounded w-48" />
            <div className="h-3 bg-surface rounded w-32" />
            <div className="h-8 bg-surface rounded-[8px] w-64" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Dot icons (11px, inherit colour from dot border)
// ─────────────────────────────────────────────
function DotCheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 5.5l2.5 2.5L9 3" stroke="oklch(0.55 0.13 155)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DotEditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M7 2l2 2-5.5 5.5H1.5V8L7 2z" stroke="oklch(0.55 0.13 240)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DotImageIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <rect x="1.5" y="2.5" width="8" height="6" rx="1" stroke="oklch(0.55 0.13 240)" strokeWidth="1.2" />
      <circle cx="4" cy="5" r="0.8" fill="oklch(0.55 0.13 240)" />
      <path d="M1.5 8l2.5-2.5 2 2 1.5-1.5 2 2" stroke="oklch(0.55 0.13 240)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function DotCloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="oklch(0.5 0.16 25)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5.5A6.5 6.5 0 1 0 5.5 2.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 2v3.5h3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 6v3.3l2.5 1.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
