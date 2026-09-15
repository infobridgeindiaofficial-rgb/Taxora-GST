const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'local-wholesale-gst.html'), 'utf8');

const required = [
  'local-wholesale-gst-core.js',
  'id="lw-setup-section"',
  'id="lw-sales-section"',
  'id="lw-purchases-section"',
  'id="lw-itc-section"',
  'id="lw-returns-section"',
  'id="lw-period"',
  'id="lw-purchase-form"',
  'id="lw-purchases-tbody"',
  'id="lw-gstr1-summary"',
  'id="lw-gstr3b-summary"',
  'id="lw-export-json"',
  'id="lw-export-csv"',
  'id="lw-export-xls"',
  'taxora.localWholesale.sales',
  'taxora.localWholesale.purchases',
  'Available in GSTR-2B',
  'Official filing must be completed on the GST portal'
];

test('page contains the complete Local / Wholesale GST workflow', () => {
  for (const token of required) assert.ok(html.includes(token), `missing ${token}`);
});

test('no placeholder learn-more controls remain in the workflow', () => {
  assert.equal(html.includes('Learn more'), false);
});
