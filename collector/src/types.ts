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

/** Extra data read from the event's own page, when it has one. */
export type EventDetails = {
  /** Source category slug, e.g. "musica". */
  category: string | null;
  /** Plain-text description. */
  description: string | null;
};

export type DetailedEvent = CollectedEvent & EventDetails;

export type EventKind = 'party' | 'show';

/** "partial" covers limited open bars, e.g. "open bar até 1h" or "open de chopp". */
export type OpenBar = 'full' | 'partial';

export type Audience = 'university' | 'independent';

/** An event that passed the filter, ready to be published. */
export type Party = DetailedEvent & {
  kind: EventKind;
  /** null when the event doesn't mention an open bar. */
  openBar: OpenBar | null;
  audience: Audience;
};
