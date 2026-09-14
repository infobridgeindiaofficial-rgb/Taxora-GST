(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TaxoraTaxInvoice = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const keyOf = (value) => String(value == null ? "" : value).toUpperCase().replace(/[^A-Z0-9]/g, "");

  function repairWorksheetRange(XLSX, worksheet) {
    if (!worksheet || !XLSX || !XLSX.utils) return worksheet;
    const cells = Object.keys(worksheet).filter((key) => key.charAt(0) !== "!" && /^[A-Z]+\d+$/.test(key));
    if (!cells.length) return worksheet;
    let minRow = Infinity, minCol = Infinity, maxRow = -1, maxCol = -1;
    cells.forEach((address) => {
      const cell = XLSX.utils.decode_cell(address);
      minRow = Math.min(minRow, cell.r); minCol = Math.min(minCol, cell.c);
      maxRow = Math.max(maxRow, cell.r); maxCol = Math.max(maxCol, cell.c);
    });
    worksheet["!ref"] = XLSX.utils.encode_range({ s: { r: minRow, c: minCol }, e: { r: maxRow, c: maxCol } });
    return worksheet;
  }

  function valueFrom(row, wanted) {
    const keys = Object.keys(row || {});
    const hit = keys.find((key) => keyOf(key) === wanted);
    return hit === undefined ? undefined : row[hit];
  }

  function periodOf(value) {
    if (typeof value === "number" && isFinite(value)) {
      const date = new Date(Math.round((value - 25569) * 86400000));
      if (!isNaN(date.getTime())) return String(date.getUTCMonth() + 1).padStart(2, "0") + date.getUTCFullYear();
    }
    const match = String(value == null ? "" : value).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return match ? String(Number(match[2])).padStart(2, "0") + match[1] : "";
  }

  function periodName(fp) {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = Number(String(fp).slice(0, 2));
    return month >= 1 && month <= 12 ? names[month - 1] + " " + String(fp).slice(2) : String(fp);
  }

  function seriesOf(number) {
    const text = String(number == null ? "" : number).trim();
    const match = text.match(/^(.*?)(\d+)$/);
    return match ? { key: match[1], prefix: match[1], value: Number(match[2]), text: text } : { key: text, prefix: text, value: null, text: text };
  }

  function buildDocIssue(rows, fp) {
    const errors = [];
    if (!Array.isArray(rows) || !rows.length) return { errors: ["Meesho Tax Invoice Details has no document rows."], doc_issue: null };
    const firstKeys = Object.keys(rows[0] || {}).map(keyOf);
    ["TYPE", "ORDERDATE", "INVOICENO"].forEach((required) => {
      if (firstKeys.indexOf(required) === -1) errors.push("Meesho Tax Invoice Details is missing column: " + ({ TYPE: "Type", ORDERDATE: "Order Date", INVOICENO: "Invoice No." })[required] + ".");
    });
    if (errors.length) return { errors: errors, doc_issue: null };

    const groups = {};
    const seen = {};
    rows.forEach((row, index) => {
      const type = String(valueFrom(row, "TYPE") || "").trim().toUpperCase();
      const invoice = String(valueFrom(row, "INVOICENO") || "").trim();
      const rowPeriod = periodOf(valueFrom(row, "ORDERDATE"));
      if (!invoice) { errors.push("Meesho Tax Invoice Details — Row " + (index + 2) + " — Invoice No. is required."); return; }
      if (!rowPeriod) { errors.push("Meesho Tax Invoice Details — Row " + (index + 2) + " — Order Date could not be read."); return; }
      if (fp && rowPeriod !== fp) { errors.push("Meesho Tax Invoice Details is for " + periodName(rowPeriod) + ", but " + periodName(fp) + " is selected."); return; }
      let docNum = 0, docType = "";
      if (type === "INVOICE") { docNum = 1; docType = "Invoices for outward supply"; }
      else if (type === "CREDIT NOTE" || type === "CREDIT_DISCOUNT") { docNum = 5; docType = "Credit Note"; }
      else return;
      const duplicateKey = docNum + "|" + invoice.toUpperCase();
      if (seen[duplicateKey]) { errors.push("Meesho Tax Invoice Details — duplicate Invoice No.: " + invoice + "."); return; }
      seen[duplicateKey] = true;
      const series = seriesOf(invoice);
      const groupKey = docNum + "|" + series.key.toUpperCase();
      if (!groups[groupKey]) groups[groupKey] = { doc_num: docNum, doc_typ: docType, prefix: series.prefix, values: [] };
      groups[groupKey].values.push(series);
    });
    if (errors.length) return { errors: Array.from(new Set(errors)), doc_issue: null };

    const categories = {};
    Object.keys(groups).forEach((key) => {
      const group = groups[key];
      const numeric = group.values.every((item) => item.value !== null);
      const sorted = group.values.slice().sort((a, b) => numeric ? a.value - b.value : a.text.localeCompare(b.text));
      const first = sorted[0], last = sorted[sorted.length - 1];
      const total = numeric ? last.value - first.value + 1 : sorted.length;
      const doc = { num: 0, from: first.text, to: last.text, totnum: total, cancel: total - sorted.length, net_issue: sorted.length };
      if (!categories[group.doc_num]) categories[group.doc_num] = { doc_num: group.doc_num, doc_typ: group.doc_typ, docs: [] };
      categories[group.doc_num].docs.push(doc);
    });
    const docDet = Object.keys(categories).map(Number).sort((a, b) => a - b).map((docNum) => {
      const category = categories[docNum];
      category.docs.sort((a, b) => a.from.localeCompare(b.from)).forEach((doc, index) => { doc.num = index + 1; });
      return category;
    });
    if (!docDet.length) return { errors: ["Meesho Tax Invoice Details does not contain INVOICE or CREDIT NOTE rows."], doc_issue: null };
    return { errors: [], doc_issue: { doc_det: docDet } };
  }

  function mergeDocIssues(issues) {
    const categories = {};
    (issues || []).forEach((issue) => {
      (((issue || {}).doc_det) || []).forEach((category) => {
        const docNum = Number(category.doc_num);
        if (!categories[docNum]) categories[docNum] = { doc_num: docNum, doc_typ: category.doc_typ || (docNum === 1 ? "Invoices for outward supply" : docNum === 5 ? "Credit Note" : ""), docs: [] };
        (category.docs || []).forEach((doc) => categories[docNum].docs.push(Object.assign({}, doc)));
      });
    });
    const docDet = Object.keys(categories).map(Number).sort((a, b) => a - b).map((docNum) => {
      const category = categories[docNum];
      category.docs.forEach((doc, index) => { doc.num = index + 1; });
      return category;
    });
    return docDet.length ? { doc_det: docDet } : null;
  }

  return { repairWorksheetRange, buildDocIssue, mergeDocIssues };
});
