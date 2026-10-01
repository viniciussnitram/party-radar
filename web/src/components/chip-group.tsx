import type { ReactNode } from 'react'

type Props = {
  /** Accessible name for the group, e.g. "Cidade". */
  label: string,
  children: ReactNode,
}

/** A row of chips that scrolls sideways on phones and wraps on wider screens. */
export function ChipGroup({ label, children }: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {children}
    </div>
  )
}
