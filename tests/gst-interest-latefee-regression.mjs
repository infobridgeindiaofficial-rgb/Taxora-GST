import fs from 'node:fs';

const html = fs.readFileSync('TAXORA GST.dc.html', 'utf8');
const required = [
  'gstCalcOpen',
  'openGstCalcModal',
  'gstCalcReturnType',
  'gstCalcDueDate',
  'gstCalcFilingDate',
  'gstCalcTaxPayable',
  'gstCalcIsNil',
  'gstCalcDelayDays',
  'gstCalcInterest',
  'gstCalcLateFee',
  'gstCalcTotalExtra',
  'downloadGstCalcSummary'
];

if (!html.includes('GST Interest &amp; Late Fee Calculator') && !html.includes('GST Interest & Late Fee Calculator')) {
  console.error('Missing GST calculator title');
  process.exit(1);
}

for (const token of required) {
  if (!html.includes(token)) {
    console.error(`Missing GST calculator token: ${token}`);
    process.exit(1);
  }
}

if (!html.includes('gstCalcLateFeePerDay')) {
  console.error('Missing late fee per-day calculation');
  process.exit(1);
}
if (!html.includes('gstCalcInterestRate')) {
  console.error('Missing interest-rate calculation');
  process.exit(1);
}

console.log('GST Interest & Late Fee Calculator regression checks passed');
