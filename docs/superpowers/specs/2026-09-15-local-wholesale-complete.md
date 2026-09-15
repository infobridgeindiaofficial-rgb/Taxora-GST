# Local / Wholesale GST Complete Workflow Spec

## Goal
Turn `local-wholesale-gst.html` into a complete, browser-local GST preparation workspace for regular local and wholesale businesses.

## Scope
The page must provide working Business Setup, Sales Register, Purchase Register, GSTR-2B/IMS match status, eligible ITC calculation, period filtering, monthly dashboard, GSTR-1 working summary, GSTR-3B working summary, and JSON/CSV/Excel-compatible exports.

## Data model
All data remains browser-local in `localStorage`. Business setup, sales invoices, purchase invoices, and selected period use Taxora-specific keys. No cloud save and no direct government-portal filing.

## GST logic
- Seller state comes from Business Setup.
- Sales with Place of Supply equal to seller state use CGST + SGST; otherwise IGST.
- B2B is determined by valid customer GSTIN presence; blank GSTIN is B2C.
- Purchase tax is split by supplier state vs seller state.
- Purchase ITC is eligible only when the purchase is marked `Available in GSTR-2B` and `ITC Eligible`.
- GSTR-1 working summary groups period sales into B2B, B2C, intra-state/inter-state totals and HSN totals.
- GSTR-3B working summary computes outward taxable value/tax, eligible ITC, and estimated net tax after ITC by tax head. It is preparation guidance, not filing.

## UX
Keep the current Taxora black/gold glass system. Provide one visible workflow navigation bar: Setup, Sales, Purchases, ITC, Returns. Every register supports add, edit, delete, validation, and empty states. Period filter controls all summaries and exports.

## Exports
Provide downloads for JSON, CSV, and Excel-compatible SpreadsheetML `.xls` without external dependencies.

## Safety / copy
Clearly label GSTR-1 and GSTR-3B outputs as working summaries and state that official filing must be completed on the GST portal. Do not claim portal submission.

## Acceptance
- No placeholder buttons.
- No broken controls.
- Business setup persists.
- Sales and purchases persist and can be edited/deleted.
- GST split calculations are deterministic and tested.
- ITC follows 2B + eligibility flags.
- Period summary and return summaries update from saved records.
- JSON, CSV and Excel-compatible exports produce downloadable content.
- Core calculations have automated Node tests.