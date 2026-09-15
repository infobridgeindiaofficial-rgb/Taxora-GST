# Local / Wholesale GST Complete Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete browser-local Local / Wholesale GST preparation workspace with working registers, ITC, returns summaries, and exports.

**Architecture:** Keep the page static and dependency-free. Move deterministic GST calculations/export builders into `local-wholesale-gst-core.js`, keep DOM/localStorage orchestration in `local-wholesale-gst.html`, and verify the pure core with Node's built-in test runner.

**Tech Stack:** HTML, CSS, vanilla JavaScript, localStorage, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-15-local-wholesale-complete.md`

## Global Constraints
- Preserve Taxora black/gold glass visual system.
- Browser-local storage only; no cloud persistence.
- No direct GST portal filing claim.
- No external runtime dependency for exports.
- Official-filing disclaimer must remain visible in Returns.

---

### Task 1: GST calculation core
**Files:** Create `local-wholesale-gst-core.js`; Test `tests/local-wholesale-gst-core.test.js`.

- [ ] Write failing tests for state tax split, ITC eligibility, period filtering, GSTR-1 aggregation, GSTR-3B aggregation, CSV, and SpreadsheetML generation.
- [ ] Run `node --test tests/local-wholesale-gst-core.test.js` and verify failure before implementation.
- [ ] Implement pure functions: `financialYearFromDate`, `periodFromDate`, `computeTaxSplit`, `summarizeSales`, `summarizePurchases`, `buildGstr1Summary`, `buildGstr3bSummary`, `toCsv`, `toSpreadsheetXml`.
- [ ] Run the Node test file and verify all tests pass.

### Task 2: Complete UI and persistence
**Files:** Replace `local-wholesale-gst.html`.

- [ ] Build workflow nav, Business Setup, Sales, Purchases, ITC, and Returns sections.
- [ ] Wire localStorage keys for setup/sales/purchases/period.
- [ ] Add validation, duplicate invoice checks, add/edit/delete for sales and purchases.
- [ ] Add 2B status and ITC eligibility to purchases.
- [ ] Bind period filter to dashboard, ITC, GSTR-1, and GSTR-3B working summaries.
- [ ] Add JSON, CSV and Excel-compatible `.xls` download actions.
- [ ] Include clear official-filing disclaimer.

### Task 3: Static integration regression
**Files:** Create `tests/local-wholesale-page.test.js`.

- [ ] Assert required sections, IDs, storage keys, core script, return labels, export buttons, and disclaimer exist.
- [ ] Run `node --test tests/local-wholesale-gst-core.test.js tests/local-wholesale-page.test.js`.
- [ ] Verify all tests pass.

### Task 4: Branch verification and integration
**Files:** No product-file changes unless verification exposes a defect.

- [ ] Re-fetch branch files and inspect critical logic/copy.
- [ ] Run automated tests in GitHub Actions or another available execution path.
- [ ] Only after green verification, fast-forward `main` to the verified feature branch commit.
- [ ] Re-fetch `main` and confirm the completed page/core/tests are present.