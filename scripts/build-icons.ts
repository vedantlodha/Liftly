/**
 * Renders every icon asset from `assets/logo.svg`.
 *
 * Run with `pnpm icons` after editing the mark. The PNGs are committed, because
 * the build reads them directly and should not depend on a rasteriser being
 * installed.
 *
 * Requires rsvg-convert:  brew install librsvg
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = 'assets';

// ── The mark, in pieces ──────────────────────────────────────────────────────
// Kept as fragments rather than sliced out of logo.svg, so each layer can be
// composed on its own. Any change here must be mirrored in assets/logo.svg.

const GRADIENT = `
<linearGradient id="bg" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
  <stop stop-color="#161B30"/>
  <stop offset="1" stop-color="#080B13"/>
</linearGradient>`;

const GLOW_FILTER = `
<filter id="glow" x="-48" y="-248" width="1120" height="1120" filterUnits="userSpaceOnUse">
  <feGaussianBlur stdDeviation="80"/>
</filter>`;

const BAR_SHADOW = `
<filter id="barShadow" x="263" y="660" width="498" height="123" filterUnits="userSpaceOnUse">
  <feOffset dy="12"/>
  <feGaussianBlur stdDeviation="12" result="blur"/>
  <feColorMatrix in="blur" type="matrix"
    values="0 0 0 0 0  0 0 0 0 0.4  0 0 0 0 1  0 0 0 0.25 0" result="shadow"/>
  <feBlend in="SourceGraphic" in2="shadow"/>
</filter>`;

/** Backdrop: the gradient plus its blue bloom. `radius` of 0 gives square corners. */
const backdrop = (radius: number) => `
<rect width="1024" height="1024" rx="${radius}" fill="url(#bg)"/>
<g opacity="0.15" filter="url(#glow)"><circle cx="512" cy="312" r="400" fill="#0066FF"/></g>`;

/** Upright, two plates, and the bar. `barFill` is overridden for the monochrome layer. */
const glyph = (barFill: string, shadow: boolean) => `
<rect x="287" y="277" width="75" height="470" rx="37.5" fill="#FFFFFF"/>
<rect x="447" y="607" width="70" height="200" rx="35" fill="#FFFFFF"/>
<rect x="607" y="607" width="70" height="200" rx="35" fill="#FFFFFF"/>
<g${shadow ? ' filter="url(#barShadow)"' : ''}>
  <rect x="287" y="672" width="450" height="75" rx="37.5" fill="${barFill}"/>
</g>`;

/**
 * Centres the glyph and shrinks it into Android's adaptive safe zone.
 *
 * A launcher may mask the icon to a circle of the middle 66%, which is a radius
 * of 341 from centre. The glyph sits 30px low and its far corner would land at
 * 371 — outside, so the bottom-right plate would be clipped on a round mask.
 * Recentring and scaling to 0.92 brings that corner to 320.
 */
const SAFE_ZONE = 'translate(512, 512) scale(0.92) translate(-512, -542)';

const svg = (defs: string, body: string) =>
  `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">` +
  `<defs>${defs}</defs>${body}</svg>`;

// ── The assets ───────────────────────────────────────────────────────────────
const assets: { file: string; size: number; svg: string }[] = [
  {
    // Square, not rounded: iOS and the Play Store apply their own mask, and
    // transparent corners here would show as black.
    file: 'icon.png',
    size: 1024,
    svg: svg(GRADIENT + GLOW_FILTER + BAR_SHADOW, backdrop(0) + glyph('#0066FF', true)),
  },
  {
    file: 'android-icon-background.png',
    size: 1024,
    svg: svg(GRADIENT + GLOW_FILTER, backdrop(0)),
  },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    svg: svg(BAR_SHADOW, `<g transform="${SAFE_ZONE}">${glyph('#0066FF', true)}</g>`),
  },
  {
    // Android 13 themed icons: the system recolours this, so it ships as a flat
    // white silhouette with no accent and no shadow to muddy the tint.
    file: 'android-icon-monochrome.png',
    size: 1024,
    svg: svg('', `<g transform="${SAFE_ZONE}">${glyph('#FFFFFF', false)}</g>`),
  },
  {
    // Drawn on the splash background, so it is the glyph alone.
    file: 'splash-icon.png',
    size: 1024,
    svg: svg(BAR_SHADOW, `<g transform="${SAFE_ZONE}">${glyph('#0066FF', true)}</g>`),
  },
  {
    // Browser tabs mask nothing, so this one keeps the rounded corners.
    file: 'favicon.png',
    size: 64,
    svg: svg(GRADIENT + GLOW_FILTER + BAR_SHADOW, backdrop(228) + glyph('#0066FF', true)),
  },
];

// ── Render ───────────────────────────────────────────────────────────────────
try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' });
} catch {
  console.error('rsvg-convert not found. Install it with:  brew install librsvg');
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'liftly-icons-'));

for (const asset of assets) {
  const source = join(scratch, `${asset.file}.svg`);
  writeFileSync(source, asset.svg);
  execFileSync('rsvg-convert', [
    source,
    '--width', String(asset.size),
    '--height', String(asset.size),
    '--output', join(OUT, asset.file),
  ]);
  console.log(`  ${asset.file}  ${asset.size}×${asset.size}`);
}

console.log(`\nwrote ${assets.length} icons to ${OUT}/`);
