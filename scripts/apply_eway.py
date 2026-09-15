from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

if '<sc-if value="{{ ewayOpen }}">' in s:
    print('E-Way Bill card already present')
    raise SystemExit(0)

# Insert service card before GST Reports.
title = '>GST Reports</h3>'
ti = s.find(title)
if ti < 0:
    raise SystemExit('GST Reports anchor missing')
card_start = s.rfind('      <div data-tilt="" style="perspective:900px">', 0, ti)
if card_start < 0:
    raise SystemExit('GST Reports card start missing')
card = '''      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="{{ openEwayModal }}" style="position:relative;height:100%;transform-style:preserve-3d;cursor:pointer;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,rgba(227,181,60,.22),rgba(227,181,60,.06) 60%,rgba(30,35,41,.9));border:1px solid rgba(227,181,60,.45);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:23px;font-weight:700">↗</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">E-Way Bill</h3>
        <p style="margin:0;font-size:var(--fs-body-sm);color:var(--muted-strong);text-wrap:pretty">Prepare a temporary goods-movement working summary without saving customer or transport data.</p>
        <button type="button" class="tx-cta" onclick="{{ openEwayCta }}" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:0;background:transparent;border:0;font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Prepare E-Way Bill<span aria-hidden="true">→</span></button>
      </div></div></div>

'''
s = s[:card_start] + card + s[card_start:]

# Insert modal before GST Payment modal.
modal_anchor = '  <sc-if value="{{ gstPayOpen }}">'
mi = s.find(modal_anchor)
if mi < 0:
    raise SystemExit('GST payment modal anchor missing')
