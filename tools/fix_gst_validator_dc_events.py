from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

repls = {
    'onclick="window.TaxoraValidatorUI && window.TaxoraValidatorUI.openGSTIN()"': 'onclick="{{ openGstinValidator }}"',
    'onclick="event.stopPropagation();window.TaxoraValidatorUI && window.TaxoraValidatorUI.openGSTIN()"': 'onclick="{{ openGstinValidator }}"',
    'onclick="window.TaxoraValidatorUI && window.TaxoraValidatorUI.openInvoices()"': 'onclick="{{ openInvoiceChecker }}"',
    'onclick="event.stopPropagation();window.TaxoraValidatorUI && window.TaxoraValidatorUI.openInvoices()"': 'onclick="{{ openInvoiceChecker }}"',
    'onclick="if(event.target===this)window.TaxoraValidatorUI.closeGSTIN()"': 'onclick="{{ closeGstinValidatorOutside }}"',
    'onclick="window.TaxoraValidatorUI.closeGSTIN()"': 'onclick="{{ closeGstinValidator }}"',
    'onclick="window.TaxoraValidatorUI.validateGSTIN()"': 'onclick="{{ validateGstinNow }}"',
    'onclick="if(event.target===this)window.TaxoraValidatorUI.closeInvoices()"': 'onclick="{{ closeInvoiceCheckerOutside }}"',
    'onclick="window.TaxoraValidatorUI.closeInvoices()"': 'onclick="{{ closeInvoiceChecker }}"',
    'onclick="window.TaxoraValidatorUI.checkInvoices()"': 'onclick="{{ checkInvoicesNow }}"',
}
for old, new in repls.items():
    s = s.replace(old, new)

anchor = 'class Component extends DCLogic {\n'
methods = '''class Component extends DCLogic {\n  openGstinValidator() {\n    if (window.TaxoraValidatorUI) window.TaxoraValidatorUI.openGSTIN();\n  }\n\n  closeGstinValidator() {\n    if (window.TaxoraValidatorUI) window.TaxoraValidatorUI.closeGSTIN();\n  }\n\n  closeGstinValidatorOutside(ev) {\n    if (ev && ev.target === ev.currentTarget) this.closeGstinValidator();\n  }\n\n  validateGstinNow() {\n    if (window.TaxoraValidatorUI) window.TaxoraValidatorUI.validateGSTIN();\n  }\n\n  openInvoiceChecker() {\n    if (window.TaxoraValidatorUI) window.TaxoraValidatorUI.openInvoices();\n  }\n\n  closeInvoiceChecker() {\n    if (window.TaxoraValidatorUI) window.TaxoraValidatorUI.closeInvoices();\n  }\n\n  closeInvoiceCheckerOutside(ev) {\n    if (ev && ev.target === ev.currentTarget) this.closeInvoiceChecker();\n  }\n\n  checkInvoicesNow() {\n    if (window.TaxoraValidatorUI) window.TaxoraValidatorUI.checkInvoices();\n  }\n\n'''
if 'openGstinValidator() {' not in s:
    if anchor not in s:
        raise SystemExit('Component anchor not found')
    s = s.replace(anchor, methods, 1)

required = [
    'onclick="{{ openGstinValidator }}"',
    'onclick="{{ openInvoiceChecker }}"',
    'onclick="{{ validateGstinNow }}"',
    'onclick="{{ checkInvoicesNow }}"',
    'closeGstinValidatorOutside(ev)',
    'closeInvoiceCheckerOutside(ev)',
]
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('Missing repaired anchors: ' + ', '.join(missing))

bad = [
    'window.TaxoraValidatorUI && window.TaxoraValidatorUI.openGSTIN()',
    'window.TaxoraValidatorUI && window.TaxoraValidatorUI.openInvoices()',
    'onclick="window.TaxoraValidatorUI.closeGSTIN()"',
    'onclick="window.TaxoraValidatorUI.closeInvoices()"',
]
left = [x for x in bad if x in s]
if left:
    raise SystemExit('Raw validator events still present: ' + ', '.join(left))

p.write_text(s, encoding='utf-8')
print('GST validator DC events repaired')
