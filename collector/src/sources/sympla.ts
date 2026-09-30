import { fetchHtml, type FetchHtmlResult } from '../lib/http.ts';
import { findObjects, parseJson } from '../lib/json.ts';
import { parseNextFlightData } from '../lib/next-flight.ts';
import { decodeHtmlText, normalize, slugify } from '../lib/text.ts';
import type { City, CollectedEvent, EventDetails } from '../types.ts';

const BASE_URL = 'https://www.sympla.com.br';
const NEXT_DATA_SCRIPT = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s;

// Shapes of an event inside Sympla's city page payload (only the fields we use).

type SymplaImages = {
  original?: string;
  lg?: string;
};

type SymplaOrganizer = {
  name?: string;
};

type SymplaLocation = {
  name?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  lat?: number;
  lon?: number;
};

type SymplaEvent = {
  id: number;
  name: string;
  start_date: string;
  end_date?: string;
  url: string;
  images?: SymplaImages;
  organizer?: SymplaOrganizer;
  location: SymplaLocation;
};

// Shape of the event inside an event page's __NEXT_DATA__ (only the fields we use).

type SymplaEventCategory = {
  /** e.g. "musica", "festas-e-shows". */
  slug?: string;
};

type SymplaEventPage = {
  eventsCategory?: SymplaEventCategory | null;
  /** Description as plain text. */
  strippedDetail?: string | null;
};

export type CityPageSuccess = {
  ok: true;
  city: City;
  html: string;
};

export type CityPageFailure = {
  ok: false;
  city: City;
  /** Why the page couldn't be fetched, e.g. "HTTP 429 for <url>". */
  reason: string;
};

export type CityPageResult = CityPageSuccess | CityPageFailure;

export function cityPageUrl(city: City): string {
  return `${BASE_URL}/eventos/${slugify(city.name, city.state)}`;
}

export async function fetchCityPage(city: City, userAgent: string): Promise<CityPageResult> {
  const page = await fetchHtml(cityPageUrl(city), userAgent);
  return page.ok
    ? { ok: true, city, html: page.html }
    : { ok: false, city, reason: `${page.reason} for ${page.url}` };
}

/** Extracts every event embedded in a Sympla city page, whatever its city. */
export function parseCityPage(html: string): CollectedEvent[] {
  const events = findObjects(parseNextFlightData(html), isSymplaEvent).map(toCollectedEvent);
  // The page repeats events across sections; keep one per id.
  return [...new Map(events.map((event) => [event.sourceId, event])).values()];
}

/** Keeps only events that take place in one of the given cities. */
export function inCities(events: CollectedEvent[], cities: City[]): CollectedEvent[] {
  const trackedCities = new Set(cities.map((city) => cityKey(city.name, city.state)));
  return events.filter((event) => trackedCities.has(cityKey(event.city, event.state)));
}

/**
 * Only www.sympla.com.br event pages carry their data in the HTML. Pages on
 * bileto.sympla.com.br (mostly theater) are rendered by JavaScript, so there
 * is nothing to fetch for them.
 */
export function hasEventPage(event: CollectedEvent): boolean {
  return event.url.startsWith(`${BASE_URL}/evento/`);
}

export function fetchEventPage(event: CollectedEvent, userAgent: string): Promise<FetchHtmlResult> {
  return fetchHtml(event.url, userAgent);
}

/** Reads the category and description from an event page. */
export function parseEventPage(html: string): EventDetails | null {
  const nextData = NEXT_DATA_SCRIPT.exec(html)?.[1];
  const [eventPage] = nextData ? findObjects(parseJson(nextData), isSymplaEventPage) : [];
  if (!eventPage) return null;

  return {
    category: eventPage.eventsCategory?.slug?.trim() || null,
    description: decodeHtmlText(eventPage.strippedDetail ?? '') || null,
  };
}

/** "Macaé", "rj" -> "macae|rj", so accents and case don't affect matching. */
function cityKey(name: string, state: string): string {
  return `${normalize(name)}|${normalize(state)}`;
}

function isSymplaEvent(candidate: object): candidate is SymplaEvent {
  return (
    'id' in candidate &&
    typeof candidate.id === 'number' &&
    'name' in candidate &&
    typeof candidate.name === 'string' &&
    'start_date' in candidate &&
    typeof candidate.start_date === 'string' &&
    'url' in candidate &&
    typeof candidate.url === 'string' &&
    'location' in candidate &&
    typeof candidate.location === 'object' &&
    candidate.location !== null
  );
}

function isSymplaEventPage(candidate: object): candidate is SymplaEventPage {
  return 'eventsCategory' in candidate && 'strippedDetail' in candidate;
}

function toCollectedEvent(event: SymplaEvent): CollectedEvent {
  const { location, images, organizer } = event;
  return {
    source: 'sympla',
    sourceId: String(event.id),
    name: event.name.trim(),
    startsAt: event.start_date,
    endsAt: event.end_date ?? null,
    city: location.city?.trim() ?? '',
    state: location.state?.trim() ?? '',
    venue: location.name?.trim() || null,
    address: cleanAddress(location.address, location.neighborhood),
    latitude: location.lat ?? null,
    longitude: location.lon ?? null,
    imageUrl: images?.original ?? images?.lg ?? null,
    url: event.url,
    organizer: organizer?.name?.trim() || null,
  };
}

/** Sympla addresses often come with empty parts, e.g. "Rua X, , 155". */
function cleanAddress(address?: string, neighborhood?: string): string | null {
  const parts = [address, neighborhood]
    .flatMap((part) => (part ?? '').split(','))
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
