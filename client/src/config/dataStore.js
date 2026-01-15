// Bump key to force-refresh seeded demo data (medications, labs, etc.)
const DATA_KEY = 'telehealth.clinicData.v5';
const CONFIG_KEY = 'telehealth.config.v1';

const defaultConfig = {
  clinicName: 'Skyward Telehealth',
  banner: null,
  appointmentTypes: ['General Consultation', 'Follow-up', 'Lab Review', 'Prescription Refill'],
  features: {
    chat: true,
    labs: true,
    billing: false,
    nurseWorkflows: true,
  },
};

const seedPharmacies = [
  { id: 'pharm1', name: 'City Pharmacy', address: '123 Main St', phone: '+1-555-1111', active: true, updatedAt: new Date().toISOString() },
  { id: 'pharm2', name: 'Community Pharmacy', address: '45 Elm Ave', phone: '+1-555-2222', active: true, updatedAt: new Date().toISOString() },
  { id: 'pharm3', name: 'Downtown Pharmacy', address: '77 Market Rd', phone: '+1-555-3333', active: true, updatedAt: new Date().toISOString() },
];

const seedPlans = [
  { id: 'plan_basic', name: 'Basic', price: 20, currency: 'CAD', interval: 'month', active: true },
  { id: 'plan_plus', name: 'Plus', price: 40, currency: 'CAD', interval: 'month', active: true },
];

