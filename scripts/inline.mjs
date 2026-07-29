// Flatten the Vite build into one self-contained HTML file.
//
// Two consumers need this: the Artifact host (strict CSP, no external requests
// of any kind) and anyone who wants to open the game from a single file. The
// output is body content only — no <html>/<head>/<body> wrapper — because the
// Artifact host supplies those.
//
// Run: npm run inline   (after npm run build)

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const ASSETS = join(DIST, 'assets');

const files = readdirSync(ASSETS);
const jsFile = files.find((f) => f.endsWith('.js'));
const cssFile = files.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('Run `npm run build` first — no dist/assets found.');

const js = readFileSync(join(ASSETS, jsFile), 'utf8');
const css = readFileSync(join(ASSETS, cssFile), 'utf8');
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

// Pull the markup out from between <body> and </body>, dropping the module
// script tag and stylesheet link that pointed at the now-inlined assets.
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script[^>]*><\/script>/g, '')
  .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
  .trim();

const title = (html.match(/<title>([^<]*)<\/title>/) ?? [, 'Slippy Sigmas'])[1];

const inner = `<title>${title}</title>
<style>
${css}
</style>
${body}
<script type="module">
${js}
</script>
`;

// Content-only, for the Artifact host which supplies its own document shell.
writeFileSync('dist/slippy-sigmas.html', inner);

// A complete standalone document, committed at the repo root as play.html.
// GitHub Pages serves repo files verbatim when its source is set to a branch
// rather than Actions, so this stays playable under either setting — the whole
// point of the prototype is being reachable from a phone without debugging
// deployment settings first.
const standaloneDoc = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />',
  '<meta name="theme-color" content="#12101A" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Ctext y=%27.9em%27 font-size=%2790%27%3E%F0%9F%8E%B2%3C/text%3E%3C/svg%3E" />',
  `<title>${title}</title>`,
  '<style>',
  css,
  '</style>',
  '</head>',
  '<body>',
  body,
  '<script type="module">',
  js,
  '</script>',
  '</body>',
  '</html>',
  '',
].join('\n');

writeFileSync('play.html', standaloneDoc);
writeFileSync('dist/play.html', standaloneDoc);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1);
console.log(`dist/slippy-sigmas.html  ${kb(inner)} kB  (content only, for the Artifact host)`);
console.log(`play.html                ${kb(standaloneDoc)} kB  (standalone document, committed)`);
