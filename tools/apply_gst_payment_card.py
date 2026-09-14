from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

card_anchor = '''      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" style="position:relative;height:100%;transform-style:preserve-3d;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,#39424D,#232A32 60%,#171C22);border:1px solid var(--hairline-on-dark);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:23px;font-weight:700;transition:transform var(--dur-base) var(--ease-out)">▤</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">GSTR-2B</h3>'''
if 'GST Payment / Challan</h3>' not in s:
    if card_anchor not in s:
        raise SystemExit('GSTR-2B card anchor not found')
    new_card = '''      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="{{ openGstPayModal }}" style="position:relative;height:100%;transform-style:preserve-3d;cursor:pointer;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,rgba(227,181,60,.22),rgba(227,181,60,.06) 60%,rgba(30,35,41,.9));border:1px solid rgba(227,181,60,.45);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:23px;font-weight:700;transition:transform var(--dur-base) var(--ease-out)">₹</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">GST Payment / Challan</h3>
        <p style="margin:0;font-size:var(--fs-body-sm);color:var(--muted-strong);text-wrap:pretty">See final tax liability, ITC used and the cash amount payable after GSTR-3B.</p>
        <button type="button" class="tx-cta" onclick="{{ openGstPayCta }}" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:0;background:transparent;border:0;font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">View GST Payment<span aria-hidden="true">→</span></button>
      </div></div></div>

'''
    s = s.replace(card_anchor, new_card + card_anchor, 1)

