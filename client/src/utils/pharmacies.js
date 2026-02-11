const normalizeCountry = (country) => String(country || '').trim().toUpperCase();

export const filterPharmaciesForUser = (pharmacies = [], user) => {
  const list = Array.isArray(pharmacies) ? pharmacies : [];
  const role = String(user?.role || '').trim().toLowerCase();
  if (role === 'admin') return list;

  const country = normalizeCountry(user?.country);
  if (!country) return list;

  return list.filter((p) => normalizeCountry(p?.country) === country);
};

export const formatPharmacyLabel = (pharmacy) => {
  if (!pharmacy) return '';
  const name = pharmacy.name || pharmacy.id || '';
  const city = pharmacy.city || '';
  const province = pharmacy.province || pharmacy.state || '';
  const country = pharmacy.country || '';
  const address = pharmacy.address || '';

  const location = [city, province].filter(Boolean).join(', ');
  const suffix = [location || null, country || null, address || null].filter(Boolean).join(' — ');

  return suffix ? `${name} — ${suffix}` : name;
};
