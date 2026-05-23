import tailwindAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1014',
        'ink-2': '#2A2D34',
        'ink-3': '#6B7280',
        'ink-4': '#9CA3AF',
        'ink-5': '#C7CACF',
        line: '#ECEDEF',
        'line-strong': '#DDDFE3',
        surface: '#F7F6F2',
        'surface-2': '#EFEDE5',
        canvas: '#F5F4EE',
        'row-hover': '#FBFAF6',
        sidebar: '#0F1014',
        accent: 'oklch(0.55 0.13 155)',
        'accent-soft': 'oklch(0.96 0.04 155)',
        'accent-ink': 'oklch(0.32 0.08 155)',
        // Status colours
        'st-avail': 'oklch(0.55 0.13 155)',
        'st-avail-bg': 'oklch(0.96 0.04 155)',
        'st-resv': 'oklch(0.62 0.14 65)',
        'st-resv-bg': 'oklch(0.97 0.05 80)',
        'st-rent': 'oklch(0.55 0.13 240)',
        'st-rent-bg': 'oklch(0.97 0.03 240)',
        'st-sold': 'oklch(0.45 0.01 270)',
        'st-sold-bg': 'oklch(0.96 0.005 270)',
        'st-unav': 'oklch(0.5 0.16 25)',
        'st-unav-bg': 'oklch(0.97 0.04 25)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        pill: '999px',
        chip: '12px',
        card: '20px',
        'card-sm': '12px',
        btn: '14px',
        input: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,16,20,0.04), 0 8px 24px rgba(15,16,20,0.06)',
        pop: '0 4px 12px rgba(15,16,20,0.08), 0 24px 48px rgba(15,16,20,0.12)',
        sticky: '0 1px 0 rgba(15,16,20,0.05), 0 8px 16px rgba(15,16,20,0.04)',
      },
      aspectRatio: {
        '4/3': '4 / 3',
      },
    },
  },
  plugins: [tailwindAnimate],
}
