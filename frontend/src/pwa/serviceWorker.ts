/**
 * Service worker registration — the boundary between the browser's SW API and
 * the rest of the app.
 *
 * Nothing here imports React, so the lifecycle rules stay independent of the
 * UI that reports them. `frontend/src/pwa/usePwa.ts` adapts this to React.
 */

export type UpdateListener = () => void;

/**
 * Development is deliberately excluded. A service worker caches aggressively,
 * so during development it serves stale bundles and makes fresh code look like
 * it never shipped — the caching layer would be debugged instead of the app.
 */
const ENABLED = import.meta.env.PROD && 'serviceWorker' in navigator;

const SW_URL = '/sw.js';

let registration: ServiceWorkerRegistration | null = null;
const updateListeners = new Set<UpdateListener>();

function notifyUpdateReady() {
  updateListeners.forEach((listener) => listener());
}

/**
 * A worker is "waiting" when a new version has installed but an older one is
 * still controlling open tabs. That is the moment to offer a refresh.
 */
function watchForUpdates(reg: ServiceWorkerRegistration) {
  if (reg.waiting && navigator.serviceWorker.controller) {
    notifyUpdateReady();
  }

  reg.addEventListener('updatefound', () => {
    const installing = reg.installing;
    if (!installing) return;

    installing.addEventListener('statechange', () => {
      // `controller` distinguishes an update from the very first install:
      // on a first install there is nothing to refresh away from.
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        notifyUpdateReady();
      }
    });
  });
}

export async function registerServiceWorker(): Promise<void> {
  if (!ENABLED) return;

  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    registration = reg;
    watchForUpdates(reg);

    // Pick up a version published while this tab was open.
    setInterval(() => void reg.update().catch(() => {}), 60 * 60 * 1000);
  } catch (err) {
    console.warn('Service worker registration failed:', err);
  }
}

export function onUpdateReady(listener: UpdateListener): () => void {
  updateListeners.add(listener);
  return () => updateListeners.delete(listener);
}

/**
 * Activate the waiting worker and reload once it takes control.
 *
 * `controllerchange` fires after the new worker claims the page; reloading at
 * that point guarantees the next load is served by the new version.
 */
export function applyUpdate(): void {
  const waiting = registration?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  waiting.postMessage({ type: 'SKIP_WAITING' });
}

/** Escape hatch: unregister and drop every cache this app owns. */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  const names = await caches.keys();
  await Promise.all(names.filter((n) => n.startsWith('circle-')).map((n) => caches.delete(n)));
}
