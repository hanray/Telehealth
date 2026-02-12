const normalizeTier = (tier) => {
  const v = String(tier || '').trim().toLowerCase();
  if (v === 'free') return 'free';
  if (v === 'basic') return 'basic';
  if (v === 'premium') return 'premium';
  if (v === 'gold') return 'gold';
  // Back-compat: old 2-tier model
  if (v === 'pro') return 'premium';
  return 'free';
};
const normalizeStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'trialing') return 'trialing';
  if (s === 'expired') return 'expired';
  return 'active';
};

export const tierRank = (tier) => {
  const t = normalizeTier(tier);
  if (t === 'basic') return 1;
  if (t === 'premium') return 2;
  if (t === 'gold') return 3;
  return 0;
};

// Feature -> minimum tier required.
// Anything not listed here is treated as Free (to avoid accidental lockouts).
export const REQUIRED_TIER = {
  // Telehealth free
  telehealth: 'free',
  doctor_nurse_views: 'free',
  patient_list: 'free',
  patient_chart: 'free',
  medical_records: 'free',
  appointments_basic: 'free',
  labs_basic_view: 'free',
  messaging_chat: 'free',
  prescriptions_basic: 'free',
  notifications_basic: 'free',

  // MyHealth free
  myhealth: 'free',
  patient_dashboard: 'free',
  myhealth_appointments: 'free',
  myhealth_labs: 'free',
  myhealth_prescriptions_refills: 'free',
  myhealth_messages: 'free',
  myhealth_records: 'free',

  // HomeCare free
  homecare: 'free',
  homecare_basic_tasks: 'free',
  homecare_shift_flow: 'free',
  homecare_patient_lists_records: 'free',

  // Paid features (previously "pro")
  triage_automation: 'basic',
  intake_sending: 'basic',
  triage_completion: 'basic',
  follow_ups: 'basic',

  lab_ordering: 'premium',
  provider_assignment: 'premium',
  escalations: 'premium',
  clinic_ops: 'premium',
  admin_config: 'premium',

  // Keep analytics as top tier for now.
  analytics: 'gold',
};

export const getRequiredTier = (featureKey) => {
  const key = String(featureKey || '').trim();
  if (!key) return 'free';
  return REQUIRED_TIER[key] || 'free';
};

export const canAccess = (featureKey, subscription) => {
  const key = String(featureKey || '').trim();
  if (!key) return false;

  const status = normalizeStatus(subscription?.status);
  const currentTier = normalizeTier(subscription?.tier);
  const requiredTier = getRequiredTier(key);

  // Free features are always accessible.
  if (tierRank(requiredTier) === 0) return true;

  // Paid features require an active (or trialing) subscription.
  if (!(status === 'active' || status === 'trialing')) return false;

  return tierRank(currentTier) >= tierRank(requiredTier);
};
