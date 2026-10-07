# GSTR-1 generator changes and validation

## Existing flow and root causes

The two active application pages are `index.html` (served entry) and `TAXORA GST.dc.html` (editable source). They load the same helper scripts. Uploaded reports are read with SheetJS. Meesho TCS sales/return rows are transactions; Amazon and Flipkart workbooks already contain GST summary sections. Marketplace parser results feed the combined preview, JSON download and Excel workbook builder. `tax-invoice-parser.js` supplies Meesho Table 13 document ranges. Archived pages under `uploads/` are not active application entry points and were left unchanged.

1. **Missing HSN JSON:** `meeshoJson`, `amazonJson` and `combinedJson` never added their existing `res.hsn` data. The standalone Flipkart exporter emitted a raw array with internal application field names instead of the GST HSN table structure. Excel consumed `res.hsn`, which explains why its HSN sheet and the UI line count existed while combined JSON had no HSN section.
2. **Mandatory Meesho returns:** three separate places required the return file: the button-readiness predicate, `runMeesho` file validation/read, and `parseMeeshoFiles` header validation against `returnRows[0]`. An absent file therefore failed before generation.
3. **No quarterly mode:** the form held one month and one set of uploads. Marketplace runners validated against that month, and the merger rejected differing filing periods. There was no quarter intake or monthly breakdown.
4. **Rounding discrepancy:** Meesho independently accumulated unrounded source amounts into POS/rate/transaction-type B2CS groups, HSN/rate groups, and ETIN groups, then rounded each group. The preview summed rounded B2CS values. HSN and ECO used different rounding boundaries. In general, the sum of rounded subgroups does not equal the rounded total. Splitting tax before independently rounding groups compounds this. There is no 0.03 correction in the fix. The exact September source files are absent, so the particular 0.03 difference was not replayed against the user's original transactions.

A further test-discovered issue was that Flipkart's intra-state parser used only CGST % as the full GST rate. It now adds CGST % and SGST %, so 9% + 9% is classified as an 18% supply.

## Files changed

| File | Change |
|---|---|
| `gstr1-core.js` | New shared decimal normalization, grouping, consolidation, HSN/JSON serialization and supported-section structural checks. |
| `index.html` | Connect shared calculation/export; optional returns; monthly/quarterly form, per-month files, preview and Excel breakdown; preserve HSN units/Cess; correct Flipkart intra-state rate. |
| `TAXORA GST.dc.html` | Same scoped generator changes in editable source; preserve unrelated differences between this page and the served entry. |
| `tests/gstr1-generator.test.cjs` | 23 regression tests exercising actual component methods in both pages and the shared core. |
| `.github/workflows/test-gstr1.yml` | CI runs generator, existing invoice-document and master-workbook regressions. |
| `docs/gstr1-generator-validation.md` | This report. |

Pre-existing PDF edits, the untracked PDF regression, and `Claude outputs/` were not modified.

## Exact calculation and export logic

