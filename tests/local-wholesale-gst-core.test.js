const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../local-wholesale-gst-core.js');

test('splits intra-state tax into CGST and SGST', () => {
  assert.deepEqual(core.computeTaxSplit(1000, 18, 'Tamil Nadu', 'Tamil Nadu'), {
    taxable: 1000, cgst: 90, sgst: 90, igst: 0, totalTax: 180, grandTotal: 1180, isIntra: true
  });
});

test('uses IGST for inter-state supply', () => {
  assert.deepEqual(core.computeTaxSplit(1000, 18, 'Tamil Nadu', 'Karnataka'), {
    taxable: 1000, cgst: 0, sgst: 0, igst: 180, totalTax: 180, grandTotal: 1180, isIntra: false
  });
});

test('period helpers use YYYY-MM and Indian financial year', () => {
  assert.equal(core.periodFromDate('2026-08-15'), '2026-08');
  assert.equal(core.financialYearFromDate('2026-03-31'), '2025-26');
  assert.equal(core.financialYearFromDate('2026-04-01'), '2026-27');
});

test('purchase summary only claims ITC when 2B matched and eligible', () => {
  const purchases = [
    { invoiceDate:'2026-08-01', taxableTotal:1000, cgst:90, sgst:90, igst:0, twoBStatus:'matched', itcEligible:true },
    { invoiceDate:'2026-08-02', taxableTotal:1000, cgst:90, sgst:90, igst:0, twoBStatus:'pending', itcEligible:true },
    { invoiceDate:'2026-08-03', taxableTotal:1000, cgst:0, sgst:0, igst:180, twoBStatus:'matched', itcEligible:false }
  ];
  const s = core.summarizePurchases(purchases, '2026-08');
  assert.equal(s.taxable, 3000);
  assert.equal(s.eligibleItc.cgst, 90);
  assert.equal(s.eligibleItc.sgst, 90);
  assert.equal(s.eligibleItc.igst, 0);
  assert.equal(s.matchedCount, 2);
});

test('GSTR-1 summary separates B2B/B2C and HSN', () => {
  const sales = [
    { invoiceDate:'2026-08-01', supplyType:'B2B', taxableTotal:1000, cgst:90, sgst:90, igst:0, items:[{hsn:'7323', taxableValue:1000, gstRate:18}] },
    { invoiceDate:'2026-08-02', supplyType:'B2C', taxableTotal:500, cgst:0, sgst:0, igst:90, items:[{hsn:'3924', taxableValue:500, gstRate:18}] }
  ];
  const g = core.buildGstr1Summary(sales, '2026-08');
  assert.equal(g.b2b.taxable, 1000);
  assert.equal(g.b2c.taxable, 500);
  assert.equal(g.totalTaxable, 1500);
  assert.equal(g.hsn.length, 2);
});

test('GSTR-3B summary nets eligible ITC by tax head without going below zero', () => {
  const sales = [
    { invoiceDate:'2026-08-01', taxableTotal:1000, cgst:90, sgst:90, igst:0 }
  ];
  const purchases = [
    { invoiceDate:'2026-08-05', taxableTotal:500, cgst:45, sgst:45, igst:0, twoBStatus:'matched', itcEligible:true }
  ];
  const g = core.buildGstr3bSummary(sales, purchases, '2026-08');
  assert.equal(g.outward.cgst, 90);
  assert.equal(g.eligibleItc.cgst, 45);
  assert.equal(g.netPayable.cgst, 45);
  assert.equal(g.netPayable.sgst, 45);
});

test('CSV and SpreadsheetML exports are generated', () => {
  const csv = core.toCsv([{invoice:'A1', taxable:100}]);
  assert.match(csv, /invoice,taxable/);
  assert.match(csv, /A1,100/);
  const xml = core.toSpreadsheetXml('GST Report', [{invoice:'A1', taxable:100}]);
  assert.match(xml, /Workbook/);
  assert.match(xml, /GST Report/);
  assert.match(xml, /A1/);
});
