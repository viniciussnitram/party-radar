import { decodeNextFlightData, extractObjectsWithKey } from '../lib/embedded-json.ts';
import { normalize, slugify } from '../lib/text.ts';
import type { City, CollectedEvent } from '../types.ts';

const BASE_URL = 'https://www.sympla.com.br/eventos';

/** Shape of an event inside Sympla's city page payload (only the fields we use). */
interface SymplaEvent {
  id: number;
  name: string;
  start_date: string;
  end_date?: string;
  url: string;
  images?: { original?: string; lg?: string };
  organizer?: { name?: string };
  location: {
    name?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    lat?: number;
    lon?: number;
  };
}

export type CityPageResult =
  | { city: City; status: 'ok'; events: CollectedEvent[] }
  | { city: City; status: 'skipped'; reason: string };

export function cityPageUrl(city: City): string {
  return `${BASE_URL}/${slugify(city.name, city.state)}`;
}

/**
 * Fetches one city page. A rate-limited or failed request is reported as
 * skipped instead of thrown, so one blocked city doesn't stop the whole run.
 */
export async function fetchCityPage(
  city: City,
  userAgent: string,
): Promise<{ ok: true; html: string } | { ok: false; reason: string }> {
  const url = cityPageUrl(city);
  try {
    const response = await fetch(url, { headers: { 'user-agent': userAgent } });
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status} for ${url}` };
    return { ok: true, html: await response.text() };
  } catch (error) {
    return { ok: false, reason: `${(error as Error).message} for ${url}` };
  }
}

/** Extracts every event embedded in a Sympla city page, whatever its city. */
export function parseCityPage(html: string): CollectedEvent[] {
  const payload = decodeNextFlightData(html);
  const events = new Map<string, CollectedEvent>();

  for (const candidate of extractObjectsWithKey(payload, 'start_date')) {
    if (!isSymplaEvent(candidate)) continue;
    const event = toCollectedEvent(candidate);
    events.set(event.sourceId, event);
  }
  return [...events.values()];
}

/** Keeps only events that take place in one of the given cities. */
export function inCities(events: CollectedEvent[], cities: City[]): CollectedEvent[] {
  const wanted = new Set(cities.map((c) => `${normalize(c.name)}|${normalize(c.state)}`));
  return events.filter((e) => wanted.has(`${normalize(e.city)}|${normalize(e.state)}`));
}

function isSymplaEvent(value: unknown): value is SymplaEvent {
  const v = value as Partial<SymplaEvent> | null;
  return (
    typeof v === 'object' &&
    v !== null &&
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
