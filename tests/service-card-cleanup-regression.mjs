import fs from 'node:fs';

const html = fs.readFileSync('TAXORA GST.dc.html', 'utf8');

const removedCards = [
  '>GSTR-1</h3>',
  '>GSTR-3B</h3>',
  '>GSTR-2B</h3>',
  '>Input Tax Credit</h3>',
  '>GST Reconciliation</h3>',
  '>GST Reports</h3>'
];

for (const token of removedCards) {
  if (html.includes(token)) {
    console.error(`Unused service card still present: ${token}`);
    process.exit(1);
  }
}

const workingCards = [
  'GST Invoice Generator',
  'GST Payment / Challan',
  'GST Interest &amp; Late Fee Calculator',
  '>E-Way Bill</h3>'
];

for (const token of workingCards) {
  if (!html.includes(token)) {
    console.error(`Working service card missing: ${token}`);
    process.exit(1);
  }
}

console.log('Service card cleanup regression checks passed');
