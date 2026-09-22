import fs from 'node:fs';

const html = fs.readFileSync('TAXORA GST.dc.html', 'utf8');

const required = [
  'PDF Segregator',
  'openPdfSegregator',
  'Upload bulk shipping-label PDFs and automatically organize them by date and marketplace.',
  'Segregate PDFs',
  './pdf-segregator.html'
];

for (const token of required) {
  if (!html.includes(token)) throw new Error(`Missing PDF Segregator card token: ${token}`);
}

// The card must reuse the exact same card shell classes/vars as existing service cards
// (tx-glass-card, --card-pad, --r-card, --dur-base, --ease-standard) rather than a bespoke design.
const cardStart = html.indexOf('onclick="{{ openPdfSegregator }}"');
if (cardStart < 0) throw new Error('PDF Segregator card trigger not found');
const cardBlock = html.slice(Math.max(0, cardStart - 400), cardStart + 900);
for (const token of ['tx-glass-card', 'var(--card-pad)', 'var(--r-card)', 'data-tilt', 'var(--dur-base)']) {
  if (!cardBlock.includes(token)) throw new Error(`PDF Segregator card is missing shared card styling: ${token}`);
}

if (!fs.existsSync('pdf-segregator.html')) throw new Error('pdf-segregator.html page is missing');
if (!fs.existsSync('pdf-segregator-detectors.js')) throw new Error('pdf-segregator-detectors.js is missing');

console.log('PDF Segregator card regression checks passed');
