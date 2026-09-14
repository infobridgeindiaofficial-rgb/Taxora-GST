const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const modulePath = path.join(__dirname, "..", "..", "..", "master-report.js");
const templatePath = path.join(__dirname, "..", "TAXORA_Master_Report_Template.xlsx");

const MR = require(modulePath);

const MASTER_BUFFER = fs.readFileSync(templatePath);

function readEntry(buf, entries, name) {
  const e = entries.find((x) => x.name === name);
  if (!e) throw new Error("missing entry " + name);
  const raw = buf.subarray(e.dataStart, e.dataStart + e.csize);
  return e.method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
}

function entriesOf(u8) {
  return MR.parseZip(Buffer.from(u8));
}

function cellText(xml, ref) {
  const re = new RegExp('<x:c r="' + ref + '"[^>]*>(?:<x:v>([\\s\\S]*?)<\\/x:v>)?<\\/x:c>');
  const m = re.exec(xml);
  return m ? (m[1] === undefined ? "" : m[1]) : null;
}

function countMerges(xml) {
  return (xml.match(/<x:mergeCell/g) || []).length;
}

const FORBIDDEN_XML_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/;

const XML_NAME_RE = /^[A-Za-z_][A-Za-z0-9._:-]*$/;
const XML_ATTR_RE = /([A-Za-z_:][A-Za-z0-9._:-]*)\s*=\s*("[\s\S]*?"|'[\s\S]*?')/g;

function assertXmlWellFormed(xml, label) {
  assert.ok(!FORBIDDEN_XML_RE.test(xml), label + ": forbidden XML 1.0 control characters present");
  const textOnly = xml.replace(/<[^>]*>/g, "");
  assert.ok(
    !/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9A-Fa-f]+;)/.test(textOnly),
    label + ": bare ampersand in text node"
  );
  const stack = [];
  let i = 0;
  while (i < xml.length) {
    const lt = xml.indexOf("<", i);
    if (lt < 0) break;
    i = lt;
    if (xml.startsWith("<!--", i)) {
      const c = xml.indexOf("-->", i + 4);
      assert.ok(c >= 0, label + ": unterminated comment");
      i = c + 3;
      continue;
    }
    if (xml.startsWith("<?", i)) {
      const c = xml.indexOf("?>", i + 2);
      assert.ok(c >= 0, label + ": unterminated PI");
      i = c + 2;
      continue;
    }
    if (xml.startsWith("<![CDATA[", i)) {
      const c = xml.indexOf("]]>", i + 9);
      assert.ok(c >= 0, label + ": unterminated CDATA");
      i = c + 3;
      continue;
    }
    if (xml.startsWith("<!DOCTYPE", i)) {
      const c = xml.indexOf(">", i + 9);
      assert.ok(c >= 0, label + ": unterminated DOCTYPE");
      i = c + 1;
      continue;
    }
    let end = -1;
    let quote = "";
    for (let j = i + 1; j < xml.length; j++) {
      const ch = xml[j];
      if (quote) {
        if (ch === quote) quote = "";
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === ">") { end = j; break; }
    }
    assert.ok(end >= 0, label + ": unterminated tag at offset " + i);
    const inner = xml.slice(i + 1, end);
    i = end + 1;
    if (inner[0] === "/") {
      const closing = inner.slice(1).trim();
      assert.ok(stack.length > 0, label + ": unexpected closing </" + closing + ">");
      assert.strictEqual(stack.pop(), closing, label + ": mismatched closing </" + closing + ">");
      continue;
    }
    const selfClosing = /\/\s*$/.test(inner);
    const nameMatch = /^([^\s]+)/.exec(inner);
    assert.ok(nameMatch, label + ": malformed tag <" + inner + ">");
    const tagName = nameMatch[1];
    assert.ok(XML_NAME_RE.test(tagName), label + ": bad tag name " + tagName);
    let rest = inner.slice(tagName.length);
    if (selfClosing) rest = rest.replace(/\/\s*$/, "");
    const seen = new Set();
    let last = 0;
    let a;
    XML_ATTR_RE.lastIndex = 0;
    while ((a = XML_ATTR_RE.exec(rest)) !== null) {
      assert.ok(!seen.has(a[1]), label + ": duplicate attribute " + a[1] + " on <" + tagName + ">");
      seen.add(a[1]);
      last = XML_ATTR_RE.lastIndex;
    }
    assert.ok(rest.slice(last).trim() === "", label + ": malformed attributes on <" + tagName + ">: " + rest.slice(last).trim());
    if (!selfClosing) stack.push(tagName);
  }
  assert.strictEqual(stack.length, 0, label + ": unclosed tags: " + stack.join(", "));
}

