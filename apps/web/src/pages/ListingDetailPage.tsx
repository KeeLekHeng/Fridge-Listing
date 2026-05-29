import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import type { PublicListingDTO } from '@fridge/shared'
import { api } from '../lib/api'
import { useShortlist } from '../hooks/useShortlist'
import { Badge } from '../components/Badge'
import { ImageGallery } from '../components/ImageGallery'
import { FridgePlaceholder } from '../components/FridgePlaceholder'
import {
  IconPin, IconTruck, IconInfo, IconCheck, IconChevron, IconTelegram,
} from '../components/icons'
import { TopBar } from '../components/TopBar'

function tgUrl(text: string): string {
  return `https://t.me/Lucas_Keee?text=${encodeURIComponent(text)}`
}

function buildBuyTelegramUrl(listing: PublicListingDTO): string {
  const pageUrl = `${window.location.origin}/listing/${listing.id}`
  const lines = [
    `Hi! I'm looking to buy this fridge:`,
    ``,
    `• Code: ${listing.listingCode}`,
    `• ${listing.brand} — ${listing.capacityLitres}L · ${listing.condition}`,
    `• Location: ${listing.location}`,
    `• Price: $${listing.buyPrice}`,
    ``,
    pageUrl,
    ``,
    `Is it still available? When can I arrange a viewing / collection?`,
  ]
  return tgUrl(lines.join('\n'))
}

