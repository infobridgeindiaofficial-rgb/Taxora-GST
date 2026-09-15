from pathlib import Path

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')

how_links = [
    '<a href="#how" data-nav="#how" style="font-size:var(--fs-body-sm);font-weight:500;padding:8px 2px;border-bottom:1px solid transparent">How It Works</a>',
    '<a href="#how" onClick="{{ closeNav }}" style="min-height:44px;display:flex;align-items:center;font-size:var(--fs-body-md)">How It Works</a>',
    '<a href="#how" style="font-size:var(--fs-body-sm)">How It Works</a>',
]
for x in how_links:
    s = s.replace(x, '', 1)

desktop_get = '<a href="#contact" style="display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:var(--r-md);background:var(--primary);color:var(--on-primary);font-size:var(--fs-body-sm);font-weight:600;white-space:nowrap;border:1px solid var(--primary)" style-hover="background:var(--primary-active);border-color:var(--primary-active);color:var(--on-primary)">Get Started<span aria-hidden="true">→</span></a>'
mobile_get = '<a href="#contact" onClick="{{ closeNav }}" style="margin-top:var(--sp-sm);min-height:48px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--r-md);background:var(--primary);color:var(--on-primary);font-size:var(--fs-body-md);font-weight:600">Get Started<span aria-hidden="true">→</span></a>'
s = s.replace(desktop_get, '', 1)
s = s.replace(mobile_get, '', 1)
s = s.replace('const ids = ["#home", "#services", "#how", "#contact"];', 'const ids = ["#home", "#services", "#contact"];', 1)

if 'id="contact"' not in s:
    contact = '''\n<section id="contact" data-screen-label="Contact" style="position:relative;z-index:1;padding:64px 24px;border-top:1px solid var(--hairline-on-dark);background:rgba(11,14,17,.72)">\n  <div style="max-width:var(--container-max);margin:0 auto">\n    <div class="tx-glass-card" style="border-radius:var(--r-card);padding:32px;display:grid;gap:24px;max-width:760px;margin:0 auto">\n      <div style="display:grid;gap:8px;text-align:center">\n        <span style="font-size:var(--fs-caption);font-weight:700;letter-spacing:.12em;color:var(--primary);text-transform:uppercase">Contact TAXORA GST</span>\n        <h2 style="margin:0;color:var(--on-dark);font-size:32px;line-height:1.2">Need help with GST?</h2>\n        <p style="margin:0;color:var(--muted-strong);font-size:var(--fs-body-md)">Contact us by email or WhatsApp.</p>\n      </div>\n      <div style="display:grid;gap:12px">\n        <a href="mailto:infobridgeindia.official@gmail.com" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(11,14,17,.45)">\n          <span style="color:var(--muted-strong);font-size:var(--fs-body-sm)">Email</span>\n          <strong style="color:var(--body);font-size:var(--fs-body-sm);word-break:break-all">infobridgeindia.official@gmail.com</strong>\n        </a>\n        <a href="https://wa.me/971521185821" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:1px solid var(--hairline-on-dark);border-radius:var(--r-md);background:rgba(11,14,17,.45)">\n          <span style="color:var(--muted-strong);font-size:var(--fs-body-sm)">WhatsApp</span>\n          <strong style="color:var(--primary);font-size:var(--fs-body-sm)">+971 52 118 5821</strong>\n        </a>\n      </div>\n    </div>\n  </div>\n</section>\n\n'''
    marker = '<footer style="position:relative;z-index:1;padding:var(--sp-xxl) 24px var(--sp-xl);border-top:1px solid var(--hairline-on-dark);background:rgba(11,14,17,.8)">'
    if marker not in s:
        raise SystemExit('Footer marker not found')
    s = s.replace(marker, contact + marker, 1)

p.write_text(s, encoding='utf-8')

checks = {
    'Get Started removed': 'Get Started' not in s,
    'How It Works link removed': '>How It Works</a>' not in s,
    'contact exists': 'id="contact"' in s,
    'email exists': 'mailto:infobridgeindia.official@gmail.com' in s,
    'whatsapp exists': 'https://wa.me/971521185821' in s,
}
bad = [k for k, v in checks.items() if not v]
if bad:
    raise SystemExit('Failed checks: ' + ', '.join(bad))
print('Header/contact update verified')
