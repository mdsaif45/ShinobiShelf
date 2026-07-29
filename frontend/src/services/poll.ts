/**
 * Shared polling for the `subscribeTo*` services.
 *
 * These services poll rather than subscribe. Two things make a naive
 * `setInterval` per caller misbehave:
 *
 *  1. Several components subscribe to the same endpoint at once (books is
 *     read by LibraryPage, ProfilePage and AnalyticsReportTab). One timer per
 *     caller means N staggered timers, so a "15s" interval turns into a
 *     request every 15/N seconds.
 *  2. React StrictMode mounts effects twice in development, doubling that
 *     again.
 *
 * So polling is keyed per endpoint: every subscriber to a key shares one
 * timer and one in-flight request, and the result is fanned out to all of
 * them. Requests stop entirely while the tab is hidden and resume with an
 * immediate refetch when it regains focus.
 */
export const DEFAULT_POLL_MS = 15000;

type Listener<T> = (data: T) => void;

interface PollGroup<T> {
  listeners: Set<Listener<T>>;
  timer: ReturnType<typeof setInterval> | null;
  fetcher: () => Promise<T>;
  intervalMs: number;
  inFlight: Promise<void> | null;
  lastData: T | undefined;
  hasData: boolean;
}

const groups = new Map<string, PollGroup<any>>();
let visibilityBound = false;

function isHidden() {
  return typeof document !== 'undefined' && document.hidden;
}

function tick<T>(group: PollGroup<T>) {
  if (isHidden()) return;
  // Coalesce: never run two requests for the same key concurrently.
  if (group.inFlight) return;

  group.inFlight = group
    .fetcher()
    .then((data) => {
      group.lastData = data;
      group.hasData = true;
      group.listeners.forEach((listener) => listener(data));
    })
    .catch(() => {
      // The service-level fetcher already logs; keep the loop alive.
    })
    .finally(() => {
      group.inFlight = null;
    });
}

function startTimer<T>(group: PollGroup<T>) {
  if (group.timer !== null) return;
  group.timer = setInterval(() => tick(group), group.intervalMs);
}

function stopTimer<T>(group: PollGroup<T>) {
  if (group.timer === null) return;
  clearInterval(group.timer);
  group.timer = null;
}

function handleVisibility() {
  groups.forEach((group) => {
    if (isHidden()) {
      stopTimer(group);
    } else {
      tick(group);
      startTimer(group);
    }
  });
}

function bindVisibility() {
  if (visibilityBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', handleVisibility);
  visibilityBound = true;
}

/**
 * Refetch a polled endpoint immediately, out of band.
 *
 * Called after a mutation so the change appears without waiting out the poll
 * interval — previously a newly added book did not show up until a manual
 * reload, which read as a silent failure.
 *
 * A no-op when nothing is subscribed to the key.
 */
export function refreshPolled(key: string): void {
  const group = groups.get(key);
  if (group) tick(group);
}

/**
 * Subscribe to a polled endpoint. Returns an unsubscribe function; the shared
 * timer is torn down once the last subscriber leaves.
 */
export function subscribePolled<T>(
  key: string,
  fetcher: () => Promise<T>,
  listener: Listener<T>,
  intervalMs = DEFAULT_POLL_MS
): () => void {
  bindVisibility();

  let group = groups.get(key) as PollGroup<T> | undefined;
  if (!group) {
    group = {
      listeners: new Set(),
      timer: null,
      fetcher,
      intervalMs,
      inFlight: null,
      lastData: undefined,
      hasData: false,
    };
    groups.set(key, group);
  }

  group.listeners.add(listener);

  // A late subscriber gets the most recent result immediately instead of
  // waiting out the interval or triggering its own duplicate request.
  if (group.hasData) {
    listener(group.lastData as T);
  }

  if (group.listeners.size === 1) {
    tick(group);
    if (!isHidden()) startTimer(group);
  } else if (!group.hasData) {
    tick(group);
  }

  return () => {
    group!.listeners.delete(listener);
    if (group!.listeners.size === 0) {
      stopTimer(group!);
      groups.delete(key);
    }
  };
}
