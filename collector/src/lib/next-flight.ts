import { parseJson } from './json.ts';

const FLIGHT_CHUNK = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
const JSON_ROW = /^[0-9a-f]+:([[{].*)$/;

/**
 * Next.js App Router pages stream their data as string chunks in
 * `self.__next_f.push([1, "..."])` script calls. Joined, the chunks form
 * rows like `1a:["$","div",null,{...}]`. Returns the parsed value of every
 * JSON row, skipping module (`I`) and text (`T`) rows.
 */
export function parseNextFlightData(html: string): unknown[] {
  const payload = [...html.matchAll(FLIGHT_CHUNK)]
    .map((match) => parseJson(match[1]!))
    .filter((chunk): chunk is string => typeof chunk === 'string')
    .join('');

  return payload
    .split('\n')
    .map((row) => JSON_ROW.exec(row)?.[1])
    .filter((json): json is string => json !== undefined)
    .map(parseJson)
    .filter((value) => value !== undefined);
}
