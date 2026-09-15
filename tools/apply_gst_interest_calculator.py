from pathlib import Path

path = Path('TAXORA GST.dc.html')
text = path.read_text(encoding='utf-8')

if 'GST Interest & Late Fee Calculator' in text and 'gst-interest-modal' in text:
    print('GST interest calculator already present; no change needed.')
    raise SystemExit(0)

card = r'''
      <div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="window.TaxoraInterest && window.TaxoraInterest.open(event)" style="position:relative;height:100%;transform-style:preserve-3d;cursor:pointer;transition:transform var(--dur-base) var(--ease-out)"><div class="tx-glass-card" style="position:relative;height:100%;padding:var(--card-pad);border-radius:var(--r-card);transition:background var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard),box-shadow var(--dur-base) var(--ease-standard)">
        <div data-tilt-lift="" style="width:56px;height:56px;display:grid;place-items:center;border-radius:var(--r-lg);background:linear-gradient(150deg,rgba(227,181,60,.22),rgba(227,181,60,.06) 60%,rgba(30,35,41,.9));border:1px solid rgba(227,181,60,.45);box-shadow:0 12px 26px rgba(0,0,0,.5);color:var(--primary);font-size:23px;font-weight:700;transition:transform var(--dur-base) var(--ease-out)">%</div>
        <h3 style="margin:20px 0 8px;font-size:var(--fs-body-md);font-weight:600;color:var(--on-dark)">GST Interest &amp; Late Fee Calculator</h3>
        <p style="margin:0;font-size:var(--fs-body-sm);color:var(--muted-strong);text-wrap:pretty">Estimate filing delay, GST interest, late fee and total extra payable.</p>
        <button type="button" class="tx-cta" onclick="window.TaxoraInterest && window.TaxoraInterest.open(event)" style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:0;background:transparent;border:0;font-family:inherit;font-size:var(--fs-body-sm);font-weight:600;cursor:pointer">Calculate Interest &amp; Late Fee<span aria-hidden="true">→</span></button>
      </div></div></div>

'''

h = text.find('>GSTR-2B</h3>')
if h < 0:
    raise SystemExit('Could not find GSTR-2B card anchor')
insert_at = text.rfind('      <div data-tilt=""', 0, h)
if insert_at < 0:
    raise SystemExit('Could not find start of GSTR-2B card')
text = text[:insert_at] + card + text[insert_at:]

