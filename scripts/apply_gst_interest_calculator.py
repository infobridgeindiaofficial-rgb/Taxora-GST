from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

if 'gstCalcOpen' in s:
    print('GST Interest & Late Fee Calculator already present')
    raise SystemExit(0)

# 1) Service card: place immediately before E-Way Bill.
title = '>E-Way Bill</h3>'
ti = s.find(title)
if ti < 0:
    raise SystemExit('E-Way Bill card title anchor missing')
card_start = s.rfind('      <div data-tilt="" style="perspective:900px">', 0, ti)
if card_start < 0:
    raise SystemExit('E-Way Bill card start missing')
card = '''      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="{{ openGstCalcModal }}" style="position:relative;height:100%;transform-style:preserve-3d;cursor:pointer;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,rgba(227,181,60,.22),rgba(227,181,60,.06) 60%,rgba(30,35,41,.9));border:1px solid rgba(227,181,60,.45);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:23px;font-weight:700">%</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">GST Interest &amp; Late Fee Calculator</h3>
        <p style="margin:0;font-size:var(--fs-body-sm);color:var(--muted-strong);text-wrap:pretty">Estimate delay days, interest and late fee before filing a delayed GSTR-1 or GSTR-3B.</p>
        <button type="button" class="tx-cta" onclick="{{ openGstCalcCta }}" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:0;background:transparent;border:0;font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Calculate Now<span aria-hidden="true">→</span></button>
      </div></div></div>

'''
s = s[:card_start] + card + s[card_start:]

# 2) Modal: insert before E-Way Bill modal.
modal_anchor = '  <sc-if value="{{ ewayOpen }}">'
mi = s.find(modal_anchor)
if mi < 0:
    raise SystemExit('E-Way Bill modal anchor missing')
modal = '''  <sc-if value="{{ gstCalcOpen }}">
    <div role="dialog" aria-modal="true" aria-label="GST Interest and Late Fee Calculator" onclick="{{ closeGstCalcModalOutside }}" style="position:fixed;inset:0;z-index:214;display:grid;overflow-y:auto;padding:24px;background:rgba(11,14,17,.58);backdrop-filter:blur(3px);animation:tx-fade var(--dur-base) var(--ease-out) both">
      <div onclick="{{ stopGstCalcPropagation }}" style="margin:auto;width:min(1260px,calc(100vw - 32px));max-height:calc(100vh - 48px);overflow-y:auto;background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.015) 48%,rgba(255,255,255,.04)),linear-gradient(0deg,rgba(14,18,23,.82),rgba(14,18,23,.82));-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.16);border-radius:var(--r-card);box-shadow:0 24px 60px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.14);animation:tx-expand 340ms var(--ease-out) both">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-md);padding:var(--card-pad);border-bottom:1px solid var(--hairline-on-dark)">
          <div style="display:grid;gap:4px"><span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">Temporary Estimate</span><h3 style="margin:0;font-size:18px;font-weight:600;color:var(--on-dark)">GST Interest &amp; Late Fee Calculator</h3></div>
          <button type="button" aria-label="Close" onclick="{{ closeGstCalcModal }}" style="width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:transparent;color:var(--muted-strong);font-size:15px;cursor:pointer">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;padding:var(--card-pad);align-items:start">
          <div style="display:grid;gap:var(--sp-lg);align-content:start;min-width:0">
            <div style="padding:12px 14px;border:1px solid rgba(227,181,60,.28);border-radius:var(--r-md);background:rgba(227,181,60,.055);font-size:var(--fs-caption);line-height:1.5;color:var(--muted-strong)">Nothing entered here is saved. Closing or refreshing the page clears this calculator.</div>
            <div style="display:grid;gap:12px">
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Return Type<select value="{{ gstCalcReturnType }}" onchange="{{ setGstCalcReturnType }}" style="width:100%;min-width:0;box-sizing:border-box;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"><option value="GSTR-3B">GSTR-3B</option><option value="GSTR-1">GSTR-1</option></select></label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong);min-width:0">Due Date<input type="date" value="{{ gstCalcDueDate }}" onchange="{{ setGstCalcDueDate }}" style="width:100%;min-width:0;box-sizing:border-box;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"></label>
                <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong);min-width:0">Actual Filing Date<input type="date" value="{{ gstCalcFilingDate }}" onchange="{{ setGstCalcFilingDate }}" style="width:100%;min-width:0;box-sizing:border-box;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"></label>
              </div>
              <label style="display:grid;gap:6px;font-size:var(--fs-caption);color:var(--muted-strong)">Tax Payable in Cash (₹)<input type="number" min="0" step="0.01" value="{{ gstCalcTaxPayable }}" oninput="{{ setGstCalcTaxPayable }}" placeholder="0.00" style="width:100%;min-width:0;box-sizing:border-box;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></label>
              <label style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:var(--canvas-dark);font-size:var(--fs-body-sm);color:var(--body);cursor:pointer"><input type="checkbox" checked="{{ gstCalcIsNil }}" onchange="{{ setGstCalcIsNil }}" style="width:16px;height:16px;accent-color:var(--primary)"><span>NIL return / NIL liability</span></label>
            </div>
            <button type="button" onclick="{{ downloadGstCalcSummary }}" style="min-height:46px;padding:0 16px;border-radius:var(--r-md);border:1px solid var(--primary);background:var(--primary);color:var(--on-primary);font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Download Calculation Summary</button>
          </div>

          <div class="ecb3b-3d-wrap" style="position:sticky;top:0;align-self:start;min-width:0;width:100%"><div class="ecb3b-3d" style="transform:none;width:100%;max-width:100%"><div class="ecb3b-3d-surface" style="width:100%;max-width:100%;box-sizing:border-box"><div style="position:relative;display:grid;gap:var(--sp-lg);padding:var(--card-pad)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--on-dark)">Late Filing Estimate</span><span style="font-size:var(--fs-caption);font-weight:600;color:var(--primary)">Live</span></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">Return</div><div style="font-size:17px;font-weight:700;color:var(--body)">{{ gstCalcReturnType }}</div></div>
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">Days Delayed</div><div style="font-size:17px;font-weight:700;color:var(--body)">{{ gstCalcDelayDays }}</div></div>
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">Due Date</div><div style="font-size:14px;font-weight:600;color:var(--body)">{{ gstCalcDueDateDisplay }}</div></div>
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">Filing Date</div><div style="font-size:14px;font-weight:600;color:var(--body)">{{ gstCalcFilingDateDisplay }}</div></div>
            </div>
            <div style="display:grid;gap:8px">
              <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="color:var(--muted-strong)">Interest rate</span><strong>{{ gstCalcInterestRate }}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="color:var(--muted-strong)">Estimated Interest</span><strong>₹{{ gstCalcInterest }}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="color:var(--muted-strong)">Late fee / day</span><strong>₹{{ gstCalcLateFeePerDay }}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0"><span style="color:var(--muted-strong)">Estimated Late Fee</span><strong>₹{{ gstCalcLateFee }}</strong></div>
            </div>
            <div style="padding:14px;border:1px solid rgba(227,181,60,.3);border-radius:var(--r-md);background:rgba(227,181,60,.075)"><div style="font-size:var(--fs-caption);color:var(--muted-strong)">Estimated Total Extra Payable</div><div style="margin-top:4px;font-size:26px;font-weight:700;color:var(--primary)">₹{{ gstCalcTotalExtra }}</div></div>
            <div style="padding:12px 14px;border:1px solid rgba(227,181,60,.24);border-radius:var(--r-md);background:rgba(227,181,60,.05);font-size:var(--fs-caption);line-height:1.55;color:var(--muted-strong)">Working estimate only. Actual GST portal amount can differ because of statutory caps, notifications, relief, taxpayer category, return period and portal interest computation. From January 2026, GSTR-3B portal interest computation can also consider the minimum Electronic Cash Ledger balance.</div>
          </div></div></div></div>
        </div>
      </div>
    </div>
  </sc-if>

'''
s = s[:mi] + modal + s[mi:]

