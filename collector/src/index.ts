import { setTimeout as sleep } from 'node:timers/promises';
import { CITIES, REQUEST_DELAY_MS, USER_AGENT } from './config.ts';
import { fetchCityPage, inCities, parseCityPage } from './sources/sympla.ts';
import type { CollectedEvent } from './types.ts';

async function collectSympla(): Promise<CollectedEvent[]> {
  const events = new Map<string, CollectedEvent>();
  let citiesFetched = 0;

  for (const [index, city] of CITIES.entries()) {
    if (index > 0) await sleep(REQUEST_DELAY_MS);

    const page = await fetchCityPage(city, USER_AGENT);
    if (!page.ok) {
      console.warn(`[sympla] skipped ${city.name}: ${page.reason}`);
      continue;
    }
    citiesFetched++;
    // A city page also lists events from nearby cities; keep any we track.
    const found = inCities(parseCityPage(page.html), CITIES);
    for (const event of found) events.set(event.sourceId, event);
    console.log(`[sympla] ${city.name}: ${found.length} events`);
  }

  // One blocked city is expected now and then; every city failing means the
  // site changed or blocked us, which someone needs to look at.
  if (citiesFetched === 0) throw new Error('[sympla] every city was skipped');
  if (events.size === 0) throw new Error('[sympla] no events found; the page layout may have changed');

  return [...events.values()];
}

const events = await collectSympla();
events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

for (const e of events) {
  const when = new Date(e.startsAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  console.log(`${when} | ${e.city} | ${e.name} | ${e.url}`);
}
console.log(`\n${events.length} events`);
