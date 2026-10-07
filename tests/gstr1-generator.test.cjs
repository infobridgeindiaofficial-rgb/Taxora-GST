const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../gstr1-core.js');
const Docs = require('../tax-invoice-parser.js');
// Synthetic format-valid identifiers; no customer GST registrations in fixtures.
const gstin = '33ABCDE1234F1Z5';
const etin = '29ABCDE1234F1Z5';

function app(page = 'index.html') {
  const html = fs.readFileSync(page, 'utf8');
  const script = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  const context = vm.createContext({ window: { TaxoraGstr1: Core, TaxoraTaxInvoice: Docs, XLSX: typeof X === 'undefined' ? null : X },
    DCLogic: class { setState(patch) { this.state = Object.assign({}, this.state, typeof patch === 'function' ? patch(this.state) : patch); } },
    React: { createRef: () => ({ current: null }), createElement: () => null }, console, setTimeout });
  vm.runInContext(script + '\n globalThis.App = Component;', context);
  return new context.App();
}
const plain = (v) => JSON.parse(JSON.stringify(v));

function sale(month = 9, overrides = {}) {
  const row = Object.fromEntries('identifier sup_name gstin sub_order_num order_date hsn_code quantity gst_rate total_taxable_sale_value tax_amount total_invoice_value taxable_shipping end_customer_state_new enrollment_no manifest_date transaction_type eco_tcs_gstin financial_year month_number supplier_id'.split(' ').map((k) => [k, '']));
  return Object.assign(row, { gstin, month_number: month, financial_year: 2026,
    hsn_code: '732399', gst_rate: 18, quantity: 1, total_taxable_sale_value: 100,
    tax_amount: 18, total_invoice_value: 118, end_customer_state_new: 'Karnataka',
    eco_tcs_gstin: etin, transaction_type: 'SALE' }, overrides);
}
const returns = (month, overrides) => Object.assign(sale(month, overrides), { cancel_return_date: '2026-09-15' });
const invoices = (month, credit = false) => [{ Type: 'INVOICE', 'Order Date': `2026-${String(month).padStart(2, '0')}-05`, 'Invoice No.': `M${month}/1` },
  ...(credit ? [{ Type: 'CREDIT NOTE', 'Order Date': `2026-${String(month).padStart(2, '0')}-15`, 'Invoice No.': `M${month}/C1` }] : [])];
function parse(a, month, sales, ret = []) {
  return a.parseMeeshoFiles(sales, ret, invoices(month, ret.length > 0), gstin, '33', String(month).padStart(2, '0') + '2026');
}
function combine(a, res, mode = 'monthly') {
  return Core.consolidate(res.map((r) => ({ name: 'Meesho', res: r })), {
    gstin, fp: res.at(-1).fp, periods: res.map((r) => r.fp), mode
  }, Docs.mergeDocIssues);
}
const sum = (rows, field) => rows.reduce((n, r) => n + Core.scaled(r[field] || 0), 0) / 100;
function reconcile(res) {
  assert.deepEqual(Core.validateJson(Core.toJson(res)), []);
  for (const [b, h, e] of [['txval', 'txval', 'suppval'], ['iamt', 'igst', 'igst'], ['camt', 'cgst', 'cgst'], ['samt', 'sgst', 'sgst'], ['csamt', 'cess', 'cess']]) {
    assert.equal(sum(res.b2cs, b), res.summary[b], b);
    assert.equal(sum(res.hsn, h), res.summary[b], 'HSN ' + b);
    assert.equal(sum(res.clttx, e), res.summary[b], 'ECO ' + b);
    const json = Core.toJson(res);
    assert.equal(sum(json.b2cs, b), res.summary[b], 'JSON ' + b);
    assert.equal(sum(json.hsn.hsn_b2c, b), res.summary[b], 'JSON HSN ' + b);
  }
}

