import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { PartyFilters } from '@/lib/parties'

type FiltersProps = {
  cities: string[]
  filters: PartyFilters
  onChange: (filters: PartyFilters) => void
}

export function Filters({ cities, filters, onChange }: FiltersProps) {
  const update = (changes: Partial<PartyFilters>) => onChange({ ...filters, ...changes })

  return (
    <div className="flex flex-col gap-3">
      <ChipGroup label="Cidade">
        <Chip pressed={filters.city === null} onClick={() => update({ city: null })}>
          Todas
        </Chip>
        {cities.map((city) => (
          <Chip key={city} pressed={filters.city === city} onClick={() => update({ city })}>
            {city}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Tipo">
        <Chip pressed={filters.kind === 'party'} onClick={() => update({ kind: filters.kind === 'party' ? null : 'party' })}>
          Só festas
        </Chip>
        <Chip pressed={filters.kind === 'show'} onClick={() => update({ kind: filters.kind === 'show' ? null : 'show' })}>
          Só shows
        </Chip>
        <Chip pressed={filters.onlyOpenBar} onClick={() => update({ onlyOpenBar: !filters.onlyOpenBar })}>
          Com open bar
        </Chip>
        <Chip pressed={filters.onlyUniversity} onClick={() => update({ onlyUniversity: !filters.onlyUniversity })}>
          Universitárias
        </Chip>
      </ChipGroup>
    </div>
  )
}

type ChipGroupProps = {
  label: string
  children: ReactNode
}

function ChipGroup({ label, children }: ChipGroupProps) {
  return (
    <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {children}
    </div>
  )
}

type ChipProps = {
  pressed: boolean
  onClick: () => void
  children: ReactNode
}

function Chip({ pressed, onClick, children }: ChipProps) {
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
