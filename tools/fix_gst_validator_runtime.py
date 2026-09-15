from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

# The site is also opened locally, where ES-module loading can fail. Use a plain browser runtime.
s = s.replace('<script type="module" src="./gst-validators.js"></script>', '')
s = s.replace('<script src="./gst-validators-browser.js"></script>', '')
anchor = '<script src="./master-report.js"></script>'
if anchor not in s:
    raise SystemExit('master-report script anchor not found')
s = s.replace(anchor, anchor + '\n<script src="./gst-validators-browser.js"></script>', 1)

# A previous patch race left a duplicate card pair immediately before the E-Way Bill card.
card_start = '<div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="window.TaxoraValidatorUI && window.TaxoraValidatorUI.openGSTIN()"'
invoice_card_start = '<div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="window.TaxoraValidatorUI && window.TaxoraValidatorUI.openInvoices()"'
eway_card = '<div data-tilt="" style="perspective:900px"><div data-tilt-inner="" onclick="{{ openEwayModal }}"'
starts = []
pos = 0
while True:
    i = s.find(card_start, pos)
    if i < 0:
        break
    starts.append(i)
    pos = i + 1
if len(starts) > 1:
    eway = s.find(eway_card, starts[1])
    if eway < 0:
        raise SystemExit('E-Way card anchor not found after duplicate validator cards')
    s = s[:starts[1]] + s[eway:]

# A duplicate modal pair was also present immediately before the E-Way modal.
modal_start = '<div id="taxora-gstin-modal"'
eway_modal = '  <sc-if value="{{ ewayOpen }}">'
modal_starts = []
pos = 0
while True:
    i = s.find(modal_start, pos)
    if i < 0:
        break
    modal_starts.append(i)
    pos = i + 1
if len(modal_starts) > 1:
    eway = s.find(eway_modal, modal_starts[1])
    if eway < 0:
        raise SystemExit('E-Way modal anchor not found after duplicate validator modals')
    s = s[:modal_starts[1]] + s[eway:]

checks = {
    'browser runtime script': s.count('<script src="./gst-validators-browser.js"></script>') == 1,
    'no module runtime': '<script type="module" src="./gst-validators.js"></script>' not in s,
    'one GSTIN card': s.count(card_start) == 1,
    'one invoice card': s.count(invoice_card_start) == 1,
    'one GSTIN modal': s.count('id="taxora-gstin-modal"') == 1,
    'one invoice modal': s.count('id="taxora-invoice-modal"') == 1,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('Validator runtime repair verification failed: ' + ', '.join(failed))

p.write_text(s, encoding='utf-8')
print('GST validator browser runtime repaired and duplicates removed')
