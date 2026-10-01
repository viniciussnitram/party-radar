import { MapPin, MessageCircle, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { displayName, formatPrice, formatTime, placeOf, thumbnailUrl, whatsAppShareUrl } from '@/lib/parties'
import type { Party } from '@/types'

type PartyRowProps = {
  party: Party
}

const OPEN_BAR_LABELS: Record<NonNullable<Party['openBar']>, string> = {
  full: 'Open bar',
  partial: 'Open bar parcial',
}

export function PartyRow({ party }: PartyRowProps) {
  const name = displayName(party.name)
  const { venue, address } = placeOf(party)
  const endsAt = party.endsAt ? ` até ${formatTime(party.endsAt)}` : ''

  return (
    <article className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-4 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-x-5">
      <Flyer party={party} name={name} />

      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-lagoon">
            {formatTime(party.startsAt)}
            {endsAt}
          </p>
          <h3 className="text-lg leading-snug font-bold text-balance sm:text-xl">{name}</h3>
        </div>

        <div className="flex items-start gap-1.5 text-sm">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            <span className="font-semibold">{venue ?? party.city}</span>
            {venue ? <span className="text-muted-foreground">, {party.city}</span> : null}
            {address ? <span className="block text-muted-foreground">{address}</span> : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-base font-bold">
            {party.priceFrom === null ? 'Preço no site' : `A partir de ${formatPrice(party.priceFrom)}`}
          </span>
          {party.openBar ? (
            <Badge className="bg-band-pink text-ink">{OPEN_BAR_LABELS[party.openBar]}</Badge>
          ) : null}
          {party.audience === 'university' ? (
            <Badge className="bg-band-yellow text-ink">Universitária</Badge>
          ) : null}
          {party.kind === 'show' ? <Badge variant="outline">Show</Badge> : null}
        </div>
      </div>

      <div className="col-span-2 flex gap-2 sm:col-start-2 sm:col-end-3">
        <Button
          render={<a href={party.ticketUrl} target="_blank" rel="noreferrer" />}
          className="flex-1 sm:flex-none"
        >
          <Ticket aria-hidden data-icon="inline-start" />
          {party.source === 'manual' ? 'Ver no Instagram' : 'Ver ingressos'}
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

type FlyerProps = {
  party: Party
  name: string
}

function Flyer({ party, name }: FlyerProps) {
  if (!party.imageUrl) {
    return (
      <div
        aria-hidden
        className="flex aspect-square items-center justify-center rounded-md bg-ink text-4xl font-extrabold text-band-yellow [font-stretch:75%]"
      >
        {name.charAt(0)}
      </div>
    )
  }

  return (
    <img
      src={thumbnailUrl(party.imageUrl)}
      alt=""
      loading="lazy"
      className="aspect-square w-full rounded-md bg-muted object-cover"
    />
  )
}
