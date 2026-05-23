import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { AdminListingDTO } from '@fridge/shared'
import type { ActionHistoryRecord } from '../lib/api'
import { api } from '../lib/api'

const ACTION_TYPE_LABELS: Record<string, string> = {
  status_change: 'Status changed',
  price_update: 'Price updated',
  note_update: 'Note updated',
  image_upload: 'Image uploaded',
  image_delete: 'Image deleted',
}

const PERFORMED_BY_LABELS: Record<string, string> = {
  admin_web: 'Admin (web)',
  telegram_bot: 'Telegram bot',
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminHistoryPage() {
  const { id } = useParams<{ id: string }>()

  const [listing, setListing] = useState<AdminListingDTO | null>(null)
  const [records, setRecords] = useState<ActionHistoryRecord[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Load listing info once
  useEffect(() => {
    if (!id) return
    api.admin.listings.get(id).then(setListing).catch(() => null)
  }, [id])

  // Load history on mount and page change
  useEffect(() => {
    if (!id) return
    setPageLoading(true)
    setFetchError(null)
    api.admin.history.list(id, page)
      .then(h => {
        setRecords(h.data)
        setTotal(h.total)
        setTotalPages(h.totalPages)
      })
      .catch(() => setFetchError('Failed to load history — please try again'))
      .finally(() => {
        setLoading(false)
        setPageLoading(false)
      })
  }, [id, page])

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-line px-5 h-14 flex items-center gap-3">
        <Link to="/manage" className="text-ink-3 text-[13px] hover:text-ink transition-colors">
          ← Dashboard
        </Link>
        <span className="text-ink-5">/</span>
        {listing && (
          <>
            <Link
              to={`/manage/listings/${id}/edit`}
              className="text-ink-3 text-[13px] hover:text-ink transition-colors"
            >
              {listing.listingCode}
            </Link>
            <span className="text-ink-5">/</span>
          </>
        )}
        <h1 className="text-[15px] font-semibold text-ink tracking-[-0.01em]">Action history</h1>
      </div>

      <div className="max-w-[780px] mx-auto px-5 py-5">
        {listing && (
          <p className="text-[13px] text-ink-3 mb-4">
            {listing.brand} · {listing.listingCode} · {total} record{total === 1 ? '' : 's'}
          </p>
        )}

        {fetchError && (
          <div role="alert" className="px-4 py-3 rounded-input bg-red-50 border border-red-200 text-red-700 text-[13px] mb-4">
            {fetchError}
          </div>
        )}

        {loading ? (
          <HistorySkeleton />
        ) : records.length === 0 && !fetchError ? (
          <div className="bg-white rounded-card border border-line px-5 py-12 text-center text-[13px] text-ink-3">
            No history records yet.
          </div>
        ) : !fetchError ? (
          <>
            <div className="bg-white rounded-card border border-line overflow-hidden">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-4 py-3 font-medium text-ink-3">Code</th>
                    <th className="px-4 py-3 font-medium text-ink-3">Action</th>
                    <th className="px-4 py-3 font-medium text-ink-3">Old value</th>
                    <th className="px-4 py-3 font-medium text-ink-3">New value</th>
                    <th className="px-4 py-3 font-medium text-ink-3">Performed by</th>
                    <th className="px-4 py-3 font-medium text-ink-3">Date / time</th>
                  </tr>
                </thead>
                <tbody className={pageLoading ? 'opacity-50' : ''}>
                  {records.map(rec => (
                    <tr key={rec.id} className="border-b border-line last:border-b-0 hover:bg-row-hover transition-colors">
                      <td className="px-4 py-3 font-mono text-[11.5px] text-ink-3 whitespace-nowrap">
                        {listing?.listingCode ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">
                        {ACTION_TYPE_LABELS[rec.actionType] ?? rec.actionType}
                      </td>
                      <td className="px-4 py-3 text-ink-3">
                        {rec.oldValue ?? <span className="text-ink-5">—</span>}
                      </td>
                      <td className="px-4 py-3 text-ink-3">
                        {rec.newValue ?? <span className="text-ink-5">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${
                          rec.performedBy === 'telegram_bot'
                            ? 'bg-[#e3f0fb] text-[#229ED9]'
                            : 'bg-surface text-ink-3'
                        }`}>
                          {PERFORMED_BY_LABELS[rec.performedBy] ?? rec.performedBy}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-3 whitespace-nowrap">
                        {formatDateTime(rec.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || pageLoading}
                  className="px-4 py-2 rounded-btn border border-line text-[13px] text-ink disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[12px] text-ink-3">
                  Page {page} of {totalPages}
                </span>
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

function HistorySkeleton() {
  return (
    <div className="bg-white rounded-card border border-line overflow-hidden animate-pulse">
      <div className="h-11 bg-surface border-b border-line" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-12 border-b border-line last:border-b-0 flex items-center px-4 gap-6">
          <div className="h-3 bg-surface rounded w-24" />
          <div className="h-3 bg-surface rounded w-16" />
          <div className="h-3 bg-surface rounded w-16" />
          <div className="h-3 bg-surface rounded w-20" />
          <div className="h-3 bg-surface rounded w-28" />
        </div>
      ))}
    </div>
  )
}
