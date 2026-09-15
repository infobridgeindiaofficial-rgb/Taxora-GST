(function () {
  const GST_STATE_NAMES = {
    '01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh','05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh','10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur','15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal','20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat','26':'Dadra and Nagar Haveli and Daman and Diu','27':'Maharashtra','29':'Karnataka','30':'Goa','31':'Lakshadweep','32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman & Nicobar Islands','36':'Telangana','37':'Andhra Pradesh','38':'Ladakh'
  };

  function validateGSTIN(input) {
    const normalized = String(input || '').trim().toUpperCase();
    const lengthValid = normalized.length === 15;
    const stateCode = normalized.slice(0, 2);
    const pan = normalized.slice(2, 12);
    const entityCode = normalized.slice(12, 13);
    const checksumChar = normalized.slice(14, 15);
    const formatValid = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(normalized);
    const stateCodeValid = /^\d{2}$/.test(stateCode) && Number(stateCode) >= 1 && Number(stateCode) <= 38;
    const errors = [];
    if (!normalized) errors.push('Enter a GSTIN.');
    if (normalized && !lengthValid) errors.push('GSTIN must contain exactly 15 characters.');
    if (lengthValid && !/^\d{2}$/.test(stateCode)) errors.push('The first 2 characters must be the state code.');
    if (lengthValid && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) errors.push('The PAN portion (characters 3–12) is not in the expected format.');
    if (lengthValid && !/^[A-Z0-9]$/.test(entityCode)) errors.push('The entity code (13th character) is invalid.');
    if (lengthValid && normalized.charAt(13) !== 'Z') errors.push('The 14th character must be Z in the GSTIN structure.');
    if (lengthValid && !/^[A-Z0-9]$/.test(checksumChar)) errors.push('The checksum position (15th character) is invalid.');
    if (lengthValid && !stateCodeValid) errors.push('The state code is outside the expected GST code range.');
    if (lengthValid && !formatValid && errors.length === 0) errors.push('GSTIN structure is invalid.');
    return { normalized, lengthValid, formatValid, stateCode, stateName: GST_STATE_NAMES[stateCode] || '', stateCodeValid, pan, entityCode, checksumChar, structureValid: Boolean(lengthValid && formatValid && stateCodeValid), errors };
  }

  function invoiceInvalidReason(value) {
    if (value.length > 16) return 'Maximum 16 characters allowed.';
    if (!/^[A-Za-z0-9/-]+$/.test(value)) return 'Use only letters, numbers, / and -.';
    return '';
  }

  function checkInvoiceNumbers(input) {
    const entries = String(input || '').split(/[\n,]+/).map(v => v.trim()).filter(Boolean);
    const invalid = [];
    const validEntries = [];
    const seen = new Map();
    const duplicateSet = new Set();
    for (const value of entries) {
      const reason = invoiceInvalidReason(value);
      if (reason) { invalid.push({ value, reason }); continue; }
      validEntries.push(value);
      const key = value.toUpperCase();
      if (seen.has(key)) duplicateSet.add(seen.get(key)); else seen.set(key, value);
    }
    const duplicates = [...duplicateSet];
    const uniqueValid = [...seen.values()];
    const gaps = [];
    const parsed = uniqueValid.map(value => {
      const m = value.match(/^(.*?)(\d+)$/);
      return m ? { value, prefix: m[1].toUpperCase(), number: Number(m[2]), width: m[2].length } : null;
    });
    if (parsed.length >= 2 && parsed.every(Boolean)) {
      const prefix = parsed[0].prefix;
      const width = parsed[0].width;
      if (parsed.every(p => p.prefix === prefix && p.width === width)) {
        const nums = [...new Set(parsed.map(p => p.number))].sort((a,b) => a-b);
        if (nums.length >= 2) {
          const set = new Set(nums);
          for (let n = nums[0]; n <= nums[nums.length - 1]; n++) if (!set.has(n)) gaps.push(prefix + String(n).padStart(width, '0'));
        }
      }
    }
    return { total: entries.length, validCount: validEntries.length, uniqueCount: uniqueValid.length, invalid, duplicates, gaps, normalized: entries };
  }

  function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
  function show(id) { const el = document.getElementById(id); if (el) el.style.display = 'grid'; }
  function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

  function runGSTINUI() {
    const input = document.getElementById('taxora-gstin-input');
    const resultBox = document.getElementById('taxora-gstin-result');
    if (!input || !resultBox) return;
    const r = validateGSTIN(input.value);
    resultBox.style.display = 'grid';
    const status = document.getElementById('taxora-gstin-status');
    if (status) { status.textContent = r.structureValid ? 'GSTIN structure looks valid' : 'GSTIN needs correction'; status.style.color = r.structureValid ? '#74D99F' : '#F0B7B7'; }
    setText('taxora-gstin-normalized', r.normalized || '—');
    setText('taxora-gstin-state', r.stateCode ? `${r.stateCode}${r.stateName ? ` — ${r.stateName}` : ''}` : '—');
    setText('taxora-gstin-pan', r.pan || '—');
    setText('taxora-gstin-entity', r.entityCode || '—');
    setText('taxora-gstin-errors', r.errors.length ? r.errors.join(' ') : 'No structural issues found.');
  }

  function runInvoiceUI() {
    const input = document.getElementById('taxora-invoice-input');
    const resultBox = document.getElementById('taxora-invoice-result');
    if (!input || !resultBox) return;
    const r = checkInvoiceNumbers(input.value);
    resultBox.style.display = 'grid';
    const clean = r.invalid.length === 0 && r.duplicates.length === 0 && r.gaps.length === 0 && r.total > 0;
    const status = document.getElementById('taxora-invoice-status');
    if (status) { status.textContent = clean ? 'Invoice numbers look clean' : (r.total ? 'Review the issues below' : 'Enter invoice numbers to check'); status.style.color = clean ? '#74D99F' : '#F0B7B7'; }
    setText('taxora-invoice-count', String(r.total));
    setText('taxora-invoice-duplicates', r.duplicates.length ? r.duplicates.join(', ') : 'None');
    setText('taxora-invoice-gaps', r.gaps.length ? r.gaps.join(', ') : 'None');
    setText('taxora-invoice-invalid', r.invalid.length ? r.invalid.map(x => `${x.value}: ${x.reason}`).join(' | ') : 'None');
  }

  window.TaxoraValidators = { validateGSTIN, checkInvoiceNumbers };
  window.TaxoraValidatorUI = {
    openGSTIN: function () { show('taxora-gstin-modal'); },
    closeGSTIN: function () { hide('taxora-gstin-modal'); },
    validateGSTIN: runGSTINUI,
    openInvoices: function () { show('taxora-invoice-modal'); },
    closeInvoices: function () { hide('taxora-invoice-modal'); },
    checkInvoices: runInvoiceUI
  };
})();
