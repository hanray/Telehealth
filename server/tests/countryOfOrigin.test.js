const test = require('node:test');
const assert = require('node:assert/strict');

const { parseCountryOfOrigin, hasCountryOfOrigin } = require('../utils/countryOfOrigin');

test('parseCountryOfOrigin accepts ISO alpha-2 code', () => {
  const res = parseCountryOfOrigin({ countryCode: 'us' }, { source: 'signup', required: true });
  assert.equal(res.ok, true);
  assert.equal(res.value.countryCode, 'US');
  assert.equal(res.value.countryOtherText, null);
  assert.equal(res.value.countrySource, 'signup');
});

test('parseCountryOfOrigin requires specify text for OTHER', () => {
  const res = parseCountryOfOrigin({ countryCode: 'OTHER' }, { source: 'onboarding', required: true });
  assert.equal(res.ok, false);
});

test('parseCountryOfOrigin sanitizes specify text and enforces length', () => {
  const res = parseCountryOfOrigin(
    { countryCode: 'OTHER', countryOtherText: '  Côte d\'Ivoire  ✅✅ ' },
    { source: 'profile', required: true }
  );
  assert.equal(res.ok, true);
  assert.equal(res.value.countryCode, 'OTHER');
  assert.match(res.value.countryOtherText, /Côte d'Ivoire/);
});

test('hasCountryOfOrigin detects valid stored values', () => {
  assert.equal(hasCountryOfOrigin({ countryOfOrigin: { countryCode: 'CA' } }), true);
  assert.equal(hasCountryOfOrigin({ countryOfOrigin: { countryCode: 'OTHER', countryOtherText: 'Ghana' } }), true);
  assert.equal(hasCountryOfOrigin({ countryOfOrigin: { countryCode: 'OTHER', countryOtherText: '' } }), false);
});