function validateAllEntries(u8) {
  const entries = entriesOf(u8);
  const buf = Buffer.from(u8);
  for (const e of entries) {
    if (/\.(xml|rels)$/.test(e.name)) {
      const content = readEntry(buf, entries, e.name).toString("utf8");
      assertXmlWellFormed(content, e.name);
    }
  }
  return entries;
}

function sheetDump(u8, entries) {
  const buf = Buffer.from(u8);
  let all = "";
  for (const name of Object.values(MR.SHEET_FILES)) {
    all += readEntry(buf, entries, name).toString("utf8");
  }
  return all;
}

const filthy = {
  gstin: "\u000133G\u0001QUPM2021K1ZL\u0004",
  periodLabel: "\u000BAugust\u000C 2026\u001F",
  platform: "Fli\u000Ekart",
  txval: 1274.59,
  igst: 192.96,
  cgst: 18.23,
  sgst: 18.23,
  cess: 0,
  b2csCount: 2,
  b2bCount: 0,
  b2clCount: 0,
  cdnCount: 0,
  ecomCount: 1,
  hsnCount: 1,
  b2cs: [
    { splyType: "\u0002INTER\u0003", gstRate: 18, type: "OE\u0005", pos: "0\u00066", posName: "\u0007Haryana\u0008", txval: 211.02, igst: 37.98, cgst: 0, sgst: 0, cess: 0 },
    { splyType: "\u000BINTRA\u000C", gstRate: 18, type: "\u000EOE\u000F", pos: "33", posName: "Tamil\tNadu", txval: 238.29, igst: 0, cgst: 21.45, sgst: 21.45, cess: 0 }
  ],
  eco: [{ etin: "33AA\u0010ICA3918J1C0\u001F", suppval: 1274.59, igst: 192.96, cgst: 18.23, sgst: 18.23, cess: 0, flag: "\u0011N\u0012" }],
  hsn: [{ hsn: "4602\u00131100\u0014", gstRate: 18, qty: 3, txval: 633.06, tax: 113.94, invoiceValue: 747, igst: 113.94, cgst: 0, sgst: 0 }],
  jsonText: "B2B \u0000 Supplies\u000B\t to registered\u0001 persons\u001E\n\"R&D\" \u000C line2"
};

const doc = {
  gstin: "33GQUPM2021K1ZL",
  periodLabel: "August 2026",
  platform: "Amazon / Flipkart / Meesho",
  txval: 1274.59,
  igst: 192.96,
  cgst: 18.23,
  sgst: 18.23,
  cess: 0,
  b2csCount: 3,
  b2bCount: 0,
  b2clCount: 1,
  cdnCount: 2,
  ecomCount: 1,
  hsnCount: 4,
  b2cs: [
    { splyType: "INTER", gstRate: 18, type: "OE", pos: "06", posName: "Haryana", txval: 211.02, igst: 37.98, cgst: 0, sgst: 0, cess: 0 },
    { splyType: "INTER", gstRate: 18, type: "OE", pos: "07", posName: "Delhi", txval: 194.07, igst: 34.93, cgst: 0, sgst: 0, cess: 0 },
    { splyType: "INTRA", gstRate: 18, type: "OE", pos: "33", posName: "Tamil Nadu", txval: 238.29, igst: 0, cgst: 21.45, sgst: 21.45, cess: 0 }
  ],
  eco: [
    { etin: "33AAICA3918J1C0", suppval: 1274.59, igst: 192.96, cgst: 18.23, sgst: 18.23, cess: 0, flag: "N" }
  ],
  hsn: [
    { hsn: "46021100", gstRate: 18, qty: 3, txval: 633.06, tax: 113.94, invoiceValue: 747, igst: 113.94, cgst: 0, sgst: 0 },
    { hsn: "70134900", gstRate: 18, qty: 1, txval: 202.54, tax: 36.46, invoiceValue: 239, igst: 0, cgst: 18.23, sgst: 18.23 }
  ],
  jsonText: '{\n  "gstin": "33GQUPM2021K1ZL"\n}'
};

