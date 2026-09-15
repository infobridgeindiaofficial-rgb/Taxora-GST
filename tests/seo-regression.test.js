const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('homepage source and GitHub Pages entry stay identical and SEO-complete', () => {
  const source = read('TAXORA GST.dc.html');
  const index = read('index.html');

  assert.equal(index, source, 'index.html must mirror the editable source page');
  assert.match(index, /<html lang="en">/);
  assert.match(index, /<title>GST Filing &amp; Invoice Tools for India \| Taxora GST<\/title>/);
  assert.match(index, /<meta name="description" content="Free GST filing preparation, GST invoice generator and calculators for Indian businesses and Amazon, Flipkart and Meesho sellers\. Prepare GSTR-1 and GSTR-3B\.">/);
  assert.match(index, /<meta name="robots" content="index, follow">/);
  assert.match(index, /<link rel="canonical" href="https:\/\/taxoragst\.online\/">/);
  assert.match(index, /<meta property="og:url" content="https:\/\/taxoragst\.online\/">/);
  assert.match(index, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(index, /<link rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml">/);
  assert.match(index, /<h1 class="tx-sr-only">GST Filing and GST Invoice Tools for Indian Businesses<\/h1>/);
  assert.match(index, /ref="\{\{ sceneRef \}\}" aria-hidden="true"/);
  assert.equal((index.match(/<h1 class="tx-sr-only">/g) || []).length, 1, 'homepage must contain one primary page heading');

  const schemaMatch = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(schemaMatch, 'homepage must include JSON-LD');
  const schema = JSON.parse(schemaMatch[1]);
  const types = schema['@graph'].map((item) => item['@type']);
  assert.deepEqual(types, ['Organization', 'WebSite', 'SoftwareApplication']);
  assert.equal(schemaMatch[1].includes('&amp;'), false, 'JSON-LD must use JSON text, not HTML entities');
});

test('all public pages have canonical, description, robots and favicon metadata', () => {
  const expected = {
    'local-wholesale-gst.html': 'https://taxoragst.online/local-wholesale-gst.html',
    'privacy.html': 'https://taxoragst.online/privacy.html',
    'terms.html': 'https://taxoragst.online/terms.html'
  };

  for (const [file, canonical] of Object.entries(expected)) {
    const html = read(file);
    assert.match(html, /<meta name="description" content="[^"]+">/, `${file}: description`);
    assert.match(html, /<meta name="robots" content="index, follow">/, `${file}: robots`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${file}: canonical`);
    assert.match(html, /<link rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml">/, `${file}: favicon`);
    assert.equal(html.includes('TAXORA%20GST.dc.html'), false, `${file}: links must point to the canonical homepage`);
  }
});

test('robots and sitemap expose only the intended public pages', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Disallow: \/uploads\/$/m);
  assert.match(robots, /^Disallow: \/tests\/$/m);
  assert.match(robots, /^Disallow: \/\*\.xlsx\$$/m);
  assert.match(robots, /^Sitemap: https:\/\/taxoragst\.online\/sitemap\.xml$/m);

  const sitemap = read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, [
    'https://taxoragst.online/',
    'https://taxoragst.online/local-wholesale-gst.html',
    'https://taxoragst.online/privacy.html',
    'https://taxoragst.online/terms.html'
  ]);
  assert.equal(sitemap.includes('TAXORA%20GST.dc.html'), false);
  assert.equal(sitemap.includes('.xlsx'), false);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'favicon.svg')));
});
