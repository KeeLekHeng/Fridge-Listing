import { useState, useRef, useEffect } from 'react'
import type { PublicListingDTO } from '@fridge/shared'
import { FridgePlaceholder } from './FridgePlaceholder'

interface Props {
  images: PublicListingDTO['images']
  brand: string
  listingCode: string
}

export function ImageGallery({ images, brand, listingCode }: Props) {
  const [idx, setIdx] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3)

  // Reset scroll position when listing changes
  useEffect(() => {
    setIdx(0)
    if (trackRef.current) trackRef.current.scrollLeft = 0
  }, [listingCode])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative w-full bg-surface">
      <div ref={trackRef} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {sorted.length > 0 ? sorted.map(img => (
          <div key={img.id} className="flex-none w-full aspect-[4/3] snap-start">
            <img src={img.imageUrl} alt={brand} className="w-full h-full object-cover" />
          </div>
        )) : (
          <div className="flex-none w-full aspect-[4/3] snap-start">
            <FridgePlaceholder label={listingCode} />
          </div>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {sorted.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