- Meesho source lines become signed normalized transactions. Sales have positive sign, returns negative sign; an absent return report produces an empty array, never an invented transaction. A supplied malformed or empty report remains an error.
- Monetary source values are rounded to two decimals once with decimal half-away-from-zero rounding, then summed as integer paise. For intra-state tax, the rounded total tax is split into CGST and SGST: CGST gets the rounded half, SGST the remaining paise. This preserves total source tax when an odd paisa cannot be divided equally. Inter-state tax is IGST. Cess is independent and preserved. Quantity uses three decimals.
- B2CS grouping uses supply type, POS, full GST rate and GST type. HSN grouping uses HSN, full GST rate, UQC and B2B/B2C category. ECO grouping uses ETIN. The preview and all export adapters consume this same normalized result.
- All four JSON adapters use one serializer. Current periods emit `hsn: { hsn_b2b: [...], hsn_b2c: [...] }`; periods before May 2025 emit `hsn: { data: [...] }`. Entries map existing calculated values to `num`, `hsn_sc`, `uqc`, `qty`, `rt`, `txval`, `iamt`, `camt`, `samt`, `csamt`; older entries also carry `val`. Existing B2CS, ECO, document and invoice field names remain unchanged.
- Native Amazon HSN UQC and Cess are retained rather than discarded. Flipkart reads UQC/rate where present, retaining its existing inferred-rate fallback when the report has no rate column. HSN Excel sheets append Cess, UQC and supply category without moving existing numeric columns.
- Flipkart ECO liability now uses its normalized B2CS amounts. The previous conditional override from Section 3 of GSTR-8 could substitute values differing by a paisa; it no longer changes generated liability amounts.
- For summary-only B2C reports, conflicting HSN and B2CS amounts block combined generation with the specific discrepancy. The generator cannot derive a valid transaction-to-HSN allocation from conflicting summary sections, so it does not manufacture an adjustment.
- Quarterly selection uses an Indian financial year starting in April. Apr–Jun, Jul–Sep and Oct–Dec use that starting calendar year; Jan–Mar uses the following calendar year. Defaults are calculated from the current browser date, with no fixed sample year.
- Each quarter month has its own report files. Existing runners validate each month's files in isolated state. Consolidation rebuilds Meesho groups from normalized transactions; Amazon/Flipkart contribute their normalized native GST report lines. No exported JSON is parsed or concatenated. JSON `fp` is the quarter-ending month.
- Each month's canonical summary and the quarter total appear in the preview; Excel adds `Monthly_Totals`. Document categories and source ranges are preserved and document rows renumbered. Overlapping ranges block a quarter instead of merging unrelated endpoints or double-counting ranges.
- Month/mode/GSTIN/upload changes invalidate stale results. Form inputs freeze during generation. Quarter reports do not silently inherit monthly-upload files. Optional return files can be removed independently.
- Local structural validation checks supported JSON sections, tax-head/supply-type alignment, monetary precision, HSN grouping uniqueness and document counts before the combined result is accepted.

## Tests and results

`node --test tests/gstr1-generator.test.cjs` — **23 passed, 0 failed**. A controlled seven-POS fixture reproduces the old taxable/IGST discrepancies of three paise in opposite directions, then verifies the normalized calculation eliminates them without an adjustment. It is not a replay of the unavailable September source files.

| Required case | Tested result |
|---|---|
| A: Meesho sales + returns | Signed netting and document categories pass, including uploaded returns through quarterly runners. |
| B: sales without returns file | Readiness remains enabled; return reader is never called; zero return rows, no synthetic transactions. |
| C: monthly GSTR-1 | Existing monthly flow produces canonical results and JSON/Excel. |
| D: three-month quarterly GSTR-1 | July, August and September combine into one result with `fp: 092026`. |
| E: quarter months with zero returns | July/September omit returns; August includes a return. All-three-month returns are also tested. |
| F: 5% and 18% products | Separate HSN/rate groups retained. |
| G: intra-state 18% | CGST 9% + SGST 9%; Flipkart's full-rate field tested independently. |
| H: inter-state | IGST used; CGST/SGST remain zero. |
| I: HSN in Excel and JSON | Actual workbook builders and all marketplace JSON adapters tested. |
| J: exact reconciliation | Integer-paise sums match UI bindings, workbook cells, JSON B2CS/HSN/ECO, and monthly/quarter summaries. Fractional inputs, signed decimal ties, odd-paisa splits, two ETINs, units and Cess covered. |
| K: existing imports | Real Amazon/Flipkart parser methods run on representative workbook fixtures; multi-marketplace monthly and quarterly consolidation passes. Local/wholesale regressions also pass. |

Additional tests check malformed supplied returns, missing sales/invoices, wrong filing month, all four quarter calendars, return of a prior-month sale, duplicate document ranges, cancellation to zero, conflicting source summaries, stale previews, platform-specific Excel workbooks and the local JSON structure contract.

