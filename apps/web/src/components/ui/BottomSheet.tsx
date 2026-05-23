import * as Dialog from '@radix-ui/react-dialog'
import { type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        {/* Scrim */}
        <Dialog.Overlay className="fixed inset-0 bg-ink/40 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        {/* Sheet */}
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-5 pt-3 pb-safe max-h-[90vh] overflow-y-auto focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
          aria-describedby={undefined}
        >
          {/* Handle */}
          <div className="w-9 h-1 rounded-full bg-line-strong mx-auto mb-4" />
          {title && (
            <Dialog.Title className="text-[22px] font-semibold tracking-[-0.025em] mb-1">
              {title}
            </Dialog.Title>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