test("master template file and embedded copy are identical and unmodified", () => {
  const fileSha = crypto.createHash("sha256").update(MASTER_BUFFER).digest("hex");
  assert.strictEqual(fileSha, MR.MASTER_SHA256, "template file changed");
  const embedded = Buffer.from(MR.b64ToBytes(MR.MASTER_BASE64));
  assert.deepStrictEqual(embedded, MASTER_BUFFER, "embedded copy differs from file");
});

test("generated workbook keeps master sheet names and order", async () => {
  const u8 = await MR.generate(doc);
  const entries = entriesOf(u8);
  const wb = readEntry(u8, entries, "xl/workbook.xml").toString("utf8");
  const names = [];
  const re = /<x:sheet name="([^"]*)"/g;
  let m;
  while ((m = re.exec(wb))) names.push(m[1]);
  assert.deepStrictEqual(names, ["Summary", "B2CS", "ECO_Summary", "HSN_Summary", "JSON_Preview"]);
});

test("unchanged zip entries are byte-identical after recompression", async () => {
  const u8 = await MR.generate(doc);
  const entries = entriesOf(u8);
  const edited = Object.values(MR.SHEET_FILES);
  const masterEntries = MR.parseZip(Buffer.from(MR.b64ToBytes(MR.MASTER_BASE64)));
  for (const e of entries) {
    if (edited.indexOf(e.name) >= 0) continue;
    const from = readEntry(Buffer.from(u8), entries, e.name);
    const ref = readEntry(MASTER_BUFFER, masterEntries, e.name);
    assert.deepStrictEqual(from, ref, "entry changed: " + e.name);
  }
});

test("summary sheet is filled with real computed values", async () => {
  const u8 = await MR.generate(doc);
  const entries = entriesOf(u8);
  const xml = readEntry(u8, entries, MR.SHEET_FILES.summary).toString("utf8");
  assert.strictEqual(cellText(xml, "A6"), "33GQUPM2021K1ZL");
  assert.strictEqual(cellText(xml, "C6"), "August 2026");
  assert.strictEqual(cellText(xml, "E6"), "Amazon / Flipkart / Meesho");
  assert.strictEqual(cellText(xml, "A9"), "1274.59");
  assert.strictEqual(cellText(xml, "C9"), "229.42");
  assert.strictEqual(cellText(xml, "E9"), "3");
  assert.strictEqual(cellText(xml, "A14"), "192.96");
  assert.strictEqual(cellText(xml, "C14"), "18.23");
  assert.strictEqual(cellText(xml, "E14"), "18.23");
  assert.strictEqual(cellText(xml, "B17"), "0");
  assert.strictEqual(cellText(xml, "D17"), "1");
  assert.strictEqual(cellText(xml, "F17"), "2");
  assert.strictEqual(cellText(xml, "B18"), "1");
  assert.strictEqual(cellText(xml, "D18"), "4");
  assert.strictEqual(cellText(xml, "F18"), "0");
});

test("summary merges are preserved from the master", async () => {
  const u8 = await MR.generate(doc);
  const entries = entriesOf(u8);
  const out = readEntry(u8, entries, MR.SHEET_FILES.summary).toString("utf8");
  const masterEntries = MR.parseZip(Buffer.from(MR.b64ToBytes(MR.MASTER_BASE64)));
  const ref = readEntry(MASTER_BUFFER, masterEntries, MR.SHEET_FILES.summary).toString("utf8");
  assert.strictEqual(countMerges(out), countMerges(ref));
});

