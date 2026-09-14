from pathlib import Path

html = Path('TAXORA GST.dc.html').read_text(encoding='utf-8')

required = [
    'GST Payment / Challan',
    'gstPayOpen',
    'openGstPayModal',
    'gstPayGrossTax',
    'gstPayEligibleItc',
    'gstPayCashRequired',
    'gstPayNetIgst',
    'gstPayNetCgst',
    'gstPayNetSgst',
    'gstPayNetCess',
    'gstPayStatus',
    'gstPayCin',
]

missing = [item for item in required if item not in html]
assert not missing, f'Missing GST Payment / Challan feature markers: {missing}'
print('GST Payment / Challan regression test passed')
