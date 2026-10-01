import { Chip } from '@/components/chip'
import { ChipGroup } from '@/components/chip-group'
import type { PartyFilters } from '@/lib/parties'

type Props = {
  cities: string[],
  filters: PartyFilters,
  onChange: (filters: PartyFilters) => void,
}

export function Filters({ cities, filters, onChange }: Props) {
  const update = (changes: Partial<PartyFilters>) => onChange({ ...filters, ...changes })
  const toggleKind = (kind: NonNullable<PartyFilters['kind']>) =>
    update({ kind: filters.kind === kind ? null : kind })

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
        <Chip pressed={filters.kind === 'party'} onClick={() => toggleKind('party')}>
          Só festas
        </Chip>
        <Chip pressed={filters.kind === 'show'} onClick={() => toggleKind('show')}>
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
