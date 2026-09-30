import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cityPageUrl, inCities, parseCityPage } from '../src/sources/sympla.ts';

const party = {
  end_date: '2026-10-03T05:00:00+00:00',
  images: { original: 'https://images.sympla.com.br/party.jpg' },
  url: 'https://www.sympla.com.br/evento/especial-70k/3598094',
  organizer: { name: ' Tô no Trabalho ' },
  name: 'Especial 70k Seguidores | 02OUT (SEX)',
  location: {
    address: 'Rua Teresópolis, , 42',
    city: 'Rio das Ostras',
    name: 'Tô no Trabalho',
    state: 'RJ',
    neighborhood: '',
    lat: -22.52,
    lon: -41.94,
  },
  id: 3598094,
  start_date: '2026-10-02T23:00:00+00:00',
};

const elsewhere = {
  ...party,
  id: 3091126,
  name: 'Rock the Mountain',
  location: { ...party.location, city: 'Petrópolis' },
};

/** Builds a page shaped like Sympla's: data split across Next.js flight chunks. */
function page(...events: object[]): string {
  const payload = `0:["$","div",null,{"data":${JSON.stringify(events)}}]`;
  const half = Math.floor(payload.length / 2);
  return [payload.slice(0, half), payload.slice(half)]
    .map((chunk) => `<script>self.__next_f.push([1,${JSON.stringify(chunk)}])</script>`)
    .join('\n');
}

describe('sympla', () => {
  it('builds the city page URL from name and state', () => {
    assert.equal(
      cityPageUrl({ name: 'Macaé', state: 'RJ' }),
      'https://www.sympla.com.br/eventos/macae-rj',
    );
  });

  it('parses events split across flight chunks', () => {
    const [event] = parseCityPage(page(party));
    assert.deepEqual(event, {
      source: 'sympla',
      sourceId: '3598094',
      name: 'Especial 70k Seguidores | 02OUT (SEX)',
      startsAt: '2026-10-02T23:00:00+00:00',
      endsAt: '2026-10-03T05:00:00+00:00',
      city: 'Rio das Ostras',
      state: 'RJ',
      venue: 'Tô no Trabalho',
      address: 'Rua Teresópolis, 42',
      latitude: -22.52,
      longitude: -41.94,
      imageUrl: 'https://images.sympla.com.br/party.jpg',
      url: 'https://www.sympla.com.br/evento/especial-70k/3598094',
      organizer: 'Tô no Trabalho',
    });
  });

  it('returns each event once even when the page repeats it', () => {
    assert.equal(parseCityPage(page(party, party, elsewhere)).length, 2);
  });

  it('returns nothing for a page without events', () => {
    assert.deepEqual(parseCityPage('<html><body>Just a moment...</body></html>'), []);
  });

  it('keeps only events in tracked cities, ignoring accents and case', () => {
    const events = parseCityPage(page(party, elsewhere));
    const kept = inCities(events, [{ name: 'RIO DAS OSTRAS', state: 'rj' }]);
    assert.deepEqual(kept.map((e) => e.sourceId), ['3598094']);
  });
});