# 3) In-memory state only.
state_anchor = '    gstPayOpen: false,'
si = s.find(state_anchor)
if si < 0:
    raise SystemExit('GST payment state anchor missing')
s = s[:si] + '    gstCalcOpen: false,\n    gstCalc: { returnType:"GSTR-3B", dueDate:"", filingDate:"", taxPayable:"", isNil:false },\n' + s[si:]

# 4) Calculator methods before a stable existing GSTR-3B helper.
method_anchor = '  ecb3bNum(v) {'
mm = s.find(method_anchor)
if mm < 0:
    raise SystemExit('GSTR-3B helper anchor missing')
methods = '''  gstCalcPatch(key, value) {
    this.setState((p) => ({ gstCalc: Object.assign({}, p.gstCalc || {}, { [key]: value }) }));
  }

  gstCalcState() { return (this.state && this.state.gstCalc) || {}; }

  gstCalcDelayDaysValue() {
    const c = this.gstCalcState();
    if (!c.dueDate || !c.filingDate) return 0;
    const due = new Date(c.dueDate + "T00:00:00Z");
    const filed = new Date(c.filingDate + "T00:00:00Z");
    if (!isFinite(due.getTime()) || !isFinite(filed.getTime())) return 0;
    return Math.max(0, Math.floor((filed.getTime() - due.getTime()) / 86400000));
  }

  gstCalcInterestValue() {
    const c = this.gstCalcState();
    if ((c.returnType || "GSTR-3B") !== "GSTR-3B" || c.isNil) return 0;
    const tax = Math.max(0, parseFloat(c.taxPayable) || 0);
    return tax * 0.18 * this.gstCalcDelayDaysValue() / 365;
  }

  gstCalcLateFeePerDayValue() {
    return this.gstCalcState().isNil ? 20 : 50;
  }

  gstCalcLateFeeValue() {
    return this.gstCalcDelayDaysValue() * this.gstCalcLateFeePerDayValue();
  }

  gstCalcMoney(v) {
    const n = isFinite(+v) ? +v : 0;
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  downloadGstCalcSummary() {
    const c = this.gstCalcState();
    const days = this.gstCalcDelayDaysValue();
    const interest = this.gstCalcInterestValue();
    const late = this.gstCalcLateFeeValue();
    const lines = [
      "TAXORA — GST INTEREST & LATE FEE WORKING ESTIMATE",
      "=================================================",
      "Return Type       : " + (c.returnType || "GSTR-3B"),
      "Due Date          : " + (c.dueDate || "-"),
      "Actual Filing Date: " + (c.filingDate || "-"),
      "Tax Payable Cash  : Rs. " + this.gstCalcMoney(parseFloat(c.taxPayable) || 0),
      "NIL Return        : " + (c.isNil ? "Yes" : "No"),
      "Days Delayed      : " + days,
      "Interest Rate     : " + ((c.returnType || "GSTR-3B") === "GSTR-3B" ? "18% p.a. (working rate)" : "0% in this calculator"),
      "Estimated Interest: Rs. " + this.gstCalcMoney(interest),
      "Late Fee / Day    : Rs. " + this.gstCalcMoney(this.gstCalcLateFeePerDayValue()),
      "Estimated Late Fee: Rs. " + this.gstCalcMoney(late),
      "Total Extra       : Rs. " + this.gstCalcMoney(interest + late),
      "",
      "Working estimate only. Actual GST portal amount may differ due to caps, notifications, relief, taxpayer category, return period and portal computation."
    ];
    const blob = new Blob([lines.join("\\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GST-Interest-Late-Fee-Estimate-" + (c.returnType || "Return") + ".txt";
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

'''
s = s[:mm] + methods + s[mm:]

