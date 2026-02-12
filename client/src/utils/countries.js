export const OTHER_COUNTRY_CODE = 'OTHER';

const FALLBACK_COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' },
  { code: 'SG', label: 'Singapore' },
  { code: 'PH', label: 'Philippines' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'GH', label: 'Ghana' },
];

export const isOtherCountry = (code) => String(code || '').trim().toUpperCase() === OTHER_COUNTRY_CODE;

export const getCountryOptions = (locale = 'en-US', t = (s) => s) => {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function' && typeof Intl.DisplayNames === 'function') {
      const regions = Intl.supportedValuesOf('region') || [];
      const dn = new Intl.DisplayNames([locale], { type: 'region' });
      const options = regions
        .map((code) => ({ code, label: dn.of(code) || code }))
        .filter((o) => o.code && o.label)
        .sort((a, b) => a.label.localeCompare(b.label));

      return [...options, { code: OTHER_COUNTRY_CODE, label: t('Other') }];
    }
  } catch (err) {
    // fall back below
  }

  return [...FALLBACK_COUNTRIES, { code: OTHER_COUNTRY_CODE, label: t('Other') }];
};
