/**
 * Generates the PWA install assets: the web app manifest and its icons.
 *
 * Run:  node scripts/generate-pwa-assets.mjs
 * Out:  public/manifest.webmanifest
 *       public/icons/icon-192.png, icon-512.png, maskable-512.png
 *       public/icons/icon.svg
 *
 * Why a script rather than checked-in binaries: the icon is derived from the
 * same wordmark as the favicon, so a brand change means editing one drawing
 * routine and re-running this, not hand-editing image files.
 *
 * PNG encoding is done here with zlib rather than an image dependency. The
 * mark is flat colour on a rounded field, so a hand-rolled encoder is both
 * exact and small — no need to pull in sharp for this.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT_DIR = path.join(process.cwd(), 'public');
const ICON_DIR = path.join(OUT_DIR, 'icons');

// Mirrors frontend/src/pwa/config.ts. Kept literal here because this script
// runs standalone (plain node, no TS transform).
const APP_NAME = 'Circle';
const APP_FULL_NAME = 'Circle — Community Book Sharing';
const APP_DESCRIPTION =
  'Peer-to-peer community book sharing: lend, borrow, track loans, build reading circles.';
const THEME_COLOR = '#4B5320';
const BACKGROUND_COLOR = '#F5F2ED';

const OLIVE = [0x4b, 0x53, 0x20];
const PARCHMENT = [0xf5, 0xf2, 0xed];

/* ---------------------------------------------------------------- PNG output */

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Encode RGBA pixel rows into a PNG buffer. */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    rgba.copy(raw, o, y * width * 4, (y + 1) * width * 4);
    o += width * 4;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------- glyph drawing */

/**
 * The "C" is drawn as an annulus with a wedge removed on the right, which
 * reads as a serif C at icon sizes and needs no font rasteriser (fonts are
 * not guaranteed present on a build machine).
 */
function drawC(px, py, size, ink) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.30;
  const inner = size * 0.205;
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);

  if (dist > outer || dist < inner) return null;

  // Remove the right-hand wedge to open the C, and thicken the terminals
  // slightly by narrowing the opening near vertical centre.
  const angle = Math.atan2(dy, dx); // -PI..PI, 0 = east
  const opening = 0.62; // radians either side of east
  if (Math.abs(angle) < opening) return null;

  return ink;
}

function renderIcon(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  // A maskable icon must keep its art inside a safe circle, because launchers
  // crop to arbitrary shapes. Non-maskable gets a rounded square.
  const radius = size * 0.22;
  const inset = maskable ? 0 : 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      let inField;
      if (maskable) {
        inField = true; // full bleed; launcher applies the mask
      } else {
        // rounded-rect test
        const rx = Math.min(x, size - 1 - x);
        const ry = Math.min(y, size - 1 - y);
        if (rx >= radius || ry >= radius) {
          inField = true;
        } else {
          const ddx = radius - rx;
          const ddy = radius - ry;
          inField = ddx * ddx + ddy * ddy <= radius * radius;
        }
      }

      if (!inField) {
        rgba[i + 3] = 0; // transparent outside the rounded field
        continue;
      }

      // Maskable icons scale the glyph down so it survives aggressive cropping.
      const glyphSize = maskable ? size * 0.78 : size;
      const offset = (size - glyphSize) / 2;
      const ink = drawC(x - offset, y - offset, glyphSize, PARCHMENT);

      const colour = ink ?? OLIVE;
      rgba[i] = colour[0];
      rgba[i + 1] = colour[1];
      rgba[i + 2] = colour[2];
      rgba[i + 3] = 255;
    }
  }

  return encodePng(size, size, rgba);
}

/* -------------------------------------------------------------------- output */

fs.mkdirSync(ICON_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'maskable-512.png', size: 512, maskable: true },
];

for (const t of targets) {
  fs.writeFileSync(path.join(ICON_DIR, t.file), renderIcon(t.size, { maskable: t.maskable }));
  console.log(`wrote icons/${t.file}`);
}

// A vector copy for any surface that prefers it (Safari pinned tabs, etc).
fs.writeFileSync(
  path.join(ICON_DIR, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${THEME_COLOR}" />
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central"
    font-family="ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    font-size="42" font-weight="600" font-style="italic"
    fill="${BACKGROUND_COLOR}">C</text>
</svg>
`
);
console.log('wrote icons/icon.svg');

const manifest = {
  name: APP_FULL_NAME,
  short_name: APP_NAME,
  description: APP_DESCRIPTION,
  id: '/',
  start_url: '/',
  scope: '/',
  // `standalone` is what removes browser chrome and makes the launch feel
  // native; without it the browser will not offer to install.
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: THEME_COLOR,
  background_color: BACKGROUND_COLOR,
  categories: ['books', 'social', 'lifestyle'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'My Books', url: '/library', description: 'Your shared shelf' },
    { name: 'Profile', url: '/profile', description: 'Your reader profile' },
  ],
};

fs.writeFileSync(
  path.join(OUT_DIR, 'manifest.webmanifest'),
  JSON.stringify(manifest, null, 2) + '\n'
);
console.log('wrote manifest.webmanifest');
