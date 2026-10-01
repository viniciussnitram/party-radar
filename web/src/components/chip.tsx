import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  pressed: boolean,
  onClick: () => void,
  children: ReactNode,
}

/** A toggle button styled as a pill, used by the filters. */
export function Chip({ pressed, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        pressed ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink hover:border-ink',
      )}
    >
      {children}
    </button>
  )
}