const defaultData = {
  pharmacies: seedPharmacies,
  plans: seedPlans,
  subscriptions: [],
  transactions: [],
  notifications: [],
  homecareTasks: [],
  // Cases / encounters (telehealth workflow state)
  cases: [
    {
      caseId: 'case_patient-001_001',
      patientId: 'patient-001',
      createdByUserId: 'nurse1',
      createdAt: new Date().toISOString(),
      assignedProviders: [],
      assignmentRequests: [],
      escalations: [],
      status: 'triage',
      title: 'Call back regarding dizziness',
      severity: 'high',
      triageStatus: 'open',
      specialistRequested: false,
    },
    {
      caseId: 'case_patient-002_001',
      patientId: 'patient-002',
      createdByUserId: 'nurse1',
      createdAt: new Date().toISOString(),
      assignedProviders: [],
      assignmentRequests: [],
      escalations: [],
      status: 'triage',
      title: 'Schedule follow-up for labs',
      severity: 'medium',
      triageStatus: 'open',
      specialistRequested: true,
      specialistRole: 'specialist',
    },
  ],
  drugList: [
    { id: 'rx-atorvastatin-20', name: 'Atorvastatin', strength: '20 mg', route: 'PO', frequency: 'daily', duration: '30 days' },
    { id: 'rx-lisinopril-10', name: 'Lisinopril', strength: '10 mg', route: 'PO', frequency: 'daily', duration: '30 days' },
    { id: 'rx-amlodipine-5', name: 'Amlodipine', strength: '5 mg', route: 'PO', frequency: 'daily', duration: '30 days' },
    { id: 'rx-metformin-500', name: 'Metformin', strength: '500 mg', route: 'PO', frequency: 'BID with meals', duration: '90 days' },
    { id: 'rx-empagliflozin-10', name: 'Empagliflozin', strength: '10 mg', route: 'PO', frequency: 'daily', duration: '90 days' },
    { id: 'rx-insulin-glargine-10', name: 'Insulin Glargine', strength: '10 units', route: 'SC', frequency: 'bedtime', duration: '30 days' },
    { id: 'rx-cephalexin-500', name: 'Cephalexin', strength: '500 mg', route: 'PO', frequency: 'QID', duration: '7 days' },
    { id: 'rx-amoxicillin-500', name: 'Amoxicillin', strength: '500 mg', route: 'PO', frequency: 'TID', duration: '7 days' },
    { id: 'rx-azithro-250', name: 'Azithromycin', strength: '250 mg', route: 'PO', frequency: '500 mg day 1 then 250 mg daily x4', duration: '5 days' },
    { id: 'rx-ibuprofen-400', name: 'Ibuprofen', strength: '400 mg', route: 'PO', frequency: 'q6h PRN pain', duration: '5 days' },
    { id: 'rx-acetaminophen-500', name: 'Acetaminophen', strength: '500 mg', route: 'PO', frequency: 'q6h PRN fever', duration: '5 days' },
    { id: 'rx-ondansetron-4', name: 'Ondansetron', strength: '4 mg', route: 'PO', frequency: 'q8h PRN nausea', duration: '5 days' },
    { id: 'rx-pantoprazole-40', name: 'Pantoprazole', strength: '40 mg', route: 'PO', frequency: 'daily', duration: '30 days' },
    { id: 'rx-furosemide-40', name: 'Furosemide', strength: '40 mg', route: 'PO', frequency: 'daily', duration: '14 days' },
    { id: 'rx-warfarin-5', name: 'Warfarin', strength: '5 mg', route: 'PO', frequency: 'daily per INR', duration: '30 days' },
  ],
  prescriptions: [],
  patients: [
    {
      id: 'patient-001',
      name: 'Alex Carter',
      fullName: 'Alex Carter',
      dob: '1988-02-14',
      sex: 'M',
      bloodType: 'O+',
      email: 'alex.carter@example.com',
      phone: '+1 (555) 123-1111',
      address: '123 Main St, Accra, Ghana',
      preferredPharmacyId: 'pharm1',
      preferredPharmacyOtherText: '',
      messages: [
        {
          from: 'Dr. Smith',
          subject: 'Test Results Available',
          preview: 'Your recent blood work results are now available.',
          date: '2025-09-09',
          unread: true,
        },
        {
          from: 'Nurse Johnson',
          subject: 'Appointment Reminder',
          preview: 'Reminder of your appointment on September 15th at 10:00 AM.',
          date: '2025-09-08',
          unread: false,
        },
        {
          from: 'Dr. Johnson',
          subject: 'Follow-up Instructions',
          preview: 'Please continue monitoring your BP at home.',
          date: '2025-09-07',
          unread: false,
        },
      ],
      medicalRecord: {
        profile: {
          fullName: 'Alex Carter',
          dob: '1988-02-14',
          sex: 'M',
          phone: '+1 (555) 123-1111',
          email: 'alex.carter@example.com',
          address: '123 Main St, Accra, Ghana',
          bloodType: 'O+',
        },
        allergies: ['Penicillin'],
        medications: [
          {
            name: 'Lisinopril 10mg',
            sig: '10mg once daily',
            status: 'active',
            refillsRemaining: 3,
            prescribedBy: 'Dr. Emily Smith',
            datePrescribed: '2025-08-15',
            instructions: 'Take with food. Monitor blood pressure.',
          },
          {
            name: 'Metformin 500mg',
            sig: '500mg twice daily',
            status: 'active',
            refillsRemaining: 2,
            prescribedBy: 'Dr. Emily Smith',
            datePrescribed: '2025-07-10',
            instructions: 'Take with meals.',
          },
          {
            name: 'Atorvastatin 20mg',
            sig: '20mg once daily at bedtime',
            status: 'active',
            refillsRemaining: 0,
            prescribedBy: 'Dr. Emily Smith',
            datePrescribed: '2025-05-02',
            instructions: 'Take at bedtime.',
          },
          {
            name: 'Amlodipine 5mg',
            sig: '5mg once daily',
            status: 'active',
            refillsRemaining: 1,
            prescribedBy: 'Dr. Emily Smith',
            datePrescribed: '2025-12-18',
            instructions: 'Take in the morning. Monitor BP.',
          },
        ],
        insurance: {
          provider: 'Ghana Health Insurance',
          policyNumber: 'GHI-2024-789456',
          groupNumber: 'GRP-001234',
          memberId: 'MEM-001234567',
          effectiveDate: '2024-01-01',
          expirationDate: '2024-12-31',
          planType: 'Gold Plus',
        },
        problems: [
          { name: 'Hypertension', status: 'active' },
          { name: 'Hyperlipidemia', status: 'active' },
        ],
        encounters: [
          { date: '2025-12-10', type: 'Follow-up', provider: 'Dr. Smith', notes: 'BP improved, continue regimen.' },
          { date: '2025-09-01', type: 'Telehealth consult', provider: 'Dr. Johnson', notes: 'Discussed lifestyle modifications.' },
        ],
        labs: [
          { test: 'CBC with Differential', date: '2026-01-02', status: 'pending_review', summary: 'Mild leukocytosis; clinical correlation advised.' },
          { test: 'Lipid Panel', date: '2025-11-20', status: 'completed', summary: 'LDL 110 mg/dL, triglycerides normal.' },
        ],
        imaging: [
          { study: 'Chest X-Ray', date: '2025-12-20', status: 'completed' },
        ],
        immunizations: [
          { vaccine: 'Influenza', date: '2025-10-15' },
          { vaccine: 'COVID-19 Booster', date: '2025-09-10' },
        ],
        documents: [
          { title: 'Referral Letter.pdf', date: '2025-11-01', size: '250 KB' },
        ],
        notes: 'Prefers telehealth visits.',
      },
      history: [
        { title: 'Follow-up', date: '2025-12-10', summary: 'BP improved, continue regimen.' },
        { title: 'Annual exam', date: '2025-08-01', summary: 'Labs within normal limits.' },
      ],
    },
    {
      id: 'patient-002',
      name: 'Jamie Rivera',
      fullName: 'Jamie Rivera',
      dob: '1990-06-02',
      sex: 'F',
      bloodType: 'A+',
      email: 'jamie.rivera@example.com',
      phone: '+1 (555) 123-2222',
      address: '45 Palm Ave, Kumasi, Ghana',
      preferredPharmacyId: 'pharm2',
      preferredPharmacyOtherText: '',
      messages: [
        {
          from: 'Dr. Lee',
          subject: 'Dietary Guidance',
          preview: 'Please continue with the low-carb plan and send your glucose log next week.',
          date: '2025-09-05',
          unread: true,
        },
      ],
      medicalRecord: {
        profile: {
          fullName: 'Jamie Rivera',
          dob: '1990-06-02',
          sex: 'F',
          phone: '+1 (555) 123-2222',
          email: 'jamie.rivera@example.com',
          address: '45 Palm Ave, Kumasi, Ghana',
          bloodType: 'A+',
        },
        allergies: ['None'],
        medications: [
          { name: 'Metformin 500mg', sig: 'Twice daily with meals', status: 'active', refillsRemaining: 2, prescribedBy: 'Dr. Lee', datePrescribed: '2025-09-01' },
          { name: 'Lisinopril 5mg', sig: 'Daily', status: 'completed', refillsRemaining: 0, prescribedBy: 'Dr. Johnson', datePrescribed: '2025-06-10' },
          { name: 'Empagliflozin 10mg', sig: 'Once daily in the morning', status: 'active', refillsRemaining: 1, prescribedBy: 'Dr. Lee', datePrescribed: '2025-12-05', instructions: 'Hold if fasting glucose < 80.' },
        ],
        insurance: {
          provider: 'Blue Plus',
          policyNumber: 'BP-2024-555123',
          groupNumber: 'GRP-009900',
          memberId: 'MEM-00998877',
          effectiveDate: '2024-02-15',
          expirationDate: '2025-02-14',
          planType: 'Silver',
        },
        problems: [
          { name: 'Type 2 Diabetes', status: 'active' },
        ],
        encounters: [
          { date: '2025-11-15', type: 'Diabetes check', provider: 'Dr. Lee', notes: 'A1c 7.2, diet reinforced.' },
          { date: '2025-08-20', type: 'Lab Review', provider: 'Dr. Johnson', notes: 'Adjusted metformin dosing.' },
        ],
        labs: [
          { test: 'HbA1c', date: '2025-12-15', status: 'completed', summary: 'A1c 7.2, monitor.' },
        ],
        imaging: [
          { study: 'Foot X-Ray', date: '2025-07-01', status: 'completed' },
        ],
        immunizations: [
          { vaccine: 'Influenza', date: '2025-10-10' },
        ],
        documents: [
          { title: 'Glucose Log.pdf', date: '2025-11-12', size: '180 KB' },
        ],
        notes: 'Track fasting glucose weekly.',
      },
      history: [
        { title: 'DM check', date: '2025-11-15', summary: 'A1c 7.2, diet reinforced.' },
      ],
    },
  ],
  providers: [
    { id: 'doc1', name: 'Dr. Smith', role: 'doctor', specialty: 'Cardiology' },
    { id: 'doc2', name: 'Dr. Johnson', role: 'doctor', specialty: 'Family Medicine' },
    { id: 'nurse1', name: 'Nurse Lee', role: 'nurse', department: 'Tele-triage' },
    { id: 'psw1', name: 'PSW Jordan', role: 'psw', department: 'HomeCare' },
    { id: 'spec1', name: 'Dr. Patel', role: 'specialist', specialty: 'Dermatology' },
    { id: 'pharm1', name: 'Pharmacist Kim', role: 'pharmacist' },
  ],
  appointments: [
    {
      id: 'A-001',
      patientId: 'patient-001',
      patientName: 'Alex Carter',
      providerId: 'doc1',
      providerName: 'Dr. Smith',
      type: 'General Consultation',
      status: 'scheduled',
      priority: 'normal',
      notes: 'BP follow-up',
      startAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'A-002',
      patientId: 'patient-002',
      patientName: 'Jamie Rivera',
      providerId: 'doc2',
      providerName: 'Dr. Johnson',
      type: 'Lab Review',
      status: 'scheduled',
      priority: 'normal',
      notes: 'Review glucose log',
      startAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  labs: [
    {
      id: 'lab-001',
      patientId: 'patient-001',
      test: 'CBC with Differential',
      date: '2026-01-02',
      orderedBy: 'Dr. Smith',
      status: 'pending_review',
      summary: 'Mild leukocytosis; clinical correlation advised.',
      critical: false,
      components: [
        { name: 'WBC', value: '11.3', unit: 'x10^3/uL', range: '4.5 - 11.0' },
        { name: 'HGB', value: '13.5', unit: 'g/dL', range: '13.0 - 17.0' },
      ],
    },
    {
      id: 'lab-002',
      patientId: 'patient-001',
      test: 'Lipid Panel',
      date: '2025-11-20',
      orderedBy: 'Dr. Johnson',
      status: 'completed',
      summary: 'LDL improved; continue statin.',
      critical: false,
      components: [
        { name: 'Total Cholesterol', value: '185', unit: 'mg/dL', range: '< 200' },
        { name: 'LDL', value: '110', unit: 'mg/dL', range: '< 130' },
      ],
    },
    {
      id: 'lab-003',
      patientId: 'patient-002',
      test: 'HbA1c',
      date: '2025-12-15',
      orderedBy: 'Dr. Lee',
      status: 'completed',
      summary: 'A1c 7.2, monitor diet and exercise.',
      critical: false,
      components: [
        { name: 'A1c', value: '7.2', unit: '%', range: '4.0 - 5.6' },
      ],
    },
  ],
};

const readLocal = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed || fallback;
  } catch (err) {
    console.warn('[dataStore] falling back to default', err?.message || err);
    return fallback;
  }
};

