from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

script_anchor = '<script src="./master-report.js"></script>'
if 'gst-validators.js' not in s:
    if script_anchor not in s:
        raise SystemExit('Script anchor not found')
    s = s.replace(script_anchor, script_anchor + '\n<script type="module" src="./gst-validators.js"></script>', 1)

cards = '''
      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="window.TaxoraValidatorUI && window.TaxoraValidatorUI.openGSTIN()" style="position:relative;height:100%;transform-style:preserve-3d;cursor:pointer;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,rgba(227,181,60,.22),rgba(227,181,60,.06) 60%,rgba(30,35,41,.9));border:1px solid rgba(227,181,60,.45);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:20px;font-weight:700">ID</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">GSTIN Validator</h3>
        <p style="margin:0;font-size:var(--fs-body-sm);color:var(--muted-strong);text-wrap:pretty">Check GSTIN length, state code, PAN portion and structural format before using it in invoices or returns.</p>
        <button type="button" class="tx-cta" onclick="event.stopPropagation();window.TaxoraValidatorUI && window.TaxoraValidatorUI.openGSTIN()" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:0;background:transparent;border:0;font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Validate GSTIN<span aria-hidden="true">→</span></button>
      </div></div></div>

      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="window.TaxoraValidatorUI && window.TaxoraValidatorUI.openInvoices()" style="position:relative;height:100%;transform-style:preserve-3d;cursor:pointer;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,rgba(227,181,60,.22),rgba(227,181,60,.06) 60%,rgba(30,35,41,.9));border:1px solid rgba(227,181,60,.45);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:21px;font-weight:700">#</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">Invoice Number Checker</h3>
        <p style="margin:0;font-size:var(--fs-body-sm);color:var(--muted-strong);text-wrap:pretty">Paste invoice numbers and check GST format issues, duplicates and simple numeric sequence gaps.</p>
        <button type="button" class="tx-cta" onclick="event.stopPropagation();window.TaxoraValidatorUI && window.TaxoraValidatorUI.openInvoices()" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:0;background:transparent;border:0;font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Check Numbers<span aria-hidden="true">→</span></button>
      </div></div></div>

'''

eway_card_anchor = '<div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="{{ openEwayModal }}"'
if 'GSTIN Validator</h3>' not in s:
    if eway_card_anchor not in s:
        raise SystemExit('E-Way card anchor not found')
    s = s.replace(eway_card_anchor, cards + '      ' + eway_card_anchor, 1)

