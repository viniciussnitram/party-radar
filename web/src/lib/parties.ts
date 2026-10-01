import type { Party } from '@/types'

const TIME_ZONE = 'America/Sao_Paulo'

export type PartyFilters = {
  city: string | null,
  onlyOpenBar: boolean,
  onlyUniversity: boolean,
  kind: Party['kind'] | null,
}

export type PartyDay = {
  /** Local date as YYYY-MM-DD, used as a stable key. */
  key: string,
  label: string,
  parties: Party[],
}

export const EMPTY_FILTERS: PartyFilters = {
  city: null,
  onlyOpenBar: false,
  onlyUniversity: false,
  kind: null,
}

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })
const dayLabelFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const shortDayFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})
const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})
const priceFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const SMALL_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'com', 'a', 'o'])

/** Listings shouting in caps ("PROJETO X HALLOWEEN") read better in title case. */
export function displayName(name: string): string {
  const letters = name.replace(/[^\p{L}]/gu, '')
  const isShouting = letters.length > 3 && letters === letters.toUpperCase()
  if (!isShouting) return name

  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

/** Sympla serves smaller renditions with an "-xs" suffix (~40 KB instead of ~220 KB). */
export function thumbnailUrl(imageUrl: string): string {
  if (!URL.canParse(imageUrl)) return imageUrl
  const url = new URL(imageUrl)
  if (url.hostname !== 'images.sympla.com.br') return imageUrl
  url.pathname = url.pathname.replace(/(?<!-xs|-lg)(\.\w+)$/, '-xs$1')
  return url.toString()
}

export type Place = {
  venue: string | null,
  /** Street and neighborhood, without parts that repeat the venue or the city. */
  address: string | null,
}

/**
 * Listings often stuff the city into the venue name ("Tô no Trabalho | Costa
 * Azul | Rio das Ostras") and repeat it in the address. Keeps each piece once.
 */
export function placeOf(party: Party): Place {
  const venue = party.venue?.split(/\s+[|–-]\s+/)[0]?.replace(/[\s.]+$/, '') || null
  const repeated = new Set([party.city, venue ?? ''].map(normalizeForCompare))
  const addressParts = (party.address ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !repeated.has(normalizeForCompare(part)))

  return { venue, address: addressParts.length > 0 ? addressParts.join(', ') : null }
}

function normalizeForCompare(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso)).replace(':00', 'h').replace(':', 'h')
}

export function formatPrice(price: number): string {
  return priceFormat.format(price)
}

export function cities(parties: Party[]): string[] {
  return [...new Set(parties.map((party) => party.city))].toSorted((first, second) =>
    first.localeCompare(second, 'pt-BR'),
  )
}

export function applyFilters(parties: Party[], filters: PartyFilters): Party[] {
  return parties.filter(
    (party) =>
      (filters.city === null || party.city === filters.city) &&
      (!filters.onlyOpenBar || party.openBar !== null) &&
      (!filters.onlyUniversity || party.audience === 'university') &&
      (filters.kind === null || party.kind === filters.kind),
  )
}

/** Upcoming parties grouped by local day, in date order. */
export function groupByDay(parties: Party[], now: Date): PartyDay[] {
  const upcoming = parties
    .filter((party) => new Date(party.endsAt ?? party.startsAt).getTime() >= now.getTime() - 6 * 3_600_000)
    .toSorted((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime())

  const days = Map.groupBy(upcoming, (party) => dayKeyFormat.format(new Date(party.startsAt)))
  return [...days.entries()].map(([key, dayParties]) => ({
    key,
    label: capitalize(dayLabelFormat.format(new Date(dayParties[0]!.startsAt))),
    parties: dayParties,
  }))
}

export function whatsAppShareUrl(party: Party): string {
  const day = shortDayFormat.format(new Date(party.startsAt)).replace('.', '')
  const { venue } = placeOf(party)
  const place = venue ? `${venue} (${party.city})` : party.city
  const message = `Bora? ${displayName(party.name)}, ${day} às ${formatTime(party.startsAt)}, ${place}. ${party.ticketUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
