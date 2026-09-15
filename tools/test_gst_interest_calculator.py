from pathlib import Path

html = Path('TAXORA GST.dc.html').read_text(encoding='utf-8')
required = [
    'GST Interest & Late Fee Calculator',
    'gst-interest-modal',
    'gst-interest-return-type',
    'gst-interest-due-date',
    'gst-interest-filing-date',
    'gst-interest-tax-payable',
    'gst-interest-delay-days',
    'gst-interest-interest-amount',
    'gst-interest-late-fee',
    'gst-interest-total-extra',
    'TaxoraInterest',
    'downloadSummary',
]
missing = [item for item in required if item not in html]
if missing:
    raise SystemExit('Missing GST interest calculator markers: ' + ', '.join(missing))
print('GST interest calculator regression test passed.')
