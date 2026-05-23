import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { PublicListingDTO } from '@fridge/shared'
import { api } from '../lib/api'
import { useShortlist } from '../hooks/useShortlist'
import { FridgePlaceholder } from '../components/FridgePlaceholder'
import { IconPin, IconClose, IconChevron, IconHeart, IconTelegram } from '../components/icons'

function buildShortlistTelegramUrl(items: PublicListingDTO[]): string {
  const listingLines = items.map((l, i) => {
    const pageUrl = `${window.location.origin}/listing/${l.id}`
    const priceParts = [
      l.buyEnabled && l.buyPrice != null ? `Buy $${l.buyPrice}` : null,
      l.rentEnabled && l.rentPrice != null ? `Rent $${l.rentPrice}/sem + $${l.depositPrice ?? 0} dep` : null,
    ].filter(Boolean).join(' · ')
    return `${i + 1}. ${l.brand} (${l.listingCode}) — ${l.capacityLitres}L · ${l.location}\n   ${priceParts}\n   ${pageUrl}`
  }).join('\n\n')

  const n = items.length
  const message = `Hi! I'm interested in ${n} fridge${n === 1 ? '' : 's'}. Which ${n === 1 ? 'one is' : 'ones are'} still available?\n\n${listingLines}\n\nThanks!`
  return `https://t.me/Lucas_Keee?text=${encodeURIComponent(message)}`
}

export function ShortlistPage() {
  const navigate = useNavigate()
  const shortlist = useShortlist()

  const [listingMap, setListingMap] = useState<Record<string, PublicListingDTO>>({})
  const [loading, setLoading] = useState(shortlist.ids.length > 0)

  // Fetch all listings in shortlist on mount only
  useEffect(() => {
    if (shortlist.ids.length === 0) {
      setLoading(false)
      return
    }
    Promise.all(
      shortlist.ids.map(id =>
        api.listings.get(id)
          .then((l): [string, PublicListingDTO | null] => [id, l])
          .catch((): [string, PublicListingDTO | null] => [id, null])
      )
    ).then(results => {
      setListingMap(prev => {
        const next = { ...prev }
        results.forEach(([id, l]) => { if (l) next[id] = l })
        return next
      })
      setLoading(false)
    })
  }, [])

  // Items in insertion order, skipping any that couldn't be fetched (no longer available)
  const items = shortlist.ids.map(id => listingMap[id]).filter((l): l is PublicListingDTO => !!l)
  const telegramUrl = buildShortlistTelegramUrl(items)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-line flex items-center justify-between px-4 h-14">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center rounded-full -ml-1 hover:bg-surface transition-colors"
        >
          <IconChevron direction="left" size={18} color="#0F1014" />
        </button>

        <div className="flex-1 mx-2 text-center text-[16px] font-semibold tracking-[-0.015em] text-ink">
          Shortlist
        </div>

        {/* Spacer to balance back button */}
        <div className="w-10" />
      </div>

      {loading ? (
        <ShortlistSkeleton />
      ) : shortlist.ids.length === 0 ? (
        <EmptyShortlist />
      ) : (
        <>
          {/* Subtitle */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[13px] text-ink-3 tracking-[-0.005em]">
              <span className="text-ink font-medium">{shortlist.count}</span> of 5 · tap a fridge to see full details
            </p>
          </div>

          {/* Item list */}
          <div className="flex flex-col gap-2.5 px-5 pb-36">
            {shortlist.ids.map(id => {
              const listing = listingMap[id]
              if (!listing) return null
              return (
                <ShortlistItem
                  key={id}
                  listing={listing}
                  onRemove={() => shortlist.remove(id)}
                />
              )
            })}
          </div>

          {/* Fixed CTA bar */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-line z-30 px-5 pt-3.5"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-btn bg-[#229ED9] text-white text-[15px] font-semibold active:opacity-90 transition-opacity"
            >
              <IconTelegram size={16} color="#fff" />
              Send shortlist to Telegram
            </a>
            <p className="mt-2 text-center text-[12.5px] text-ink-3">
              Pre-fills a message with all {items.length} fridge{items.length === 1 ? '' : 's'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function ShortlistItem({ listing, onRemove }: { listing: PublicListingDTO; onRemove: () => void }) {
  const navigate = useNavigate()
  const coverImage = listing.images[0]?.imageUrl

  const priceLabel = [
    listing.buyEnabled && listing.buyPrice != null ? `$${listing.buyPrice} buy` : null,
    listing.rentEnabled && listing.rentPrice != null ? `$${listing.rentPrice}/sem` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div
      className="flex items-center gap-3 p-3.5 bg-white rounded-card border border-line active:bg-surface transition-colors cursor-pointer"
      onClick={() => navigate(`/listing/${listing.id}`)}
    >
      {/* Thumbnail */}
      <div className="flex-none w-[68px] h-[68px] rounded-[10px] overflow-hidden bg-surface">
        {coverImage
          ? <img src={coverImage} alt={listing.brand} className="w-full h-full object-cover" />
          : <FridgePlaceholder label={listing.listingCode} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-mono text-ink-3 tracking-[0.04em] uppercase">
          {listing.listingCode}
        </div>
        <div className="text-[15px] font-semibold text-ink tracking-[-0.01em] truncate mt-0.5">
          {listing.brand}
        </div>
        <div className="flex items-center gap-1 text-[12px] text-ink-3 mt-0.5">
          <IconPin size={10} color="#6B7280" />
          <span className="truncate">{listing.location} · {listing.condition}</span>
        </div>
        {priceLabel && (
          <div className="text-[13px] text-ink-2 font-medium mt-1">{priceLabel}</div>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        aria-label="Remove from shortlist"
        className="flex-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors text-ink-4 hover:text-ink"
      >
        <IconClose size={12} color="currentColor" />
      </button>
    </div>
  )
}

function EmptyShortlist() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-5 text-center">
      <div className="w-16 h-16 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-5">
        <IconHeart size={26} />
      </div>
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Your shortlist is empty</h2>
      <p className="mt-2 text-[14px] text-ink-3 leading-relaxed max-w-[260px]">
        Save up to 5 fridges and send them to us on Telegram in one go.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 rounded-btn bg-ink text-white text-[14px] font-semibold"
      >
        Browse fridges
      </Link>
    </div>
  )
}

function ShortlistSkeleton() {
  return (
    <div className="px-5 pt-4 animate-pulse">
      <div className="h-3.5 bg-surface-2 rounded w-1/3 mb-4" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-card border border-line mb-2.5">
          <div className="flex-none w-[68px] h-[68px] rounded-[10px] bg-surface" />
          <div className="flex-1">
            <div className="h-3 bg-surface rounded w-1/4 mb-1.5" />
            <div className="h-4 bg-surface rounded w-2/3 mb-1.5" />
            <div className="h-3 bg-surface rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
