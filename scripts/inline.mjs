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

const out = `<title>${title}</title>
<style>
${css}
</style>
${body}
<script type="module">
${js}
</script>
`;

writeFileSync('dist/slippy-sigmas.html', out);
console.log(
  `dist/slippy-sigmas.html  ${(Buffer.byteLength(out) / 1024).toFixed(1)} kB  (single file, zero external requests)`,
);
