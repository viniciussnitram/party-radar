import { cn } from '@/lib/utils'

const BAND_COLORS = ['bg-band-pink', 'bg-band-yellow', 'bg-band-cyan', 'bg-band-orange'] as const

type DayBandProps = {
  label: string
  count: number
  /** Position of the day in the list; picks the wristband color. */
  index: number
}

/** A day header drawn as a party wristband, one color per day. */
export function DayBand({ label, count, index }: DayBandProps) {
  return (
    <div
      className={cn(
        'band-edge flex items-baseline justify-between gap-4 rounded-l-sm py-2 pr-8 pl-4 text-ink',
        BAND_COLORS[index % BAND_COLORS.length],
      )}
    >
      <h2 className="text-2xl leading-tight font-extrabold [font-stretch:75%] sm:text-3xl">{label}</h2>
      <span className="shrink-0 text-sm font-semibold">
        {count} {count === 1 ? 'rolê' : 'rolês'}
      </span>
    </div>
  )
}
