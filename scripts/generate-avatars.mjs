/**
 * Generates the local avatar set used by the profile picker.
 *
 * Everything is drawn from code, so the set is fully owned by this project:
 * no external requests, no third-party art, no links that can rot.
 *
 * Run:  node scripts/generate-avatars.mjs
 * Out:  public/avatars/<category>/<name>.svg  +  public/avatars/index.json
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'avatars');

// Palette drawn from the app's existing colours (olive / parchment / clay).
const PALETTES = [
  { bg: '#4B5320', ink: '#F5F2ED', accent: '#D4A373' },
  { bg: '#F5F2ED', ink: '#4B5320', accent: '#8C867E' },
  { bg: '#D4A373', ink: '#3D2B1F', accent: '#F5F2ED' },
  { bg: '#2C2C2C', ink: '#F5F2ED', accent: '#D4A373' },
  { bg: '#8C867E', ink: '#F9F7F4', accent: '#4B5320' },
  { bg: '#3D441A', ink: '#E5E0D8', accent: '#D4A373' },
  { bg: '#E5E0D8', ink: '#4B5320', accent: '#8C867E' },
  { bg: '#6B705C', ink: '#F5F2ED', accent: '#D4A373' },
];

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img">${inner}</svg>\n`;

const disc = (fill) => `<circle cx="48" cy="48" r="48" fill="${fill}"/>`;

/** Monogram letters A-Z, cycling the palette. */
function monograms() {
  const out = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  letters.forEach((ch, i) => {
    const p = PALETTES[i % PALETTES.length];
    out.push({
      category: 'letters',
      name: `letter-${ch.toLowerCase()}`,
      label: `Monogram ${ch}`,
      svg: svg(
        disc(p.bg) +
          `<text x="48" y="50" text-anchor="middle" dominant-baseline="central"` +
          ` font-family="ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"` +
          ` font-size="46" font-style="italic" font-weight="600" fill="${p.ink}">${ch}</text>`
      ),
    });
  });
  return out;
}

/** Reading motifs: open book, closed book, stack, bookmark, spectacles, quill, lamp, cup. */
function motifs() {
  const shapes = {
    'open-book': (p) =>
      `<path d="M20 34c10-5 20-5 28 1 8-6 18-6 28-1v30c-10-5-20-5-28 1-8-6-18-6-28-1z" fill="${p.ink}" opacity=".95"/>` +
      `<path d="M48 35v31" stroke="${p.bg}" stroke-width="3"/>`,
    'closed-book': (p) =>
      `<rect x="30" y="24" width="36" height="48" rx="4" fill="${p.ink}"/>` +
      `<rect x="30" y="24" width="8" height="48" rx="3" fill="${p.accent}"/>`,
    'book-stack': (p) =>
      `<rect x="24" y="56" width="48" height="10" rx="3" fill="${p.ink}"/>` +
      `<rect x="28" y="44" width="40" height="10" rx="3" fill="${p.accent}"/>` +
      `<rect x="24" y="32" width="48" height="10" rx="3" fill="${p.ink}"/>`,
    bookmark: (p) =>
      `<path d="M36 22h24v52l-12-11-12 11z" fill="${p.ink}"/>` +
      `<circle cx="48" cy="40" r="6" fill="${p.accent}"/>`,
    spectacles: (p) =>
      `<circle cx="34" cy="50" r="12" fill="none" stroke="${p.ink}" stroke-width="4"/>` +
      `<circle cx="62" cy="50" r="12" fill="none" stroke="${p.ink}" stroke-width="4"/>` +
      `<path d="M46 50h4" stroke="${p.ink}" stroke-width="4"/>`,
    quill: (p) =>
      `<path d="M66 26c-16 6-28 20-32 38l8 4c8-16 16-26 28-34z" fill="${p.ink}"/>` +
      `<path d="M30 70l10-4" stroke="${p.accent}" stroke-width="4" stroke-linecap="round"/>`,
    lamp: (p) =>
      `<path d="M34 30h28l8 20H26z" fill="${p.ink}"/>` +
      `<path d="M48 50v16" stroke="${p.ink}" stroke-width="4"/>` +
      `<rect x="38" y="66" width="20" height="6" rx="3" fill="${p.accent}"/>`,
    cup: (p) =>
      `<path d="M30 38h30v18a15 15 0 0 1-30 0z" fill="${p.ink}"/>` +
      `<path d="M60 44h6a6 6 0 0 1 0 12h-6" fill="none" stroke="${p.ink}" stroke-width="4"/>` +
      `<path d="M34 30c4-4 8-4 12 0" stroke="${p.accent}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  };

  const out = [];
  Object.entries(shapes).forEach(([key, draw], i) => {
    // Two colourways per motif for variety.
    [0, 3].forEach((offset, variant) => {
      const p = PALETTES[(i + offset) % PALETTES.length];
      out.push({
        category: 'reading',
        name: `${key}-${variant + 1}`,
        label: key.replace(/-/g, ' ') + ` ${variant + 1}`,
        svg: svg(disc(p.bg) + draw(p)),
      });
    });
  });
  return out;
}

/** Abstract geometric discs, for people who want something plain. */
function abstracts() {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const p = PALETTES[i % PALETTES.length];
    const rot = i * 30;
    out.push({
      category: 'abstract',
      name: `abstract-${String(i + 1).padStart(2, '0')}`,
      label: `Abstract ${i + 1}`,
      svg: svg(
        disc(p.bg) +
          `<g transform="rotate(${rot} 48 48)">` +
          `<circle cx="48" cy="30" r="12" fill="${p.ink}" opacity=".9"/>` +
          `<rect x="24" y="52" width="48" height="14" rx="7" fill="${p.accent}" opacity=".9"/>` +
          `</g>`
      ),
    });
  }
  return out;
}

const all = [...monograms(), ...motifs(), ...abstracts()];

fs.rmSync(OUT_DIR, { recursive: true, force: true });
const index = [];
for (const a of all) {
  const dir = path.join(OUT_DIR, a.category);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${a.name}.svg`), a.svg, 'utf8');
  index.push({ category: a.category, label: a.label, src: `/avatars/${a.category}/${a.name}.svg` });
}
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

const counts = index.reduce((m, a) => ({ ...m, [a.category]: (m[a.category] || 0) + 1 }), {});
console.log(`Wrote ${index.length} avatars to public/avatars`);
console.log(counts);
