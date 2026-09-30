/** Lowercases and strips accents, so "Macaé" and "MACAE" compare equal. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Decodes HTML entities ("&amp;", "&nbsp;", "&#39;", "&#x27;") and collapses whitespace. */
export function decodeHtmlText(text: string): string {
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
      if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
      return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** "Rio das Ostras" + "RJ" -> "rio-das-ostras-rj" */
export function slugify(...parts: string[]): string {
  return normalize(parts.join(' '))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
