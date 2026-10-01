import { MapPin, MessageCircle, Ticket } from 'lucide-react'
import { Flyer } from '@/components/flyer'
import { Show } from '@/components/show'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { displayName, formatPrice, formatTime, placeOf, whatsAppShareUrl } from '@/lib/parties'
import type { OpenBar, Party } from '@/types'

type Props = {
  party: Party,
}

const OPEN_BAR_LABELS: Record<OpenBar, string> = {
  full: 'Open bar',
  partial: 'Open bar parcial',
}

export function PartyRow({ party }: Props) {
  const name = displayName(party.name)
  const { venue, address } = placeOf(party)

  return (
    <article className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-4 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-x-5">
      <Flyer imageUrl={party.imageUrl} name={name} />

      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-lagoon">
            {formatTime(party.startsAt)}
            <Show when={party.endsAt !== null}> até {formatTime(party.endsAt ?? party.startsAt)}</Show>
          </p>
          <h3 className="text-lg leading-snug font-bold text-balance sm:text-xl">{name}</h3>
        </div>

        <div className="flex items-start gap-1.5 text-sm">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            <span className="font-semibold">{venue ?? party.city}</span>
            <Show when={venue !== null}>
              <span className="text-muted-foreground">, {party.city}</span>
            </Show>
            <Show when={address !== null}>
              <span className="block text-muted-foreground">{address}</span>
            </Show>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-base font-bold">
            <Show when={party.priceFrom !== null} fallback="Preço no site">
              A partir de {formatPrice(party.priceFrom ?? 0)}
            </Show>
          </span>
          <Show when={party.openBar !== null}>
            <Badge className="bg-band-pink text-ink">{OPEN_BAR_LABELS[party.openBar ?? 'full']}</Badge>
          </Show>
          <Show when={party.audience === 'university'}>
            <Badge className="bg-band-yellow text-ink">Universitária</Badge>
          </Show>
          <Show when={party.kind === 'show'}>
            <Badge variant="outline">Show</Badge>
          </Show>
        </div>
      </div>

      <div className="col-span-2 flex gap-2 sm:col-start-2 sm:col-end-3">
        <Button
          render={<a href={party.ticketUrl} target="_blank" rel="noreferrer" />}
          className="flex-1 sm:flex-none"
        >
          <Ticket aria-hidden data-icon="inline-start" />
          <Show when={party.source === 'manual'} fallback="Ver ingressos">
            Ver no Instagram
          </Show>
        </Button>
        <Button
          render={<a href={whatsAppShareUrl(party)} target="_blank" rel="noreferrer" />}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          <MessageCircle aria-hidden data-icon="inline-start" />
          Mandar no grupo
        </Button>
      </div>
    </article>
  )
}
