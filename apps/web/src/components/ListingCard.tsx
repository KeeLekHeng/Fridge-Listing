import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import type { PublicListingDTO } from '@fridge/shared'
import { FridgePlaceholder } from './FridgePlaceholder'
import { Badge } from './Badge'
import { IconPin, IconTruck, IconHeart } from './icons'
import type { PriceMode } from './FilterBar'

interface Props {
  listing: PublicListingDTO
  mode: PriceMode
  isShortlisted: boolean
  onToggleShortlist: (id: string, e: React.MouseEvent) => void
}

export function ListingCard({ listing, mode, isShortlisted, onToggleShortlist }: Props) {
  const coverImage = listing.images[0]?.imageUrl

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="block bg-white rounded-card overflow-hidden active:scale-[0.995] transition-transform duration-200"
    >
      {/* Image area */}
      <div className="relative w-full aspect-[4/3] rounded-card overflow-hidden bg-surface">
        {coverImage ? (
          <img src={coverImage} alt={listing.brand} className="w-full h-full object-contain" />
        ) : (
          <FridgePlaceholder label={listing.listingCode} />
        )}

        {/* Top-left: capacity badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="dark">{listing.capacityLitres}L</Badge>
        </div>

        {/* Top-right: shortlist heart */}
        <button
          aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          onClick={e => onToggleShortlist(listing.id, e)}
          className={clsx(
            'absolute top-3 right-3 z-10 w-9 h-9 rounded-pill flex items-center justify-center transition-colors duration-150',
            isShortlisted ? 'bg-ink' : 'bg-white/90 backdrop-blur-md hover:bg-white',
          )}
        >
          <IconHeart size={16} filled={isShortlisted} />
        </button>
      </div>

      {/* Body */}
      <div className="pt-3 px-0.5 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold tracking-[-0.015em] text-ink truncate">{listing.brand}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[13px] text-ink-3 tracking-[-0.005em]">
              <IconPin size={11} color="#6B7280" />
              {listing.location}
            </div>
          </div>

          {/* Price (mode-aware) */}
          <div className="text-right font-[feature-settings:'tnum'] shrink-0">
            {mode === 'buy' && listing.buyEnabled && listing.buyPrice != null ? (
              <>
                <div className="text-[16px] font-semibold text-ink tracking-[-0.02em]">${listing.buyPrice}</div>
                <div className="text-[12px] text-ink-3 mt-0.5">to buy</div>
              </>
            ) : mode === 'rent' && listing.rentEnabled ? (
              <>
                <div className="text-[16px] font-semibold text-ink tracking-[-0.02em]">
                  ${listing.rentPrice}<span className="text-[12px] font-normal text-ink-3">/sem</span>
                </div>
                <div className="text-[12px] text-ink-3 mt-0.5">+ ${listing.depositPrice} dep.</div>
              </>
            ) : null}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          <span className="text-[12px] text-ink-3 tracking-[-0.005em]">{listing.condition}</span>
          {listing.deliveryAvailable && (
            <span className="flex items-center gap-1 text-[12px] text-ink-3">
              <IconTruck size={12} color="#6B7280" />
              Delivery
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
