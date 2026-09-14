(function (global) {
	"use strict";

	var MASTER_B64 = "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";
	var MASTER_SHA256 = "03b2d206330a4683979cf9d2b63d54d2af13d8275f1e598b9e8abe3c0d4d55c9";

	var SHEET = {
		summary: "xl/worksheets/sheet1.xml",
		b2cs: "xl/worksheets/sheet2.xml",
		eco: "xl/worksheets/sheet3.xml",
		hsn: "xl/worksheets/sheet4.xml",
		json: "xl/worksheets/sheet5.xml"
	};

	var SIG_LH = 0x04034b50, SIG_CD = 0x02014b50, SIG_EOCD = 0x06054b50;

	function u16(b, o) { return b[o] | (b[o + 1] << 8); }
	function u32(b, o) { return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24); }

	function parseZip(buf) {
		var view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
		var n = buf.length;
		var eocd = -1;
		for (var i = n - 22; i >= Math.max(0, n - 22 - 65536); i--) {
			if (view.getUint32(i, true) === SIG_EOCD) { eocd = i; break; }
		}
		if (eocd < 0) throw new Error("zip: EOCD not found");
		var count = view.getUint16(eocd + 10, true);
		var cdOff = view.getUint32(eocd + 16, true);
		var entries = [];
		var p = cdOff;
		for (var k = 0; k < count; k++) {
			if (view.getUint32(p, true) !== SIG_CD) throw new Error("zip: bad central directory");
			var method = view.getUint16(p + 10, true);
			var csize = view.getUint32(p + 20, true);
			var nlen = view.getUint16(p + 28, true);
			var elen = view.getUint16(p + 30, true);
			var clen = view.getUint16(p + 32, true);
			var reloff = view.getUint32(p + 42, true);
			var name = decodeStr(buf.subarray(p + 46, p + 46 + nlen));
			var ds = reloff + 30 + u32(buf, reloff + 26) + u16(buf, reloff + 28);
			entries.push({ name: name, method: method, csize: csize, dataStart: ds });
			p += 46 + nlen + elen + clen;
		}
		return entries;
	}

	function decodeStr(u8) {
		var s = "";
		for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
		try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
	}

	var hasNode = typeof process !== "undefined" && process.versions && !!process.versions.node;

	function inflateRaw(u8) {
		if (hasNode) {
			return Promise.resolve(require("node:zlib").inflateRawSync(new Uint8Array(u8)));
		}
		var ds = new DecompressionStream("deflate-raw");
		var stream = new Blob([u8]).stream().pipeThrough(ds);
		return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
	}

	function deflateRaw(u8) {
		if (hasNode) {
			return Promise.resolve(require("node:zlib").deflateRawSync(new Uint8Array(u8)));
		}
		var cs = new CompressionStream("deflate-raw");
		var stream = new Blob([u8]).stream().pipeThrough(cs);
		return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
	}

	var CRC_TABLE = (function () {
		var t = new Uint32Array(256);
		for (var n = 0; n < 256; n++) {
			var c = n;
			for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
			t[n] = c >>> 0;
		}
		return t;
	})();

	function crc32(u8) {
		var c = 0xffffffff;
		for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	}

	function concat(chunks) {
		var len = 0, i;
		for (i = 0; i < chunks.length; i++) len += chunks[i].length;
		var out = new Uint8Array(len);
		var off = 0;
		for (i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length; }
		return out;
	}

	function buildZip(files) {
		var parts = [];
		var cd = [];
		var offset = 0;
		var d = new Date(2020, 0, 1);
		var date16 = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
		var time16 = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
		for (var f = 0; f < files.length; f++) {
			var file = files[f];
			var nameB = strBytes(file.name);
			var comp = file.comp;
			var crc = file.crc;
			var usize = file.usize;
			var csize = comp.length;
			var lh = new Uint8Array(30);
			var lv = new DataView(lh.buffer);
			lv.setUint32(0, SIG_LH, true);
			lv.setUint16(4, 20, true);
			lv.setUint16(6, 0x0800, true);
			lv.setUint16(8, 8, true);
			lv.setUint16(10, time16, true);
			lv.setUint16(12, date16, true);
			lv.setUint32(14, crc, true);
			lv.setUint32(18, csize, true);
			lv.setUint32(22, usize, true);
			lv.setUint16(26, nameB.length, true);
			lv.setUint16(28, 0, true);
			parts.push(lh, nameB, comp);
			var ce = new Uint8Array(46);
			var cv = new DataView(ce.buffer);
			cv.setUint32(0, SIG_CD, true);
			cv.setUint16(4, 20, true);
			cv.setUint16(6, 20, true);
			cv.setUint16(8, 0x0800, true);
			cv.setUint16(10, 8, true);
			cv.setUint16(12, time16, true);
			cv.setUint16(14, date16, true);
			cv.setUint32(16, crc, true);
			cv.setUint32(20, csize, true);
			cv.setUint32(24, usize, true);
			cv.setUint16(28, nameB.length, true);
			cv.setUint32(42, offset, true);
			cd.push(concat([ce, nameB]));
			offset += lh.length + nameB.length + comp.length;
		}
		var cdBuf = concat(cd);
		var eocd = new Uint8Array(22);
		var ev = new DataView(eocd.buffer);
		ev.setUint32(0, SIG_EOCD, true);
		ev.setUint16(4, 0, true);
		ev.setUint16(6, files.length, true);
		ev.setUint16(8, files.length, true);
		ev.setUint16(10, files.length, true);
		ev.setUint32(12, cdBuf.length, true);
		ev.setUint32(16, offset, true);
		return concat(parts.concat([cdBuf, eocd]));
	}

	function utf8Bytes(s) {
		var str = String(s);
		if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
		var out = [];
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if (c < 0x80) out.push(c);
			else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
			else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
				var lo = str.charCodeAt(i + 1);
				if (lo >= 0xdc00 && lo <= 0xdfff) {
					var cp = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00);
					out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
					i++;
					continue;
				}
			}
			out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
		}
		return new Uint8Array(out);
	}

	function strBytes(s) {
		return utf8Bytes(s);
	}

	function utf8String(u8) {
		if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8").decode(u8);
		var out = "";
		var i = 0;
		while (i < u8.length) {
			var b0 = u8[i];
			if (b0 < 0x80) { out += String.fromCharCode(b0); i++; continue; }
			var n = b0 < 0xe0 ? 1 : (b0 < 0xf0 ? 2 : 3);
			if (i + n >= u8.length) { out += "\uFFFD"; break; }
			var cp = b0 & (n === 1 ? 0x1f : n === 2 ? 0x0f : 0x07);
			for (var k = 1; k <= n; k++) cp = (cp << 6) | (u8[i + k] & 0x3f);
			if (cp > 0xffff) {
				cp -= 0x10000;
				out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
			} else {
				out += String.fromCharCode(cp);
			}
			i += n + 1;
		}
		return out;
	}

	function u8Str(u8) {
		return utf8String(u8);
	}

	function b64Decode(b64) {
		if (hasNode) {
			return new Uint8Array(require("node:buffer").Buffer.from(b64, "base64"));
		}
		var bin = atob(b64);
		var out = new Uint8Array(bin.length);
		for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
		return out;
	}

	var TEMPLATE_BYTES = b64Decode(MASTER_B64);
	var ZIP_ENTRIES = parseZip(TEMPLATE_BYTES);

	var SHEET_XML_CACHE = null;
	function rawOf(e) { return TEMPLATE_BYTES.subarray(e.dataStart, e.dataStart + e.csize); }
	function getSheetXml(name) {
		if (SHEET_XML_CACHE) return Promise.resolve(name ? SHEET_XML_CACHE[name] : SHEET_XML_CACHE);
		var jobs = {};
		var self = this;
		return Promise.all(ZIP_ENTRIES.filter(function (e) {
			return e.name === SHEET.summary || e.name === SHEET.b2cs || e.name === SHEET.eco || e.name === SHEET.hsn || e.name === SHEET.json;
		}).map(function (e) {
			if (e.method === 0) {
				jobs[e.name] = Promise.resolve(u8Str(rawOf(e)));
				return null;
			}
			return inflateRaw(rawOf(e)).then(function (d) { jobs[e.name] = u8Str(d); });
		})).then(function () {
			SHEET_XML_CACHE = jobs;
			return jobs;
		});
	}

	function sanitize(s) {
		var str = String(s);
		var out = "";
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if (c === 9 || c === 10 || c === 13) { out += str[i]; continue; }
			if (c < 32 || c === 0xFFFE || c === 0xFFFF) continue;
			out += str[i];
		}
		return out;
	}

	function esc(s) {
		return sanitize(String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
	}

	function fmtNum(n) {
		var v = (typeof n === "number" && isFinite(n)) ? n : (Number(n) || 0);
		var r = Math.round(v * 100) / 100;
		return String(r);
	}

	function splitSheet(xml) {
		var openTag = "<x:sheetData>";
		var closeTag = "</x:sheetData>";
		var i0 = xml.indexOf(openTag);
		var i1 = xml.indexOf(closeTag);
		if (i0 < 0 || i1 < 0) throw new Error("master sheet xml missing sheetData");
		var before = xml.slice(0, i0 + openTag.length);
		var body = xml.slice(i0 + openTag.length, i1);
		var after = xml.slice(i1);
		var rows = body.match(/<x:row[\s\S]*?<\/x:row>/g) || [];
		return { before: before, after: after, rows: rows };
	}

	function colIndex(col) {
		var n = 0;
		for (var i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
		return n - 1;
	}

	function colLetter(idx) {
		var s = "";
		idx = idx + 1;
		while (idx > 0) { var m = (idx - 1) % 26; s = String.fromCharCode(65 + m) + s; idx = Math.floor((idx - 1) / 26); }
		return s;
	}

	function renderDataRow(donorXml, rowIndex, cells) {
		var withRow = donorXml.replace(/r="\d+"/, 'r="' + rowIndex + '"');
		return withRow.replace(/<x:c r="([A-Z]+)\d+"([^>]*)>[\s\S]*?<\/x:c>/g, function (whole, col, attrs) {
			var cell = cells[colIndex(col)];
			if (!cell) return whole;
var sAttr = /s="\d+"/.exec(attrs);
		var s = sAttr ? " " + sAttr[0] : "";
		var ref = col + rowIndex;
			if (cell.kind === "s") {
				return '<x:c r="' + ref + '"' + s + ' t="str"><x:v>' + esc(cell.text) + '</x:v></x:c>';
			}
			return '<x:c r="' + ref + '"' + s + '><x:v>' + fmtNum(cell.text) + '</x:v></x:c>';
		});
	}

	function renderRows(xml, headerCount, startRow, rowsOfCells) {
		var parts = splitSheet(xml);
		var keep = parts.rows.slice(0, headerCount);
		var donors = parts.rows.slice(headerCount);
		var out = [];
		for (var i = 0; i < rowsOfCells.length; i++) {
			var donor = donors[i % donors.length];
			out.push(renderDataRow(donor, startRow + i, rowsOfCells[i]));
		}
		return parts.before + keep.join("") + out.join("") + parts.after;
	}

	function setCell(xml, ref, kind, text) {
		var re = new RegExp('<x:c r="' + ref + '"([^>]*)>[\\s\\S]*?<\\/x:c>');
		var m = re.exec(xml);
		if (!m) throw new Error("master cell not found: " + ref);
		var sAttr = /s="\d+"/.exec(m[1]);
		var s = sAttr ? " " + sAttr[0] : "";
		var t = kind === "s" ? ' t="str"' : (/t="n"/.test(m[1]) ? ' t="n"' : "");
		var rep = '<x:c r="' + ref + '"' + s + t + '><x:v>' + (kind === "s" ? esc(text) : fmtNum(text)) + '</x:v></x:c>';
		return xml.replace(re, rep);
	}

	function computeSummary(doc) {
		var d = doc || {};
		var num = function (v) { return fmtNum(v); };
		var cnt = function (v) { return fmtNum(Number(v) || 0); };
		var str = function (v) { return v === undefined || v === null ? "" : String(v); };
		var igst = num(d.igst), cgst = num(d.cgst), sgst = num(d.sgst), cess = num(d.cess);
		var netGst = fmtNum((Number(d.igst) || 0) + (Number(d.cgst) || 0) + (Number(d.sgst) || 0) + (Number(d.cess) || 0));
		return {
			gstin: str(d.gstin), periodLabel: str(d.periodLabel), platform: str(d.platform),
			txval: num(d.txval), igst: igst, cgst: cgst, sgst: sgst, cess: cess, netGst: netGst,
			b2csCount: cnt(d.b2csCount), b2bCount: cnt(d.b2bCount), b2clCount: cnt(d.b2clCount),
			cdnCount: cnt(d.cdnCount), ecomCount: cnt(d.ecomCount), hsnCount: cnt(d.hsnCount)
		};
	}

	function b2csCells(row) {
		return [
			{ kind: "s", text: row.splyType },
			{ kind: "n", text: row.gstRate },
			{ kind: "s", text: row.type },
			{ kind: "s", text: row.pos },
			{ kind: "s", text: row.posName },
			{ kind: "n", text: row.txval },
			{ kind: "n", text: row.igst },
			{ kind: "n", text: row.cgst },
			{ kind: "n", text: row.sgst },
			{ kind: "n", text: row.cess }
		];
	}

	function ecoCells(row) {
		return [
			{ kind: "s", text: row.etin },
			{ kind: "n", text: row.suppval },
			{ kind: "n", text: row.igst },
			{ kind: "n", text: row.cgst },
			{ kind: "n", text: row.sgst },
			{ kind: "n", text: row.cess },
			{ kind: "s", text: row.flag }
		];
	}

	function hsnCells(row) {
		return [
			{ kind: "s", text: row.hsn },
			{ kind: "n", text: row.gstRate },
			{ kind: "n", text: row.qty },
			{ kind: "n", text: row.txval },
			{ kind: "n", text: row.tax },
			{ kind: "n", text: row.invoiceValue },
			{ kind: "n", text: row.igst },
			{ kind: "n", text: row.cgst },
			{ kind: "n", text: row.sgst }
		];
	}

	function fillSummary(xml, doc) {
		var S = computeSummary(doc);
		xml = setCell(xml, "A6", "s", S.gstin);
		xml = setCell(xml, "C6", "s", S.periodLabel);
		xml = setCell(xml, "E6", "s", S.platform);
		xml = setCell(xml, "A9", "n", S.txval);
		xml = setCell(xml, "C9", "n", S.netGst);
		xml = setCell(xml, "E9", "n", S.b2csCount);
		xml = setCell(xml, "A14", "n", S.igst);
		xml = setCell(xml, "C14", "n", S.cgst);
		xml = setCell(xml, "E14", "n", S.sgst);
		xml = setCell(xml, "B17", "n", S.b2bCount);
		xml = setCell(xml, "D17", "n", S.b2clCount);
		xml = setCell(xml, "F17", "n", S.cdnCount);
		xml = setCell(xml, "B18", "n", S.ecomCount);
		xml = setCell(xml, "D18", "n", S.hsnCount);
		xml = setCell(xml, "F18", "n", S.cess);
		return xml;
	}

	function generate(doc) {
		var d = doc || {};
		return getSheetXml().then(function (xmls) {
			var edited = {};
			edited[SHEET.summary] = fillSummary(xmls[SHEET.summary], d);
			var b2cs = (d.b2cs || []).map(b2csCells);
			var eco = (d.eco || []).map(ecoCells);
			var hsn = (d.hsn || []).map(hsnCells);
			var lines = (d.jsonText || "").split("\n");
			var json = lines.map(function (line) { return [{ kind: "s", text: line }]; });
			edited[SHEET.b2cs] = renderRows(xmls[SHEET.b2cs], 1, 2, b2cs);
			edited[SHEET.eco] = renderRows(xmls[SHEET.eco], 1, 2, eco);
			edited[SHEET.hsn] = renderRows(xmls[SHEET.hsn], 1, 2, hsn);
			edited[SHEET.json] = renderRows(xmls[SHEET.json], 1, 3, json);
			var jobs = [];
			var files = [];
			var prep = ZIP_ENTRIES.map(function (e) {
				if (Object.prototype.hasOwnProperty.call(edited, e.name)) {
					return { name: e.name, data: strBytes(edited[e.name]) };
				}
				if (e.method === 0) return { name: e.name, data: rawOf(e) };
				return inflateRaw(rawOf(e)).then(function (d) { return { name: e.name, data: d }; });
			});
			return Promise.all(prep).then(function (resolved) {
resolved.forEach(function (r) {
				files.push({ name: r.name, data: r.data, crc: crc32(r.data), usize: r.data.length, comp: null });
				var idx = files.length - 1;
				jobs.push(deflateRaw(r.data).then(function (cmp) { files[idx].comp = cmp; }));
			});
				return Promise.all(jobs).then(function () {
					return buildZip(files);
				});
			});
		});
	}

	var MasterReport = {
		MASTER_BASE64: MASTER_B64,
		MASTER_SHA256: MASTER_SHA256,
		SHEET_FILES: SHEET,
		computeSummary: computeSummary,
		generate: generate,
		parseZip: parseZip,
		splitSheet: splitSheet,
		setCell: setCell,
		renderRows: renderRows,
		renderDataRow: renderDataRow,
		buildZip: buildZip,
		crc32: crc32,
		strBytes: strBytes,
		b64ToBytes: b64Decode
	};

	if (typeof module !== "undefined" && module.exports) {
		module.exports = MasterReport;
	} else {
		global.MasterReport = MasterReport;
	}
})(typeof globalThis !== "undefined" ? globalThis : this);