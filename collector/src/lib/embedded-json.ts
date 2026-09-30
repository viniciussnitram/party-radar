/**
 * Next.js App Router pages stream their data as string chunks in
 * `self.__next_f.push([1, "..."])` script calls. Joins and decodes them.
 */
export function decodeNextFlightData(html: string): string {
  const chunk = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let decoded = '';
  for (const match of html.matchAll(chunk)) {
    decoded += JSON.parse(match[1]!) as string;
  }
  return decoded;
}

/**
 * Finds every JSON object in `text` that contains `"key":` and parses it.
 * Used to pull records out of framework payloads that mix JSON with other syntax.
 */
export function extractObjectsWithKey(text: string, key: string): unknown[] {
  const needle = `"${key}":`;
  const objects: unknown[] = [];
  let from = 0;

  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, from)) {
    from = at + needle.length;
    const start = findEnclosingObjectStart(text, at);
    if (start === -1) continue;
    const end = findMatchingBrace(text, start);
    if (end === -1) continue;
    try {
      objects.push(JSON.parse(text.slice(start, end + 1)));
    } catch {
      // Not valid JSON (e.g. the key appeared inside another syntax); skip it.
    }
  }
  return objects;
}

function findEnclosingObjectStart(text: string, from: number): number {
  let depth = 0;
  for (let i = from; i >= 0; i--) {
    const char = text[i];
    if (char === '}') depth++;
    else if (char === '{') {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}

function findMatchingBrace(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (char === '\\') i++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return i;
  }
  return -1;
}