# 5) Escape closes calculator too.
escape_old = 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false, ewayOpen: false })'
if escape_old in s:
    s = s.replace(escape_old, 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false, ewayOpen: false, gstCalcOpen: false })', 1)
else:
    escape_old2 = 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false })'
    if escape_old2 in s:
        s = s.replace(escape_old2, 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false, gstCalcOpen: false })', 1)

# 6) Template props and handlers before GST payment props.
props_anchor = '      gstPayOpen: s.gstPayOpen,'
pi = s.find(props_anchor)
if pi < 0:
    raise SystemExit('GST payment props anchor missing')
props = '''      gstCalcOpen: s.gstCalcOpen,
      openGstCalcModal: () => this.setState({ gstCalcOpen: true }),
      openGstCalcCta: (ev) => { ev.stopPropagation(); this.setState({ gstCalcOpen: true }); },
      closeGstCalcModal: () => this.setState({ gstCalcOpen: false }),
      closeGstCalcModalOutside: (ev) => { if (ev.target === ev.currentTarget) this.setState({ gstCalcOpen: false }); },
      stopGstCalcPropagation: (ev) => ev.stopPropagation(),
      gstCalcReturnType: (s.gstCalc || {}).returnType || "GSTR-3B",
      gstCalcDueDate: (s.gstCalc || {}).dueDate || "",
      gstCalcFilingDate: (s.gstCalc || {}).filingDate || "",
      gstCalcTaxPayable: (s.gstCalc || {}).taxPayable || "",
      gstCalcIsNil: !!(s.gstCalc || {}).isNil,
      setGstCalcReturnType: (ev) => this.gstCalcPatch("returnType", ev.target.value),
      setGstCalcDueDate: (ev) => this.gstCalcPatch("dueDate", ev.target.value),
      setGstCalcFilingDate: (ev) => this.gstCalcPatch("filingDate", ev.target.value),
      setGstCalcTaxPayable: (ev) => this.gstCalcPatch("taxPayable", ev.target.value),
      setGstCalcIsNil: (ev) => this.gstCalcPatch("isNil", !!ev.target.checked),
      gstCalcDelayDays: this.gstCalcDelayDaysValue(),
      gstCalcInterestRate: ((s.gstCalc || {}).returnType || "GSTR-3B") === "GSTR-3B" ? "18% p.a." : "0%",
      gstCalcInterest: this.gstCalcMoney(this.gstCalcInterestValue()),
      gstCalcLateFeePerDay: this.gstCalcMoney(this.gstCalcLateFeePerDayValue()),
      gstCalcLateFee: this.gstCalcMoney(this.gstCalcLateFeeValue()),
      gstCalcTotalExtra: this.gstCalcMoney(this.gstCalcInterestValue() + this.gstCalcLateFeeValue()),
      gstCalcDueDateDisplay: (s.gstCalc || {}).dueDate || "—",
      gstCalcFilingDateDisplay: (s.gstCalc || {}).filingDate || "—",
      downloadGstCalcSummary: () => this.downloadGstCalcSummary(),
'''
s = s[:pi] + props + s[pi:]

p.write_text(s, encoding='utf-8')
print('GST Interest & Late Fee Calculator applied')