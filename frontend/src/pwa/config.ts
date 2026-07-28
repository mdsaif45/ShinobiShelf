/**
 * PWA configuration — single source of truth.
 *
 * Values here are consumed by three separate places that must agree:
 *   - scripts/generate-pwa-assets.mjs  (writes the manifest + icons at build time)
 *   - public/sw.js                     (cache names)
 *   - frontend/src/pwa/*               (runtime registration and UI)
 *
 * Keeping them in one module means a rename or a theme change is a one-line
 * edit rather than a hunt across the tree.
 */

/** Bump to invalidate every cached asset on the next visit. */
export const CACHE_VERSION = 'v1';

export const APP_NAME = 'Circle';
export const APP_FULL_NAME = 'Circle — Community Book Sharing';
export const APP_DESCRIPTION =
  'Peer-to-peer community book sharing: lend, borrow, track loans, build reading circles.';

/** Olive and parchment, matching the in-app palette. */
export const THEME_COLOR = '#4B5320';
export const BACKGROUND_COLOR = '#F5F2ED';

/** Paths the service worker must never intercept. */
export const NEVER_CACHE_PREFIXES = ['/api/', '/auth/callback'];

/**
 * Static assets pre-cached on install so a cold, offline launch still renders
 * a shell. Deliberately small: the JS bundle is hashed per build and is picked
 * up by the runtime cache instead.
 */
export const PRECACHE_URLS = ['/', '/index.html', '/favicon.svg', '/offline.html'];
