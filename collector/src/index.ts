import { setTimeout as sleep } from 'node:timers/promises';
import { CITIES, REQUEST_DELAY_MS, USER_AGENT } from './config.ts';
import {
  fetchCityPage,
  inCities,
  parseCityPage,
  type FetchPageFailure,
  type FetchPageResult,
  type FetchPageSuccess,
} from './sources/sympla.ts';
import type { CollectedEvent } from './types.ts';

async function collectSympla(): Promise<CollectedEvent[]> {
  const pages: FetchPageResult[] = [];

  // Sequential on purpose: one request at a time, with a pause in between.
  for (const [index, city] of CITIES.entries()) {
    if (index > 0) await sleep(REQUEST_DELAY_MS);
    pages.push(await fetchCityPage(city, USER_AGENT));
  }

  const fetched = pages.filter((page): page is FetchPageSuccess => page.ok);
  const skipped = pages.filter((page): page is FetchPageFailure => !page.ok);
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

const byStartDate = (first: CollectedEvent, second: CollectedEvent) =>
  first.startsAt.localeCompare(second.startsAt);

const events = (await collectSympla()).toSorted(byStartDate);

events.forEach((event) => {
  const startsAt = new Date(event.startsAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  console.log(`${startsAt} | ${event.city} | ${event.name} | ${event.url}`);
});
console.log(`\n${events.length} events`);