modals = '''
  <div id="taxora-gstin-modal" role="dialog" aria-modal="true" aria-label="GSTIN Validator" onclick="if(event.target===this)window.TaxoraValidatorUI.closeGSTIN()" style="display:none;position:fixed;inset:0;z-index:216;overflow-y:auto;padding:24px;background:rgba(11,14,17,.68);backdrop-filter:blur(3px)">
    <div style="margin:auto;width:min(760px,calc(100vw - 32px));background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.015) 48%,rgba(255,255,255,.04)),linear-gradient(0deg,rgba(14,18,23,.96),rgba(14,18,23,.96));border:1px solid rgba(255,255,255,.16);border-radius:var(--r-card);box-shadow:0 24px 60px rgba(0,0,0,.52)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px;border-bottom:1px solid var(--hairline-on-dark)">
        <div><div style="font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">Free GST Tool</div><h3 style="margin:4px 0 0;font-size:20px;color:var(--on-dark)">GSTIN Validator</h3></div>
        <button type="button" aria-label="Close" onclick="window.TaxoraValidatorUI.closeGSTIN()" style="width:40px;height:40px;border:1px solid var(--hairline-on-dark);border-radius:6px;background:transparent;color:var(--muted-strong);cursor:pointer">✕</button>
      </div>
      <div style="display:grid;gap:20px;padding:24px">
        <div style="font-size:13px;line-height:1.6;color:var(--muted-strong);padding:12px 14px;border:1px solid rgba(227,181,60,.25);border-radius:8px;background:rgba(227,181,60,.05)">Checks GSTIN format and structure only. It does not confirm whether a GST registration is active on the Government GST Portal. Nothing entered here is saved.</div>
        <div><label for="taxora-gstin-input" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--body)">GSTIN</label><input id="taxora-gstin-input" maxlength="15" autocomplete="off" placeholder="Example: 33ABCDE1234F1Z5" oninput="this.value=this.value.toUpperCase()" style="width:100%;height:48px;padding:0 14px;border:1px solid var(--hairline-on-dark);border-radius:8px;background:#0B0E11;color:var(--body);font:inherit;box-sizing:border-box"></div>
        <button type="button" onclick="window.TaxoraValidatorUI.validateGSTIN()" style="height:48px;border:0;border-radius:8px;background:var(--primary);color:var(--on-primary);font:600 14px var(--font-sans);cursor:pointer">Validate GSTIN</button>
        <div id="taxora-gstin-result" style="display:none;gap:12px;padding:18px;border:1px solid var(--hairline-on-dark);border-radius:10px;background:rgba(255,255,255,.025)">
          <div id="taxora-gstin-status" style="font-size:16px;font-weight:700"></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
            <div><small style="color:var(--muted)">Normalized GSTIN</small><div id="taxora-gstin-normalized" style="font-weight:600;word-break:break-all"></div></div>
            <div><small style="color:var(--muted)">State</small><div id="taxora-gstin-state" style="font-weight:600"></div></div>
            <div><small style="color:var(--muted)">PAN portion</small><div id="taxora-gstin-pan" style="font-weight:600"></div></div>
            <div><small style="color:var(--muted)">Entity code</small><div id="taxora-gstin-entity" style="font-weight:600"></div></div>
          </div>
          <div id="taxora-gstin-errors" style="font-size:13px;line-height:1.6;color:var(--muted-strong)"></div>
        </div>
        <div style="font-size:13px;line-height:1.6;color:var(--muted-strong)"><strong style="color:var(--body)">What this checks:</strong> 15-character length, state-code position, PAN pattern, entity position, the standard Z position and final checksum-character structure.</div>
      </div>
    </div>
  </div>

  <div id="taxora-invoice-modal" role="dialog" aria-modal="true" aria-label="Invoice Number Checker" onclick="if(event.target===this)window.TaxoraValidatorUI.closeInvoices()" style="display:none;position:fixed;inset:0;z-index:216;overflow-y:auto;padding:24px;background:rgba(11,14,17,.68);backdrop-filter:blur(3px)">
    <div style="margin:auto;width:min(820px,calc(100vw - 32px));background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.015) 48%,rgba(255,255,255,.04)),linear-gradient(0deg,rgba(14,18,23,.96),rgba(14,18,23,.96));border:1px solid rgba(255,255,255,.16);border-radius:var(--r-card);box-shadow:0 24px 60px rgba(0,0,0,.52)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px;border-bottom:1px solid var(--hairline-on-dark)">
        <div><div style="font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">Free GST Tool</div><h3 style="margin:4px 0 0;font-size:20px;color:var(--on-dark)">Invoice Number Checker</h3></div>
        <button type="button" aria-label="Close" onclick="window.TaxoraValidatorUI.closeInvoices()" style="width:40px;height:40px;border:1px solid var(--hairline-on-dark);border-radius:6px;background:transparent;color:var(--muted-strong);cursor:pointer">✕</button>
      </div>
      <div style="display:grid;gap:20px;padding:24px">
        <div style="font-size:13px;line-height:1.6;color:var(--muted-strong);padding:12px 14px;border:1px solid rgba(227,181,60,.25);border-radius:8px;background:rgba(227,181,60,.05)">Paste one invoice number per line or separate them with commas. This checker does not compare your invoices with GST Portal records. Nothing entered here is saved.</div>
        <div><label for="taxora-invoice-input" style="display:block;margin-bottom:8px;font-size:13px;font-weight:600;color:var(--body)">Invoice Numbers</label><textarea id="taxora-invoice-input" rows="7" placeholder="INV-001&#10;INV-002&#10;INV-004" style="width:100%;padding:12px 14px;border:1px solid var(--hairline-on-dark);border-radius:8px;background:#0B0E11;color:var(--body);font:inherit;resize:vertical;box-sizing:border-box"></textarea></div>
        <button type="button" onclick="window.TaxoraValidatorUI.checkInvoices()" style="height:48px;border:0;border-radius:8px;background:var(--primary);color:var(--on-primary);font:600 14px var(--font-sans);cursor:pointer">Check Invoice Numbers</button>
        <div id="taxora-invoice-result" style="display:none;gap:12px;padding:18px;border:1px solid var(--hairline-on-dark);border-radius:10px;background:rgba(255,255,255,.025)">
          <div id="taxora-invoice-status" style="font-size:16px;font-weight:700"></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px"><div><small style="color:var(--muted)">Entered</small><div id="taxora-invoice-count" style="font-size:20px;font-weight:700">0</div></div><div><small style="color:var(--muted)">Duplicates</small><div id="taxora-invoice-duplicates" style="font-weight:600">None</div></div><div><small style="color:var(--muted)">Sequence gaps</small><div id="taxora-invoice-gaps" style="font-weight:600">None</div></div></div>
          <div><small style="color:var(--muted)">Invalid format</small><div id="taxora-invoice-invalid" style="font-size:13px;line-height:1.6;color:var(--muted-strong)">None</div></div>
        </div>
        <div style="font-size:13px;line-height:1.6;color:var(--muted-strong)"><strong style="color:var(--body)">What this checks:</strong> maximum 16 characters, letters/numbers with / or -, repeated invoice numbers, and simple missing numbers when one common numeric sequence is detected.</div>
      </div>
    </div>
  </div>

'''

modal_anchor = '  <sc-if value="{{ ewayOpen }}">'
if 'id="taxora-gstin-modal"' not in s:
    if modal_anchor not in s:
        raise SystemExit('E-Way modal anchor not found')
    s = s.replace(modal_anchor, modals + modal_anchor, 1)

required = [
    'gst-validators.js',
    'GSTIN Validator</h3>',
    'Invoice Number Checker</h3>',
    'id="taxora-gstin-modal"',
    'id="taxora-invoice-modal"',
    'TaxoraValidatorUI.openGSTIN',
    'TaxoraValidatorUI.openInvoices'
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('Missing after patch: ' + ', '.join(missing))

p.write_text(s, encoding='utf-8')
print('GST validator cards patched successfully')
