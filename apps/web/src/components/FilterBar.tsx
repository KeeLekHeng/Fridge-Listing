import { useState } from 'react'
import { clsx } from 'clsx'
import { BottomSheet } from './ui/BottomSheet'
import { IconPin, IconChevron, IconCheck } from './icons'

export type PriceMode = 'buy' | 'rent'

interface Props {
  mode: PriceMode
  onModeChange: (m: PriceMode) => void
  selectedLocation: string | undefined
  onLocationChange: (loc: string | undefined) => void
  locations: string[]
  scrolled?: boolean
}

export function FilterBar({ mode, onModeChange, selectedLocation, onLocationChange, locations, scrolled = false }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const chipLabel = selectedLocation ?? 'Location'
  const chipActive = !!selectedLocation

  return (
    <>
      <div
        className={clsx(
          'sticky top-[64px] z-[25] bg-white px-5 pt-2.5 pb-3.5 flex gap-2 transition-shadow duration-200',
          scrolled && 'shadow-sticky',
        )}
      >
        {/* Buy / Rent segmented control */}
        <div className="inline-flex bg-surface rounded-pill p-1 gap-0.5">
          {(['buy', 'rent'] as PriceMode[]).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={clsx(
                'px-4 py-1.5 rounded-pill text-[14px] font-medium tracking-[-0.01em] transition-all duration-150',
                mode === m
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(15,16,20,0.08),0_0_0_0.5px_rgba(15,16,20,0.04)]'
                  : 'text-ink-3 hover:text-ink-2',
              )}
            >
              {m === 'buy' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>

        {/* Location chip */}
        <button
          onClick={() => setSheetOpen(true)}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-[14px] font-medium tracking-[-0.01em] border whitespace-nowrap transition-all duration-150',
            chipActive
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-ink-2 border-line hover:border-line-strong',
          )}
        >
          <IconPin size={11} color={chipActive ? '#fff' : '#0F1014'} />
          {chipLabel}
          <IconChevron direction="down" size={10} color={chipActive ? '#fff' : '#0F1014'} />
        </button>
      </div>

      {/* Location picker sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Pick a location"
      >
        <p className="text-[14px] text-ink-3 mb-3 leading-snug">
          Show fridges close to your dorm.
        </p>

        <div className="flex flex-col">
          {locations.map(loc => {
            const selected = selectedLocation === loc
            return (
              <button
                key={loc}
                onClick={() => {
                  onLocationChange(selected ? undefined : loc)
                  setSheetOpen(false)
                }}
                className="flex items-center justify-between py-3.5 border-b border-line text-left text-[16px] last:border-b-0"
                style={{ fontWeight: selected ? 600 : 400 }}
              >
                <span className="flex items-center gap-2.5">
                  <IconPin size={12} color="#6B7280" />
                  {loc}
                </span>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1.5px solid ${selected ? 'oklch(0.55 0.13 155)' : '#DDDFE3'}`,
                    background: selected ? 'oklch(0.55 0.13 155)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  {selected && <IconCheck size={14} color="#fff" />}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { onLocationChange(undefined); setSheetOpen(false) }}
            className="flex-none px-5 py-3.5 rounded-btn bg-surface text-ink text-[15px] font-semibold"
          >
            Clear
          </button>
          <button
            onClick={() => setSheetOpen(false)}
            className="flex-1 py-3.5 rounded-btn bg-ink text-white text-[15px] font-semibold"
          >
            Show fridges
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
