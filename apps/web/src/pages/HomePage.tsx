import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type ListingsResponse } from '../lib/api'
import { useShortlist } from '../hooks/useShortlist'
import { TopBar } from '../components/TopBar'
import { FilterBar, type PriceMode } from '../components/FilterBar'
import { ListingCard } from '../components/ListingCard'
import { Pagination } from '../components/Pagination'

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  // Derive filter state from URL
  const rawMode = searchParams.get('mode')
  const mode: PriceMode = rawMode === 'rent' ? 'rent' : 'buy'
  const locations = searchParams.getAll('location')
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  // Fetch state
  const [result, setResult] = useState<ListingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // All known locations (derived from an unfiltered fetch on mount)
  const [allLocations, setAllLocations] = useState<string[]>([])

  const shortlist = useShortlist()
  const [shortlistError, setShortlistError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortlistError) return
    const t = setTimeout(() => setShortlistError(null), 3500)
    return () => clearTimeout(t)
  }, [shortlistError])

  // Scroll shadow on top bar
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 8)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch all available locations once on mount (unfiltered, high limit)
  useEffect(() => {
    api.listings.list({ page: 1, limit: 50 }).then(res => {
      const unique = [...new Set(res.data.map(l => l.location))].sort()
      setAllLocations(unique)
    }).catch(() => {/* silently ignore — locations just won't show in filter */})
  }, [])

  // Fetch listings when filters/page change
  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = {
      page,
      limit: 6,
      ...(mode === 'buy' && { buyEnabled: true }),
      ...(mode === 'rent' && { rentEnabled: true }),
      ...(locations.length > 0 && { locations }),
    }
    api.listings.list(params)
      .then(setResult)
      .catch(() => setError('Failed to load listings. Please try again.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, locations.join(','), page])

  const setParam = useCallback((key: string, value: string | undefined) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === undefined || value === '') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      next.delete('page') // reset to page 1 when filters change (unless setting page)
      if (key === 'page' && value !== undefined) next.set('page', value)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const handleModeChange = (m: PriceMode) => setParam('mode', m)
  const handleLocationsChange = (locs: string[]) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('location')
      locs.forEach(l => next.append('location', l))
      next.delete('page')
      return next
    }, { replace: true })
  }
  const handlePage = (p: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    }, { replace: true })
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleShortlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (shortlist.has(id)) {
      shortlist.remove(id)
    } else {
      const addResult = shortlist.add(id)
      if (!addResult.ok && addResult.error) setShortlistError(addResult.error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Shortlist-full toast */}
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

        {/* Hero */}
        <div className="px-5 pt-2 pb-5">
          <h1 className="text-[34px] font-semibold tracking-[-0.035em] leading-[1.05] text-ink text-balance">
            Find a <em className="font-serif font-normal italic not-italic" style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic' }}>fridge</em> for your room
          </h1>
          <div className="mt-1.5 text-[15px] text-ink-3 tracking-[-0.005em]" style={{ fontFeatureSettings: "'tnum'" }}>
            Buy from <span className="text-ink font-medium">$60</span> · Rent from <span className="text-ink font-medium">$70/sem</span>
          </div>
        </div>

        <FilterBar
          mode={mode}
          onModeChange={handleModeChange}
          selectedLocations={locations}
          onLocationsChange={handleLocationsChange}
          locations={allLocations}
          scrolled={scrolled}
        />

        {/* Listing grid */}
        <div className="px-5 pt-1 pb-8">
          {error && (
            <div className="py-10 text-center text-ink-3 text-[14px]">{error}</div>
          )}

          {loading && !result && (
            <ListingGridSkeleton />
          )}

          {!loading && result && result.data.length === 0 && (
            <EmptyState mode={mode} />
          )}

          {result && result.data.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    mode={mode}
                    isShortlisted={shortlist.has(listing.id)}
                    onToggleShortlist={handleToggleShortlist}
                  />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                limit={result.limit}
                onPage={handlePage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ListingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-card bg-surface" />
          <div className="mt-3 h-4 bg-surface rounded w-2/3" />
          <div className="mt-2 h-3 bg-surface rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ mode }: { mode: PriceMode }) {
  return (
    <div className="py-16 text-center">
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">No fridges found</h2>
      <p className="mt-1.5 text-[14px] text-ink-3 leading-relaxed">
        {mode === 'buy'
          ? 'No fridges are available to buy right now. Try the Rent tab.'
          : 'No fridges are available to rent right now. Try the Buy tab.'}
      </p>
    </div>
  )
}

