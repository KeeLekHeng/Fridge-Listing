import { clsx } from 'clsx'
import { IconChevron } from './icons'

interface Props {
  page: number
  totalPages: number
  total: number
  limit: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPage }: Props) {
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  // Show at most 5 page numbers centered around current page
  const pages: number[] = []
  const range = 2
  for (let i = Math.max(1, page - range); i <= Math.min(totalPages, page + range); i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-[12.5px] text-ink-3">
        Showing <span className="text-ink font-medium">{start}–{end}</span> of {total}
      </span>

      <div className="flex items-center gap-1">
        <PageBtn disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <IconChevron direction="left" size={12} color={page === 1 ? '#9CA3AF' : '#0F1014'} />
        </PageBtn>

        {pages[0] > 1 && (
          <>
            <PageBtn active={false} onClick={() => onPage(1)}>1</PageBtn>
            {pages[0] > 2 && <span className="text-ink-4 text-[12px] px-1">…</span>}
          </>
        )}

        {pages.map(p => (
          <PageBtn key={p} active={p === page} onClick={() => onPage(p)}>{p}</PageBtn>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-ink-4 text-[12px] px-1">…</span>}
            <PageBtn active={false} onClick={() => onPage(totalPages)}>{totalPages}</PageBtn>
          </>
        )}

        <PageBtn disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <IconChevron direction="right" size={12} color={page === totalPages ? '#9CA3AF' : '#0F1014'} />
        </PageBtn>
      </div>
    </div>
  )
}

function PageBtn({
  children,
  active = false,
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
  'aria-label'?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={clsx(
        'min-w-[30px] h-[30px] px-1 rounded-[6px] text-[12.5px] font-medium transition-colors',
        active && 'bg-ink text-white',
        !active && !disabled && 'text-ink-2 hover:bg-surface',
        disabled && 'text-ink-4 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}
