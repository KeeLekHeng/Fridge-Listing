import { Link } from 'react-router-dom'
import { IconHeart } from './icons'
import { clsx } from 'clsx'

interface Props {
  shortlistCount: number
  scrolled?: boolean
}

export function TopBar({ shortlistCount, scrolled = false }: Props) {
  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex items-center justify-between px-5 pt-4 pb-3 bg-white transition-shadow duration-200',
        scrolled && 'shadow-sticky',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <LogoMark />
        <span className="font-semibold text-[22px] tracking-[-0.04em] leading-none">
          Chillix<span className="text-accent">.</span>
        </span>
      </div>

      {/* Shortlist icon */}
      <Link
        to="/shortlist"
        aria-label={`Shortlist (${shortlistCount} items)`}
        className="relative w-10 h-10 rounded-pill bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors"
      >
        <IconHeart size={18} />
        {shortlistCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-pill bg-ink text-white text-[11px] font-semibold flex items-center justify-center border-2 border-white leading-none">
            {shortlistCount}
          </span>
        )}
      </Link>
    </header>
  )
}

function LogoMark() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 22,
        height: 22,
        borderRadius: 6,
        background: 'oklch(0.55 0.13 155)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          right: 4,
          top: 4,
          width: 2,
          height: 2,
          background: 'white',
          borderRadius: '50%',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: 9,
          height: 1.5,
          background: 'white',
          borderRadius: 2,
        }}
      />
    </span>
  )
}
