// PDF Segregator — "Create 4-in-1" engine.
//
// This is a direct port of the proven InfoBridgeIndia shipping-label-4in1
// engine (src/shipping-label-4in1/core.js): it hand-parses the PDF object/
// content-stream structure of each source file (no external PDF library),
// then builds a brand-new PDF that embeds each source PAGE, byte-for-byte,
// as a vector Form XObject inside a quarter of an A4 sheet. No rasterization
// anywhere — barcodes, QR codes, fonts and text stay exactly as sharp as the
// source PDF. Only the UI-integration adapter at the bottom (create4in1) is
// Taxora-specific; everything above it is the ported InfoBridgeIndia core,
// unchanged in behavior.
//
// Kept isolated from the UI (pdf-segregator.html) and from the marketplace/
// date detectors (pdf-segregator-detectors.js) — neither is read or affected
// by this file. No external library is loaded (InfoBridgeIndia's engine has
// none) — the previous pdf-lib CDN dependency has been removed.

(function () {
  'use strict';

  var BYTE_ENCODING = 'windows-1252'; // 1 byte <-> 1 char, safe for structural scanning

  // ---------------------------------------------------------------------------
  // Low-level PDF object model parsing (ported from InfoBridgeIndia core.js)
  // ---------------------------------------------------------------------------

  function isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n' || ch === '\f' || ch === '\0';
  }
  function isDelimiter(ch) {
    return '()<>[]{}/%'.indexOf(ch) !== -1;
  }

  function parseValue(s, pos) {
    pos = skipWs(s, pos);
    var ch = s[pos];
    if (ch === undefined) return [null, pos];
    if (ch === '<' && s[pos + 1] === '<') return parseDict(s, pos);
    if (ch === '<') return parseHexString(s, pos);
    if (ch === '(') return parseLiteralString(s, pos);
    if (ch === '/') return parseName(s, pos);
    if (ch === '[') return parseArray(s, pos);
    if (/[0-9+\-.]/.test(ch)) return parseNumberOrRef(s, pos);
    if (s.startsWith('true', pos)) return [true, pos + 4];
    if (s.startsWith('false', pos)) return [false, pos + 5];
    if (s.startsWith('null', pos)) return [null, pos + 4];
    var p = pos;
    while (p < s.length && !isWhitespace(s[p]) && !isDelimiter(s[p])) p++;
    return [{ raw: s.slice(pos, Math.max(p, pos + 1)) }, Math.max(p, pos + 1)];
  }

  function skipWs(s, pos) {
    for (;;) {
      while (pos < s.length && isWhitespace(s[pos])) pos++;
      if (s[pos] === '%') {
        while (pos < s.length && s[pos] !== '\n' && s[pos] !== '\r') pos++;
        continue;
      }
      return pos;
    }
  }

  function parseDict(s, pos) {
    pos += 2; // skip <<
    var dict = {};
    for (;;) {
      pos = skipWs(s, pos);
      if (s.startsWith('>>', pos)) return [dict, pos + 2];
      if (pos >= s.length) return [dict, pos];
      if (s[pos] !== '/') {
        pos++;
        continue;
      }
      var kv = parseName(s, pos);
      var key = kv[0], p1 = kv[1];
      var vv = parseValue(s, p1);
      var val = vv[0], p2 = vv[1];
      dict[key] = val;
      pos = p2;
    }
  }

  function parseArray(s, pos) {
    pos += 1;
    var arr = [];
    for (;;) {
      pos = skipWs(s, pos);
      if (s[pos] === ']') return [arr, pos + 1];
      if (pos >= s.length) return [arr, pos];
      var vv = parseValue(s, pos);
      arr.push(vv[0]);
      pos = vv[1];
    }
  }

  function parseName(s, pos) {
    pos += 1; // skip /
    var out = '';
    while (pos < s.length && !isWhitespace(s[pos]) && !isDelimiter(s[pos])) {
      if (s[pos] === '#' && /[0-9A-Fa-f]{2}/.test(s.slice(pos + 1, pos + 3))) {
        out += String.fromCharCode(parseInt(s.slice(pos + 1, pos + 3), 16));
        pos += 3;
      } else {
        out += s[pos];
        pos++;
      }
    }
    return ['/' + out, pos];
  }

  function parseHexString(s, pos) {
    pos += 1;
    var start = pos;
    while (pos < s.length && s[pos] !== '>') pos++;
    var hex = s.slice(start, pos).replace(/[^0-9A-Fa-f]/g, '');
    if (hex.length % 2) hex += '0';
    var bytes = [];
    for (var i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
    return [{ isString: true, bytes: bytes }, pos + 1];
  }

  function parseLiteralString(s, pos) {
    pos += 1;
    var depth = 1;
    var bytes = [];
    while (pos < s.length && depth > 0) {
      var ch = s[pos];
      if (ch === '\\') {
        var next = s[pos + 1];
        if (next === 'n') { bytes.push(10); pos += 2; }
        else if (next === 'r') { bytes.push(13); pos += 2; }
        else if (next === 't') { bytes.push(9); pos += 2; }
        else if (next === 'b') { bytes.push(8); pos += 2; }
        else if (next === 'f') { bytes.push(12); pos += 2; }
        else if (next === '(') { bytes.push(40); pos += 2; }
        else if (next === ')') { bytes.push(41); pos += 2; }
        else if (next === '\\') { bytes.push(92); pos += 2; }
        else if (next === '\r' || next === '\n') {
          pos += next === '\r' && s[pos + 2] === '\n' ? 3 : 2;
        } else if (/[0-7]/.test(next)) {
          var oct = '';
          pos += 1;
          for (var i = 0; i < 3 && /[0-7]/.test(s[pos]); i++) { oct += s[pos]; pos++; }
          bytes.push(parseInt(oct, 8) & 0xff);
        } else {
          bytes.push(next.charCodeAt(0));
          pos += 2;
        }
        continue;
      }
      if (ch === '(') { depth++; bytes.push(40); pos++; continue; }
      if (ch === ')') { depth--; pos++; if (depth === 0) break; bytes.push(41); continue; }
      bytes.push(ch.charCodeAt(0) & 0xff);
      pos++;
    }
    return [{ isString: true, bytes: bytes }, pos];
  }

  function parseNumberOrRef(s, pos) {
    var m = /^[+\-]?\d+(\.\d+)?|^[+\-]?\.\d+/.exec(s.slice(pos));
    if (!m) return [0, pos + 1];
    var numText = m[0];
    var next = pos + numText.length;
    var after = skipWs(s, next);
    if (!isNaN(Number(numText)) && Number.isInteger(Number(numText))) {
      var genMatch = /^(\d+)\s+R\b/.exec(s.slice(after));
      if (genMatch) {
        return [{ ref: Number(numText), gen: Number(genMatch[1]) }, after + genMatch[0].length];
      }
    }
    return [Number(numText), next];
  }

  function scanObjects(text, bytes) {
    var objects = new Map();
    var starts = [];
    var startRe = /(\d+)[ \t]+(\d+)[ \t]+obj\b/g;
    var m;
    while ((m = startRe.exec(text))) {
      starts.push({ num: Number(m[1]), bodyStart: m.index + m[0].length, matchStart: m.index });
    }
    for (var i = 0; i < starts.length; i++) {
      var cur = starts[i];
      var boundary = i + 1 < starts.length ? starts[i + 1].matchStart : text.length;
      var endIdx = text.indexOf('endobj', cur.bodyStart);
      if (endIdx === -1 || endIdx > boundary) endIdx = boundary;
      var body = text.slice(cur.bodyStart, endIdx);
      var dict = parseValue(body, 0)[0];
      var stream = null;
      var streamIdx = body.indexOf('stream');
      if (streamIdx !== -1 && dict && typeof dict === 'object' && !Array.isArray(dict)) {
        var sPos = cur.bodyStart + streamIdx + 'stream'.length;
        if (text[sPos] === '\r' && text[sPos + 1] === '\n') sPos += 2;
        else if (text[sPos] === '\n') sPos += 1;
        var length = dict['/Length'];
        if (length && typeof length === 'object' && 'ref' in length) {
          length = null;
        }
        var endStreamIdx = text.indexOf('endstream', sPos);
        var sEnd = typeof length === 'number' ? sPos + length : endStreamIdx;
        if (typeof length === 'number') {
          var check = text.slice(sPos + length, sPos + length + 20);
          if (!/^\s*endstream/.test(check)) sEnd = endStreamIdx === -1 ? boundary : endStreamIdx;
        }
        if (sEnd === -1) sEnd = boundary;
        stream = { byteStart: sPos, byteEnd: sEnd, lengthRef: length === null ? dict['/Length'] : null };
      }
      objects.set(cur.num, { dict: dict, stream: stream });
    }
    objects.forEach(function (obj) {
      if (obj.stream && obj.stream.lengthRef) {
        var target = objects.get(obj.stream.lengthRef.ref);
        var len = target && typeof target.dict === 'number' ? target.dict : null;
        if (typeof len === 'number') {
          obj.stream.byteEnd = obj.stream.byteStart + len;
        }
      }
    });
    return objects;
  }

  function resolve(objects, val) {
    if (val && typeof val === 'object' && 'ref' in val && !Array.isArray(val)) {
      var target = objects.get(val.ref);
      return target ? target.dict : null;
    }
    return val;
  }

  async function inflate(bytes, format) {
    try {
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (e) {
      return new Uint8Array(0);
    }
  }

  function asciiHexDecode(bytes) {
    var text = String.fromCharCode.apply(null, bytes).split('>')[0].replace(/[^0-9A-Fa-f]/g, '');
    var out = new Uint8Array(Math.ceil(text.length / 2));
    for (var i = 0; i < out.length; i++) out[i] = parseInt(text.slice(i * 2, i * 2 + 2).padEnd(2, '0'), 16);
    return out;
  }

  function ascii85Decode(bytes) {
    var text = String.fromCharCode.apply(null, bytes).replace(/~>$/, '');
    var out = [];
    var group = [];
    for (var idx = 0; idx < text.length; idx++) {
      var ch = text[idx];
      if (ch === 'z' && group.length === 0) { out.push(0, 0, 0, 0); continue; }
      if (ch.charCodeAt(0) < 33 || ch.charCodeAt(0) > 117) continue;
      group.push(ch.charCodeAt(0) - 33);
      if (group.length === 5) {
        var val = 0;
        for (var g = 0; g < group.length; g++) val = val * 85 + group[g];
        out.push((val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff);
        group = [];
      }
    }
    if (group.length > 1) {
      var n = group.length;
      while (group.length < 5) group.push(84);
      var val2 = 0;
      for (var g2 = 0; g2 < group.length; g2++) val2 = val2 * 85 + group[g2];
      var full = [(val2 >>> 24) & 0xff, (val2 >>> 16) & 0xff, (val2 >>> 8) & 0xff, val2 & 0xff];
      out.push.apply(out, full.slice(0, n - 1));
    }
    return new Uint8Array(out);
  }

  // Decodes a stream object's content to raw bytes. Only used for the (rare)
  // case of a page whose /Contents is an array of several stream objects,
  // which must be concatenated as plain operator text before re-embedding.
  // The common single-stream case never calls this - it copies the original
  // compressed bytes untouched instead, for maximum fidelity and speed.
  async function decodeStream(bytes, obj) {
    if (!obj.stream) return new Uint8Array(0);
    var raw = bytes.subarray(obj.stream.byteStart, Math.max(obj.stream.byteStart, obj.stream.byteEnd));
    var filters = obj.dict['/Filter'];
    if (!filters) return raw;
    if (!Array.isArray(filters)) filters = [filters];
    var data = raw;
    for (var i = 0; i < filters.length; i++) {
      var f = filters[i];
      var name = typeof f === 'string' ? f : '';
      if (name === '/FlateDecode' || name === '/Fl') {
        data = await inflate(data, 'deflate');
      } else if (name === '/ASCIIHexDecode' || name === '/AHx') {
        data = asciiHexDecode(data);
      } else if (name === '/ASCII85Decode' || name === '/A85') {
        data = ascii85Decode(data);
      } else {
        return new Uint8Array(0); // unsupported filter - skip rather than corrupt
      }
    }
    return data;
  }

  function findCatalog(objects) {
    var found = null;
    objects.forEach(function (obj) {
      if (!found && obj.dict && obj.dict['/Type'] === '/Catalog') found = obj.dict;
    });
    return found;
  }

  function collectPages(objects) {
    var catalog = findCatalog(objects);
    var ordered = [];
    var seen = new Set();
    function walk(nodeRef, depth) {
      if (depth > 64 || !nodeRef) return;
      var node = nodeRef && typeof nodeRef === 'object' && 'ref' in nodeRef ? objects.get(nodeRef.ref) : null;
      if (!node || !node.dict || seen.has(nodeRef.ref)) return;
      seen.add(nodeRef.ref);
      var dict = node.dict;
      if (dict['/Type'] === '/Page') { ordered.push({ ref: nodeRef.ref, dict: dict }); return; }
      if (Array.isArray(dict['/Kids'])) {
        for (var i = 0; i < dict['/Kids'].length; i++) walk(dict['/Kids'][i], depth + 1);
      }
    }
    if (catalog && catalog['/Pages']) walk(catalog['/Pages'], 0);
    if (ordered.length) return ordered;
    var fallback = [];
    var nums = Array.from(objects.keys()).sort(function (a, b) { return a - b; });
    for (var i = 0; i < nums.length; i++) {
      var obj = objects.get(nums[i]);
      if (obj.dict && obj.dict['/Type'] === '/Page') fallback.push({ ref: nums[i], dict: obj.dict });
    }
    return fallback;
  }

  function inheritedResources(objects, pageDict) {
    var d = pageDict;
    var depth = 0;
    while (d && depth < 64) {
      if (d['/Resources']) return resolve(objects, d['/Resources']) || {};
      var parent = d['/Parent'];
      d = parent && typeof parent === 'object' && 'ref' in parent ? (objects.get(parent.ref) || {}).dict : null;
      depth++;
    }
    return {};
  }

  function inheritedMediaBox(objects, pageDict) {
    var d = pageDict;
    var depth = 0;
    while (d && depth < 64) {
      if (d['/MediaBox']) {
        var raw = resolve(objects, d['/MediaBox']);
        if (Array.isArray(raw) && raw.length === 4) {
          var nums = raw.map(function (v) { var r = resolve(objects, v); return typeof r === 'number' ? r : 0; });
          return [Math.min(nums[0], nums[2]), Math.min(nums[1], nums[3]), Math.max(nums[0], nums[2]), Math.max(nums[1], nums[3])];
        }
      }
      var parent = d['/Parent'];
      d = parent && typeof parent === 'object' && 'ref' in parent ? (objects.get(parent.ref) || {}).dict : null;
      depth++;
    }
    return [0, 0, 595.28, 841.89]; // fall back to A4
  }

  function inheritedRotate(objects, pageDict) {
    var d = pageDict;
    var depth = 0;
    while (d && depth < 64) {
      if (d['/Rotate'] !== undefined) {
        var r = resolve(objects, d['/Rotate']);
        if (typeof r === 'number') return r;
      }
      var parent = d['/Parent'];
      d = parent && typeof parent === 'object' && 'ref' in parent ? (objects.get(parent.ref) || {}).dict : null;
      depth++;
    }
    return 0;
  }

  // ---------------------------------------------------------------------------
  // Document parsing entry point
  // ---------------------------------------------------------------------------

  async function parsePdfDocument(arrayBuffer) {
    var bytes = new Uint8Array(arrayBuffer);
    var text = new TextDecoder(BYTE_ENCODING).decode(bytes);
    if (!text.startsWith('%PDF-')) {
      var e1 = new Error('This file does not look like a valid PDF.');
      e1.code = 'NOT_PDF';
      throw e1;
    }

    var objects = scanObjects(text, bytes);
    if (!objects.size) {
      var e2 = new Error('No readable content was found in this PDF.');
      e2.code = 'EMPTY';
      throw e2;
    }

    var encrypted = false;
    objects.forEach(function (obj) {
      if (obj.dict && obj.dict['/Type'] === '/Encrypt') encrypted = true;
    });
    if (encrypted || /trailer[\s\S]*?\/Encrypt/.test(text)) {
      var e3 = new Error("This PDF is password-protected or encrypted and can't be processed in the browser.");
      e3.code = 'ENCRYPTED';
      throw e3;
    }

    var pages = collectPages(objects);
    if (!pages.length) {
      var e4 = new Error('No pages could be found in this PDF.');
      e4.code = 'NO_PAGES';
      throw e4;
    }

    return { objects: objects, bytes: bytes, pages: pages, cache: new Map() };
  }

  // ---------------------------------------------------------------------------
  // PDF object graph deep-copy (source objects -> new document's object space)
  // ---------------------------------------------------------------------------

  function createBuilder() {
    var objects = new Map(); // num -> { dict, streamBytes }
    var nextNum = 1;
    return {
      reserve: function () {
        return nextNum++;
      },
      setObject: function (num, dict, streamBytes) {
        var finalDict = dict;
        if (streamBytes != null) {
          finalDict = dict && typeof dict === 'object' && !Array.isArray(dict) ? Object.assign({}, dict) : {};
          finalDict['/Length'] = streamBytes.length;
        }
        objects.set(num, { dict: finalDict, streamBytes: streamBytes || null });
      },
      addObject: function (dict, streamBytes) {
        var num = nextNum++;
        this.setObject(num, dict, streamBytes);
        return num;
      },
      get maxNum() {
        return nextNum - 1;
      },
      entries: function () {
        return objects;
      }
    };
  }

  // Recursively copies a value from a source document into the builder's new
  // object space, following indirect references (and copying their targets)
  // so the new document is fully self-contained. Names/numbers/strings/arrays/
  // dicts are copied structurally; only {ref} markers trigger a subgraph copy.
  function transformValue(sourceCtx, builder, val) {
    if (val === null || val === undefined) return null;
    if (Array.isArray(val)) return val.map(function (v) { return transformValue(sourceCtx, builder, v); });
    if (typeof val === 'object') {
      if (val.isString) return val;
      if (val.raw !== undefined) return val;
      if ('ref' in val) return { ref: copySubgraph(sourceCtx, builder, val.ref), gen: 0 };
      var out = {};
      var keys = Object.keys(val);
      for (var i = 0; i < keys.length; i++) out[keys[i]] = transformValue(sourceCtx, builder, val[keys[i]]);
      return out;
    }
    return val; // number, name-string, boolean
  }

  // Copies one indirect object (and, transitively, everything it references)
  // from the source document into the new document. Reserves the new object
  // number before recursing so cyclic references can't cause infinite loops,
  // and caches per-source so shared resources (e.g. a font used by every page
  // of a multi-page label PDF) are embedded once, not once per slip.
  function copySubgraph(sourceCtx, builder, sourceNum) {
    if (sourceCtx.cache.has(sourceNum)) return sourceCtx.cache.get(sourceNum);
    var newNum = builder.reserve();
    sourceCtx.cache.set(sourceNum, newNum);
    var obj = sourceCtx.objects.get(sourceNum);
    if (!obj) {
      builder.setObject(newNum, {}, null);
      return newNum;
    }
    var newDict = transformValue(sourceCtx, builder, obj.dict);
    var streamBytes = null;
    if (obj.stream) {
      streamBytes = sourceCtx.bytes.slice(obj.stream.byteStart, Math.max(obj.stream.byteStart, obj.stream.byteEnd));
    }
    builder.setObject(newNum, newDict, streamBytes);
    return newNum;
  }

  // ---------------------------------------------------------------------------
  // Rotation compensation
  // ---------------------------------------------------------------------------

  function normalizeRotate(deg) {
    var r = ((Math.round(deg || 0) % 360) + 360) % 360;
    return Math.round(r / 90) * 90 % 360;
  }

  // Maps a source page's own (unrotated) content-stream coordinate space onto
  // a Form XObject's parent space so it displays with the same orientation
  // /Rotate asks a normal PDF viewer to apply, with the result's origin moved
  // to (0,0) and no negative coordinates - ready to scale straight into an A4
  // quadrant. [a b c d e f] per PDF 32000-1 8.3.4: x'=a*x+c*y+e, y'=b*x+d*y+f.
  function rotationMatrix(mediabox, rotate) {
    var x0 = mediabox[0], y0 = mediabox[1], x1 = mediabox[2], y1 = mediabox[3];
    var W = x1 - x0;
    var H = y1 - y0;
    switch (rotate) {
      case 90: return [0, -1, 1, 0, -y0, W + x0];
      case 180: return [-1, 0, 0, -1, W + x0, H + y0];
      case 270: return [0, 1, -1, 0, H + y0, -x0];
      default: return [1, 0, 0, 1, -x0, -y0];
    }
  }

  function effectiveSize(mediabox, rotate) {
    var W = mediabox[2] - mediabox[0];
    var H = mediabox[3] - mediabox[1];
    return rotate === 90 || rotate === 270 ? { effW: H, effH: W } : { effW: W, effH: H };
  }

  // The physical source label is always the complete inherited MediaBox. Never
  // substitute CropBox/TrimBox/ArtBox or a content-derived bounding box: blank
  // space inside the page is part of the shipping label's original layout.
  function sourcePageGeometry(objects, pageDict) {
    var pageBox = inheritedMediaBox(objects, pageDict);
    var rotate = normalizeRotate(inheritedRotate(objects, pageDict));
    var sz = effectiveSize(pageBox, rotate);
    if (!(sz.effW > 0 && sz.effH > 0)) {
      var e = new Error('The source PDF page has an invalid MediaBox.');
      e.code = 'INVALID_PAGE_BOX';
      throw e;
    }
    return { pageBox: pageBox, rotate: rotate, effW: sz.effW, effH: sz.effH };
  }

  // ---------------------------------------------------------------------------
  // A4 4-up layout
  // ---------------------------------------------------------------------------

  var A4_WIDTH = 595.28; // 210mm in points
  var A4_HEIGHT = 841.89; // 297mm in points
  // Fixed geometry measured from the InfoBridgeIndia reference.pdf. These
  // coordinates are the source of truth for this tool; do not derive them
  // from generic page margins or quarter-page padding.
  var REFERENCE_SCALE = 0.4169;
  var REFERENCE_SOURCE_WIDTH = 595;
  var REFERENCE_SOURCE_HEIGHT = 842;
  var SLOT_WIDTH = 248.03;
  var SLOT_HEIGHT = 351;
  var BORDER_WIDTH = 0.85;
  var SLOT_POSITIONS = [
    { x: 42.5197, y: 438.2029 },
    { x: 304.7244, y: 438.2029 },
    { x: 42.5197, y: 52.6911 },
    { x: 304.7244, y: 52.6911 }
  ];

  // Slot order is fixed: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right.
  function slotBox(index) {
    var position = SLOT_POSITIONS[index];
    if (!position) throw new RangeError('Shipping-label slot index must be between 0 and 3.');
    return { x: position.x, y: position.y, w: SLOT_WIDTH, h: SLOT_HEIGHT };
  }

  function referencePlacement(effW, effH, box) {
    if (Math.abs(effW - REFERENCE_SOURCE_WIDTH) < 0.01 && Math.abs(effH - REFERENCE_SOURCE_HEIGHT) < 0.01) {
      return {
        scale: REFERENCE_SCALE,
        placedW: effW * REFERENCE_SCALE,
        placedH: effH * REFERENCE_SCALE,
        offX: box.x,
        offY: box.y
      };
    }
    return computePlacement(effW, effH, box);
  }

  // Proportionally fits a effW x effH box into a slot, preserving aspect ratio
  // and centring it - never stretches, crops, or overflows the slot.
  function computePlacement(effW, effH, box) {
    var scale = Math.min(box.w / effW, box.h / effH);
    var placedW = effW * scale;
    var placedH = effH * scale;
    return {
      scale: scale,
      placedW: placedW,
      placedH: placedH,
      offX: box.x + (box.w - placedW) / 2,
      offY: box.y + (box.h - placedH) / 2
    };
  }

  // ---------------------------------------------------------------------------
  // PDF value serialization (writer side)
  // ---------------------------------------------------------------------------

  function formatNumber(n) {
    if (!isFinite(n)) return '0';
    if (Number.isInteger(n)) return String(n);
    var s = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    return s === '' || s === '-' ? '0' : s;
  }

  function serializeName(name) {
    var out = '/';
    var rest = name.slice(1);
    for (var i = 0; i < rest.length; i++) {
      var ch = rest[i];
      var code = ch.codePointAt(0);
      if (code < 33 || code > 126 || '()<>[]{}/%#'.indexOf(ch) !== -1) {
        out += '#' + code.toString(16).padStart(2, '0');
      } else {
        out += ch;
      }
    }
    return out;
  }

  function serializeHexString(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return '<' + hex + '>';
  }

  function serializeValue(val) {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return formatNumber(val);
    if (typeof val === 'string') return val[0] === '/' ? serializeName(val) : val;
    if (Array.isArray(val)) return '[' + val.map(serializeValue).join(' ') + ']';
    if (val.isString) return serializeHexString(val.bytes);
    if (val.raw !== undefined) return val.raw;
    if ('ref' in val) return val.ref + ' 0 R';
    var parts = [];
    var keys = Object.keys(val);
    for (var i = 0; i < keys.length; i++) parts.push(serializeName(keys[i]) + ' ' + serializeValue(val[keys[i]]));
    return '<< ' + parts.join(' ') + ' >>';
  }

  // Assembles the finished PDF file (classic cross-reference table) from every
  // object the builder has accumulated.
  function writePdf(builder, rootNum) {
    var encoder = new TextEncoder();
    var chunks = [];
    var offset = 0;
    function push(data) {
      var bytes = typeof data === 'string' ? encoder.encode(data) : data;
      chunks.push(bytes);
      offset += bytes.length;
    }

    push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // %PDF-1.7\n%<binary>\n

    var maxNum = builder.maxNum;
    var entries = builder.entries();
    var offsets = new Array(maxNum + 1).fill(0);
    for (var num = 1; num <= maxNum; num++) {
      offsets[num] = offset;
      var entry = entries.get(num) || { dict: {}, streamBytes: null };
      push(num + ' 0 obj\n' + serializeValue(entry.dict) + '\n');
      if (entry.streamBytes) {
        push('stream\n');
        push(entry.streamBytes);
        push('\nendstream\n');
      }
      push('endobj\n');
    }

    var xrefOffset = offset;
    push('xref\n0 ' + (maxNum + 1) + '\n0000000000 65535 f \n');
    for (var num2 = 1; num2 <= maxNum; num2++) {
      push(offsets[num2].toString().padStart(10, '0') + ' 00000 n \n');
    }
    push('trailer\n<< /Size ' + (maxNum + 1) + ' /Root ' + rootNum + ' 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF');

    var total = 0;
    for (var i = 0; i < chunks.length; i++) total += chunks[i].length;
    var out = new Uint8Array(total);
    var p = 0;
    for (var j = 0; j < chunks.length; j++) { out.set(chunks[j], p); p += chunks[j].length; }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Embedding one source page as a Form XObject
  // ---------------------------------------------------------------------------

  async function embedSlipAsForm(builder, sourceCtx, pageDict) {
    var geom = sourcePageGeometry(sourceCtx.objects, pageDict);
    var pageBox = geom.pageBox, rotate = geom.rotate, effW = geom.effW, effH = geom.effH;
    var resources = inheritedResources(sourceCtx.objects, pageDict);
    var newResources = transformValue(sourceCtx, builder, resources);

    var contentBytes;
    var filterVal = null;
    var decodeParmsVal = null;
    var contentsVal = pageDict['/Contents'];

    if (contentsVal && typeof contentsVal === 'object' && !Array.isArray(contentsVal) && 'ref' in contentsVal) {
      // Common case: a single content stream - copy its original (still
      // compressed) bytes untouched for maximum fidelity and speed.
      var obj = sourceCtx.objects.get(contentsVal.ref);
      if (obj && obj.stream) {
        contentBytes = sourceCtx.bytes.slice(obj.stream.byteStart, Math.max(obj.stream.byteStart, obj.stream.byteEnd));
        filterVal = obj.dict['/Filter'] || null;
        decodeParmsVal = obj.dict['/DecodeParms'] || obj.dict['/DP'] || null;
      } else {
        contentBytes = new Uint8Array(0);
      }
    } else if (Array.isArray(contentsVal)) {
      // Multiple content streams: must decode and concatenate as operator
      // text, since each may be independently (and differently) compressed.
      var parts = [];
      for (var i = 0; i < contentsVal.length; i++) {
        var ref = contentsVal[i];
        var o = ref && typeof ref === 'object' && 'ref' in ref ? sourceCtx.objects.get(ref.ref) : null;
        if (o) {
          parts.push(await decodeStream(sourceCtx.bytes, o));
          parts.push(new Uint8Array([0x0a]));
        }
      }
      var total = 0;
      for (var k = 0; k < parts.length; k++) total += parts[k].length;
      contentBytes = new Uint8Array(total);
      var off = 0;
      for (var m = 0; m < parts.length; m++) { contentBytes.set(parts[m], off); off += parts[m].length; }
    } else {
      contentBytes = new Uint8Array(0);
    }

    var formDict = {
      '/Type': '/XObject',
      '/Subtype': '/Form',
      '/FormType': 1,
      '/BBox': pageBox,
      '/Matrix': rotationMatrix(pageBox, rotate),
      '/Resources': newResources
    };
    if (filterVal) formDict['/Filter'] = transformValue(sourceCtx, builder, filterVal);
    if (decodeParmsVal) formDict['/DecodeParms'] = transformValue(sourceCtx, builder, decodeParmsVal);

    var formNum = builder.addObject(formDict, contentBytes);
    return { formNum: formNum, effW: effW, effH: effH };
  }

  // ---------------------------------------------------------------------------
  // Orchestrator
  // ---------------------------------------------------------------------------

  /**
   * Builds one printable A4 PDF containing every page of every input PDF,
   * four per sheet (top-left, top-right, bottom-left, bottom-right; a partial
   * final sheet only fills the leading slots and leaves the rest blank).
   *
   * files: [{name, bytes: Uint8Array|ArrayBuffer}]
   */
  async function buildFourInOnePdf(files, opts) {
    var onProgress = (opts && opts.onProgress) || null;
    if (!files || !files.length) {
      var eNo = new Error('Add at least one shipping-label PDF first.');
      eNo.code = 'NO_FILES';
      throw eNo;
    }

    var slips = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var doc;
      try {
        doc = await parsePdfDocument(file.bytes);
      } catch (err) {
        var wrapped = new Error('"' + file.name + '": ' + err.message);
        wrapped.code = err.code || 'PARSE_ERROR';
        throw wrapped;
      }
      for (var p = 0; p < doc.pages.length; p++) {
        slips.push({ sourceCtx: doc, pageDict: doc.pages[p].dict });
      }
    }
    if (!slips.length) {
      var eNp = new Error('No pages were found in the selected PDFs.');
      eNp.code = 'NO_PAGES';
      throw eNp;
    }

    var builder = createBuilder();
    var catalogNum = builder.reserve();
    var pagesNum = builder.reserve();
    var kids = [];
    var totalSheets = Math.ceil(slips.length / 4);

    for (var start = 0; start < slips.length; start += 4) {
      var group = slips.slice(start, start + 4);
      if (onProgress) onProgress(Math.floor(start / 4) + 1, totalSheets);

      var xobjectDict = {};
      var contentLines = [];
      for (var slot = 0; slot < group.length; slot++) {
        var slip = group[slot];
        var embedded = await embedSlipAsForm(builder, slip.sourceCtx, slip.pageDict);
        var box = slotBox(slot);
        var placement = referencePlacement(embedded.effW, embedded.effH, box);
        var name = 'S' + slot;
        xobjectDict['/' + name] = { ref: embedded.formNum, gen: 0 };
        // Contain scaling guarantees the complete source MediaBox fits inside
        // its quarter, so no clipping path is needed (or allowed) here.
        contentLines.push('q ' + formatNumber(placement.scale) + ' 0 0 ' + formatNumber(placement.scale) + ' ' + formatNumber(placement.offX) + ' ' + formatNumber(placement.offY) + ' cm /' + name + ' Do Q');
        contentLines.push('q ' + formatNumber(BORDER_WIDTH) + ' w 0 G ' + formatNumber(box.x) + ' ' + formatNumber(box.y) + ' ' + formatNumber(box.w) + ' ' + formatNumber(box.h) + ' re S Q');
      }

      var contentBytes = new TextEncoder().encode(contentLines.join('\n') + '\n');
      var contentNum = builder.addObject({}, contentBytes);
      var pageDict = {
        '/Type': '/Page',
        '/Parent': { ref: pagesNum, gen: 0 },
        '/MediaBox': [0, 0, A4_WIDTH, A4_HEIGHT],
        '/Resources': { '/XObject': xobjectDict, '/ProcSet': ['/PDF'] },
        '/Contents': { ref: contentNum, gen: 0 }
      };
      var pageNum = builder.addObject(pageDict, null);
      kids.push({ ref: pageNum, gen: 0 });
    }

    builder.setObject(pagesNum, { '/Type': '/Pages', '/Kids': kids, '/Count': kids.length }, null);
    builder.setObject(catalogNum, { '/Type': '/Catalog', '/Pages': { ref: pagesNum, gen: 0 } }, null);

    var bytes = writePdf(builder, catalogNum);
    return { bytes: bytes, slipCount: slips.length, pageCount: kids.length };
  }

  // ---------------------------------------------------------------------------
  // Taxora integration adapter
  // ---------------------------------------------------------------------------
  // The engine above is the ported InfoBridgeIndia core, unmodified in
  // behavior. This is the only Taxora-specific part: it reads each selected
  // entry's ORIGINAL File, adapts to buildFourInOnePdf's {name, bytes} input
  // shape, and maps results/errors onto the existing UI contract
  // ({success, bytes, pageCount} or {success:false, failures}).

  // items: array of entries ({ file }) in the exact order they should be
  // placed — must be the same order as the current Date+Marketplace list.
  async function create4in1(items) {
    var files = [];
    for (var i = 0; i < items.length; i++) {
      var entry = items[i];
      try {
        var buf = await entry.file.arrayBuffer();
        files.push({ name: entry.file.name, bytes: new Uint8Array(buf) });
      } catch (err) {
        return { success: false, failures: [{ name: entry.file.name, reason: 'This PDF could not be read.' }] };
      }
    }

    try {
      var result = await buildFourInOnePdf(files);
      return { success: true, bytes: result.bytes, pageCount: result.pageCount };
    } catch (err) {
      // buildFourInOnePdf prefixes per-file parse errors as `"<name>": <reason>`
      // (see the loop in buildFourInOnePdf above) — recover the filename when
      // present so the UI can point at the specific problem file.
      var m = /^"([^"]*)":\s*([\s\S]*)$/.exec(err.message || '');
      if (m) {
        return { success: false, failures: [{ name: m[1], reason: m[2] }] };
      }
      return { success: false, failures: [{ name: 'Selected files', reason: err.message || 'PDF generation failed.' }] };
    }
  }

  window.TaxoraPdf4in1 = {
    create4in1: create4in1
  };
})();
