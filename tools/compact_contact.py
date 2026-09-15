from pathlib import Path
import re

p = Path('TAXORA GST.dc.html')
s = p.read_text(encoding='utf-8')
new = '''<section id="contact" data-screen-label="Contact" style="position:relative;z-index:1;padding:32px 24px;border-top:1px solid var(--hairline-on-dark);background:rgba(11,14,17,.72)">
  <div style="max-width:var(--container-max);margin:0 auto;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap">
    <a href="mailto:infobridgeindia.official@gmail.com" style="font-size:13px;color:var(--muted-strong)">infobridgeindia.official@gmail.com</a>
    <a href="https://wa.me/971521185821" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" title="WhatsApp" style="width:42px;height:42px;flex:0 0 42px;border-radius:50%;display:grid;place-items:center;background:#25D366;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.25)">
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M19.11 17.38c-.26-.13-1.55-.76-1.79-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.82 1.02-.15.17-.3.2-.56.07-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46-.07-.13-.59-1.42-.81-1.94-.21-.51-.43-.44-.59-.45h-.5c-.17 0-.46.07-.7.33-.24.26-.92.9-.92 2.2s.94 2.55 1.07 2.72c.13.17 1.85 2.83 4.49 3.97.63.27 1.12.43 1.5.55.63.2 1.2.17 1.65.1.5-.07 1.55-.63 1.77-1.24.22-.61.22-1.13.15-1.24-.06-.11-.24-.17-.5-.3z"/><path d="M16.03 3.2C8.94 3.2 3.2 8.86 3.2 15.84c0 2.47.73 4.88 2.1 6.94L3.2 28.8l6.18-2.03a12.96 12.96 0 0 0 6.64 1.82h.01c7.08 0 12.83-5.66 12.83-12.64S23.11 3.2 16.03 3.2zm0 23.25h-.01a10.78 10.78 0 0 1-5.5-1.51l-.39-.23-3.67 1.21 1.23-3.55-.25-.4a10.39 10.39 0 0 1-1.69-5.66c0-5.75 4.74-10.43 10.57-10.43 5.83 0 10.57 4.68 10.57 10.43 0 5.75-4.74 10.43-10.86 10.43z"/></svg>
    </a>
  </div>
</section>'''
s2, n = re.subn(r'<section id="contact"\b[\s\S]*?</section>', new, s, count=1)
if n != 1:
    raise SystemExit(f'Expected 1 contact section, found {n}')
p.write_text(s2, encoding='utf-8')

s = p.read_text(encoding='utf-8')
assert 'aria-label="Chat on WhatsApp"' in s
assert 'https://wa.me/971521185821' in s
assert 'mailto:infobridgeindia.official@gmail.com' in s
assert '+971 52 118 5821' not in s
assert 'Need help with GST?' not in s
print('Compact contact verified')