modal = '''  <sc-if value="{{ ewayOpen }}">
    <div role="dialog" aria-modal="true" aria-label="E-Way Bill" onclick="{{ closeEwayModalOutside }}" style="position:fixed;inset:0;z-index:212;display:grid;overflow-y:auto;padding:24px;background:rgba(11,14,17,.58);backdrop-filter:blur(3px);animation:tx-fade var(--dur-base) var(--ease-out) both">
      <div onclick="{{ stopEwayPropagation }}" style="margin:auto;width:min(1180px,100%);max-height:calc(100vh - 48px);overflow-y:auto;background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.015) 48%,rgba(255,255,255,.04)),linear-gradient(0deg,rgba(14,18,23,.82),rgba(14,18,23,.82));-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.16);border-radius:var(--r-card);box-shadow:0 24px 60px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.14);animation:tx-expand 340ms var(--ease-out) both">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-md);padding:var(--card-pad);border-bottom:1px solid var(--hairline-on-dark)">
          <div style="display:grid;gap:4px"><span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">Temporary Working Summary</span><h3 style="margin:0;font-size:18px;font-weight:600;color:var(--on-dark)">E-Way Bill</h3></div>
          <button type="button" aria-label="Close" onclick="{{ closeEwayModal }}" style="width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:transparent;color:var(--muted-strong);font-size:15px;cursor:pointer">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:var(--sp-xl);padding:var(--card-pad)">
          <div style="display:grid;gap:var(--sp-lg);align-content:start">
            <div style="padding:12px 14px;border:1px solid rgba(227,181,60,.28);border-radius:var(--r-md);background:rgba(227,181,60,.055);font-size:var(--fs-caption);color:var(--muted-strong)">Nothing entered here is saved. Closing or refreshing the page clears this E-Way Bill data.</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Supplier GSTIN<input type="text" value="{{ ewaySupplierGstin }}" oninput="{{ setEwaySupplierGstin }}" placeholder="33ABCDE1234F1Z5" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Buyer GSTIN<input type="text" value="{{ ewayBuyerGstin }}" oninput="{{ setEwayBuyerGstin }}" placeholder="Optional for unregistered buyer" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Invoice Number<input type="text" value="{{ ewayInvoiceNo }}" oninput="{{ setEwayInvoiceNo }}" placeholder="INV-001" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Invoice Date<input type="date" value="{{ ewayInvoiceDate }}" onchange="{{ setEwayInvoiceDate }}" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"></label>
            </div>
            <div style="display:grid;gap:10px;padding-top:var(--sp-sm);border-top:1px solid var(--hairline-on-dark)"><span style="font-size:var(--fs-body-sm);font-weight:600;color:var(--on-dark)">Goods</span>
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Product / Description<input type="text" value="{{ ewayProduct }}" oninput="{{ setEwayProduct }}" placeholder="Product description" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              <div style="display:grid;grid-template-columns:1fr .7fr .9fr;gap:10px">
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">HSN / SAC<input type="text" value="{{ ewayHsn }}" oninput="{{ setEwayHsn }}" placeholder="HSN" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Qty<input type="number" min="0" step="0.01" value="{{ ewayQty }}" oninput="{{ setEwayQty }}" placeholder="0" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Taxable Value (₹)<input type="number" min="0" step="0.01" value="{{ ewayValue }}" oninput="{{ setEwayValue }}" placeholder="0.00" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              </div>
            </div>
            <div style="display:grid;gap:10px;padding-top:var(--sp-sm);border-top:1px solid var(--hairline-on-dark)"><span style="font-size:var(--fs-body-sm);font-weight:600;color:var(--on-dark)">Movement / Transport</span>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">From Place<input type="text" value="{{ ewayFrom }}" oninput="{{ setEwayFrom }}" placeholder="Origin" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">To Place<input type="text" value="{{ ewayTo }}" oninput="{{ setEwayTo }}" placeholder="Destination" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Distance (km)<input type="number" min="0" value="{{ ewayDistance }}" oninput="{{ setEwayDistance }}" placeholder="0" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Transport Mode<select value="{{ ewayMode }}" onchange="{{ setEwayMode }}" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"><option value="Road">Road</option><option value="Rail">Rail</option><option value="Air">Air</option><option value="Ship">Ship</option></select></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Vehicle Number<input type="text" value="{{ ewayVehicle }}" oninput="{{ setEwayVehicle }}" placeholder="TN01AB1234" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;text-transform:uppercase"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Transporter<input type="text" value="{{ ewayTransporter }}" oninput="{{ setEwayTransporter }}" placeholder="Transporter name / ID" style="height:42px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              </div>
            </div>
            <button type="button" onclick="{{ downloadEwaySummary }}" style="min-height:46px;padding:0 16px;border-radius:var(--r-md);border:1px solid var(--primary);background:var(--primary);color:var(--on-primary);font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Download E-Way Bill Summary</button>
          </div>
          <div class="ecb3b-3d-wrap" style="position:sticky;top:0;align-self:start"><div class="ecb3b-3d"><div class="ecb3b-3d-surface"><div style="position:relative;display:grid;gap:var(--sp-lg);padding:var(--card-pad)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--on-dark)">E-Way Bill Preview</span><span style="font-size:var(--fs-caption);font-weight:600;color:var(--primary)">Live</span></div>
            <div style="display:flex;justify-content:space-between;gap:20px"><div><div style="font-size:var(--fs-caption);color:var(--muted)">Supplier GSTIN</div><div style="color:var(--body);font-weight:600">{{ ewaySupplierGstinDisplay }}</div></div><div style="text-align:right"><div style="font-size:var(--fs-caption);color:var(--muted)">Buyer GSTIN</div><div style="color:var(--body);font-weight:600">{{ ewayBuyerGstinDisplay }}</div></div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.1);border-radius:var(--r-md);overflow:hidden"><div style="padding:12px;background:rgba(10,14,19,.34)"><span style="color:var(--muted)">Invoice No.</span><div style="color:var(--on-dark);font-weight:600">{{ ewayInvoiceNoDisplay }}</div></div><div style="padding:12px;background:rgba(10,14,19,.34)"><span style="color:var(--muted)">Invoice Date</span><div style="color:var(--on-dark);font-weight:600">{{ ewayInvoiceDateDisplay }}</div></div></div>
            <div style="display:grid;gap:8px"><span style="font-size:var(--fs-body-sm);font-weight:600;color:var(--on-dark)">Goods</span><div style="padding:14px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(10,14,19,.28)"><div style="font-weight:600;color:var(--on-dark)">{{ ewayProductDisplay }}</div><div style="margin-top:6px;font-size:var(--fs-caption);color:var(--muted-strong)">HSN / SAC: {{ ewayHsnDisplay }} · Qty: {{ ewayQtyDisplay }}</div><div style="margin-top:8px;font-size:18px;font-weight:700;color:var(--primary)">₹{{ ewayValueDisplay }}</div></div></div>
            <div style="display:grid;gap:8px"><span style="font-size:var(--fs-body-sm);font-weight:600;color:var(--on-dark)">Movement</span><div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center"><div><div style="font-size:var(--fs-caption);color:var(--muted)">From</div><div style="color:var(--body);font-weight:600">{{ ewayFromDisplay }}</div></div><div style="color:var(--primary)">→</div><div style="text-align:right"><div style="font-size:var(--fs-caption);color:var(--muted)">To</div><div style="color:var(--body);font-weight:600">{{ ewayToDisplay }}</div></div></div></div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div style="padding:10px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md)"><div style="font-size:var(--fs-caption);color:var(--muted)">Mode</div><div style="color:var(--body);font-weight:600">{{ ewayMode }}</div></div><div style="padding:10px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md)"><div style="font-size:var(--fs-caption);color:var(--muted)">Distance</div><div style="color:var(--body);font-weight:600">{{ ewayDistanceDisplay }} km</div></div><div style="padding:10px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md)"><div style="font-size:var(--fs-caption);color:var(--muted)">Vehicle</div><div style="color:var(--body);font-weight:600">{{ ewayVehicleDisplay }}</div></div></div>
            <div style="padding:12px 14px;border:1px solid rgba(227,181,60,.24);border-radius:var(--r-md);background:rgba(227,181,60,.05);font-size:var(--fs-caption);line-height:1.5;color:var(--muted-strong)">This is a Taxora working summary only. No official E-Way Bill number is generated here. Generate the official EWB on the government portal.</div>
          </div></div></div></div>
        </div>
      </div>
    </div>
  </sc-if>

'''
s = s[:mi] + modal + s[mi:]