test("B2CS / ECO / HSN / JSON sheets carry rows and headers intact", async () => {
  const u8 = await MR.generate(doc);
  const entries = entriesOf(u8);
  const masterEntries = MR.parseZip(Buffer.from(MR.b64ToBytes(MR.MASTER_BASE64)));

  const b2cs = readEntry(u8, entries, MR.SHEET_FILES.b2cs).toString("utf8");
  assert.strictEqual(cellText(b2cs, "A1"), "Supply Type");
  assert.strictEqual(cellText(b2cs, "J1"), "Cess");
  assert.strictEqual(cellText(b2cs, "A2"), "INTER");
  assert.strictEqual(cellText(b2cs, "B2"), "18");
  assert.strictEqual(cellText(b2cs, "E2"), "Haryana");
  assert.strictEqual(cellText(b2cs, "F2"), "211.02");
  assert.strictEqual(cellText(b2cs, "G2"), "37.98");
  assert.strictEqual(cellText(b2cs, "A4"), "INTRA");
  assert.strictEqual(cellText(b2cs, "H4"), "21.45");
  assert.strictEqual(cellText(b2cs, "A5"), null, "only header + 3 data rows expected");

  const eco = readEntry(u8, entries, MR.SHEET_FILES.eco).toString("utf8");
  assert.strictEqual(cellText(eco, "A1"), "ECO GSTIN / ETIN");
  assert.strictEqual(cellText(eco, "A2"), "33AAICA3918J1C0");
  assert.strictEqual(cellText(eco, "B2"), "1274.59");
  assert.strictEqual(cellText(eco, "G2"), "N");
  assert.strictEqual(cellText(eco, "A3"), null);

  const hsn = readEntry(u8, entries, MR.SHEET_FILES.hsn).toString("utf8");
  assert.strictEqual(cellText(hsn, "A1"), "HSN");
  assert.strictEqual(cellText(hsn, "A2"), "46021100");
  assert.strictEqual(cellText(hsn, "F3"), "239");
  assert.strictEqual(cellText(hsn, "A4"), null);

  const json = readEntry(u8, entries, MR.SHEET_FILES.json).toString("utf8");
  assert.strictEqual(cellText(json, "A1"), "Generated Combined GSTR-1 JSON");
  assert.strictEqual(cellText(json, "A3"), "{");
  assert.strictEqual(cellText(json, "A4"), '  &quot;gstin&quot;: &quot;33GQUPM2021K1ZL&quot;');
  assert.strictEqual(cellText(json, "A5"), "}");
  assert.strictEqual(cellText(json, "A6"), null);

  const refB2cs = readEntry(MASTER_BUFFER, masterEntries, MR.SHEET_FILES.b2cs).toString("utf8");
  const refJson = readEntry(MASTER_BUFFER, masterEntries, MR.SHEET_FILES.json).toString("utf8");
  const rowEq = (a, b) => {
    const am = (a.match(/<x:row[\s\S]*?<\/x:row>/) || [null])[0];
    const bm = (b.match(/<x:row[\s\S]*?<\/x:row>/) || [null])[0];
    return am === bm;
  };
  assert.strictEqual(rowEq(b2cs, refB2cs), true, "B2CS header row changed");
  assert.strictEqual(rowEq(json, refJson), true, "JSON title row changed");
});

test("donor row cycling supports more rows than the master has", async () => {
  const wide = {
    gstin: "33GQUPM2021K1ZL",
    periodLabel: "August 2026",
    platform: "Test",
    txval: 100,
    igst: 10,
    cgst: 5,
    sgst: 5,
    cess: 0,
    b2csCount: 9,
    b2bCount: 0,
    b2clCount: 0,
    cdnCount: 0,
    ecomCount: 2,
    hsnCount: 7,
    b2cs: Array.from({ length: 9 }, (_, i) => ({ splyType: "INTER", gstRate: 18, type: "OE", pos: "06", posName: "Haryana", txval: i + 1, igst: i, cgst: 0, sgst: 0, cess: 0 })),
    eco: Array.from({ length: 2 }, (_, i) => ({ etin: "33AAICA3918J1C0", suppval: i + 1, igst: i, cgst: 0, sgst: 0, cess: 0, flag: "N" })),
    hsn: Array.from({ length: 7 }, (_, i) => ({ hsn: "46021100", gstRate: 18, qty: i + 1, txval: i + 1, tax: 0, invoiceValue: i + 1, igst: 0, cgst: 0, sgst: 0 })),
    jsonText: Array.from({ length: 6 }, (_, i) => '"line' + i + '"').join("\n")
  };
  const u8 = await MR.generate(wide);
  const entries = entriesOf(u8);
  const b2cs = readEntry(u8, entries, MR.SHEET_FILES.b2cs).toString("utf8");
  const eco = readEntry(u8, entries, MR.SHEET_FILES.eco).toString("utf8");
  const hsn = readEntry(u8, entries, MR.SHEET_FILES.hsn).toString("utf8");
  const json = readEntry(u8, entries, MR.SHEET_FILES.json).toString("utf8");
  assert.strictEqual(cellText(b2cs, "A10"), "INTER");
  assert.strictEqual(cellText(b2cs, "F10"), "9");
  assert.strictEqual(cellText(b2cs, "A11"), null);
  assert.strictEqual(cellText(eco, "A3"), "33AAICA3918J1C0");
  assert.strictEqual(cellText(eco, "A4"), null);
  assert.strictEqual(cellText(hsn, "A8"), "46021100");
  assert.strictEqual(cellText(hsn, "C8"), "7");
  assert.strictEqual(cellText(hsn, "A9"), null);
  assert.strictEqual(cellText(json, "A8"), '&quot;line5&quot;');
  assert.strictEqual(cellText(json, "A9"), null);
});

