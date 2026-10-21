(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TaxoraGstr1 = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Decimal half-away-from-zero; round source amounts once, then add integer paise.
  // String conversion avoids binary floating point changing a decimal tie (e.g. 1.005).
  function scaled(value, digits = 2) {
    if (!Number.isFinite(Number(value))) throw new Error("Invalid numeric amount: " + value);
    const text = String(value).toLowerCase();
    const [mantissa, exponent = "0"] = text.split("e");
    const negative = mantissa.startsWith("-");
    const [whole, fraction = ""] = mantissa.replace(/^[+-]/, "").split(".");
    let n = BigInt((whole || "0") + fraction);
    const shift = digits + Number(exponent) - fraction.length;
    if (shift >= 0) n *= 10n ** BigInt(shift);
    else {
      const divisor = 10n ** BigInt(-shift);
      n = (n + divisor / 2n) / divisor;
    }
    const result = Number(negative ? -n : n);
    if (!Number.isSafeInteger(result)) throw new Error("Amount exceeds safe calculation limit.");
    return result;
  }
  const money = (value) => scaled(value) / 100;
  const amountFields = ["txval", "iamt", "camt", "samt", "csamt"];
  const hsnFields = ["txval", "igst", "cgst", "sgst", "cess", "tax", "invoice_value"];
  const ecoFields = ["suppval", "igst", "cgst", "sgst", "cess"];
  const number = (v) => v == null || v === "" ? 0 : v;

  function group(rows, key, fields, quantity) {
    const map = new Map();
    rows.forEach((row) => {
      const k = key(row);
      if (!map.has(k)) map.set(k, { row: Object.assign({}, row), sums: {} });
      const entry = map.get(k);
      fields.forEach((f) => { entry.sums[f] = (entry.sums[f] || 0) + scaled(number(row[f])); });
      if (quantity) entry.sums.quantity = (entry.sums.quantity || 0) + scaled(number(row.quantity), 3);
    });
    return Array.from(map).sort(([a], [b]) => a.localeCompare(b)).map(([, entry]) => {
      fields.forEach((f) => { entry.row[f] = entry.sums[f] / 100; });
      if (quantity) entry.row.quantity = entry.sums.quantity / 1000;
      return entry.row;
    });
  }

  function summaryOf(rows) {
    const summary = {};
    amountFields.forEach((f) => { summary[f] = rows.reduce((sum, r) => sum + scaled(number(r[f])), 0) / 100; });
    return summary;
  }

  function normalizeMeesho(row, sign, sellerState, pos, fp) {
    const tax = money(row.tax_amount);
    const intra = pos === sellerState;
    const iamt = intra ? 0 : sign * money(tax);
    const camt = intra ? sign * money(tax / 2) : 0;
    // An odd paisa cannot be split equally. CGST receives the rounded half;
    // SGST receives the remainder, preserving the source's total tax exactly.
    const samt = intra ? sign * money(tax - money(tax / 2)) : 0;
    return {
      fp, pos, sply_ty: intra ? "INTRA" : "INTER", typ: "OE",
      sply: String(row.transaction_type || "OE").trim().toUpperCase(),
      gst_rate: Number(row.gst_rate), hsn_code: String(row.hsn_code).trim(),
      uqc: String(row.uqc || "NOS").trim().toUpperCase(), supply_category: "B2C",
      etin: String(row.eco_tcs_gstin || "").trim().toUpperCase(),
      quantity: sign * scaled(number(row.quantity), 3) / 1000,
      txval: sign * money(row.total_taxable_sale_value), iamt, camt, samt,
      csamt: sign * money(number(row.cess_amount)),
      invoice_value: sign * money(number(row.total_invoice_value)),
      isReturn: sign < 0
    };
  }

  function fromTransactions(transactions) {
    const b2cs = group(transactions, (r) => [r.sply_ty, r.pos, r.gst_rate, r.typ].join("|"), amountFields)
      .filter((r) => amountFields.some((f) => r[f] !== 0))
      .map((r) => ({ pos: r.pos, sply_ty: r.sply_ty, typ: r.typ, sply: r.sply,
        gst_rate: r.gst_rate, txval: r.txval, iamt: r.iamt, camt: r.camt, samt: r.samt, csamt: r.csamt }));
    const hsn = group(transactions.map((r) => ({ hsn_code: r.hsn_code, gst_rate: r.gst_rate,
      uqc: r.uqc, supply_category: r.supply_category, quantity: r.quantity, txval: r.txval,
      igst: r.iamt, cgst: r.camt, sgst: r.samt, cess: r.csamt,
      tax: money(r.iamt + r.camt + r.samt + r.csamt), invoice_value: r.invoice_value })),
    (r) => [r.hsn_code, r.gst_rate, r.uqc, r.supply_category].join("|"), hsnFields, true)
      .filter((r) => r.quantity !== 0 || hsnFields.some((f) => r[f] !== 0));
    const clttx = group(transactions.filter((r) => r.etin).map((r) => ({ etin: r.etin,
      suppval: r.txval, igst: r.iamt, cgst: r.camt, sgst: r.samt, cess: r.csamt, flag: "N" })),
    (r) => r.etin, ecoFields).filter((r) => ecoFields.some((f) => r[f] !== 0));
    return { normalizedTransactions: transactions, b2cs, hsn, clttx, supeco: { clttx }, summary: summaryOf(transactions) };
  }

  function quarterMonths(year, start) {
    year = Number(year); start = Number(start);
    if (!Number.isInteger(year) || year < 1950 || year > 2200 || ![1, 4, 7, 10].includes(start)) return [];
    return [start, start + 1, start + 2].map((m) => year + "-" + String(m).padStart(2, "0"));
  }
  const fpOf = (ym) => ym.slice(5, 7) + ym.slice(0, 4);
  const labelOf = (fp) => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(Number(fp.slice(2)), Number(fp.slice(0, 2)) - 1, 1)));

  function consolidate(sources, options, mergeDocIssues) {
    const errors = [];
    const warnings = [];
    const all = sources.map(({ name, res }) => {
      if (!res) { errors.push({ msg: name + ": report was not processed." }); return { name, res: {} }; }
      (res.errors || []).forEach((e) => errors.push({ msg: name + ": " + (e.msg || e) }));
      if (res.gstin !== options.gstin) errors.push({ msg: name + ": GSTIN mismatch between selected reports." });
      if (!options.periods.includes(res.fp)) errors.push({ msg: name + ": filing period is outside the selected period." });
      if (!res.normalizedTransactions && !(res.errors || []).length) {
        // Summary-only reports have no row-to-HSN linkage. Reject conflicting
        // supplied totals instead of inventing an HSN or tax allocation.
        const totals = summaryOf(res.b2cs || []);
        if (!(res.b2b || []).length && !(res.b2cl || []).length && !(res.cdnr || []).length && !(res.cdnur || []).length) {
          [["txval", "txval"], ["iamt", "igst"], ["camt", "cgst"], ["samt", "sgst"], ["csamt", "cess"]].forEach(([b, h]) => {
            const reported = (res.hsn || []).reduce((n, row) => n + scaled(number(row[h])), 0) / 100;
            if (reported !== totals[b]) warnings.push({ msg: name + ": source HSN " + h + " total " + reported.toFixed(2) +
              " differs from B2CS " + totals[b].toFixed(2) + ". Source figures retained; review before GST filing." });
          });
        }
      }
      // Rebuild from source records, never from exported JSON. Other marketplaces provide
      // normalized GST report lines rather than transaction-level TCS reports.
      return { name, res: res.normalizedTransactions ? Object.assign({}, res, fromTransactions(res.normalizedTransactions)) : res };
    });
    const rows = (field) => all.flatMap((s) => s.res[field] || []);
    const b2cs = group(rows("b2cs"), (r) => [r.sply_ty, r.pos, r.gst_rate, r.typ || "OE"].join("|"), amountFields);
    const hsn = group(rows("hsn").map((r) => Object.assign({ uqc: "NOS", supply_category: "B2C" }, r)),
      (r) => [r.hsn_code, r.gst_rate, r.uqc, r.supply_category].join("|"), hsnFields, true);
    const clttx = group(rows("clttx"), (r) => r.etin, ecoFields);
    const monthlySummaries = options.periods.map((fp) => ({ fp, label: labelOf(fp),
      summary: summaryOf(all.filter((s) => s.res.fp === fp).flatMap((s) => s.res.b2cs || [])) }));
    if (options.mode === "quarterly") {
      const ranges = [];
      all.forEach(({ name, res }) => ((res.doc_issue || {}).doc_det || []).forEach((category) =>
        (category.docs || []).forEach((doc) => {
          const from = String(doc.from).match(/^(.*?)(\d+)$/), to = String(doc.to).match(/^(.*?)(\d+)$/);
          const range = { name, category: category.doc_num, from: String(doc.from), to: String(doc.to),
            prefix: from && to && from[1] === to[1] ? from[1].toUpperCase() : null,
            low: from ? Number(from[2]) : null, high: to ? Number(to[2]) : null };
          const overlap = ranges.find((r) => r.category === range.category &&
            (r.from === range.from && r.to === range.to ||
              r.prefix !== null && r.prefix === range.prefix && range.low <= r.high && r.low <= range.high));
          if (overlap) errors.push({ msg: "Overlapping document ranges in " + overlap.name + " and " + name +
            ": " + range.from + "–" + range.to + ". Check duplicate monthly uploads or invoice series." });
          ranges.push(range);
        })));
    }
    const result = { errors, warnings, gstin: options.gstin, fp: options.fp, mode: options.mode || "monthly",
      platforms: Array.from(new Set(sources.map((s) => s.name.split(" — ")[0]))),
      normalizedSources: all, monthlySummaries, b2cs, hsn, clttx, supeco: { clttx },
      b2b: rows("b2b"), b2cl: rows("b2cl"), cdnr: rows("cdnr"), cdnur: rows("cdnur"),
      salesRows: all.reduce((n, s) => n + Number(s.res.amazonRows || s.res.salesRows || 0), 0),
      returnRows: all.reduce((n, s) => n + Number(s.res.returnRows || 0), 0),
      validRows: all.reduce((n, s) => n + Number(s.res.validRows || 0), 0),
      doc_issue: mergeDocIssues(all.map((s) => s.res.doc_issue).filter(Boolean)),
      summary: summaryOf(b2cs), roundingPolicy: "Source-line decimal rounding to paise, half away from zero; integer-paise aggregation."
    };
    if (!errors.length) validateJson(toJson(result)).forEach((msg) => errors.push({ msg: "JSON validation: " + msg }));
    return result;
  }

  function hsnJson(res) {
    const entries = (res.hsn || []).map((h, i) => ({ num: i + 1, hsn_sc: h.hsn_code,
      uqc: h.uqc || "NOS", qty: h.quantity, rt: h.gst_rate, txval: h.txval,
      iamt: h.igst, camt: h.cgst, samt: h.sgst, csamt: h.cess || 0 }));
    if (!entries.length) return null;
    if (Number(res.fp.slice(2) + res.fp.slice(0, 2)) < 202505) return {
      data: entries.map((entry, i) => Object.assign({ val: res.hsn[i].invoice_value || 0 }, entry))
    };
    return {
      hsn_b2b: entries.filter((_, i) => res.hsn[i].supply_category === "B2B").map((r, i) => Object.assign({}, r, { num: i + 1 })),
      hsn_b2c: entries.filter((_, i) => res.hsn[i].supply_category !== "B2B").map((r, i) => Object.assign({}, r, { num: i + 1 }))
    };
  }

  function toJson(res) {
    if (!res) return {};
    const out = { gstin: res.gstin || "", fp: res.fp || "" };
    ["b2b", "b2cl", "cdnr", "cdnur"].forEach((f) => { if ((res[f] || []).length) out[f] = res[f]; });
    if ((res.b2cs || []).length) out.b2cs = res.b2cs.map((r) => ({ sply_ty: r.sply_ty,
      rt: r.gst_rate, typ: r.typ || "OE", pos: r.pos, txval: r.txval, iamt: r.iamt,
      camt: r.camt, samt: r.samt, csamt: r.csamt || 0 }));
    if ((res.clttx || []).length) out.supeco = { clttx: res.clttx };
    if (res.doc_issue && res.doc_issue.doc_det.length) out.doc_issue = res.doc_issue;
    const hsn = hsnJson(res);
    if (hsn) out.hsn = hsn;
    return out;
  }

  // Structural checks for the sections this generator emits. This is a local
  // supported-section contract, not a replacement for GSTN portal validation.
  function validateJson(json) {
    const errors = [];
    const fail = (where, message) => errors.push(where + ": " + message);
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/.test(json.gstin || "")) fail("gstin", "invalid GSTIN");
    if (!/^(0[1-9]|1[0-2])\d{4}$/.test(json.fp || "")) fail("fp", "expected MMYYYY");
    const amounts = (row, fields, where) => fields.forEach((field) => {
      if (typeof row[field] !== "number" || !Number.isFinite(row[field]) || Math.abs(row[field] * 100 - Math.round(row[field] * 100)) > 0.000001)
        fail(where + "." + field, "expected a finite amount with at most two decimals");
    });
    (json.b2cs || []).forEach((r, i) => {
      const where = "b2cs[" + i + "]";
      if (!["INTER", "INTRA"].includes(r.sply_ty) || !/^\d{2}$/.test(r.pos) || !r.typ || !Number.isFinite(r.rt)) fail(where, "missing supply grouping fields");
      amounts(r, amountFields, where);
      if (r.sply_ty === "INTRA" && r.iamt !== 0 || r.sply_ty === "INTER" && (r.camt !== 0 || r.samt !== 0)) fail(where, "tax heads do not match supply type");
    });
    if (json.hsn) {
      if (Array.isArray(json.hsn)) fail("hsn", "expected an object containing HSN tables");
      const modern = Number((json.fp || "").slice(2) + (json.fp || "").slice(0, 2)) >= 202505;
      const tables = modern ? ["hsn_b2b", "hsn_b2c"] : ["data"];
      tables.forEach((table) => {
        if (!Array.isArray(json.hsn[table])) { fail("hsn." + table, "expected an array"); return; }
        const seen = new Set();
        json.hsn[table].forEach((r, i) => {
          const where = "hsn." + table + "[" + i + "]";
          if (!/^(\d{4}|\d{6}|\d{8})$/.test(r.hsn_sc) || !/^[A-Z]{3}$/.test(r.uqc) || !Number.isFinite(r.qty) || !Number.isFinite(r.rt) || r.num !== i + 1) fail(where, "invalid HSN, unit, rate, quantity or sequence");
          amounts(r, ["txval", "iamt", "camt", "samt", "csamt"], where);
          const key = [r.hsn_sc, r.uqc, r.rt].join("|");
          if (seen.has(key)) fail(where, "duplicate HSN + UQC + rate");
          seen.add(key);
        });
      });
    }
    if (json.supeco) (json.supeco.clttx || []).forEach((r, i) => {
      const where = "supeco.clttx[" + i + "]";
      if (!r.etin || r.flag !== "N") fail(where, "missing ETIN or flag");
      amounts(r, ecoFields, where);
    });
    ((json.doc_issue || {}).doc_det || []).forEach((category) => (category.docs || []).forEach((r, i) => {
      if (r.num !== i + 1 || r.from == null || r.to == null ||
        ![r.totnum, r.cancel, r.net_issue].every((n) => Number.isInteger(n) && n >= 0) ||
        r.totnum - r.cancel !== r.net_issue) fail("doc_issue", "invalid document range counts or numbering");
    }));
    return errors;
  }
  return { scaled, money, normalizeMeesho, fromTransactions, summaryOf, consolidate, quarterMonths, fpOf, labelOf, hsnJson, toJson, validateJson };
});
