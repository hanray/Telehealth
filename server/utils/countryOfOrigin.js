const ISO_CODE_RE = /^[A-Z]{2}$/;

const isoNow = () => new Date().toISOString();

const normalizeCountryCode = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return null;
  if (raw === 'OTHER') return 'OTHER';
  if (ISO_CODE_RE.test(raw)) return raw;
  return null;
};

const collapseWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const sanitizeFreeText = (value) => {
  // Allow letters/numbers and common punctuation used in names.
  // Remove emoji/symbol soup by stripping most non-letter/number characters.
  const collapsed = collapseWhitespace(value);
  // Keep unicode letters (\p{L}) + marks (\p{M}) for accents.
  const cleaned = collapsed
    .replace(/[^\p{L}\p{M}0-9 .,'\-()]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
};

const validateCountryOtherText = (value) => {
  const cleaned = sanitizeFreeText(value);
  if (!cleaned) return { ok: false, error: 'Specify country is required when selecting Other' };
  if (cleaned.length < 2) return { ok: false, error: 'Specify country must be at least 2 characters' };
  if (cleaned.length > 64) return { ok: false, error: 'Specify country is too long (max 64 characters)' };
  return { ok: true, value: cleaned };
};

const parseCountryOfOrigin = (input = {}, opts = {}) => {
  const required = opts.required !== false;
  const source = String(opts.source || 'profile').trim().toLowerCase();
  const countrySource = (source === 'signup' || source === 'profile' || source === 'onboarding') ? source : 'profile';

  // Back-compat: allow `country` to mean a country code.
  const countryCode = normalizeCountryCode(input.countryCode || input.country || input.country_code);
  const countryNameRaw = input.countryName || input.country_name || null;
  const countryName = countryNameRaw ? sanitizeFreeText(countryNameRaw) : null;

  if (required && !countryCode && !countryName) {
    return { ok: false, error: 'Country of origin is required' };
  }

  if (countryCode === 'OTHER') {
    const otherCheck = validateCountryOtherText(input.countryOtherText || input.country_other_text);
    if (!otherCheck.ok) return otherCheck;
    return {
      ok: true,
      value: {
        countryCode: 'OTHER',
        countryName: countryName || null,
        countryOtherText: otherCheck.value,
        countrySource,
        countryUpdatedAt: isoNow(),
      },
    };
  }

  if (countryCode && countryCode !== 'OTHER') {
    return {
      ok: true,
      value: {
        countryCode,
        countryName: countryName || null,
        countryOtherText: null,
        countrySource,
        countryUpdatedAt: isoNow(),
      },
    };
  }

  // If only a name is provided, store it as-is.
  if (countryName) {
    return {
      ok: true,
      value: {
        countryCode: null,
        countryName,
        countryOtherText: null,
        countrySource,
        countryUpdatedAt: isoNow(),
      },
    };
  }

  return { ok: false, error: 'Invalid country of origin' };
};

const hasCountryOfOrigin = (user) => {
  const coo = user?.countryOfOrigin || user?.country_of_origin || null;
  if (!coo) return false;
  const code = normalizeCountryCode(coo.countryCode);
  if (code === 'OTHER') return typeof coo.countryOtherText === 'string' && coo.countryOtherText.trim().length >= 2;
  if (code && ISO_CODE_RE.test(code)) return true;
  if (typeof coo.countryName === 'string' && coo.countryName.trim().length >= 2) return true;
  return false;
};

module.exports = {
  normalizeCountryCode,
  sanitizeFreeText,
  parseCountryOfOrigin,
  hasCountryOfOrigin,
};
