import { useMemo, useState } from 'react'
import { DayBand } from '@/components/day-band'
import { Filters } from '@/components/filters'
import { PartyRow } from '@/components/party-row'
import { Show } from '@/components/show'
import { Button } from '@/components/ui/button'
import partiesData from '@/data/parties.json'
import { EMPTY_FILTERS, applyFilters, cities, groupByDay, type PartyFilters } from '@/lib/parties'
import type { Party } from '@/types'

const parties = partiesData as Party[]
const UPDATED_AT = '1 de outubro de 2026'

export default function App() {
  const [filters, setFilters] = useState<PartyFilters>(EMPTY_FILTERS)
  // Read the clock once per visit, so past parties drop off without reshuffling on every render.
  const [now] = useState(() => new Date())
  const days = useMemo(() => groupByDay(applyFilters(parties, filters), now), [filters, now])
  const cityOptions = useMemo(() => cities(parties), [])

  return (
    <div className="mx-auto min-h-svh max-w-2xl px-4 pb-16">
      <header className="pt-10 pb-6 sm:pt-14">
        <h1 className="text-5xl leading-[0.95] font-extrabold tracking-tight [font-stretch:75%] sm:text-7xl">
          Onde é o rolê?
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground sm:text-lg">
          Festas e shows em Rio das Ostras, Macaé, Cabo Frio, Arraial do Cabo e Campos. Atualizado em {UPDATED_AT}.
        </p>
      </header>

      <Filters cities={cityOptions} filters={filters} onChange={setFilters} />

      <main className="mt-8 flex flex-col gap-10">
        <Show when={days.length === 0}>
          <div className="flex flex-col items-start gap-3 py-10">
            <p className="text-lg font-semibold">Nenhum rolê com esses filtros.</p>
            <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpar filtros
            </Button>
          </div>
        </Show>
        {days.map((day, index) => (
          <section key={day.key} aria-label={day.label}>
            <DayBand label={day.label} count={day.parties.length} index={index} />
            {day.parties.map((party, partyIndex) => (
              <div key={party.id}>
                <Show when={partyIndex > 0}>
                  <div aria-hidden className="perforation" />
                </Show>
                <PartyRow party={party} />
              </div>
            ))}
          </section>
        ))}
      </main>

      <footer className="mt-16 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Faltou alguma festa? Manda o link no grupo que a gente adiciona. Os preços não incluem taxa e mudam de lote,
          então confira no site do ingresso.
        </p>
        <p className="mt-2">
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href="https://github.com/viniciussnitram/party-radar"
          >
            Código no GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