# Add in-memory state only.
state_anchor = '    gstPayOpen: false,'
si = s.find(state_anchor)
if si < 0:
    raise SystemExit('state anchor missing')
s = s[:si] + '    ewayOpen: false,\n    eway: { supplierGstin:"", buyerGstin:"", invoiceNo:"", invoiceDate:"", product:"", hsn:"", qty:"", value:"", from:"", to:"", distance:"", mode:"Road", vehicle:"", transporter:"" },\n' + s[si:]

# Add helpers before GST payment download helper.
method_anchor = '  downloadGstPaySummary() {'
mm = s.find(method_anchor)
if mm < 0:
    raise SystemExit('method anchor missing')
methods = '''  ewayPatch(key, value) {
    this.setState((p) => ({ eway: Object.assign({}, p.eway || {}, { [key]: value }) }));
  }

  downloadEwaySummary() {
    const e = this.state.eway || {};
    const lines = [
      "TAXORA — E-WAY BILL WORKING SUMMARY",
      "=================================",
      "Supplier GSTIN : " + (e.supplierGstin || "-"),
      "Buyer GSTIN    : " + (e.buyerGstin || "-"),
      "Invoice No.    : " + (e.invoiceNo || "-"),
      "Invoice Date   : " + (e.invoiceDate || "-"),
      "Product        : " + (e.product || "-"),
      "HSN / SAC      : " + (e.hsn || "-"),
      "Qty            : " + (e.qty || "-"),
      "Taxable Value  : Rs. " + (e.value || "0"),
      "From           : " + (e.from || "-"),
      "To             : " + (e.to || "-"),
      "Distance       : " + (e.distance || "0") + " km",
      "Transport Mode : " + (e.mode || "Road"),
      "Vehicle No.    : " + (e.vehicle || "-"),
      "Transporter    : " + (e.transporter || "-"),
      "",
      "Working summary only. Generate the official E-Way Bill on the government portal."
    ];
    const blob = new Blob([lines.join("\\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "E-Way-Bill-Working-Summary-" + (e.invoiceNo || "Draft") + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  }

'''
s = s[:mm] + methods + s[mm:]

# Escape closes the temporary modal too.
escape_old = 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false })'
if escape_old in s:
    s = s.replace(escape_old, 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false, ewayOpen: false })', 1)

