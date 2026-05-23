import { useId } from 'react'

interface Props {
  label?: string
  className?: string
}

// Subtle tinted fridge silhouette used when a listing has no uploaded photos
export function FridgePlaceholder({ label, className = '' }: Props) {
  const uid = useId()
  const patternId = `stripe-${uid}`
  return (
    <div className={`w-full h-full relative flex items-center justify-center bg-surface ${className}`}>
      {/* Subtle diagonal stripe overlay */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#9CA3AF" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Fridge silhouette */}
      <div
        style={{
          width: '38%',
          aspectRatio: '0.62',
          background: 'white',
          borderRadius: 10,
          position: 'relative',
          boxShadow: '0 4px 16px rgba(15,16,20,0.10), 0 0 0 0.5px rgba(15,16,20,0.06)',
        }}
      >
        {/* Door split */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '34%', height: 1.2, background: 'rgba(15,16,20,0.10)' }} />
        {/* Handle top */}
        <div style={{ position: 'absolute', right: '10%', top: '14%', width: '6%', height: '14%', background: 'rgba(15,16,20,0.18)', borderRadius: 2 }} />
        {/* Handle bottom */}
        <div style={{ position: 'absolute', right: '10%', bottom: '14%', width: '6%', height: '14%', background: 'rgba(15,16,20,0.18)', borderRadius: 2 }} />
        {/* Foot */}
        <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: '-3%', height: '3%', background: 'rgba(15,16,20,0.10)', borderRadius: '0 0 4px 4px' }} />
      </div>

      {label && (
        <span
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: 10,
            color: 'rgba(15,16,20,0.35)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          [ {label} ]
        </span>
      )}
    </div>
  )
}