const writeLocal = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[dataStore] failed to persist', err?.message || err);
  }
};

export const getClinicConfig = () => readLocal(CONFIG_KEY, defaultConfig);

export const updateClinicConfig = (updater) => {
  const current = getClinicConfig();
  const next = typeof updater === 'function' ? updater(current) : updater;
  writeLocal(CONFIG_KEY, next);
  window.dispatchEvent(new CustomEvent('clinicConfigChanged', { detail: next }));
  return next;
};

export const getClinicData = () => readLocal(DATA_KEY, defaultData);

export const updateClinicData = (updater) => {
  const current = getClinicData();
  const clone = JSON.parse(JSON.stringify(current));
  const next = typeof updater === 'function' ? updater(clone) : updater;
  writeLocal(DATA_KEY, next);
  window.dispatchEvent(new CustomEvent('clinicDataChanged', { detail: next }));
  return next;
};

export const onClinicDataChange = (handler) => {
  const fn = (evt) => handler(evt.detail || getClinicData());
  window.addEventListener('clinicDataChanged', fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener('clinicDataChanged', fn);
    window.removeEventListener('storage', fn);
  };
};

export const onClinicConfigChange = (handler) => {
  const fn = (evt) => handler(evt.detail || getClinicConfig());
  window.addEventListener('clinicConfigChanged', fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener('clinicConfigChanged', fn);
    window.removeEventListener('storage', fn);
  };
};
