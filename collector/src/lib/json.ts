/**
 * Parses JSON without throwing. `JSON.parse` has no non-throwing variant, so
 * this is the one place in the collector that needs a try/catch.
 */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Recursively collects every object inside `value` that matches `predicate`. */
export function findObjects<T extends object>(value: unknown, predicate: (candidate: object) => candidate is T): T[] {
  if (Array.isArray(value)) return value.flatMap((item) => findObjects(item, predicate));
  if (typeof value !== 'object' || value === null) return [];

  const nested = Object.values(value).flatMap((item) => findObjects(item, predicate));
  return predicate(value) ? [value, ...nested] : nested;
}