function buildRentTelegramUrl(listing: PublicListingDTO): string {
  const pageUrl = `${window.location.origin}/listing/${listing.id}`
  const lines = [
    `Hi! I'm looking to rent this fridge:`,
    ``,
    `• Code: ${listing.listingCode}`,
    `• ${listing.brand} — ${listing.capacityLitres}L · ${listing.condition}`,
    `• Location: ${listing.location}`,
    `• Rent: $${listing.rentPrice}/sem + $${listing.depositPrice} deposit`,
  ]
  if (listing.deliveryAvailable && listing.deliveryPrice != null) {
    lines.push(`• Delivery: +$${listing.deliveryPrice} (or self-pickup)`)
  }
  lines.push(``, pageUrl, ``, `Is it still available? When can I arrange collection?`)
  return tgUrl(lines.join('\n'))
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  const [listing, setListing] = useState<PublicListingDTO | null>(null)
  const [recommendations, setRecommendations] = useState<PublicListingDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const shortlist = useShortlist()
  const [shortlistError, setShortlistError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortlistError) return
    const t = setTimeout(() => setShortlistError(null), 3500)
    return () => clearTimeout(t)
  }, [shortlistError])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 80)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    setListing(null)
    setRecommendations([])

    Promise.all([
      api.listings.get(id),
      api.listings.recommendations(id).catch((): PublicListingDTO[] => []),
    ])
      .then(([listingData, recsData]) => {
        setListing(listingData)
        setRecommendations(recsData)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleShortlist = useCallback(() => {
    if (!listing) return
    if (shortlist.has(listing.id)) {
      shortlist.remove(listing.id)
    } else {
      const addResult = shortlist.add(listing.id)
      if (!addResult.ok && addResult.error) setShortlistError(addResult.error)
    }
  }, [listing, shortlist])

  if (loading) return <DetailSkeleton />

  if (notFound || !listing) return <NotFound onBack={() => navigate(-1)} />

  const isShortlisted = shortlist.has(listing.id)
  const buyTelegramUrl = listing.buyEnabled && listing.buyPrice != null ? buildBuyTelegramUrl(listing) : null
  const rentTelegramUrl = listing.rentEnabled ? buildRentTelegramUrl(listing) : null

  return (
    <div className="min-h-screen bg-white">
      {shortlistError && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-btn bg-ink text-white text-[13.5px] font-medium shadow-pop whitespace-nowrap animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
        >
          {shortlistError}
        </div>
      )}

      <div ref={scrollRef} className="h-screen overflow-y-auto overflow-x-hidden no-scrollbar">
        <TopBar shortlistCount={shortlist.count} scrolled={scrolled} />

        {/* Gallery */}
        <ImageGallery
          images={listing.images}
          brand={listing.brand}
          listingCode={listing.listingCode}
        />

        {/* Title & meta */}
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em] text-ink leading-tight">
            {listing.brand}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-[14px] text-ink-3 flex-wrap">
            <span className="flex items-center gap-1">
              <IconPin size={11} color="#6B7280" />
              {listing.location}
            </span>
            <span className="text-ink-5">·</span>
            <span>{listing.condition}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="dark">{listing.capacityLitres}L capacity</Badge>
            <Badge variant="green">Available now</Badge>
          </div>
        </div>

        {/* Price sections */}
        {listing.buyEnabled && listing.buyPrice != null && (
          <PriceSection title="Buy outright">
            <PriceRow label="One-time purchase" value={`$${listing.buyPrice}`} />
          </PriceSection>
        )}

        {listing.rentEnabled && (
          <PriceSection title="Rent per semester">
            <PriceRow
              label="Semester rate"
              value={<>{`$${listing.rentPrice}`}<span className="text-[13px] font-normal text-ink-3">/sem</span></>}
            />
            <PriceRow
              label="Refundable deposit"
              sub="Returned when the fridge is brought back to the original pickup point."
              value={`$${listing.depositPrice}`}
            />
            <div className="flex items-start gap-2.5 mt-3 p-3 rounded-[10px] bg-surface text-[13px] text-ink-3 leading-snug">
              <IconInfo size={14} color="#6B7280" />
              <span>
                Returning the fridge in working condition is your responsibility.
                We can collect it for you for an additional fee — ask on Telegram.
              </span>
            </div>
          </PriceSection>
        )}

        {/* Delivery note */}
        {listing.deliveryAvailable && listing.deliveryPrice != null && (
          <div className="mx-5 mb-5 flex items-start gap-3 p-4 rounded-[12px] border border-line">
            <IconTruck size={18} color="#0F1014" />
            <div className="text-[14px] leading-snug">
              <strong className="font-semibold">Delivery +${listing.deliveryPrice}</strong> to any dorm on campus.{' '}
              <span className="text-ink-3">Self-pickup is free — we'll send the address on Telegram.</span>
            </div>
          </div>
        )}

        {/* Similar listings */}
        {recommendations.length > 0 && (
          <>
            <div className="px-5 pt-2 pb-3">
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">Similar fridges</h2>
            </div>
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-5 pb-6">
              {recommendations.map(rec => (
                <SimilarCard key={rec.id} listing={rec} />
              ))}
            </div>
          </>
        )}

        {/* Spacer for fixed CTA bar */}
        <div className="h-36" />
      </div>

      {/* Fixed CTA bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-line z-30 px-5 pt-3.5"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-2">
          {buyTelegramUrl && (
            <a
              href={buyTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 py-3.5 rounded-btn bg-[#229ED9] text-white text-[15px] font-semibold active:opacity-90 transition-opacity"
            >
              <IconTelegram size={16} color="#fff" />
              {rentTelegramUrl ? 'Buy' : 'Enquire to buy'}
            </a>
          )}
          {rentTelegramUrl && (
            <a
              href={rentTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 py-3.5 rounded-btn bg-[#229ED9] text-white text-[15px] font-semibold active:opacity-90 transition-opacity"
            >
              <IconTelegram size={16} color="#fff" />
              {buyTelegramUrl ? 'Rent' : 'Enquire to rent'}
            </a>
          )}
        </div>
        <button
          onClick={handleShortlist}
          disabled={shortlist.isFull && !isShortlisted}
          aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          className={clsx(
            'mt-2.5 flex items-center justify-center gap-2 w-full py-3 rounded-btn text-[14px] font-medium transition-colors',
            isShortlisted
              ? 'bg-ink text-white'
              : shortlist.isFull
                ? 'bg-surface text-ink-4 cursor-not-allowed'
                : 'bg-surface text-ink hover:bg-surface-2',
          )}
        >
          {isShortlisted ? (
            <><IconCheck size={15} color="#fff" /> Already in shortlist</>
          ) : shortlist.isFull ? (
            'Shortlist full (5/5)'
          ) : (
            '+ Add to shortlist'
          )}
        </button>
      </div>
    </div>
  )
}

function PriceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-5 mb-4 pb-5 border-b border-line">
      <h3 className="text-[15px] font-semibold text-ink mb-3 tracking-[-0.01em]">{title}</h3>
      {children}
    </div>
  )
}

function PriceRow({
  label, sub, value,
}: {
  label: string
  sub?: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] text-ink-2">{label}</div>
        {sub && <div className="text-[12px] text-ink-3 mt-0.5 leading-snug">{sub}</div>}
      </div>
      <div className="text-[18px] font-semibold text-ink shrink-0 tracking-[-0.02em]">{value}</div>
    </div>
  )
}

function SimilarCard({ listing }: { listing: PublicListingDTO }) {
  const coverImage = listing.images[0]?.imageUrl
  const priceLabel = [
    listing.buyEnabled && listing.buyPrice != null ? `$${listing.buyPrice} buy` : null,
    listing.rentEnabled ? `$${listing.rentPrice}/sem` : null,
  ].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="flex-none w-[152px] block rounded-card-sm overflow-hidden border border-line bg-white active:scale-[0.98] transition-transform duration-150"
    >
      <div className="w-full aspect-[4/3] bg-surface overflow-hidden">
        {coverImage
          ? <img src={coverImage} alt={listing.brand} className="w-full h-full object-cover" />
          : <FridgePlaceholder label={listing.listingCode} />
        }
      </div>
      <div className="p-2.5">
        <div className="text-[13px] font-semibold text-ink truncate tracking-[-0.01em]">{listing.brand}</div>
        <div className="text-[11.5px] text-ink-3 mt-0.5 truncate">{priceLabel}</div>
      </div>
    </Link>
  )
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 bg-white h-14 border-b border-line" />
      <div className="w-full aspect-[4/3] bg-surface animate-pulse" />
      <div className="px-5 pt-5 animate-pulse">
        <div className="h-7 bg-surface rounded w-2/3" />
        <div className="h-4 bg-surface rounded w-1/2 mt-2" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-20 bg-surface rounded-pill" />
          <div className="h-6 w-24 bg-surface rounded-pill" />
        </div>
      </div>
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-30 bg-white flex items-center px-4 h-14 border-b border-line">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        >
          <IconChevron direction="left" size={18} color="#0F1014" />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-24 px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="7" y="4" width="14" height="20" rx="3" stroke="#9CA3AF" strokeWidth="1.5" />
            <line x1="7" y1="13" x2="21" y2="13" stroke="#9CA3AF" strokeWidth="1.5" />
            <rect x="18.5" y="7" width="1.5" height="4" rx="0.75" fill="#9CA3AF" />
            <rect x="18.5" y="16" width="1.5" height="4" rx="0.75" fill="#9CA3AF" />
          </svg>
        </div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Fridge not found</h2>
        <p className="mt-2 text-[14px] text-ink-3 leading-relaxed max-w-[260px]">
          This listing isn't available. It may have been sold, rented, or removed.
        </p>
        <Link
          to="/"
          className="mt-6 px-6 py-3 rounded-btn bg-ink text-white text-[14px] font-semibold"
        >
          Browse available fridges
        </Link>
      </div>
    </div>
  )
}
