export type City = {
  name: string;
  /** Two-letter Brazilian state code, e.g. "RJ". */
  state: string;
};

/** An event as found on a source, before filtering and duplicate merging. */
export type CollectedEvent = {
  source: 'sympla';
  sourceId: string;
  name: string;
  /** ISO 8601 timestamp with offset. */
  startsAt: string;
  endsAt: string | null;
  city: string;
  state: string;
  venue: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  url: string;
  organizer: string | null;
};
