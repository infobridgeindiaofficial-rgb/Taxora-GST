import assert from 'node:assert/strict';
import { validateGSTIN, checkInvoiceNumbers } from '../gst-validators.js';

const valid = validateGSTIN('33ABCDE1234F1Z5');
assert.equal(valid.normalized, '33ABCDE1234F1Z5');
assert.equal(valid.lengthValid, true);
assert.equal(valid.formatValid, true);
assert.equal(valid.stateCode, '33');
assert.equal(valid.pan, 'ABCDE1234F');
assert.equal(valid.structureValid, true);

const bad = validateGSTIN('99ABC');
assert.equal(bad.structureValid, false);
assert.ok(bad.errors.length >= 1);

const batch = checkInvoiceNumbers('INV-001\nINV-002\nINV-002\nINV-004');
assert.equal(batch.total, 4);
assert.deepEqual(batch.duplicates, ['INV-002']);
assert.deepEqual(batch.gaps, ['INV-003']);
assert.equal(batch.invalid.length, 0);

const invalidBatch = checkInvoiceNumbers('INV 001\nTHIS-INVOICE-NUMBER-IS-WAY-TOO-LONG-1234567890');
assert.equal(invalidBatch.invalid.length, 2);

console.log('GST validator tests passed');
