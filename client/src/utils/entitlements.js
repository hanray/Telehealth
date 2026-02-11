const normalizeTier = (tier) => (String(tier || '').trim().toLowerCase() === 'pro' ? 'pro' : 'free');
const normalizeStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'trialing') return 'trialing';
  if (s === 'expired') return 'expired';
  return 'active';
};

// Entitlement map (must match spec exactly)
export const ENTITLEMENTS = {
  free: {
    // Telehealth
    telehealth: true,
    doctor_nurse_views: true,
    patient_list: true,
    patient_chart: true,
    medical_records: true,
    appointments_basic: true,
    labs_basic_view: true,
    messaging_chat: true,
    prescriptions_basic: true,
    notifications_basic: true,

    // MyHealth
    myhealth: true,
    patient_dashboard: true,
    myhealth_appointments: true,
    myhealth_labs: true,
    myhealth_prescriptions_refills: true,
    myhealth_messages: true,
    myhealth_records: true,

    // HomeCare
    homecare: true,
    homecare_basic_tasks: true,
    homecare_shift_flow: true,
    homecare_patient_lists_records: true,
  },
  pro: {
    // Everything in Free plus:
    // Nurse workflows
    triage_automation: true,
    intake_sending: true,
    triage_completion: true,
    follow_ups: true,
    lab_ordering: true,

    // Provider coordination
    provider_assignment: true,
    escalations: true,

    // Clinic ops
    clinic_ops: true,

    // Admin configuration
    admin_config: true,

    // Analytics
    analytics: true,
  },
};

export const isProActive = (subscription) => {
  const tier = normalizeTier(subscription?.tier);
  const status = normalizeStatus(subscription?.status);
  return tier === 'pro' && (status === 'active' || status === 'trialing');
};

export const canAccess = (featureKey, subscription) => {
  const key = String(featureKey || '').trim();
  if (!key) return false;

  const tier = isProActive(subscription) ? 'pro' : 'free';

  if (ENTITLEMENTS.free[key]) return true;
  if (tier === 'pro' && ENTITLEMENTS.pro[key]) return true;

  return false;
};
