export type PartyKind = 'party' | 'show'

/** "partial" covers limited open bars, e.g. "4 horas de open bar" or "open de chopp". */
export type OpenBar = 'full' | 'partial'

export type Audience = 'university' | 'independent'

export type PartySource = 'sympla' | 'uticket' | 'manual'

export type Party = {
  id: string,
  name: string,
  kind: PartyKind,
  audience: Audience,
  /** null when the listing doesn't mention an open bar. */
  openBar: OpenBar | null,
  /** ISO 8601 timestamp with offset. */
  startsAt: string,
  endsAt: string | null,
  city: string,
  venue: string | null,
  address: string | null,
  imageUrl: string | null,
  /** Where to buy tickets, or the organizer's page when there is no public listing. */
  ticketUrl: string,
  /** Cheapest ticket in BRL, without fees. null when the listing doesn't show prices. */
  priceFrom: number | null,
  organizer: string | null,
  source: PartySource,
}
