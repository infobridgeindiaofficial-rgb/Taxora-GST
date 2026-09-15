from pathlib import Path
import re

path = Path('TAXORA GST.dc.html')
html = path.read_text(encoding='utf-8')

titles = [
    'GSTR-1',
    'GSTR-3B',
    'GSTR-2B',
    'Input Tax Credit',
    'GST Reconciliation',
    'GST Reports',
]

for title in titles:
    pattern = re.compile(
        r'\n\s*<div data-tilt="" style="perspective:900px">'
        r'(?:(?!<div data-tilt="" style="perspective:900px">)[\s\S])*?'
        r'<h3[^>]*>' + re.escape(title) + r'</h3>'
        r'[\s\S]*?</div></div></div>\s*',
        re.MULTILINE,
    )
    html, count = pattern.subn('\n', html, count=1)
    if count != 1:
        raise SystemExit(f'Expected exactly one service card for {title}, removed {count}')

path.write_text(html, encoding='utf-8')
print('Removed unused GST service cards')
