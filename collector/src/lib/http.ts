export type FetchHtmlSuccess = {
  ok: true;
  url: string;
  html: string;
};

export type FetchHtmlFailure = {
  ok: false;
  url: string;
  /** Why the page couldn't be fetched, e.g. "HTTP 429". */
  reason: string;
};

export type FetchHtmlResult = FetchHtmlSuccess | FetchHtmlFailure;

/**
 * Fetches a page as text. Network errors and non-2xx responses are returned
 * as a failure instead of thrown, so one bad page doesn't stop a run.
 */
export async function fetchHtml(url: string, userAgent: string): Promise<FetchHtmlResult> {
  const response = await fetch(url, { headers: { 'user-agent': userAgent } }).catch(
    (error: Error) => error,
  );

  if (response instanceof Error) return { ok: false, url, reason: response.message };
  if (!response.ok) return { ok: false, url, reason: `HTTP ${response.status}` };
  return { ok: true, url, html: await response.text() };
}