test('both live pages compile and use the shared generator', () => {
  for (const page of ['index.html', 'TAXORA GST.dc.html']) {
    assert.ok(app(page));
    assert.match(fs.readFileSync(page, 'utf8'), /gstr1-core\.js/);
  }
});
test('A/C/F/G/H: monthly sales and returns, 5%/18%, intra/inter tax', () => {
  const a = app();
  const res = parse(a, 9, [sale(9), sale(9, { end_customer_state_new: 'Tamil Nadu' }),
    sale(9, { hsn_code: '961590', gst_rate: 5, tax_amount: 5, total_invoice_value: 105 })], [returns(9)]);
  assert.deepEqual(plain(res.errors), []);
  assert.deepEqual(plain(res.summary), { txval: 200, iamt: 5, camt: 9, samt: 9, csamt: 0 });
  assert.equal(res.returnRows, 1);
  assert.equal(res.hsn.length, 2);
  reconcile(res);
});
test('B: no returns file is not read and does not block generation or readiness', async () => {
  const a = app();
  const file = (name) => ({ name, arrayBuffer: async () => new ArrayBuffer(0) });
  a.ecPatch({ meesho: true, gstin, month: '2026-07', meeshoSalesFile: true,
    meeshoTaxInvoiceFile: true, meeshoSalesFileObj: file('tcs_sales.xlsx'), meeshoTaxInvoiceFileObj: file('invoices.xlsx') });
  a.loadXlsx = async () => ({});
  a.readSheet = async (_, f) => { assert.equal(f.name, 'tcs_sales.xlsx'); return [sale(7)]; };
  a.readTaxInvoiceSheet = async () => invoices(7);
  assert.equal(a.renderVals().ecomBtnDisabled, false);
  await a.runMeesho();
  assert.deepEqual(plain(a.state.meeshoResult.errors), []);
  assert.equal(a.state.meeshoResult.returnRows, 0);
  assert.equal(a.state.meeshoResult.normalizedTransactions.length, 1);
  a.combineResults();
  reconcile(a.state.combinedResult);
});
test('provided malformed returns are rejected, and sales/invoice reports remain required', async () => {
  const a = app();
  const res = parse(a, 9, [sale()], [{ bad: 1 }]);
  assert.match(res.errors[0].msg, /missing column/);
  a.ecPatch({ gstin, month: '2026-09', meesho: true });
  await a.runMeesho();
  assert.match(a.state.meeshoResult.errors.map((e) => e.msg).join(' '), /Sales Report is required.*Tax Invoice Details is required/);
  assert.doesNotMatch(a.state.meeshoResult.errors.map((e) => e.msg).join(' '), /Return Report is required/);
});
test('D/E: quarter groups all three months from source records, including no-return months', async () => {
  const a = app();
  const file = (month, type) => ({ name: `${month}-${type}.xlsx`, month, type, arrayBuffer: async () => new ArrayBuffer(0) });
  const quarterFiles = {};
  for (const month of [7, 8, 9]) quarterFiles[`2026-0${month}`] = {
    meeshoSalesFileObj: file(month, 'sales'), meeshoTaxInvoiceFileObj: file(month, 'invoices'),
    ...(month === 8 ? { meeshoReturnFileObj: file(month, 'returns') } : {}) };
  a.ecPatch({ meesho: true, gstin, mode: 'quarterly', quarterYear: '2026', quarterStart: '7', quarterFiles });
  a.loadXlsx = async () => ({});
  a.readSheet = async (_, f) => f.type === 'returns' ? [returns(f.month)] : [sale(f.month), sale(f.month, { hsn_code: '961590', gst_rate: 5, tax_amount: 5, total_invoice_value: 105, end_customer_state_new: 'Tamil Nadu' })];
  a.readTaxInvoiceSheet = async (_, f) => invoices(f.month, f.month === 8);
  assert.equal(a.renderVals().ecomBtnDisabled, false);
  await a.generateQuarter();
  const res = a.state.combinedResult;
  assert.deepEqual(plain(res.errors), []);
  assert.equal(res.fp, '092026');
  assert.equal(res.salesRows, 6); assert.equal(res.returnRows, 1);
  assert.equal(res.b2cs.length, 2); assert.equal(res.hsn.length, 2); assert.equal(res.clttx.length, 1);
  assert.deepEqual(plain(res.summary), { txval: 500, iamt: 36, camt: 7.5, samt: 7.5, csamt: 0 });
  assert.deepEqual(plain(res.monthlySummaries.map((m) => m.summary.txval)), [200, 100, 200]);
  assert.deepEqual(plain(res.doc_issue.doc_det.map((d) => [d.doc_num, d.docs.length])), [[1, 3], [5, 1]]);
  assert.equal(res.doc_issue.doc_det[0].docs[0].from, 'M7/1');
  assert.equal(res.doc_issue.doc_det[0].docs[2].to, 'M9/1');
  assert.equal(a.state.ecom.month, ''); // Quarter runners must not overwrite live form.
  const ui = a.renderVals();
  assert.equal(ui.combinedQuarterly, true);
  assert.deepEqual(plain(ui.combinedMonthRows.map((r) => r.label)), ['July 2026', 'August 2026', 'September 2026']);
  reconcile(res);
});
test('quarter calendar correctly handles all four financial-year quarters', () => {
  const a = app();
  assert.deepEqual(a.ecQuarterMonths({ quarterYear: '2026', quarterStart: '1' }), ['2027-01', '2027-02', '2027-03']);
  for (const start of [4, 7, 10]) assert.deepEqual(a.ecQuarterMonths({ quarterYear: '2026', quarterStart: String(start) }), Core.quarterMonths(2026, start));
  assert.deepEqual(Core.quarterMonths(2026, 2), []);
});
test('quarter rejects missing or wrong-month reports', async () => {
  const a = app();
  a.ecPatch({ meesho: true, gstin, mode: 'quarterly', quarterYear: '2026', quarterStart: '7', quarterFiles: {} });
  assert.equal(a.renderVals().ecomBtnDisabled, true);
  await a.generateQuarter();
  assert.ok(a.state.combinedResult.errors.length);
  const wrong = parse(a, 8, [sale(9)]);
  assert.match(wrong.errors[0].msg, /month mismatch/);
});
test('J: fractional source amounts reconcile under every grouping, with no sample correction', () => {
  const a = app();
  const sales = Array.from({ length: 17 }, (_, i) => sale(9, { total_taxable_sale_value: 100.0049,
    tax_amount: 18.0049, total_invoice_value: 118.0098, hsn_code: i % 2 ? '961590' : '732399',
    end_customer_state_new: ['Karnataka', 'Kerala', 'Tamil Nadu'][i % 3], eco_tcs_gstin: i % 2 ? etin : '27ABCDE1234F1Z5' }));
  const result = combine(a, [parse(a, 9, sales, [returns(9, { total_taxable_sale_value: 10.005, tax_amount: 1.805, total_invoice_value: 11.81 })])]);
  reconcile(result);
  assert.equal(result.summary.txval, 1689.99);
  assert.equal(Core.money('1.005'), 1.01);
  assert.equal(Core.money('-1.005'), -1.01);
});

