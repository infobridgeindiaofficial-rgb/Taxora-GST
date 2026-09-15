(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TaxoraLocalWholesaleCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function n(v) {
    var x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  function round2(v) { return Math.round((n(v) + Number.EPSILON) * 100) / 100; }
  function normalizeState(v) { return String(v || '').trim().toLowerCase(); }
  function financialYearFromDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(String(dateStr) + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    var y = d.getFullYear();
    var start = d.getMonth() + 1 >= 4 ? y : y - 1;
    return start + '-' + String(start + 1).slice(-2);
  }
  function periodFromDate(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || '')) ? String(dateStr).slice(0, 7) : '';
  }
  function inPeriod(row, period) { return !period || periodFromDate(row && row.invoiceDate) === period; }
  function computeTaxSplit(taxable, rate, sellerState, otherState) {
    taxable = round2(taxable);
    rate = n(rate);
    var tax = round2(taxable * rate / 100);
    var intra = !!normalizeState(sellerState) && normalizeState(sellerState) === normalizeState(otherState);
    var cgst = intra ? round2(tax / 2) : 0;
    var sgst = intra ? round2(tax - cgst) : 0;
    var igst = intra ? 0 : tax;
    return { taxable: taxable, cgst: cgst, sgst: sgst, igst: igst, totalTax: tax, grandTotal: round2(taxable + tax), isIntra: intra };
  }
  function sumTax(rows) {
    return rows.reduce(function (a, r) {
      a.taxable = round2(a.taxable + n(r.taxableTotal));
      a.cgst = round2(a.cgst + n(r.cgst));
      a.sgst = round2(a.sgst + n(r.sgst));
      a.igst = round2(a.igst + n(r.igst));
      a.grandTotal = round2(a.grandTotal + n(r.grandTotal));
      return a;
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, grandTotal: 0 });
  }
  function summarizeSales(sales, period) {
    var rows = (Array.isArray(sales) ? sales : []).filter(function (r) { return inPeriod(r, period); });
    var totals = sumTax(rows);
    totals.count = rows.length;
    totals.b2bCount = rows.filter(function (r) { return r.supplyType === 'B2B'; }).length;
    totals.b2cCount = rows.length - totals.b2bCount;
    totals.intraCount = rows.filter(function (r) { return n(r.igst) === 0 && (n(r.cgst) > 0 || n(r.sgst) > 0); }).length;
    totals.interCount = rows.filter(function (r) { return n(r.igst) > 0; }).length;
    return totals;
  }
  function summarizePurchases(purchases, period) {
    var rows = (Array.isArray(purchases) ? purchases : []).filter(function (r) { return inPeriod(r, period); });
    var totals = sumTax(rows);
    var eligible = rows.filter(function (r) { return r.twoBStatus === 'matched' && r.itcEligible === true; });
    var itc = eligible.reduce(function (a, r) {
      a.cgst = round2(a.cgst + n(r.cgst));
      a.sgst = round2(a.sgst + n(r.sgst));
      a.igst = round2(a.igst + n(r.igst));
      return a;
    }, { cgst: 0, sgst: 0, igst: 0 });
    totals.count = rows.length;
    totals.matchedCount = rows.filter(function (r) { return r.twoBStatus === 'matched'; }).length;
    totals.pendingCount = rows.filter(function (r) { return r.twoBStatus === 'pending'; }).length;
    totals.missingCount = rows.filter(function (r) { return r.twoBStatus === 'missing'; }).length;
    totals.eligibleItc = itc;
    totals.eligibleItc.total = round2(itc.cgst + itc.sgst + itc.igst);
    return totals;
  }
  function groupSales(rows) {
    var t = sumTax(rows);
    return { count: rows.length, taxable: t.taxable, cgst: t.cgst, sgst: t.sgst, igst: t.igst, tax: round2(t.cgst + t.sgst + t.igst), total: t.grandTotal };
  }
  function buildHsn(rows) {
    var map = {};
    rows.forEach(function (inv) {
      (Array.isArray(inv.items) ? inv.items : []).forEach(function (it) {
        var hsn = String(it.hsn || 'UNSPECIFIED').trim() || 'UNSPECIFIED';
        var key = hsn + '|' + n(it.gstRate);
        if (!map[key]) map[key] = { hsn: hsn, gstRate: n(it.gstRate), taxable: 0, tax: 0, qty: 0 };
        map[key].taxable = round2(map[key].taxable + n(it.taxableValue));
        map[key].tax = round2(map[key].tax + n(it.taxableValue) * n(it.gstRate) / 100);
        map[key].qty = round2(map[key].qty + n(it.qty));
      });
    });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  }
  function buildGstr1Summary(sales, period) {
    var rows = (Array.isArray(sales) ? sales : []).filter(function (r) { return inPeriod(r, period); });
    var b2bRows = rows.filter(function (r) { return r.supplyType === 'B2B'; });
    var b2cRows = rows.filter(function (r) { return r.supplyType !== 'B2B'; });
    var intraRows = rows.filter(function (r) { return n(r.igst) === 0; });
    var interRows = rows.filter(function (r) { return n(r.igst) > 0; });
    var total = sumTax(rows);
    return {
      period: period || '', count: rows.length,
      b2b: groupSales(b2bRows), b2c: groupSales(b2cRows),
      intra: groupSales(intraRows), inter: groupSales(interRows),
      totalTaxable: total.taxable, cgst: total.cgst, sgst: total.sgst, igst: total.igst,
      totalTax: round2(total.cgst + total.sgst + total.igst), grandTotal: total.grandTotal,
      hsn: buildHsn(rows)
    };
  }
  function buildGstr3bSummary(sales, purchases, period) {
    var s = summarizeSales(sales, period);
    var p = summarizePurchases(purchases, period);
    var net = {
      cgst: round2(Math.max(0, s.cgst - p.eligibleItc.cgst)),
      sgst: round2(Math.max(0, s.sgst - p.eligibleItc.sgst)),
      igst: round2(Math.max(0, s.igst - p.eligibleItc.igst))
    };
    net.total = round2(net.cgst + net.sgst + net.igst);
    return {
      period: period || '',
      outward: { taxable: s.taxable, cgst: s.cgst, sgst: s.sgst, igst: s.igst, totalTax: round2(s.cgst + s.sgst + s.igst) },
      inward: { taxable: p.taxable, cgst: p.cgst, sgst: p.sgst, igst: p.igst },
      eligibleItc: { cgst: p.eligibleItc.cgst, sgst: p.eligibleItc.sgst, igst: p.eligibleItc.igst, total: p.eligibleItc.total },
      netPayable: net
    };
  }
  function escapeCsv(v) {
    var s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) {
    rows = Array.isArray(rows) ? rows : [];
    if (!rows.length) return '';
    var headers = Object.keys(rows[0]);
    return headers.map(escapeCsv).join(',') + '\n' + rows.map(function (r) {
      return headers.map(function (h) { return escapeCsv(r[h]); }).join(',');
    }).join('\n');
  }
  function xmlEscape(v) {
    return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }
  function toSpreadsheetXml(sheetName, rows) {
    rows = Array.isArray(rows) ? rows : [];
    var headers = rows.length ? Object.keys(rows[0]) : ['No Data'];
    function cell(v) {
      var isNum = typeof v === 'number' && Number.isFinite(v);
      return '<Cell><Data ss:Type="' + (isNum ? 'Number' : 'String') + '">' + xmlEscape(v) + '</Data></Cell>';
    }
    var xmlRows = '<Row>' + headers.map(cell).join('') + '</Row>';
    rows.forEach(function (r) { xmlRows += '<Row>' + headers.map(function (h) { return cell(r[h]); }).join('') + '</Row>'; });
    return '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
      '<Worksheet ss:Name="' + xmlEscape(sheetName || 'GST Report') + '"><Table>' + xmlRows + '</Table></Worksheet></Workbook>';
  }

  return {
    round2: round2,
    financialYearFromDate: financialYearFromDate,
    periodFromDate: periodFromDate,
    computeTaxSplit: computeTaxSplit,
    summarizeSales: summarizeSales,
    summarizePurchases: summarizePurchases,
    buildGstr1Summary: buildGstr1Summary,
    buildGstr3bSummary: buildGstr3bSummary,
    toCsv: toCsv,
    toSpreadsheetXml: toSpreadsheetXml
  };
});
