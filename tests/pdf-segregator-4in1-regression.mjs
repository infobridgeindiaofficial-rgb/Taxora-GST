import fs from 'node:fs';

const html = fs.readFileSync('pdf-segregator.html', 'utf8');

const requiredHtmlTokens = [
  './pdf-segregator-4in1.js',
  'Create 4-in-1',
  'group-action-bar',
  'group-result-row'
];
for (const token of requiredHtmlTokens) {
  if (!html.includes(token)) throw new Error(`Missing 4-in-1 UI token in pdf-segregator.html: ${token}`);
}

if (!fs.existsSync('pdf-segregator-4in1.js')) throw new Error('pdf-segregator-4in1.js is missing');
const mod = fs.readFileSync('pdf-segregator-4in1.js', 'utf8');

const requiredModuleTokens = [
  'create4in1',
  'buildFourInOnePdf',
  'embedSlipAsForm',
  'rotationMatrix',
  'inheritedMediaBox',
  'inheritedRotate',
  'inheritedResources',
  'copySubgraph',
  'transformValue',
  'window.TaxoraPdf4in1',
  'REFERENCE_SCALE',
  'SLOT_WIDTH',
  'SLOT_HEIGHT',
  'BORDER_WIDTH'
];
for (const token of requiredModuleTokens) {
  if (!mod.includes(token)) throw new Error(`Missing token in pdf-segregator-4in1.js: ${token}`);
}

// This engine intentionally embeds the COMPLETE source page (InfoBridgeIndia
// behavior, ported from its core.js) — marketplace-specific shipping-label
// cropping and the previous pdf-lib dependency must not return.
if (mod.includes('getShippingLabelCrop') || mod.includes('MEESHO_HEADING_PATTERNS') || mod.includes('embedPage(') || mod.includes('PDFLib')) {
  throw new Error('pdf-segregator-4in1.js must not reintroduce content-derived cropping or the pdf-lib dependency');
}

// Marketplace/date detection must remain untouched by the 4-in-1 feature.
const detectors = fs.readFileSync('pdf-segregator-detectors.js', 'utf8');
if (detectors.includes('embedPage') || detectors.includes('PDFLib') || detectors.includes('buildFourInOnePdf')) {
  throw new Error('pdf-segregator-detectors.js must not be modified by the 4-in-1 feature');
}

console.log('PDF Segregator 4-in-1 regression checks passed');
