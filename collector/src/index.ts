import { setTimeout as sleep } from 'node:timers/promises';
import { classifyEvent } from './classify.ts';
import { CITIES, EVENT_PAGE_DELAY_MS, REQUEST_DELAY_MS, USER_AGENT } from './config.ts';
import {
  fetchCityPage,
  fetchEventPage,
  hasEventPage,
  inCities,
  parseCityPage,
  parseEventPage,
  type CityPageFailure,
  type CityPageResult,
  type CityPageSuccess,
} from './sources/sympla.ts';
import type { CollectedEvent, DetailedEvent, EventDetails, Party } from './types.ts';

const NO_DETAILS: EventDetails = { category: null, description: null };

async function collectSympla(): Promise<CollectedEvent[]> {
  const pages: CityPageResult[] = [];

  // Sequential on purpose: one request at a time, with a pause in between.
  for (const [index, city] of CITIES.entries()) {
    if (index > 0) await sleep(REQUEST_DELAY_MS);
    pages.push(await fetchCityPage(city, USER_AGENT));
  }

  const fetched = pages.filter((page): page is CityPageSuccess => page.ok);
  const skipped = pages.filter((page): page is CityPageFailure => !page.ok);
  skipped.forEach((page) => console.warn(`[sympla] skipped ${page.city.name}: ${page.reason}`));

  // A city page also lists events from nearby cities; keep any we track.
  const found = fetched.flatMap((page) => inCities(parseCityPage(page.html), CITIES));
  const events = [...new Map(found.map((event) => [event.sourceId, event])).values()];

  // One blocked city is expected now and then; every city failing means the
  // site changed or blocked us, which someone needs to look at.
  if (fetched.length === 0) throw new Error('[sympla] every city was skipped');
  if (events.length === 0) throw new Error('[sympla] no events found; the page layout may have changed');

  console.log(`[sympla] ${events.length} events from ${fetched.length} cities`);
  return events;
}

/**
 * Adds category and description from each event's own page. An event whose
 * page is missing or fails is kept without details, and is classified by its
 * name alone.
 */
async function addDetails(events: CollectedEvent[]): Promise<DetailedEvent[]> {
  const detailed: DetailedEvent[] = [];

  for (const event of events) {
    if (!hasEventPage(event)) {
      detailed.push({ ...event, ...NO_DETAILS });
      continue;
    }
    await sleep(EVENT_PAGE_DELAY_MS);
    const page = await fetchEventPage(event, USER_AGENT);
    if (!page.ok) console.warn(`[sympla] no details for ${event.url}: ${page.reason}`);
    const details = page.ok ? parseEventPage(page.html) : null;
    detailed.push({ ...event, ...(details ?? NO_DETAILS) });
  }
  return detailed;
}

const byStartDate = (first: CollectedEvent, second: CollectedEvent) =>
  first.startsAt.localeCompare(second.startsAt);

const events = await addDetails(await collectSympla());
const parties = events
  .map(classifyEvent)
  .filter((party): party is Party => party !== null)
  .toSorted(byStartDate);

parties.forEach((party) => {
  const startsAt = new Date(party.startsAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const openBar = party.openBar ? ` | open bar: ${party.openBar}` : '';
  console.log(
    `${startsAt} | ${party.city} | ${party.kind} | ${party.audience}${openBar} | ${party.name} | ${party.url}`,
  );
});
console.log(`\n${parties.length} of ${events.length} events kept`);