test("two runs on identical input produce identical bytes", async () => {
  const a = await MR.generate(doc);
  const b = await MR.generate(doc);
  assert.deepStrictEqual(Buffer.from(a), Buffer.from(b));
});

test("computeSummary derives net GST and counts safely", () => {
  const s = MR.computeSummary({ igst: "192.96", cgst: 18.23, sgst: "18.23", cess: "0", txval: "1274.59", b2csCount: "3", b2bCount: 1, b2clCount: 0, cdnCount: 2, ecomCount: 1, hsnCount: 4 });
  assert.strictEqual(s.txval, "1274.59");
  assert.strictEqual(s.igst, "192.96");
  assert.strictEqual(s.cgst, "18.23");
  assert.strictEqual(s.sgst, "18.23");
  assert.strictEqual(s.netGst, "229.42");
  assert.strictEqual(s.b2csCount, "3");
  assert.strictEqual(s.b2bCount, "1");
  assert.strictEqual(s.cdnCount, "2");
  assert.strictEqual(s.ecomCount, "1");
  assert.strictEqual(s.hsnCount, "4");
});

test("forbidden XML control characters are stripped from every worksheet string", async () => {
  const u8 = await MR.generate(filthy);
  const entries = entriesOf(u8);
  const buf = Buffer.from(u8);
  assert.ok(!FORBIDDEN_XML_RE.test(sheetDump(u8, entries)), "summary/row sheets contain forbidden chars");

  const summary = readEntry(buf, entries, MR.SHEET_FILES.summary).toString("utf8");
  assert.strictEqual(cellText(summary, "A6"), "33GQUPM2021K1ZL");
  assert.strictEqual(cellText(summary, "C6"), "August 2026");
  assert.strictEqual(cellText(summary, "E6"), "Flikart");

  const b2cs = readEntry(buf, entries, MR.SHEET_FILES.b2cs).toString("utf8");
  assert.strictEqual(cellText(b2cs, "A2"), "INTER");
  assert.strictEqual(cellText(b2cs, "C2"), "OE");
  assert.strictEqual(cellText(b2cs, "D2"), "06");
  assert.strictEqual(cellText(b2cs, "E2"), "Haryana");
  assert.strictEqual(cellText(b2cs, "A3"), "INTRA");
  assert.strictEqual(cellText(b2cs, "E3"), "Tamil\tNadu", "tab must survive sanitation");

  const eco = readEntry(buf, entries, MR.SHEET_FILES.eco).toString("utf8");
  assert.strictEqual(cellText(eco, "A2"), "33AAICA3918J1C0");
  assert.strictEqual(cellText(eco, "G2"), "N");

  const hsn = readEntry(buf, entries, MR.SHEET_FILES.hsn).toString("utf8");
  assert.strictEqual(cellText(hsn, "A2"), "46021100");

  const json = readEntry(buf, entries, MR.SHEET_FILES.json).toString("utf8");
  assert.strictEqual(cellText(json, "A3"), "B2B  Supplies\t to registered persons");
  assert.strictEqual(cellText(json, "A4"), '&quot;R&amp;D&quot;  line2');
});

