import { normalize } from './lib/text.ts';
import type { Audience, DetailedEvent, EventKind, OpenBar, Party } from './types.ts';

// Rules were drawn from real Sympla listings for the tracked cities. Every
// pattern runs on normalized text (lowercase, no accents).

/** Source categories that are never a party or a show. */
const EXCLUDED_CATEGORIES = new Set([
  'academico-e-cientifico',
  'desenvolvimento-pessoal',
  'empreendedorismo-negocios-e-inovacao',
  'esportes',
  'religiao-espiritualidade',
  'saude-nutricao-e-bemestar',
  'sociedade-e-cultura',
  'teatro-stand-up-e-danca',
]);

const MUSIC_CATEGORY = 'musica';

/** Name or venue words for events that aren't parties or shows. */
const EXCLUDED_WORDS =
  /\b(teatro|cinema|infantil|curso|palestra|workshop|summit|imersao|mentoria|congresso|seminario|expo|corrida|mutirao|diocese|missa)\b/;

/** Family events (children's musicals, fairs) say so in the description. */
const FAMILY_EVENT = /\btoda a familia\b/;

/**
 * Crowdfunded or placeholder listings, whose date means nothing yet. No
 * trailing \b: Sympla's plain text often glues sentences ("DATA A DEFINIREste").
 */
const DATE_TO_BE_DEFINED = /\bdata a (definir|confirmar)/;

const PARTY_WORDS =
  /\b(festa|fest|festival|halloween|baile|reveillon|choppada|calourada|rave|balada|after|beer|open bar)\b/;

/** Party hints that only count in the description, where "show" or "festa" alone would be too loose. */
const PARTY_DESCRIPTION_WORDS = /\b(festa|baile|balada|open[\s-]?bar|dj)\b/;

const SHOW_WORDS = /\b(tributo|show|ao vivo)\b/;

const OPEN_BAR = /\bopen[\s-]?bar\b/;

/** "1h de open bar", "open bar ate 1h", "open de chopp", "cerveja liberada". */
const PARTIAL_OPEN_BAR =
  /\b\d+\s?h(oras?)? de (mega )?open\b|\bopen[\s-]?bar ate\b|\bopen de (chopp|chope|cerveja|gin|vodka|drinks?)\b|\b(cerveja|chopp|chope|bebida)s? liberad[ao]s?\b|\blitros de (cerveja|chopp|chope) liberad/;

const UNIVERSITY_WORDS =
  /\b(atletica|universitari[ao]s?|calourada|choppada|intercurso|interatleticas?|dce|uff|ufrj|uenf|ucam|iff)\b/;

/** Returns the event as a party or show, or null when it should be left out. */
export function classifyEvent(event: DetailedEvent): Party | null {
  const name = normalize(event.name);
  const venue = normalize(event.venue ?? '');
  const description = normalize(event.description ?? '');

  const isExcluded =
    (event.category !== null && EXCLUDED_CATEGORIES.has(event.category)) ||
    EXCLUDED_WORDS.test(name) ||
    EXCLUDED_WORDS.test(venue) ||
    FAMILY_EVENT.test(description) ||
    DATE_TO_BE_DEFINED.test(description);
  const isCandidate = event.category === MUSIC_CATEGORY || PARTY_WORDS.test(name);
  if (isExcluded || !isCandidate) return null;

  return {
    ...event,
    kind: kindOf(name, description),
    openBar: openBarOf(`${name} ${description}`),
    audience: audienceOf(`${name} ${normalize(event.organizer ?? '')} ${description}`),
  };
}

function kindOf(name: string, description: string): EventKind {
  if (SHOW_WORDS.test(name)) return 'show';
  if (PARTY_WORDS.test(name) || PARTY_DESCRIPTION_WORDS.test(description)) return 'party';
  return 'show';
}

function openBarOf(text: string): OpenBar | null {
  if (PARTIAL_OPEN_BAR.test(text)) return 'partial';
  if (OPEN_BAR.test(text)) return 'full';
  return null;
}

function audienceOf(text: string): Audience {
  return UNIVERSITY_WORDS.test(text) ? 'university' : 'independent';
}