# Template props and event handlers.
props_anchor = '      gstPayOpen: s.gstPayOpen,'
pi = s.find(props_anchor)
if pi < 0:
    raise SystemExit('props anchor missing')
props = '''      ewayOpen: s.ewayOpen,
      openEwayModal: () => this.setState({ ewayOpen: true }),
      openEwayCta: (ev) => { ev.stopPropagation(); this.setState({ ewayOpen: true }); },
      closeEwayModal: () => this.setState({ ewayOpen: false }),
      closeEwayModalOutside: (ev) => { if (ev.target === ev.currentTarget) this.setState({ ewayOpen: false }); },
      stopEwayPropagation: (ev) => ev.stopPropagation(),
      ewaySupplierGstin: (s.eway || {}).supplierGstin || "",
      ewayBuyerGstin: (s.eway || {}).buyerGstin || "",
      ewayInvoiceNo: (s.eway || {}).invoiceNo || "",
      ewayInvoiceDate: (s.eway || {}).invoiceDate || "",
      ewayProduct: (s.eway || {}).product || "",
      ewayHsn: (s.eway || {}).hsn || "",
      ewayQty: (s.eway || {}).qty || "",
      ewayValue: (s.eway || {}).value || "",
      ewayFrom: (s.eway || {}).from || "",
      ewayTo: (s.eway || {}).to || "",
      ewayDistance: (s.eway || {}).distance || "",
      ewayMode: (s.eway || {}).mode || "Road",
      ewayVehicle: (s.eway || {}).vehicle || "",
      ewayTransporter: (s.eway || {}).transporter || "",
      ewaySupplierGstinDisplay: (s.eway || {}).supplierGstin || "—",
      ewayBuyerGstinDisplay: (s.eway || {}).buyerGstin || "—",
      ewayInvoiceNoDisplay: (s.eway || {}).invoiceNo || "—",
      ewayInvoiceDateDisplay: (s.eway || {}).invoiceDate || "—",
      ewayProductDisplay: (s.eway || {}).product || "Product description",
      ewayHsnDisplay: (s.eway || {}).hsn || "—",
      ewayQtyDisplay: (s.eway || {}).qty || "—",
      ewayValueDisplay: Number((s.eway || {}).value || 0).toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 }),
      ewayFromDisplay: (s.eway || {}).from || "Origin",
      ewayToDisplay: (s.eway || {}).to || "Destination",
      ewayDistanceDisplay: (s.eway || {}).distance || "0",
      ewayVehicleDisplay: (s.eway || {}).vehicle || "—",
      setEwaySupplierGstin: (ev) => this.ewayPatch("supplierGstin", ev.target.value.toUpperCase()),
      setEwayBuyerGstin: (ev) => this.ewayPatch("buyerGstin", ev.target.value.toUpperCase()),
      setEwayInvoiceNo: (ev) => this.ewayPatch("invoiceNo", ev.target.value),
      setEwayInvoiceDate: (ev) => this.ewayPatch("invoiceDate", ev.target.value),
      setEwayProduct: (ev) => this.ewayPatch("product", ev.target.value),
      setEwayHsn: (ev) => this.ewayPatch("hsn", ev.target.value),
      setEwayQty: (ev) => this.ewayPatch("qty", ev.target.value),
      setEwayValue: (ev) => this.ewayPatch("value", ev.target.value),
      setEwayFrom: (ev) => this.ewayPatch("from", ev.target.value),
      setEwayTo: (ev) => this.ewayPatch("to", ev.target.value),
      setEwayDistance: (ev) => this.ewayPatch("distance", ev.target.value),
      setEwayMode: (ev) => this.ewayPatch("mode", ev.target.value),
      setEwayVehicle: (ev) => this.ewayPatch("vehicle", ev.target.value.toUpperCase()),
      setEwayTransporter: (ev) => this.ewayPatch("transporter", ev.target.value),
      downloadEwaySummary: () => this.downloadEwaySummary(),
'''
s = s[:pi] + props + s[pi:]

p.write_text(s, encoding='utf-8')
print('E-Way Bill workspace patched')
