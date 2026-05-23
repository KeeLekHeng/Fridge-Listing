// Hand-tuned SVG icons matching design spec

export function IconPin({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M6 1.2c-2 0-3.6 1.6-3.6 3.6 0 2.5 3.6 6 3.6 6s3.6-3.5 3.6-6c0-2-1.6-3.6-3.6-3.6z" stroke={color} strokeWidth="1.2" />
      <circle cx="6" cy="4.8" r="1.2" fill={color} />
    </svg>
  )
}

export function IconHeart({ size = 18, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path
        d="M9 15.5s-5.8-3.5-5.8-7.5c0-2 1.6-3.5 3.5-3.5 1.2 0 2 .6 2.3 1.3.3-.7 1.1-1.3 2.3-1.3 1.9 0 3.5 1.5 3.5 3.5 0 4-5.8 7.5-5.8 7.5z"
        stroke={filled ? 'white' : '#0F1014'}
        fill={filled ? 'white' : 'none'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconChevron({ size = 14, direction = 'left', color = '#0F1014' }: { size?: number; direction?: 'left' | 'right' | 'up' | 'down'; color?: string }) {
  const rotate = { left: 180, right: 0, up: 270, down: 90 }[direction]
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M5 3l4 4-4 4" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconClose({ size = 14, color = '#0F1014' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14">
      <path d="M3 3l8 8M11 3l-8 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconTruck({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M1.5 4h8v6h-8z" stroke={color} strokeWidth="1.2" />
      <path d="M9.5 6h3l2 2v2h-5z" stroke={color} strokeWidth="1.2" />
      <circle cx="4" cy="11.5" r="1.3" stroke={color} strokeWidth="1.2" />
      <circle cx="12" cy="11.5" r="1.3" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}

export function IconCheck({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18">
      <path d="M4 9.5l3.5 3.5L14 6" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconTelegram({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <path d="M3.5 7.8l8.5-3.4c.4-.1.7.1.6.6L11.2 12c-.1.4-.4.5-.7.3l-2.6-1.9-1.2 1.2c-.2.2-.4.2-.5 0L6 9.4l3.6-3.2c.1-.1 0-.2-.2-.1L5.2 8.7l-1.9-.6c-.4-.1-.4-.3.2-.3z" fill={color} />
    </svg>
  )
}

export function IconInfo({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.2" />
      <path d="M7 6.2v3.6M7 4.3v.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
