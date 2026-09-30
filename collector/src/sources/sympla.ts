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

export type FetchPageResult = { ok: true; html: string } | { ok: false; reason: string };

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

  if (response instanceof Error) return { ok: false, reason: `${response.message} for ${url}` };
  if (!response.ok) return { ok: false, reason: `HTTP ${response.status} for ${url}` };
  return { ok: true, html: await response.text() };
}

/** Extracts every event embedded in a Sympla city page, whatever its city. */
export function parseCityPage(html: string): CollectedEvent[] {
  const events = findObjects(parseNextFlightData(html), isSymplaEvent).map(toCollectedEvent);
  // The page repeats events across sections; keep one per id.
  return [...new Map(events.map((event) => [event.sourceId, event])).values()];
}

/** Keeps only events that take place in one of the given cities. */
export function inCities(events: CollectedEvent[], cities: City[]): CollectedEvent[] {
  const wanted = new Set(cities.map((c) => `${normalize(c.name)}|${normalize(c.state)}`));
  return events.filter((e) => wanted.has(`${normalize(e.city)}|${normalize(e.state)}`));
}

function isSymplaEvent(value: object): value is SymplaEvent {
  const v = value as Partial<SymplaEvent>;
  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.start_date === 'string' &&
    typeof v.url === 'string' &&
    typeof v.location === 'object' &&
    v.location !== null
  );
}

function toCollectedEvent(e: SymplaEvent): CollectedEvent {
  const { location } = e;
  return {
    source: 'sympla',
    sourceId: String(e.id),
    name: e.name.trim(),
    startsAt: e.start_date,
    endsAt: e.end_date ?? null,
    city: location.city?.trim() ?? '',
    state: location.state?.trim() ?? '',
    venue: location.name?.trim() || null,
    address: cleanAddress(location.address, location.neighborhood),
    latitude: location.lat ?? null,
    longitude: location.lon ?? null,
    imageUrl: e.images?.original ?? e.images?.lg ?? null,
    url: e.url,
    organizer: e.organizer?.name?.trim() || null,
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
