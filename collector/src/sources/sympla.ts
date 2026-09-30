import { findObjects } from '../lib/json.ts';
import { parseNextFlightData } from '../lib/next-flight.ts';
import { normalize, slugify } from '../lib/text.ts';
import type { City, CollectedEvent } from '../types.ts';

const BASE_URL = 'https://www.sympla.com.br/eventos';

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

export type FetchPageSuccess = {
  ok: true;
  city: City;
  html: string;
};

export type FetchPageFailure = {
  ok: false;
  city: City;
  /** Why the page couldn't be fetched, e.g. "HTTP 429 for <url>". */
  reason: string;
};

export type FetchPageResult = FetchPageSuccess | FetchPageFailure;

export function cityPageUrl(city: City): string {
  return `${BASE_URL}/${slugify(city.name, city.state)}`;
}

/**
 * Fetches one city page. A rate-limited or failed request is reported as a
 * failed result instead of thrown, so one blocked city doesn't stop the run.
 */
export async function fetchCityPage(city: City, userAgent: string): Promise<FetchPageResult> {
  const url = cityPageUrl(city);
  const response = await fetch(url, { headers: { 'user-agent': userAgent } }).catch(
    (error: Error) => error,
  );

  if (response instanceof Error) return { ok: false, city, reason: `${response.message} for ${url}` };
  if (!response.ok) return { ok: false, city, reason: `HTTP ${response.status} for ${url}` };
  return { ok: true, city, html: await response.text() };
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
