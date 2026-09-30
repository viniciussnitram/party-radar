import { setTimeout as sleep } from 'node:timers/promises';
import { CITIES, REQUEST_DELAY_MS, USER_AGENT } from './config.ts';
import { fetchCityPage, inCities, parseCityPage, type FetchPageResult } from './sources/sympla.ts';
import type { CollectedEvent } from './types.ts';

async function collectSympla(): Promise<CollectedEvent[]> {
  const pages: FetchPageResult[] = [];

  // Sequential on purpose: one request at a time, with a pause in between.
  for (const [index, city] of CITIES.entries()) {
    if (index > 0) await sleep(REQUEST_DELAY_MS);
    const page = await fetchCityPage(city, USER_AGENT);
    if (!page.ok) console.warn(`[sympla] skipped ${city.name}: ${page.reason}`);
    pages.push(page);
  }

  // A city page also lists events from nearby cities; keep any we track.
  const found = pages
    .filter((page) => page.ok)
    .flatMap((page) => inCities(parseCityPage(page.html), CITIES));
  const events = [...new Map(found.map((event) => [event.sourceId, event])).values()];

  // One blocked city is expected now and then; every city failing means the
  // site changed or blocked us, which someone needs to look at.
  if (!pages.some((page) => page.ok)) throw new Error('[sympla] every city was skipped');
  if (events.length === 0) throw new Error('[sympla] no events found; the page layout may have changed');

  console.log(`[sympla] ${events.length} events from ${pages.filter((p) => p.ok).length} cities`);
  return events;
}

const events = (await collectSympla()).toSorted((a, b) => a.startsAt.localeCompare(b.startsAt));

for (const e of events) {
  const when = new Date(e.startsAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  console.log(`${when} | ${e.city} | ${e.name} | ${e.url}`);
}
console.log(`\n${events.length} events`);
