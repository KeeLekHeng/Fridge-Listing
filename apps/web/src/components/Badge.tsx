import { type ReactNode } from 'react'
import { clsx } from 'clsx'

type Variant = 'dark' | 'green' | 'soft' | 'amber' | 'warn'

interface Props {
  children: ReactNode
  variant?: Variant
  icon?: ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  dark: 'bg-black/85 text-white backdrop-blur-md',
  green: 'bg-accent text-white',
  soft: 'bg-surface text-ink-2 border border-line',
  amber: 'bg-[oklch(0.96_0.06_80)] text-[oklch(0.42_0.12_65)]',
  warn: 'bg-[oklch(0.97_0.03_25)] text-[oklch(0.5_0.16_25)]',
}

export function Badge({ children, variant = 'soft', icon, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-1 rounded-pill text-[11px] font-semibold',
        variantClasses[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

// Coloured status badge for listings
const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: 'Available', bg: 'bg-st-avail-bg', text: 'text-st-avail' },
  reserved: { label: 'Reserved', bg: 'bg-st-resv-bg', text: 'text-st-resv' },
  rented: { label: 'Rented', bg: 'bg-st-rent-bg', text: 'text-st-rent' },
  sold: { label: 'Sold', bg: 'bg-st-sold-bg', text: 'text-st-sold' },
  unavailable: { label: 'Unavailable', bg: 'bg-st-unav-bg', text: 'text-st-unav' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig['unavailable']
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11.5px] font-medium whitespace-nowrap',
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', cfg.text.replace('text-', 'bg-'))} />
      {cfg.label}
    </span>
  )
}