modal = r'''
  <div id="gst-interest-modal" role="dialog" aria-modal="true" aria-label="GST Interest and Late Fee Calculator" style="display:none;position:fixed;inset:0;z-index:260;overflow-y:auto;padding:24px;background:rgba(11,14,17,.62);backdrop-filter:blur(4px)">
    <div data-gst-interest-panel style="margin:auto;width:min(1040px,100%);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.015) 48%,rgba(255,255,255,.04)),linear-gradient(0deg,rgba(14,18,23,.92),rgba(14,18,23,.92));border:1px solid rgba(255,255,255,.16);border-radius:var(--r-card);box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.14);overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-md);padding:var(--card-pad);border-bottom:1px solid var(--hairline-on-dark)">
        <div style="display:grid;gap:4px">
          <span style="font-size:var(--fs-caption);font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)">GST Utility</span>
          <h3 style="margin:0;font-size:20px;font-weight:600;color:var(--on-dark)">GST Interest &amp; Late Fee Calculator</h3>
        </div>
        <button type="button" aria-label="Close" onclick="window.TaxoraInterest.close()" style="width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:transparent;color:var(--muted-strong);font-size:15px;cursor:pointer">✕</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--sp-xl);padding:var(--card-pad)">
        <div style="display:grid;gap:16px;align-content:start">
          <div style="display:grid;gap:6px">
            <label for="gst-interest-return-type" style="font-size:var(--fs-body-sm);font-weight:600;color:var(--body)">Return Type</label>
            <select id="gst-interest-return-type" onchange="window.TaxoraInterest.calculate()" style="width:100%;height:44px;padding:0 14px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark">
              <option value="GSTR-3B">GSTR-3B</option>
              <option value="GSTR-1">GSTR-1</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:grid;gap:6px"><label for="gst-interest-due-date" style="font-size:var(--fs-body-sm);font-weight:600;color:var(--body)">Due Date</label><input id="gst-interest-due-date" type="date" oninput="window.TaxoraInterest.calculate()" style="width:100%;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"></div>
            <div style="display:grid;gap:6px"><label for="gst-interest-filing-date" style="font-size:var(--fs-body-sm);font-weight:600;color:var(--body)">Filing Date</label><input id="gst-interest-filing-date" type="date" oninput="window.TaxoraInterest.calculate()" style="width:100%;height:44px;padding:0 12px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit;color-scheme:dark"></div>
          </div>
          <div style="display:grid;gap:6px"><label for="gst-interest-tax-payable" style="font-size:var(--fs-body-sm);font-weight:600;color:var(--body)">Tax Payable (₹)</label><input id="gst-interest-tax-payable" type="number" min="0" step="0.01" value="0" oninput="window.TaxoraInterest.calculate()" placeholder="0.00" style="width:100%;height:44px;padding:0 14px;background:var(--canvas-dark);border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);color:var(--body);font-family:inherit"></div>
          <p style="margin:0;font-size:var(--fs-caption);line-height:1.6;color:var(--muted-strong)">Estimate only. Interest uses 18% p.a. Late fee estimate uses ₹50/day for non-nil returns and ₹20/day for nil returns, subject to a simple cap. Verify final liability on the GST portal before payment.</p>
          <button type="button" class="tx-cta" onclick="window.TaxoraInterest.downloadSummary()" style="justify-self:start;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid rgba(227,181,60,.45);border-radius:var(--r-md);background:rgba(227,181,60,.10);font-family:inherit;font-weight:600;cursor:pointer">Download Summary <span aria-hidden="true">↓</span></button>
        </div>

        <div class="ecb3b-3d-wrap" style="min-height:100%">
          <div class="ecb3b-3d" style="height:100%">
            <div class="ecb3b-3d-surface" style="height:100%;display:grid;align-content:start;gap:14px;padding:22px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><div style="font-size:var(--fs-caption);letter-spacing:.12em;text-transform:uppercase;color:var(--primary);font-weight:700">Live Estimate</div><div style="margin-top:4px;font-size:18px;font-weight:700;color:var(--on-dark)">Delay &amp; Charges</div></div><span style="width:10px;height:10px;border-radius:50%;background:var(--primary);box-shadow:0 0 16px rgba(227,181,60,.8)"></span></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="padding:14px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(255,255,255,.025)"><div style="font-size:var(--fs-caption);color:var(--muted-strong)">Delay Days</div><div id="gst-interest-delay-days" style="margin-top:6px;font-size:22px;font-weight:700;color:var(--on-dark)">0</div></div>
                <div style="padding:14px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(255,255,255,.025)"><div style="font-size:var(--fs-caption);color:var(--muted-strong)">Interest @ 18% p.a.</div><div id="gst-interest-interest-amount" style="margin-top:6px;font-size:22px;font-weight:700;color:var(--on-dark)">₹0.00</div></div>
                <div style="padding:14px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(255,255,255,.025)"><div style="font-size:var(--fs-caption);color:var(--muted-strong)">Estimated Late Fee</div><div id="gst-interest-late-fee" style="margin-top:6px;font-size:22px;font-weight:700;color:var(--on-dark)">₹0.00</div></div>
                <div style="padding:14px;border:1px solid rgba(227,181,60,.40);border-radius:var(--r-md);background:rgba(227,181,60,.08)"><div style="font-size:var(--fs-caption);color:var(--primary)">Total Extra Payable</div><div id="gst-interest-total-extra" style="margin-top:6px;font-size:24px;font-weight:800;color:var(--primary)">₹0.00</div></div>
              </div>
              <div style="padding:14px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(0,0,0,.14);font-size:var(--fs-caption);line-height:1.6;color:var(--muted-strong)"><span id="gst-interest-summary-line">Enter due date, filing date and tax payable to calculate.</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
  (function(){
    const q = (id) => document.getElementById(id);
    const money = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
    const api = {
      open(ev){ if(ev){ ev.preventDefault(); ev.stopPropagation(); } const m=q('gst-interest-modal'); if(m){m.style.display='grid'; document.body.style.overflow='hidden';} api.calculate(); },
      close(){ const m=q('gst-interest-modal'); if(m){m.style.display='none'; document.body.style.overflow='';} },
      calculate(){
        const due = q('gst-interest-due-date') && q('gst-interest-due-date').value;
        const filed = q('gst-interest-filing-date') && q('gst-interest-filing-date').value;
        const tax = Math.max(0, parseFloat((q('gst-interest-tax-payable') && q('gst-interest-tax-payable').value) || '0') || 0);
        let days = 0;
        if(due && filed){ const a=new Date(due+'T00:00:00'); const b=new Date(filed+'T00:00:00'); days=Math.max(0,Math.ceil((b-a)/86400000)); }
        const interest = tax * 0.18 * days / 365;
        const nil = tax <= 0;
        const daily = nil ? 20 : 50;
        const cap = nil ? 500 : 10000;
        const lateFee = Math.min(days * daily, cap);
        const total = interest + lateFee;
        if(q('gst-interest-delay-days')) q('gst-interest-delay-days').textContent=String(days);
        if(q('gst-interest-interest-amount')) q('gst-interest-interest-amount').textContent=money(interest);
        if(q('gst-interest-late-fee')) q('gst-interest-late-fee').textContent=money(lateFee);
        if(q('gst-interest-total-extra')) q('gst-interest-total-extra').textContent=money(total);
        const rt=(q('gst-interest-return-type') && q('gst-interest-return-type').value) || 'GSTR-3B';
        if(q('gst-interest-summary-line')) q('gst-interest-summary-line').textContent = days ? (rt+' is '+days+' day'+(days===1?'':'s')+' late. Estimated additional amount: '+money(total)+'.') : 'No filing delay based on the dates entered.';
        return {returnType:rt,dueDate:due||'',filingDate:filed||'',taxPayable:tax,days,interest,lateFee,total};
      },
      downloadSummary(){
        const x=api.calculate();
        const lines=['TAXORA GST - Interest & Late Fee Estimate','', 'Return Type: '+x.returnType,'Due Date: '+(x.dueDate||'-'),'Filing Date: '+(x.filingDate||'-'),'Tax Payable: '+money(x.taxPayable),'Delay Days: '+x.days,'Interest @ 18% p.a.: '+money(x.interest),'Estimated Late Fee: '+money(x.lateFee),'Total Extra Payable: '+money(x.total),'','Estimate only. Verify final liability on the GST portal before payment.'];
        const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='GST-Interest-Late-Fee-Summary.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    };
    window.TaxoraInterest=api;
    document.addEventListener('click',function(e){ const m=q('gst-interest-modal'); if(m && e.target===m) api.close(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ const m=q('gst-interest-modal'); if(m && m.style.display!=='none') api.close(); } });
  })();
  </script>
'''

body = text.rfind('</body>')
if body < 0:
    raise SystemExit('Could not find </body>')
text = text[:body] + modal + '\n' + text[body:]
path.write_text(text, encoding='utf-8')
print('GST interest calculator card and modal inserted.')
