/** Lowercases and strips accents, so "Macaé" and "MACAE" compare equal. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** "Rio das Ostras" + "RJ" -> "rio-das-ostras-rj" */
export function slugify(...parts: string[]): string {
  return normalize(parts.join(' '))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
