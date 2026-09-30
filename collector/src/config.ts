import type { City } from './types.ts';

// Temporary: moves to the database once admins can manage cities.
export const CITIES: City[] = [
  { name: 'Cabo Frio', state: 'RJ' },
  { name: 'Arraial do Cabo', state: 'RJ' },
  { name: 'Rio das Ostras', state: 'RJ' },
  { name: 'Macaé', state: 'RJ' },
  { name: 'Campos dos Goytacazes', state: 'RJ' },
];

export const USER_AGENT =
  'PartyRadar/0.1 (+https://github.com/viniciussnitram/party-radar)';

/** Pause between requests to the same site, to stay well below rate limits. */
export const REQUEST_DELAY_MS = 30_000;