`node --test tests/gstr1-generator.test.cjs uploads/TAXORA-GST-NEW-DESIGN/tests/tax-invoice.test.cjs uploads/TAXORA-GST-NEW-DESIGN/tests/master-report.test.cjs` — **41 passed, 0 failed**. Existing master-workbook tests include ZIP/XML validation and workbook read-back. The new generator workbook checks exercise SheetJS-compatible worksheet objects; they do not test a real browser/CDN download or binary SheetJS serialization.

`node --check gstr1-core.js` and `git diff --check` pass.

Broader regression runs found two unrelated failures:

- `tests/seo-regression.test.js` requires `index.html` and the editable page to be byte-identical. `git show HEAD:index.html` and `git show HEAD:TAXORA GST.dc.html` are already different, before these edits. Their unrelated differences were preserved.
- The pre-existing untracked `tests/pdf-segregator-global-selection-regression.mjs` fails against the pre-existing PDF edits. No PDF files were changed for this task.

Other executed local/wholesale, E-Way Bill, interest/late-fee, service-card, PDF detector/card and master/invoice-document regressions pass.

Before publishing, the branch was rebased onto the three existing upstream `main` commits. Those already-published homepage/PDF changes resolved the two broader failures above. The full regression run against the integrated commit passed **60 tests, 0 failed**. GSTR-1 calculation/export logic was unchanged by the rebase. The new regression fixture's seller GSTIN was replaced with a synthetic format-valid identifier before committing; customer reports and unrelated local PDF edits were excluded.

## GST format references and remaining assumptions

GSTN's [GSTR-1 guide](https://tutorial.gst.gov.in/userguide/returns/Creation_of_Outward_Supplies_Return_in_GSTR-1.htm) specifies separate B2B/B2C HSN tables from May 2025 and uniqueness by HSN, UQC and rate. GSTN's [offline-tool manual](https://tutorial.gst.gov.in/downloads/invoiceuploadofflineutility.pdf) specifies selecting the quarter-ending month and including invoices from all three months. These were checked while implementing the exporter.

- **Portal acceptance is not certified.** The GST developer schema endpoints returned retrieval errors/403, and the official offline-utility archive could not be downloaded in this environment. Local supported-section structure checks and official published guidance are verified; a full authoritative machine-schema validation and a GST portal upload were not performed. Existing B2B/B2CL/note serialization was intentionally preserved and is outside the new structural checks.
- **Real September validation:** the user subsequently confirmed that generated UI, Excel and JSON totals reconcile, HSN appears in JSON, and documents issued are generated. No real customer identifiers, source reports or generated customer amounts are stored in these new tests or this report. Automated regressions use synthetic transactions and identifiers.
- **Browser/download verification remains outstanding.** The enabled computer-use inventory had no browser; creating an in-app browser was unavailable. Both component scripts compile and actual form bindings/workbook builders are tested, but rendered styling and real file downloads were not visually verified.
- **Marketplace assumptions:** Meesho return values are interpreted using the existing positive-return-report convention and negated once. Its Tax Invoice Details file remains required for Table 13. UQC defaults to `NOS` when the source has no unit. Existing Amazon/Flipkart aggregate HSN imports are treated as B2C; mixed registered/unregistered HSN summaries require a reliable B2B/B2C split before filing. The core supports that grouping, but the existing unsplit report formats do not supply enough information to infer it safely. Original Amazon report date/period checks are unchanged, so files must be assigned to the correct month slot; Meesho's existing numeric `financial_year`/`month_number` period interpretation is retained.
- **Quarter eligibility/IFF:** quarterly selection does not enroll a GSTIN in QRMP or query portal eligibility. Users must select their actual filing frequency and avoid re-reporting invoices already furnished through IFF. Source document gap/cancellation conventions remain those of the existing document parser; quarterly consolidation preserves the ranges and rejects detected overlaps.