modal_anchor = '  <sc-if value="{{ ecomOpen }}">'
if '<sc-if value="{{ gstPayOpen }}">' not in s:
    if modal_anchor not in s:
        raise SystemExit('E-commerce modal anchor not found')
    modal = '''  <sc-if value="{{ gstPayOpen }}">
    <div role="dialog" aria-modal="true" aria-label="GST Payment / Challan" onclick="{{ closeGstPayModalOutside }}" style="position:fixed;inset:0;z-index:210;display:grid;overflow-y:auto;padding:24px;background:rgba(11,14,17,.58);backdrop-filter:blur(3px);animation:tx-fade var(--dur-base) var(--ease-out) both">
      <div onclick="{{ stopGstPayPropagation }}" style="margin:auto;width:min(980px,100%);max-height:calc(100vh - 48px);overflow-y:auto;background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.015) 48%,rgba(255,255,255,.04)),linear-gradient(0deg,rgba(14,18,23,.82),rgba(14,18,23,.82));-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.16);border-radius:var(--r-card);box-shadow:0 24px 60px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.14);animation:tx-expand 340ms var(--ease-out) both">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-md);padding:var(--card-pad);border-bottom:1px solid var(--hairline-on-dark)">
          <div style="display:grid;gap:4px">
            <span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">After GSTR-3B</span>
            <h3 style="margin:0;font-size:18px;font-weight:600;line-height:1.2;color:var(--on-dark)">GST Payment / Challan</h3>
          </div>
          <button type="button" aria-label="Close" onclick="{{ closeGstPayModal }}" style="width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:transparent;color:var(--muted-strong);font-size:15px;cursor:pointer">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:var(--sp-xl);padding:var(--card-pad)">
          <div style="display:grid;gap:var(--sp-lg);align-content:start">
            <div style="display:grid;gap:8px">
              <span style="font-size:var(--fs-body-sm);font-weight:600;color:var(--on-dark)">Payment Details</span>
              <div style="display:grid;gap:6px">
                <label style="font-size:var(--fs-caption);color:var(--muted-strong)">Payment Status</label>
                <select value="{{ gstPayStatus }}" onchange="{{ setGstPayStatus }}" style="width:100%;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"><option value="Not Paid">Not Paid</option><option value="Paid">Paid</option></select>
              </div>
              <div style="display:grid;gap:6px">
                <label style="font-size:var(--fs-caption);color:var(--muted-strong)">Challan / CIN Reference</label>
                <input type="text" value="{{ gstPayCin }}" oninput="{{ setGstPayCin }}" placeholder="Enter after payment" style="width:100%;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;font-size:var(--fs-body-sm)">
              </div>
            </div>
            <div style="padding:14px;border:1px solid rgba(227,181,60,.25);border-radius:var(--r-md);background:rgba(227,181,60,.055)">
              <div style="font-size:var(--fs-caption);color:var(--muted-strong);margin-bottom:4px">GSTR-3B source</div>
              <div style="font-size:var(--fs-body-sm);color:var(--body)">GSTIN: {{ gstPayGstin }}</div>
              <div style="font-size:var(--fs-body-sm);color:var(--body)">Period: {{ gstPayPeriod }}</div>
            </div>
            <button type="button" onclick="{{ downloadGstPaySummary }}" style="min-height:44px;padding:0 16px;border-radius:var(--r-md);border:1px solid var(--primary);background:var(--primary);color:var(--on-primary);font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Download Payment Summary</button>
          </div>
          <div class="ecb3b-3d-wrap"><div class="ecb3b-3d"><div class="ecb3b-3d-surface"><div style="position:relative;display:grid;gap:var(--sp-lg);padding:var(--card-pad)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--on-dark)">GST Payment Summary</span><span style="font-size:var(--fs-caption);font-weight:600;color:var(--primary)">{{ gstPayStatus }}</span></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">Output Tax Liability</div><div style="font-size:18px;font-weight:700;color:var(--body)">₹{{ gstPayGrossTax }}</div></div>
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">Eligible ITC</div><div style="font-size:18px;font-weight:700;color:var(--body)">₹{{ gstPayEligibleItc }}</div></div>
              <div style="padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);background:rgba(255,255,255,.035)"><div style="font-size:11px;color:var(--muted)">ITC Used</div><div style="font-size:18px;font-weight:700;color:var(--body)">₹{{ gstPayItcUsed }}</div></div>
              <div style="padding:12px;border:1px solid rgba(227,181,60,.28);border-radius:var(--r-md);background:rgba(227,181,60,.075)"><div style="font-size:11px;color:var(--muted-strong)">Cash Payable</div><div style="font-size:22px;font-weight:700;color:var(--primary)">₹{{ gstPayCashRequired }}</div></div>
            </div>
            <div style="display:grid;gap:8px;padding-top:4px">
              <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="color:var(--muted-strong)">IGST</span><strong>₹{{ gstPayNetIgst }}</strong></div>
              <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="color:var(--muted-strong)">CGST</span><strong>₹{{ gstPayNetCgst }}</strong></div>
              <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)"><span style="color:var(--muted-strong)">SGST</span><strong>₹{{ gstPayNetSgst }}</strong></div>
              <div style="display:flex;justify-content:space-between;padding:9px 0"><span style="color:var(--muted-strong)">Cess</span><strong>₹{{ gstPayNetCess }}</strong></div>
            </div>
            <sc-if value="{{ gstPayNoData }}"><div style="padding:12px;border:1px solid rgba(248,81,73,.3);border-radius:var(--r-md);font-size:var(--fs-caption);color:var(--muted-strong)">Prepare GSTR-3B first. Payment figures will appear here automatically.</div></sc-if>
          </div></div></div></div>
        </div>
      </div>
    </div>
  </sc-if>

'''
    s = s.replace(modal_anchor, modal + modal_anchor, 1)

if 'gstPayOpen: false' not in s:
    anchor = '    ecbOpen: false,\n'
    if anchor not in s:
        raise SystemExit('state anchor not found')
    s = s.replace(anchor, anchor + '    gstPayOpen: false,\n    gstPayment: { status: "Not Paid", cin: "" },\n', 1)

s = s.replace('this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false })', 'this.setState({ ecomOpen: false, ecbOpen: false, invOpen: false, gstPayOpen: false })', 1)

