import fs from 'node:fs';

const html = fs.readFileSync('TAXORA GST.dc.html', 'utf8');

const required = [
  'E-Way Bill',
  'openEwayModal',
  'ewayOpen',
  'Supplier GSTIN',
  'Buyer GSTIN',
  'Invoice Number',
  'HSN / SAC',
  'Transport Mode',
  'Vehicle Number',
  'Distance (km)',
  'E-Way Bill Preview',
  'Download E-Way Bill Summary'
];

for (const token of required) {
  if (!html.includes(token)) throw new Error(`Missing E-Way Bill token: ${token}`);
}

const start = html.indexOf('<sc-if value="{{ ewayOpen }}">');
const end = start >= 0 ? html.indexOf('</sc-if>', start) : -1;
const block = start >= 0 && end > start ? html.slice(start, end) : '';
if (!block) throw new Error('E-Way Bill modal block missing');
if (/localStorage|sessionStorage|indexedDB/i.test(block)) {
  throw new Error('E-Way Bill card must not persist user data');
}

console.log('E-Way Bill regression checks passed');