test("non-ASCII text is encoded as UTF-8 without latin-1 truncation", async () => {
  const unicodeDoc = {
    gstin: "33GQUPM2021K1ZL",
    periodLabel: "August 2026",
    platform: "\u2014 GSTR-3B \u20B9",
    txval: 1274.59,
    igst: 192.96,
    cgst: 18.23,
    sgst: 18.23,
    cess: 0,
    b2csCount: 0,
    b2bCount: 0,
    b2clCount: 0,
    cdnCount: 0,
    ecomCount: 0,
    hsnCount: 0,
    b2cs: [],
    eco: [],
    hsn: [],
    jsonText: "B2B \u2014 Supplies to registered persons\nCost \u20B9 100"
  };
  const u8 = await MR.generate(unicodeDoc);
  const entries = entriesOf(u8);
  const buf = Buffer.from(u8);
  const summary = readEntry(buf, entries, MR.SHEET_FILES.summary).toString("utf8");
  assert.strictEqual(cellText(summary, "E6"), "\u2014 GSTR-3B \u20B9");
  assert.ok(!FORBIDDEN_XML_RE.test(summary), "summary sheet must stay clean after UTF-8 encoding");

  const json = readEntry(buf, entries, MR.SHEET_FILES.json).toString("utf8");
  assert.strictEqual(cellText(json, "A3"), "B2B \u2014 Supplies to registered persons");
  assert.strictEqual(cellText(json, "A4"), "Cost \u20B9 100");
  assert.ok(json.indexOf("\u0014") < 0, "em dash must not collapse into control char U+0014");

  const raw = readEntry(buf, entries, MR.SHEET_FILES.json);
  const labelBytes = Buffer.from("B2B \u2014 Supplies to registered persons", "utf8");
  assert.ok(Buffer.from(raw).indexOf(labelBytes) >= 0, "em dash stored as UTF-8 bytes E2 80 94");

  const masterEntries = MR.parseZip(Buffer.from(MR.b64ToBytes(MR.MASTER_BASE64)));
  const refSheet = readEntry(MASTER_BUFFER, masterEntries, MR.SHEET_FILES.summary);
  const refDecoded = new TextDecoder("utf-8").decode(refSheet);
  assert.strictEqual(
    Buffer.from(MR.strBytes(refDecoded)).equals(refSheet),
    true,
    "master template XML must round-trip byte-identically through UTF-8 decode/encode"
  );
});

test("every .xml and .rels entry inside the generated workbook is well-formed XML", async () => {
  const big = {
    gstin: "33GQUPM2021K1ZL",
    periodLabel: "August 2026",
    platform: "Test",
    txval: 100,
    igst: 10,
    cgst: 5,
    sgst: 5,
    cess: 0,
    b2csCount: 9,
    b2bCount: 0,
    b2clCount: 0,
    cdnCount: 0,
    ecomCount: 2,
    hsnCount: 7,
    b2cs: Array.from({ length: 9 }, (_, i) => ({ splyType: "INTER", gstRate: 18, type: "OE", pos: "06", posName: "Haryana", txval: i + 1, igst: i, cgst: 0, sgst: 0, cess: 0 })),
    eco: Array.from({ length: 2 }, (_, i) => ({ etin: "33AAICA3918J1C0", suppval: i + 1, igst: i, cgst: 0, sgst: 0, cess: 0, flag: "N" })),
    hsn: Array.from({ length: 7 }, (_, i) => ({ hsn: "46021100", gstRate: 18, qty: i + 1, txval: i + 1, tax: 0, invoiceValue: i + 1, igst: 0, cgst: 0, sgst: 0 })),
    jsonText: Array.from({ length: 6 }, (_, i) => '"line' + i + '"').join("\n")
  };
  for (const input of [doc, filthy, big]) {
    const u8 = await MR.generate(input);
    validateAllEntries(u8);
  }
});

test("generated workbook reopens and reads back filled values", async () => {
  const u8 = await MR.generate(doc);
  const entries = validateAllEntries(u8);
  const buf = Buffer.from(u8);

  const wb = readEntry(buf, entries, "xl/workbook.xml").toString("utf8");
  const names = [];
  let m;
  const re = /<x:sheet name="([^"]*)"/g;
  while ((m = re.exec(wb))) names.push(m[1]);
  assert.deepStrictEqual(names, ["Summary", "B2CS", "ECO_Summary", "HSN_Summary", "JSON_Preview"]);

  const summary = readEntry(buf, entries, MR.SHEET_FILES.summary).toString("utf8");
  assert.strictEqual(cellText(summary, "A6"), "33GQUPM2021K1ZL");
  assert.strictEqual(cellText(summary, "E9"), "3");
  assert.strictEqual(cellText(summary, "D18"), "4");

  const b2cs = readEntry(buf, entries, MR.SHEET_FILES.b2cs).toString("utf8");
  assert.strictEqual(cellText(b2cs, "A2"), "INTER");
  assert.strictEqual(cellText(b2cs, "H4"), "21.45");

  const json = readEntry(buf, entries, MR.SHEET_FILES.json).toString("utf8");
  assert.strictEqual(cellText(json, "A3"), "{");
  assert.strictEqual(cellText(json, "A4"), '  &quot;gstin&quot;: &quot;33GQUPM2021K1ZL&quot;');
  assert.strictEqual(cellText(json, "A5"), "}");
});