vm_anchor = '      ecbOpen: s.ecbOpen,\n'
if 'gstPayGrossTax:' not in s:
    if vm_anchor not in s:
        raise SystemExit('view model anchor not found')
    vm = '''      gstPayOpen: s.gstPayOpen,
      openGstPayModal: () => this.setState({ gstPayOpen: true }),
      openGstPayCta: (ev) => { ev.stopPropagation(); this.setState({ gstPayOpen: true }); },
      closeGstPayModal: () => this.setState({ gstPayOpen: false }),
      closeGstPayModalOutside: (ev) => { if (ev.target === ev.currentTarget) this.setState({ gstPayOpen: false }); },
      stopGstPayPropagation: (ev) => { ev.stopPropagation(); },
      gstPayGrossTax: (((s.ecb3b || {}).preview || {}).summary || {}).grossTax || "0.00",
      gstPayEligibleItc: (((s.ecb3b || {}).preview || {}).summary || {}).eligItc || "0.00",
      gstPayItcUsed: Math.max(0, Math.min(this.ecb3bNum(((((s.ecb3b || {}).preview || {}).summary || {}).grossTax || 0)), this.ecb3bNum(((((s.ecb3b || {}).preview || {}).summary || {}).eligItc || 0)))).toFixed(2),
      gstPayCashRequired: (((s.ecb3b || {}).preview || {}).summary || {}).cashReq || "0.00",
      gstPayNetIgst: (((s.ecb3b || {}).preview || {}).summary || {}).netIgst || "0.00",
      gstPayNetCgst: (((s.ecb3b || {}).preview || {}).summary || {}).netCgst || "0.00",
      gstPayNetSgst: (((s.ecb3b || {}).preview || {}).summary || {}).netSgst || "0.00",
      gstPayNetCess: (((s.ecb3b || {}).preview || {}).summary || {}).netCess || "0.00",
      gstPayGstin: (s.ecb3b || {}).gstin || "—",
      gstPayPeriod: (s.ecb3b || {}).period || "—",
      gstPayNoData: !((s.ecb3b || {}).preview && (s.ecb3b || {}).gstr1Data),
      gstPayStatus: ((s.gstPayment || {}).status || "Not Paid"),
      gstPayCin: ((s.gstPayment || {}).cin || ""),
      setGstPayStatus: (e) => this.setState({ gstPayment: Object.assign({}, s.gstPayment || {}, { status: e.currentTarget.value }) }),
      setGstPayCin: (e) => this.setState({ gstPayment: Object.assign({}, s.gstPayment || {}, { cin: e.currentTarget.value }) }),
      downloadGstPaySummary: () => {
        const sum = (((this.state.ecb3b || {}).preview || {}).summary || {});
        const pay = this.state.gstPayment || {};
        const lines = [
          "GST PAYMENT / CHALLAN SUMMARY",
          "GSTIN: " + ((this.state.ecb3b || {}).gstin || ""),
          "Period: " + ((this.state.ecb3b || {}).period || ""),
          "Output Tax Liability: Rs. " + (sum.grossTax || "0.00"),
          "Eligible ITC: Rs. " + (sum.eligItc || "0.00"),
          "Cash Payable: Rs. " + (sum.cashReq || "0.00"),
          "IGST: Rs. " + (sum.netIgst || "0.00"),
          "CGST: Rs. " + (sum.netCgst || "0.00"),
          "SGST: Rs. " + (sum.netSgst || "0.00"),
          "Cess: Rs. " + (sum.netCess || "0.00"),
          "Payment Status: " + (pay.status || "Not Paid"),
          "Challan / CIN: " + (pay.cin || "")
        ];
        const blob = new Blob([lines.join("\\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "GST-Payment-Summary-" + (((this.state.ecb3b || {}).period || "period").replace(/[^0-9A-Za-z_-]/g, "-")) + ".txt";
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      },

'''
    s = s.replace(vm_anchor, vm + vm_anchor, 1)

p.write_text(s, encoding='utf-8')
print('GST Payment / Challan patch applied')
