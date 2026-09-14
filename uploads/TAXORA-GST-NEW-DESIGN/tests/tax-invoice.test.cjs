const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const helperPath = path.join(__dirname, "..", "tax-invoice-parser.js");

test("Meesho tax invoice helper is included", () => {
  assert.equal(fs.existsSync(helperPath), true, "tax-invoice-parser.js is missing");
});

test("repairs a stale A1 worksheet range before reading rows", () => {
  const api = require(helperPath);
  const ws = { "!ref": "A1", A1: { v: "Type" }, F127: { v: "u17sg2710" } };
  const XLSX = {
    utils: {
      decode_cell(addr) {
        const m = addr.match(/^([A-Z]+)(\d+)$/);
        let c = 0;
        for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64;
        return { r: Number(m[2]) - 1, c: c - 1 };
      },
      encode_range(range) {
        const col = (n) => {
          let out = "";
          for (n += 1; n; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
          return out;
        };
        return col(range.s.c) + (range.s.r + 1) + ":" + col(range.e.c) + (range.e.r + 1);
      }
    }
  };

  api.repairWorksheetRange(XLSX, ws);

  assert.equal(ws["!ref"], "A1:F127");
});

test("converts Meesho invoice rows into GSTR-1 Table 13", () => {
  const api = require(helperPath);
  const rows = [
    { Type: "INVOICE", "Order Date": "2026-08-04 10:00:00", "Invoice No.": "u17sg2710" },
    { Type: "INVOICE", "Order Date": "2026-08-05 10:00:00", "Invoice No.": "u17sg2712" },
    { Type: "CREDIT NOTE", "Order Date": "2026-08-06 10:00:00", "Invoice No.": "u17sg27C3" },
    { Type: "CREDIT NOTE", "Order Date": "2026-08-07 10:00:00", "Invoice No.": "u17sg27C5" },
    { Type: "CREDIT_DISCOUNT", "Order Date": "2026-08-08 10:00:00", "Invoice No.": "u17sg27CM4" }
  ];

  const result = api.buildDocIssue(rows, "082026");

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.doc_issue, {
    doc_det: [
      {
        doc_num: 1,
        doc_typ: "Invoices for outward supply",
        docs: [{ num: 1, from: "u17sg2710", to: "u17sg2712", totnum: 3, cancel: 1, net_issue: 2 }]
      },
      {
        doc_num: 5,
        doc_typ: "Credit Note",
        docs: [
          { num: 1, from: "u17sg27C3", to: "u17sg27C5", totnum: 3, cancel: 1, net_issue: 2 },
          { num: 2, from: "u17sg27CM4", to: "u17sg27CM4", totnum: 1, cancel: 0, net_issue: 1 }
        ]
      }
    ]
  });
});

test("rejects tax invoice rows from another filing month", () => {
  const api = require(helperPath);
  const result = api.buildDocIssue([
    { Type: "INVOICE", "Order Date": "2026-07-31 10:00:00", "Invoice No.": "ABC1" }
  ], "082026");

  assert.match(result.errors[0], /July 2026/);
  assert.equal(result.doc_issue, null);
});

test("merges invoice and credit-note document types without changing doc_num", () => {
  const api = require(helperPath);
  const merged = api.mergeDocIssues([
    { doc_det: [{ doc_num: 1, doc_typ: "Invoices for outward supply", docs: [{ num: 1, from: "A1", to: "A2", totnum: 2, cancel: 0, net_issue: 2 }] }] },
    { doc_det: [{ doc_num: 1, doc_typ: "Invoices for outward supply", docs: [{ num: 1, from: "M1", to: "M3", totnum: 3, cancel: 0, net_issue: 3 }] }, { doc_num: 5, doc_typ: "Credit Note", docs: [{ num: 1, from: "C1", to: "C1", totnum: 1, cancel: 0, net_issue: 1 }] }] }
  ]);

  assert.deepEqual(merged.doc_det.map((d) => d.doc_num), [1, 5]);
  assert.deepEqual(merged.doc_det[0].docs.map((d) => d.num), [1, 2]);
  assert.equal(merged.doc_det[0].docs.length, 2);
});