// SheetJS-compatible worksheet builder: exercise the actual workbook-writing method
// without a network/CDN dependency. Assertions read cells, not duplicated export code.
const col = (n) => { let s = ''; for (n++; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
const X = { utils: {
  encode_cell: ({ r, c }) => col(c) + (r + 1),
  encode_range: ({ s, e }) => `${col(s.c)}${s.r + 1}:${col(e.c)}${e.r + 1}`,
  book_new: () => ({ SheetNames: [], Sheets: {} }),
  book_append_sheet: (wb, ws, name) => { wb.SheetNames.push(name); wb.Sheets[name] = ws; },
  aoa_to_sheet: (rows) => { const ws = {}; rows.forEach((row, r) => row.forEach((v, c) => { ws[col(c) + (r + 1)] = { t: typeof v === 'number' ? 'n' : 's', v }; })); return ws; },
  json_to_sheet: (rows) => { const heads = Object.keys(rows[0] || {}); return X.utils.aoa_to_sheet([heads, ...rows.map((r) => heads.map((h) => r[h]))]); },
  sheet_to_json: (rows) => rows
} };
test('I/J: actual Excel workbook, UI preview and JSON use identical totals and HSN', () => {
  const a = app();
  const res = combine(a, [7, 8, 9].map((m) => parse(a, m, [sale(m, { total_taxable_sale_value: 100.005, tax_amount: 18.001 })])), 'quarterly');
  a.setState({ combinedResult: res });
  const wb = a.buildCombinedExcel(res, X);
  assert.ok(wb.SheetNames.includes('HSN_Summary'));
  assert.ok(wb.SheetNames.includes('Monthly_Totals'));
  const json = a.combinedJson(res);
  assert.equal(json.hsn.hsn_b2c[0].hsn_sc, '732399');
  assert.equal(wb.Sheets.HSN_Summary.D2.v, res.summary.txval);
  assert.equal(wb.Sheets.HSN_Summary.G2.v, res.summary.iamt);
  assert.equal(wb.Sheets.ECO_Summary.B2.v, res.summary.txval);
  assert.equal(wb.Sheets.Monthly_Totals.B5.v, res.summary.txval);
  const summary = Object.fromEntries(a.combinedExcelData(res).summary.map((r) => [r.Field, r.Value]));
  assert.equal(summary['Net Taxable Value'], res.summary.txval);
  assert.equal(a.renderVals().combinedTxval, '₹ ' + res.summary.txval.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
  const lines = Object.entries(wb.Sheets.JSON_Preview).filter(([k]) => /^A\d+$/.test(k) && Number(k.slice(1)) >= 3).map(([, cell]) => cell.v);
  assert.deepEqual(JSON.parse(lines.join('\n')), plain(json));
});

function amazonWorkbook() {
  const Sheets = { GSTIN: [['Merchant GSTIN'], [gstin]],
    'B2C Small': [['Type', 'Place Of Supply', 'Applicable %', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN'],
      ['E', '29-Karnataka', '', 18, 100, 0, etin], ['E', '33-Tamil Nadu', '', 5, 100, 0, etin]],
    'HSN Summary': [['HSN', 'Description', 'UQC', 'Total Quantity', 'Rate', 'Total Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State Tax Amount', 'Cess Amount'],
      ['732399', 'Goods', 'NOS', 1, 18, 118, 100, 18, 0, 0, 0], ['961590', 'Goods', 'NOS', 1, 5, 105, 100, 0, 2.5, 2.5, 0]] };
  return { SheetNames: Object.keys(Sheets), Sheets };
}
function flipkartWorkbook() {
  const Sheets = {
    'Section 7(B)(2) in GSTR-1': [['GSTIN', 'Delivered State (PoS)', 'Gross Taxable Value', 'Taxable Sales Return', 'Aggregate Taxable Value', 'IGST %', 'IGST Amount', 'Cess Amount'],
      [gstin, 'Karnataka', 100, 0, 100, 18, 18, 0]],
    'Section 7(A)(2) in GSTR-1': [['GSTIN', 'Gross Taxable Value', 'Taxable Sales Return', 'Aggregate Taxable Value', 'CGST %', 'CGST Amount', 'SGST %', 'SGST Amount', 'Cess Amount'],
      [gstin, 100, 0, 100, 2.5, 2.5, 2.5, 2.5, 0]],
    'Section 12 in GSTR-1': [['HSN Number', 'Total Quantity', 'Total Value', 'Total Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'Cess Amount'],
      ['732399', 1, 118, 100, 18, 0, 0, 0], ['961590', 1, 105, 100, 0, 2.5, 2.5, 0]] };
  return { SheetNames: Object.keys(Sheets), Sheets };
}
test('K: existing Amazon and Flipkart parsers and multi-marketplace consolidation still work', () => {
  const a = app();
  const amazon = a.parseAmazonWorkbook(X, amazonWorkbook(), gstin, '33', '092026');
  const flipkart = a.parseFlipkartWorkbook(X, flipkartWorkbook(), gstin, '33', '092026', etin);
  assert.deepEqual(plain(amazon.errors), []);
  assert.deepEqual(plain(flipkart.errors), []);
  assert.deepEqual(plain(amazon.summary), { txval: 200, iamt: 18, camt: 2.5, samt: 2.5, csamt: 0 });
  assert.deepEqual(plain(flipkart.summary), plain(amazon.summary));
  const res = Core.consolidate([{ name: 'Amazon', res: amazon }, { name: 'Flipkart', res: flipkart },
    { name: 'Meesho', res: parse(a, 9, [sale()]) }], { gstin, fp: '092026', periods: ['092026'] }, Docs.mergeDocIssues);
  assert.equal(res.summary.txval, 500);
  assert.equal(res.b2cs.length, 2);
  reconcile(res);
  assert.ok(a.amazonJson(amazon).hsn.hsn_b2c.length);
  assert.ok(a.flipkartJson(flipkart).hsn.hsn_b2c.length);
});
test('HSN schema follows filing period and preserves rate, UQC and B2B/B2C grouping', () => {
  const res = { gstin, fp: '092026', hsn: [{ hsn_code: '732399', gst_rate: 18, quantity: 1,
    txval: 100, igst: 18, cgst: 0, sgst: 0, cess: 1, uqc: 'KGS', supply_category: 'B2B' }] };
  const json = Core.toJson(res);
  assert.equal(Array.isArray(json.hsn), false);
  assert.equal(json.hsn.hsn_b2b[0].uqc, 'KGS');
  assert.equal(json.hsn.hsn_b2b[0].csamt, 1);
  assert.deepEqual(Object.keys(json.hsn.hsn_b2b[0]).sort(), ['num', 'hsn_sc', 'uqc', 'qty', 'rt', 'txval', 'iamt', 'camt', 'samt', 'csamt'].sort());
  res.fp = '042025';
  assert.ok(Core.toJson(res).hsn.data);
});

test('odd-paisa intra-state tax splits preserve source tax and reverse exactly on returns', () => {
  const row = sale(9, { tax_amount: 18.005, end_customer_state_new: 'Tamil Nadu' });
  const plus = Core.normalizeMeesho(row, 1, '33', '33', '092026');
  const minus = Core.normalizeMeesho(row, -1, '33', '33', '092026');
  assert.equal(plus.camt, 9.01); assert.equal(plus.samt, 9);
  assert.equal(Core.money(plus.camt + plus.samt), 18.01);
  const canceled = Core.fromTransactions([plus, minus]);
  assert.equal(canceled.summary.txval, 0); assert.equal(canceled.b2cs.length, 0);
  assert.equal(canceled.hsn.length, 0); assert.equal(canceled.clttx.length, 0);
});
test('HSN + rate + UQC stays distinct; Cess survives all exports', () => {
  const a = app();
  const res = combine(a, [parse(a, 9, [sale(9, { uqc: 'KGS', cess_amount: 1 }), sale(9, { uqc: 'NOS', cess_amount: 2 })])]);
  assert.equal(res.hsn.length, 2);
  assert.equal(res.summary.csamt, 3);
  reconcile(res);
  const wb = a.buildCombinedExcel(res, X);
  assert.equal(wb.Sheets.HSN_Summary.J2.v + wb.Sheets.HSN_Summary.J3.v, 3);
  assert.equal(wb.Sheets.HSN_Summary.K2.v, 'KGS');
});
test('summary imports retain HSN UQC and Cess and use the full intra-state rate', () => {
  const a = app();
  const amazonWb = amazonWorkbook();
  amazonWb.Sheets['B2C Small'][1][5] = 1;
  amazonWb.Sheets['HSN Summary'][1][2] = 'KGS';
  amazonWb.Sheets['HSN Summary'][1][10] = 1;
  const amazon = a.parseAmazonWorkbook(X, amazonWb, gstin, '33', '092026');
  assert.deepEqual(plain(amazon.errors), []);
  const flipWb = flipkartWorkbook();
  flipWb.Sheets['Section 7(A)(2) in GSTR-1'][1] = [gstin, 100, 0, 100, 9, 9, 9, 9, 0];
  flipWb.Sheets['Section 12 in GSTR-1'][2] = ['961590', 1, 118, 100, 0, 9, 9, 0];
  const flipkart = a.parseFlipkartWorkbook(X, flipWb, gstin, '33', '092026', etin);
  assert.equal(flipkart.b2cs.find((r) => r.sply_ty === 'INTRA').gst_rate, 18);
  assert.equal(amazon.hsn[0].uqc, 'KGS'); assert.equal(amazon.hsn[0].cess, 1);
  const res = Core.consolidate([{ name: 'Amazon', res: amazon }], { gstin, fp: '092026', periods: ['092026'] }, Docs.mergeDocIssues);
  reconcile(res);
});
test('quarter document ranges are retained, renumbered, and overlaps are rejected', () => {
  const a = app();
  const july = parse(a, 7, [sale(7)]), august = parse(a, 8, [sale(8)]);
  august.doc_issue = july.doc_issue;
  const res = combine(a, [july, august], 'quarterly');
  assert.match(res.errors.map((e) => e.msg).join(' '), /Overlapping document ranges/);
  assert.deepEqual(res.doc_issue.doc_det[0].docs.map((d) => d.num), [1, 2]);
  assert.equal(july.doc_issue.doc_det[0].docs[0].num, 1);
});
test('inconsistent supplied summary totals are reported without fabricated corrections', () => {
  const a = app();
  const res = a.parseAmazonWorkbook(X, amazonWorkbook(), gstin, '33', '092026');
  res.hsn[0].txval += 0.01;
  const combined = Core.consolidate([{ name: 'Amazon', res }], { gstin, fp: '092026', periods: ['092026'] }, Docs.mergeDocIssues);
  assert.match(combined.errors[0].msg, /source HSN.*differs from B2CS/);
  assert.equal(combined.hsn[0].txval, 100.01);
  assert.equal(combined.summary.txval, 200);
});
test('quarter refuses to borrow monthly files when a quarter month upload is missing', async () => {
  const a = app();
  const file = { name: 'monthly.xlsx', arrayBuffer: async () => new ArrayBuffer(0) };
  a.ecPatch({ meesho: true, gstin, month: '2026-09', mode: 'quarterly', quarterYear: '2026', quarterStart: '7',
    meeshoSalesFileObj: file, meeshoTaxInvoiceFileObj: file, quarterFiles: {} });
  a.loadXlsx = async () => { throw new Error('Monthly file should not be read'); };
  await a.generateQuarter();
  assert.match(a.state.combinedResult.errors[0].msg, /Sales Report is required/);
  assert.doesNotMatch(a.state.combinedResult.errors[0].msg, /should not be read/);
});
test('changing month, mode or uploads invalidates stale previews', () => {
  const a = app();
  const result = combine(a, [parse(a, 9, [sale()])]);
  a.setState({ combinedResult: result });
  a.renderVals().setEcMonth({ target: { value: '2026-08' } });
  assert.equal(a.state.combinedResult, null);
  a.setState({ combinedResult: result });
  a.renderVals().setEcMode({ target: { value: 'quarterly' } });
  assert.equal(a.state.combinedResult, null);
  a.setState({ combinedResult: result });
  a.ecPatch({ meeshoSalesFileObj: null });
  assert.equal(a.state.combinedResult, null);
});
test('local JSON contract rejects the previous raw HSN array and invalid tax heads', () => {
  const json = Core.toJson(combine(app(), [parse(app(), 9, [sale()])]));
  assert.deepEqual(Core.validateJson(json), []);
  json.hsn = [];
  assert.match(Core.validateJson(json).join(' '), /expected an object/);
  json.b2cs[0].sply_ty = 'INTRA';
  assert.match(Core.validateJson(json).join(' '), /tax heads do not match/);
});
test('quarter supports monthly Amazon and Flipkart reports together through their existing import runners', async () => {
  const a = app();
  const quarterFiles = {};
  for (const month of [7, 8, 9]) quarterFiles[`2026-0${month}`] = {
    amazonFileObj: { kind: 'Amazon', name: `Amazon-${month}.xlsx`, arrayBuffer: async () => new ArrayBuffer(0) },
    flipkartFileObj: { kind: 'Flipkart', name: `Flipkart-${month}.xlsx`, arrayBuffer: async () => new ArrayBuffer(0) } };
  a.ecPatch({ amazon: true, flipkart: true, gstin, etin, mode: 'quarterly', quarterYear: '2026', quarterStart: '7', quarterFiles });
  a.loadXlsx = async () => X;
  a.readWorkbook = async (_, f) => f.kind === 'Amazon' ? amazonWorkbook() : flipkartWorkbook();
  await a.generateQuarter();
  const res = a.state.combinedResult;
  assert.deepEqual(plain(res.errors), []);
  assert.equal(res.summary.txval, 1200);
  assert.equal(res.b2cs.length, 2); assert.equal(res.hsn.length, 2);
  assert.equal(res.clttx.length, 1);
  assert.deepEqual(plain(res.monthlySummaries.map((r) => r.summary.txval)), [400, 400, 400]);
  reconcile(res);
});
test('all three months with returns net correctly, including returns of a prior-month sale', () => {
  const a = app();
  const res = combine(a, [7, 8, 9].map((month) => parse(a, month, [sale(month)], [returns(month, {
    total_taxable_sale_value: 25, tax_amount: 4.5, total_invoice_value: 29.5, order_date: '2026-06-01'
  })])), 'quarterly');
  assert.deepEqual(plain(res.errors), []);
  assert.equal(res.summary.txval, 225); assert.equal(res.summary.iamt, 40.5);
  assert.equal(res.returnRows, 3);
  reconcile(res);
});
test('platform-specific Excel exports include HSN and share JSON totals', () => {
  const a = app();
  const meesho = parse(a, 9, [sale(9)]);
  const mWb = a.buildMeeshoExcel(meesho);
  assert.ok(mWb.SheetNames.includes('HSN Summary'));
  assert.equal(mWb.Sheets['HSN Summary'].D2.v, a.meeshoJson(meesho).hsn.hsn_b2c[0].txval);
  const amazon = a.parseAmazonWorkbook(X, amazonWorkbook(), gstin, '33', '092026');
  const aWb = a.buildAmazonExcel(amazon, X);
  assert.ok(aWb.SheetNames.includes('HSN_Summary'));
  assert.equal(aWb.Sheets.HSN_Summary.D2.v, a.amazonJson(amazon).hsn.hsn_b2c[0].txval);
  const flipkart = a.parseFlipkartWorkbook(X, flipkartWorkbook(), gstin, '33', '092026', etin);
  const fWb = a.buildFlipkartExcel(flipkart, X);
  assert.ok(fWb.SheetNames.includes('HSN_Summary'));
  assert.equal(fWb.Sheets.HSN_Summary.D2.v, a.flipkartJson(flipkart).hsn.hsn_b2c[0].txval);
});
test('reproduces the three-paisa grouping defect and eliminates it without adjustment', () => {
  const a = app();
  const rows = ['01', '07', '09', '24', '27', '29', '32'].map((pos) => sale(9, {
    end_customer_state_new: pos, total_taxable_sale_value: 100.0049,
    tax_amount: 18.0051, total_invoice_value: 118.01
  }));
  // Seven POS groups each rounded individually, versus one HSN/operator group.
  // These are controlled fixture amounts, not the user's unavailable September file.
  const oldB2csTaxable = sum(rows.map((r) => ({ txval: Core.money(r.total_taxable_sale_value) })), 'txval');
  const oldHsnTaxable = Core.money(rows.reduce((n, r) => n + r.total_taxable_sale_value, 0));
  const oldB2csIgst = sum(rows.map((r) => ({ iamt: Core.money(r.tax_amount) })), 'iamt');
  const oldHsnIgst = Core.money(rows.reduce((n, r) => n + r.tax_amount, 0));
  assert.equal(Core.money(oldHsnTaxable - oldB2csTaxable), 0.03);
  assert.equal(Core.money(oldB2csIgst - oldHsnIgst), 0.03);
  const res = combine(a, [parse(a, 9, rows)]);
  assert.equal(res.summary.txval, 700);
  assert.equal(res.summary.iamt, 126.07);
  reconcile(res);
});
