import type { ReactNode } from 'react'

type Props = {
  /** Whether to render the children. */
  when: boolean,
  children: ReactNode,
  /** Rendered instead of the children when `when` is false. */
  fallback?: ReactNode,
}

/** Renders its children only when `when` is true, otherwise the optional fallback. */
export function Show({ when, children, fallback = null }: Props) {
  return when ? children : fallback
}
