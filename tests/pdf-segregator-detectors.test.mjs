import assert from 'node:assert/strict';
import detectors from '../pdf-segregator-detectors.js';
const { detectMarketplace, detectDate, formatDisplayDate, extractOrderIdentifier } = detectors;

// --- Marketplace detection ---------------------------------------------------

const amazon = detectMarketplace('Ship To: Jane Doe\nOrder ID: 171-1234567-1234567\nFulfilled by Amazon\namazon.in');
assert.equal(amazon.marketplace, 'Amazon');
assert.equal(amazon.confidence, 'high');

const flipkart = detectMarketplace('Flipkart Internet Private Limited\nOrder ID: OD123456789012345\nFSN: ABC123');
assert.equal(flipkart.marketplace, 'Flipkart');

const meesho = detectMarketplace('Meesho.com\nFulfilled by Meesho\nReturn Address');
assert.equal(meesho.marketplace, 'Meesho');

const weak = detectMarketplace('This package was delivered fast, thanks amazon!');
assert.equal(weak.marketplace, null, 'a single weak mention should not be enough to classify');

const ambiguous = detectMarketplace('amazon.in and flipkart.com both mentioned, order id OD123456789012345, 171-1234567-1234567');
assert.equal(ambiguous.marketplace, null, 'conflicting strong signals must not be guessed');

const none = detectMarketplace('Just some random invoice text with no marketplace signal at all.');
assert.equal(none.marketplace, null);

// Real Meesho "Sub_Order_Labels_*.pdf" invoices never print the word "Meesho" anywhere
// (the seller generates the bill of supply, not the marketplace) — the old brand-name-only
// rules scored 0 and sent all of these to "Marketplace not detected". This text mirrors
// the structural signals confirmed present across 13 real samples: a sub-order id in the
// form <long-digit-id>_<n>, the "Original For Recipient" invoice heading, "Enrolment No.",
// and a "Product Details" table heading — with no marketplace brand name at all.
const meshoNoBrandName = detectMarketplace(
  'Product Details SKU Size Qty Color Order No. n2gcd-vbyxZOorsQSZ Free Size 1 Brown 332318070202076544_1 ' +
  'BILL OF SUPPLY/COMMERCIAL INVOICE Original For Recipient Enrolment No. - 332600092636ES3'
);
assert.equal(meshoNoBrandName.marketplace, 'Meesho', 'brand-less Meesho invoices must still be classified from structural signals');

// The Meesho sub-order id pattern must not fire on Amazon's or Flipkart's own id formats.
const amazonNotMeesho = detectMarketplace('Order Number: 408-2431102-1265951 Fulfilled by Amazon amazon.in');
assert.equal(amazonNotMeesho.marketplace, 'Amazon');
const flipkartNotMeesho = detectMarketplace('Order Id: OD338648559580556100 E-Kart Logistics Flipkart.com');
assert.equal(flipkartNotMeesho.marketplace, 'Flipkart');

// --- Date detection -----------------------------------------------------------

const withKeyword = detectDate('Invoice Number: 123\nOrder Date: 22 Sep 2026\nSome other date 01/01/2020 mentioned far below.'.padEnd(200, ' ') + 'ignore 05-05-2019');
assert.equal(withKeyword.date, '2026-09-22');
assert.equal(formatDisplayDate(withKeyword.date), '22 Sep 2026');

const isoStyle = detectDate('Label generated on 2026-09-22 for shipment.');
assert.equal(isoStyle.date, '2026-09-22');

const dmy = detectDate('Order Placed: 22/09/2026');
assert.equal(dmy.date, '2026-09-22');

const singleImplicit = detectDate('Some header text\n22 Sep 2026\nfooter text');
assert.equal(singleImplicit.date, '2026-09-22');

const ambiguousDate = detectDate('Dates found: 01 Jan 2025 and 15 Mar 2024, no keyword nearby, far apart.'.padEnd(300, ' '));
assert.equal(ambiguousDate.date, null, 'multiple unrelated dates with no keyword must not be guessed');

const noDate = detectDate('No date anywhere in this text.');
assert.equal(noDate.date, null);

// Dot-separated DD.MM.YYYY, as printed by real Amazon invoices: "Order Date: 12.08.2026".
// This format was previously unsupported and caused real Amazon PDFs (with no other
// date field present) to be wrongly routed to "Date not detected".
const dotFormat = detectDate('Invoice Number : IN-2  Order Date: 12.08.2026   Invoice Details : TN-922810673-2627');
assert.equal(dotFormat.date, '2026-08-12');

const dotFormatNoOtherDate = detectDate('N-1  Order Date: 07.08.2026   Invoice Details : TN-922810673-2627 Invoice Date : 07.08.2026');
assert.equal(dotFormatNoOtherDate.date, '2026-08-07');

// Explicit label priority: "Order Date" must win over "Invoice Date" even when the
// Invoice Date appears earlier in the document — priority is by label meaning, not
// by document order.
const priorityOrder = detectDate('Invoice Date: 01.01.2025 far earlier in the text. '.padEnd(120, ' ') + 'Order Date: 22.09.2026 appears later.');
assert.equal(priorityOrder.date, '2026-09-22', 'higher-priority label must win over an earlier-positioned lower-priority label');

// --- Order-identifier extraction (used for duplicate-PDF detection) ----------

assert.equal(
  extractOrderIdentifier('Order Number: 408-1064426-4391530 Fulfilled by Amazon amazon.in', 'Amazon'),
  '408-1064426-4391530'
);
assert.equal(extractOrderIdentifier('No order number here at all.', 'Amazon'), null);

assert.equal(
  extractOrderIdentifier('Order Id: OD338656128967546100 E-Kart Logistics', 'Flipkart'),
  'OD338656128967546100'
);
assert.equal(
  extractOrderIdentifier('order id: od338656128967546100 lowercase variant', 'Flipkart'),
  'OD338656128967546100',
  'Flipkart order id must normalize to uppercase'
);

// Meesho: the sub-order suffix distinguishes legitimate separate shipments
// under the same parent order — the key must include it, not just the parent.
assert.equal(
  extractOrderIdentifier('Order No. 332318070202076544_1 Product Details', 'Meesho'),
  '332318070202076544_1'
);
const subOrder2 = extractOrderIdentifier('Order No. 332318070202076544_2 Product Details', 'Meesho');
assert.notEqual(subOrder2, '332318070202076544_1', 'different sub-order suffixes must not produce the same key');

assert.equal(extractOrderIdentifier('some text', 'UnknownMarketplace'), null);
assert.equal(extractOrderIdentifier('', 'Amazon'), null);

console.log('PDF Segregator detector tests passed');
