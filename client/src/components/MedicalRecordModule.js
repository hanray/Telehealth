// src/components/MedicalRecordModule.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Alert,
  ListGroup,
  Tabs,
  Tab,
  Table,
  Badge,
  InputGroup,
  Row,
  Col,
} from 'react-bootstrap';
import { formatPharmacyLabel } from '../utils/pharmacies';

const MedicalRecordModule = ({
  show,
  onHide,
  patients = [],
  initialPatientId = null,
  readOnly = false,
  onUpdatePatient,
  pharmacies = [],
  t = (str) => str,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [pharmacyPref, setPharmacyPref] = useState({ id: '', other: '' });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const emptyRecord = useMemo(() => ({
    admin: {
      mrn: '',
      admissionDate: '',
      dischargeDate: '',
    },
    profile: {
      fullName: '',
      dob: '',
      sex: 'Other',
      phone: '',
      email: '',
      address: '',
      bloodType: '',
    },
    emergencyContacts: [],
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      memberId: '',
      effectiveDate: '',
      expirationDate: '',
      planType: '',
    },
    allergies: [],
    medications: [],
    problems: [],
    history: {
      medical: '',
      surgical: '',
      family: '',
      social: '',
    },
    clinicalNotes: [],
    vitals: [],
    orders: {
      labs: [],
      imaging: [],
      medications: [],
      procedures: [],
    },
    results: {
      pathology: [],
      ecg: [],
    },
    carePlans: [],
    legal: {
      consents: [],
      advanceDirectives: [],
      privacyAcknowledgements: [],
    },
    encounters: [],
    labs: [],
    imaging: [],
    immunizations: [],
    documents: [],
  }), []);

  // Seeded fallback record used when a patient has no stored medicalRecord
  const seededRecord = useMemo(() => ({
    admin: {
      mrn: 'MRN-000123',
      admissionDate: today,
      dischargeDate: '',
    },
    profile: {
      fullName: 'Sample Patient',
      dob: '1992-04-10',
      sex: 'Female',
      phone: '+1 (555) 010-9000',
      email: 'sample.patient@example.com',
      address: '456 Market St, Accra, Ghana',
      bloodType: 'A+',
    },
    emergencyContacts: [
      { name: 'Jordan Patient', relationship: 'Spouse', phone: '+1 (555) 010-9001' },
    ],
    insurance: {
      provider: 'Ghana Health Insurance',
      policyNumber: 'GHI-2026-123456',
      groupNumber: 'GRP-002200',
      memberId: 'MEM-00998877',
      effectiveDate: today,
      expirationDate: today,
      planType: 'Silver',
    },
    allergies: ['Penicillin'],
    medications: [
      { name: 'Lisinopril 10mg', sig: '10mg once daily', status: 'active' },
      { name: 'Metformin 500mg', sig: '500mg twice daily with meals', status: 'active' },
    ],
    problems: [
      { name: 'Hypertension', status: 'active' },
      { name: 'Type 2 Diabetes', status: 'active' },
    ],
    history: {
      medical: 'Hypertension; Type 2 Diabetes (diagnosed 2020).',
      surgical: 'Appendectomy (2010).',
      family: 'Father: HTN. Mother: T2DM.',
      social: 'Non-smoker. Occasional alcohol. Exercises 2–3x/week.',
    },
    clinicalNotes: [
      { date: today, type: 'physician', author: 'Dr. Smith', title: 'Initial assessment', text: 'Telehealth intake completed. Reviewed meds/allergies. Discussed goals and follow-up.' },
    ],
    vitals: [
      { recordedAt: `${today}T09:00`, bp: '132/84', hr: 78, rr: 16, tempC: 36.8, spo2: 98, weightKg: 82.3, heightCm: 175 },
      { recordedAt: `${today}T09:15`, bp: '128/82', hr: 76, rr: 16, tempC: 36.7, spo2: 99, weightKg: 82.1, heightCm: 175 },
    ],
    orders: {
      labs: [{ orderedAt: today, test: 'CBC with Differential', priority: 'routine', status: 'ordered' }],
      imaging: [{ orderedAt: today, study: 'Chest X-Ray', priority: 'routine', status: 'ordered' }],
      medications: [{ orderedAt: today, medication: 'Lisinopril 10mg', sig: '10mg once daily', status: 'prescribed' }],
      procedures: [],
    },
    results: {
      pathology: [],
      ecg: [],
    },
    carePlans: [
      { date: today, plan: 'BP control and diabetes management', goals: 'BP < 130/80, A1c < 7.0', followUp: 'Follow up in 4 weeks with home BP log.' },
    ],
    legal: {
      consents: [{ title: 'Telehealth Consent', date: today, status: 'signed' }],
      advanceDirectives: [],
      privacyAcknowledgements: [{ title: 'Privacy Acknowledgement', date: today, status: 'acknowledged' }],
    },
    encounters: [
      {
        date: today,
        type: 'Telehealth consult',
        provider: 'Dr. Smith',
        notes: 'Baseline consult and medication reconciliation.',
      },
    ],
    labs: [
      {
        test: 'CBC with Differential',
        date: today,
        status: 'pending',
        summary: 'Awaiting review by clinician.',
      },
    ],
    imaging: [
      { study: 'Chest X-Ray', date: today, status: 'completed' },
    ],
    immunizations: [
      { vaccine: 'Influenza', date: today },
    ],
    documents: [
      { title: 'Referral Letter.pdf', date: today, size: '250 KB' },
    ],
  }), [today]);

  const [draft, setDraft] = useState(emptyRecord);

  const normalizeList = useCallback((value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') return [value];
    return [];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q)
    );
  }, [patients, query]);

  const pick = useCallback((p) => {
    setSelected(p);
    const mr = p?.medicalRecord || {};
    const hasRecord = mr && Object.keys(mr).length > 0;
    const base = hasRecord ? mr : seededRecord;
    setPharmacyPref({
      id: p?.preferredPharmacyId || '',
      other: p?.preferredPharmacyOtherText || '',
    });

    setDraft({
      admin: {
        ...emptyRecord.admin,
        ...(base.admin || {}),
        mrn: (base.admin && base.admin.mrn) || p?.mrn || '',
      },
      profile: {
        ...emptyRecord.profile,
        ...(base.profile || {}),
        fullName:
          (base.profile && base.profile.fullName) || p?.name || '',
        phone: (base.profile && base.profile.phone) || p?.phone || '',
        email: (base.profile && base.profile.email) || p?.email || '',
        address: (base.profile && base.profile.address) || p?.address || '',
      },
      emergencyContacts: Array.isArray(base.emergencyContacts) ? base.emergencyContacts : [],
      insurance: { ...emptyRecord.insurance, ...(base.insurance || {}) },
      allergies: normalizeList(base.allergies),
      medications: Array.isArray(base.medications) ? base.medications : [],
      problems: Array.isArray(base.problems)
        ? base.problems
        : normalizeList(base.conditions),
      history: {
        ...emptyRecord.history,
        ...(base.history || {}),
      },
      clinicalNotes: Array.isArray(base.clinicalNotes) ? base.clinicalNotes : [],
      vitals: Array.isArray(base.vitals) ? base.vitals : [],
      orders: {
        ...emptyRecord.orders,
        ...(base.orders || {}),
        labs: Array.isArray(base?.orders?.labs) ? base.orders.labs : [],
        imaging: Array.isArray(base?.orders?.imaging) ? base.orders.imaging : [],
        medications: Array.isArray(base?.orders?.medications) ? base.orders.medications : [],
        procedures: Array.isArray(base?.orders?.procedures) ? base.orders.procedures : [],
      },
      results: {
        ...emptyRecord.results,
        ...(base.results || {}),
        pathology: Array.isArray(base?.results?.pathology) ? base.results.pathology : [],
        ecg: Array.isArray(base?.results?.ecg) ? base.results.ecg : [],
      },
      carePlans: Array.isArray(base.carePlans) ? base.carePlans : [],
      legal: {
        ...emptyRecord.legal,
        ...(base.legal || {}),
        consents: Array.isArray(base?.legal?.consents) ? base.legal.consents : [],
        advanceDirectives: Array.isArray(base?.legal?.advanceDirectives) ? base.legal.advanceDirectives : [],
        privacyAcknowledgements: Array.isArray(base?.legal?.privacyAcknowledgements) ? base.legal.privacyAcknowledgements : [],
      },
      encounters: Array.isArray(base.encounters) ? base.encounters : [],
      labs: Array.isArray(base.labs) ? base.labs : [],
      imaging: Array.isArray(base.imaging) ? base.imaging : [],
      immunizations: Array.isArray(base.immunizations) ? base.immunizations : [],
      documents: Array.isArray(base.documents) ? base.documents : [],
    });
    setActiveTab('summary');
  }, [emptyRecord, normalizeList, seededRecord]);

  useEffect(() => {
    if (!show) return;
    if (!patients.length) return;

    const preferred = initialPatientId
      ? patients.find((p) => p?.id === initialPatientId)
      : null;

    if (preferred) {
      if (selected?.id !== preferred.id) pick(preferred);
      return;
    }

    if (!selected || !patients.find((p) => p.id === selected.id)) {
      pick(patients[0]);
    }
  }, [show, patients, initialPatientId, selected, pick]);

  const save = () => {
    if (!selected) return;
    const updated = {
      ...selected,
      preferredPharmacyId: pharmacyPref.id,
      preferredPharmacyOtherText: pharmacyPref.other,
      medicalRecord: { ...draft },
    };
    onUpdatePatient?.(updated);
  };

  const addItem = (key, item) => {
    if (readOnly || !item) return;
    setDraft((prev) => ({ ...prev, [key]: [...(prev[key] || []), item] }));
  };

  const removeItem = (key, idx) => {
    if (readOnly) return;
    setDraft((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== idx),
    }));
  };

  const renderPillList = (items, key) => {
    const list = normalizeList(items);
    return (
      <div className="d-flex flex-wrap gap-2">
        {list.map((item, idx) => (
          <Badge
            bg="secondary"
            key={`${item}-${idx}`}
            className="p-2 text-uppercase"
          >
            {item}
            {!readOnly && (
              <Button
                size="sm"
                variant="link"
                className="text-white ms-2 p-0"
                onClick={() => removeItem(key, idx)}
              >
                ×
              </Button>
            )}
          </Badge>
        ))}
        {!list.length && <div className="text-muted">No entries.</div>}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          {selected
            ? `${t('Medical Record')} — ${selected.name || draft.profile.fullName || ''} (${selected.id})`
            : t('Medical Record')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!readOnly && patients.length > 1 && (
          <Alert variant="info" className="mb-3">
            {t('Select a patient to view or edit their record. Patients are view-only.')}
          </Alert>
        )}

        {!readOnly && patients.length > 1 && (
          <Form className="mb-3">
            <Form.Group>
              <Form.Label>{t('Search Patients')}</Form.Label>
              <Form.Control
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Search by name or ID...')}
              />
            </Form.Group>
          </Form>
        )}

        <div className="d-flex gap-3">
          {!readOnly && patients.length > 1 && (
            <div style={{ width: 260 }}>
              <ListGroup>
                {filtered.map((p) => (
                  <ListGroup.Item
                    key={p.id}
                    action
                    active={selected?.id === p.id}
                    onClick={() => pick(p)}
                  >
                    <div className="fw-semibold">{p.name}</div>
                    <div
                      className={selected?.id === p.id ? "text-white" : "text-muted"}
                      style={{ fontSize: 12 }}
                    >
                      {p.id}
                    </div>
                  </ListGroup.Item>
                ))}
                {!filtered.length && (
                  <ListGroup.Item className="text-muted">
                    {t('No patients match.')}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          )}

          <div className="flex-grow-1">
            {!selected ? (
              <div className="text-muted">{t('Pick a patient to view details.')}</div>
            ) : (
              <>
                <div className="fw-semibold mb-2">
                  {selected.name} ({selected.id})
                </div>
                {!readOnly && (
                  <div className="text-muted mb-3">
                    {t('Viewing as')}{' '}
                    {readOnly ? t('patient (view only)') : t('care team (editable)')}
                  </div>
                )}

                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || 'summary')}
                  className="mb-3"
                >
                  <Tab eventKey="summary" title={t('Summary')}>
                    {(() => {
                      const calcAge = (dob) => {
                        if (!dob) return '';
                        const d = new Date(dob);
                        if (Number.isNaN(d.getTime())) return '';
                        const now = new Date();
                        let age = now.getFullYear() - d.getFullYear();
                        const m = now.getMonth() - d.getMonth();
                        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
                        return age;
                      };

                      const activeProblems = (draft.problems || [])
                        .map((p) => (typeof p === 'string' ? { name: p, status: 'active' } : p))
                        .filter((p) => p && p.name)
                        .filter((p) => String(p.status || 'active').toLowerCase() !== 'resolved');

                      const activeMeds = (draft.medications || [])
                        .filter((m) => m && m.name)
                        .filter((m) => String(m.status || 'active').toLowerCase() !== 'completed');

                      const sortedEncounters = [...(draft.encounters || [])].sort((a, b) =>
                        String(b?.date || '').localeCompare(String(a?.date || ''))
                      );
                      const sortedLabs = [...(draft.labs || [])].sort((a, b) =>
                        String(b?.date || '').localeCompare(String(a?.date || ''))
                      );
                      const sortedVitals = [...(draft.vitals || [])].sort((a, b) =>
                        String(b?.recordedAt || '').localeCompare(String(a?.recordedAt || ''))
                      );
                      const latestVitals = sortedVitals[0] || null;

                      return (
                        <Row className="g-3">
                          <Col md={7}>
                            <div className="fw-semibold mb-1">{t('Demographics')}</div>
                            <Table bordered size="sm" className="mb-3">
                              <tbody>
                                <tr>
                                  <td style={{ width: 160 }}><strong>{t('Full Name')}</strong></td>
                                  <td>{draft.profile.fullName || selected?.name || ''}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('DOB / Age')}</strong></td>
                                  <td>
                                    {draft.profile.dob
                                      ? `${draft.profile.dob}${Number.isFinite(calcAge(draft.profile.dob)) ? ` (${calcAge(draft.profile.dob)})` : ''}`
                                      : ''}
                                  </td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Sex')}</strong></td>
                                  <td>{draft.profile.sex || ''}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Blood Type')}</strong></td>
                                  <td>{draft.profile.bloodType || ''}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Phone')}</strong></td>
                                  <td>{draft.profile.phone || selected?.phone || ''}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Email')}</strong></td>
                                  <td>{draft.profile.email || selected?.email || ''}</td>
                                </tr>
                              </tbody>
                            </Table>

                            <div className="fw-semibold mb-1">{t('Clinical Snapshot')}</div>
                            <Table bordered size="sm" className="mb-0">
                              <tbody>
                                <tr>
                                  <td style={{ width: 160 }}><strong>{t('Allergies')}</strong></td>
                                  <td>
                                    {Array.isArray(draft.allergies) && draft.allergies.length
                                      ? draft.allergies.join(', ')
                                      : t('None recorded')}
                                  </td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Active Problems')}</strong></td>
                                  <td>
                                    {activeProblems.length
                                      ? activeProblems.map((p) => p.name).join(', ')
                                      : t('None recorded')}
                                  </td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Active Medications')}</strong></td>
                                  <td>
                                    {activeMeds.length
                                      ? activeMeds.map((m) => m.name).join(', ')
                                      : t('None recorded')}
                                  </td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Last Encounter')}</strong></td>
                                  <td>
                                    {sortedEncounters.length
                                      ? `${sortedEncounters[0].date || ''} — ${sortedEncounters[0].type || ''}${sortedEncounters[0].provider ? ` (${sortedEncounters[0].provider})` : ''}`
                                      : t('None recorded')}
                                  </td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Most Recent Lab')}</strong></td>
                                  <td>
                                    {sortedLabs.length
                                      ? `${sortedLabs[0].date || ''} — ${sortedLabs[0].test || ''}${sortedLabs[0].status ? ` [${sortedLabs[0].status}]` : ''}`
                                      : t('None recorded')}
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </Col>

                          <Col md={5}>
                            <div className="fw-semibold mb-1">{t('Latest Vitals')}</div>
                            <Table bordered size="sm" className="mb-3">
                              <tbody>
                                <tr>
                                  <td style={{ width: 140 }}><strong>{t('Recorded')}</strong></td>
                                  <td>{latestVitals?.recordedAt || t('None')}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('BP')}</strong></td>
                                  <td>{latestVitals?.bp || t('—')}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('HR')}</strong></td>
                                  <td>{typeof latestVitals?.hr === 'number' ? `${latestVitals.hr} bpm` : (latestVitals?.hr ?? t('—'))}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Temp')}</strong></td>
                                  <td>{typeof latestVitals?.tempC === 'number' ? `${latestVitals.tempC} °C` : (latestVitals?.tempC ?? t('—'))}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('SpO₂')}</strong></td>
                                  <td>{typeof latestVitals?.spo2 === 'number' ? `${latestVitals.spo2}%` : (latestVitals?.spo2 ?? t('—'))}</td>
                                </tr>
                              </tbody>
                            </Table>

                            <div className="fw-semibold mb-1">{t('Coverage')}</div>
                            <Table bordered size="sm" className="mb-0">
                              <tbody>
                                <tr>
                                  <td style={{ width: 140 }}><strong>{t('Insurance')}</strong></td>
                                  <td>{draft.insurance?.provider || t('None')}</td>
                                </tr>
                                <tr>
                                  <td><strong>{t('Member ID')}</strong></td>
                                  <td>{draft.insurance?.memberId || t('—')}</td>
                                </tr>
                              </tbody>
                            </Table>
                          </Col>
                        </Row>
                      );
                    })()}
                  </Tab>

                  <Tab eventKey="profile" title={t('Profile')}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>{t('Full Name')}</Form.Label>
                          <Form.Control
                            value={draft.profile.fullName}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  fullName: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label>{t('Date of Birth')}</Form.Label>
                          <Form.Control
                            type="date"
                            value={draft.profile.dob}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  dob: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label>Sex</Form.Label>
                          <Form.Select
                            value={draft.profile.sex}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  sex: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          >
                            <option>Female</option>
                            <option>Male</option>
                            <option>Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            value={draft.profile.phone}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  phone: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={draft.profile.email}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  email: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label>Blood Type</Form.Label>
                          <Form.Control
                            value={draft.profile.bloodType}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  bloodType: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label>Address</Form.Label>
                          <Form.Control
                            value={draft.profile.address}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                profile: {
                                  ...draft.profile,
                                  address: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab>

                  <Tab eventKey="insurance" title={t('Insurance')}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Insurance Provider *</Form.Label>
                          <Form.Control
                            value={draft.insurance.provider}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  provider: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Policy Number *</Form.Label>
                          <Form.Control
                            value={draft.insurance.policyNumber}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  policyNumber: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Group Number</Form.Label>
                          <Form.Control
                            value={draft.insurance.groupNumber}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  groupNumber: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Member ID *</Form.Label>
                          <Form.Control
                            value={draft.insurance.memberId}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  memberId: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Effective Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={draft.insurance.effectiveDate}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  effectiveDate: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Expiration Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={draft.insurance.expirationDate}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  expirationDate: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label>Plan Type</Form.Label>
                          <Form.Control
                            value={draft.insurance.planType}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                insurance: {
                                  ...draft.insurance,
                                  planType: e.target.value,
                                },
                              })
                            }
                            disabled={readOnly}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group className="mb-2">
                          <Form.Label>Preferred Pharmacy</Form.Label>
                          <Form.Select
                            value={pharmacyPref.id}
                            onChange={(e) => setPharmacyPref({ ...pharmacyPref, id: e.target.value })}
                            disabled={readOnly}
                          >
                            <option value="">Select pharmacy</option>
                            {pharmacies.map((ph) => (
                              <option key={ph.id} value={ph.id}>{formatPharmacyLabel(ph) || ph.name}</option>
                            ))}
                            <option value="other">Other (specify)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      {pharmacyPref.id === 'other' && (
                        <Col md={12}>
                          <Form.Group className="mb-2">
                            <Form.Label>Other pharmacy details</Form.Label>
                            <Form.Control
                              value={pharmacyPref.other}
                              onChange={(e) => setPharmacyPref({ ...pharmacyPref, other: e.target.value })}
                              placeholder="Name, phone"
                              disabled={readOnly}
                            />
                          </Form.Group>
                        </Col>
                      )}
                    </Row>
                  </Tab>

                  <Tab eventKey="allergies" title="Allergies">
                    {renderPillList(draft.allergies, 'allergies')}
                    {!readOnly && (
                      <InputGroup className="mt-3">
                        <Form.Control
                          placeholder="Add new allergy"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val) {
                                addItem('allergies', val);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={(e) => {
                            const input =
                              e.currentTarget.parentElement.querySelector(
                                'input'
                              );
                            const val = input.value.trim();
                            if (val) {
                              addItem('allergies', val);
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </Button>
                      </InputGroup>
                    )}
                  </Tab>

                  <Tab eventKey="medications" title="Medications">
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Sig</th>
                          <th>Status</th>
                          {!readOnly && <th style={{ width: 60 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.medications.map((m, idx) => (
                          <tr key={idx}>
                            <td>{m.name}</td>
                            <td>{m.sig}</td>
                            <td>
                              <Badge bg="success">{m.status || 'active'}</Badge>
                            </td>
                            {!readOnly && (
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => removeItem('medications', idx)}
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {!draft.medications.length && (
                          <tr>
                            <td
                              colSpan={readOnly ? 3 : 4}
                              className="text-muted text-center"
                            >
                              No medications.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={4}>
                          <Form.Label>Medication</Form.Label>
                          <Form.Control
                            id="mr-new-med"
                            placeholder="e.g., Lisinopril 10mg"
                          />
                        </Col>
                        <Col md={5}>
                          <Form.Label>Sig</Form.Label>
                          <Form.Control
                            id="mr-new-sig"
                            placeholder="1 tab daily"
                          />
                        </Col>
                        <Col md={2}>
                          <Form.Label>Status</Form.Label>
                          <Form.Select id="mr-new-status" defaultValue="active">
                            <option value="active">active</option>
                            <option value="pending">pending</option>
                            <option value="completed">completed</option>
                          </Form.Select>
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const med = document.getElementById('mr-new-med');
                              const sig = document.getElementById('mr-new-sig');
                              const status =
                                document.getElementById('mr-new-status');
                              if (!med.value.trim()) return;
                              addItem('medications', {
                                name: med.value.trim(),
                                sig: sig.value.trim(),
                                status: status.value,
                              });
                              med.value = '';
                              sig.value = '';
                              status.value = 'active';
                            }}
                          >
                            Add
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>

                  <Tab eventKey="problems" title="Problems">
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>Problem</th>
                          <th>Status</th>
                          {!readOnly && <th style={{ width: 60 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.problems.map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.name}</td>
                            <td>
                              <Badge bg="success">{p.status || 'active'}</Badge>
                            </td>
                            {!readOnly && (
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => removeItem('problems', idx)}
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {!draft.problems.length && (
                          <tr>
                            <td
                              colSpan={readOnly ? 2 : 3}
                              className="text-muted text-center"
                            >
                              No problems.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={8}>
                          <Form.Label>Problem</Form.Label>
                          <Form.Control
                            id="mr-new-problem"
                            placeholder="e.g., Hypertension"
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            id="mr-new-problem-status"
                            defaultValue="active"
                          >
                            <option value="active">active</option>
                            <option value="resolved">resolved</option>
                          </Form.Select>
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const name = document
                                .getElementById('mr-new-problem')
                                .value.trim();
                              const status = document.getElementById(
                                'mr-new-problem-status'
                              ).value;
                              if (!name) return;
                              addItem('problems', { name, status });
                              document.getElementById('mr-new-problem').value =
                                '';
                              document.getElementById(
                                'mr-new-problem-status'
                              ).value = 'active';
                            }}
                          >
                            Add
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>

                  <Tab eventKey="encounters" title="Encounters">
                    <Table bordered responsive size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Provider</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.encounters.map((e, idx) => (
                          <tr key={idx}>
                            <td>{e.date}</td>
                            <td>{e.type}</td>
                            <td>{e.provider}</td>
                            <td>{e.notes}</td>
                          </tr>
                        ))}
                        {!draft.encounters.length && (
                          <tr>
                            <td colSpan={4} className="text-muted text-center">
                              No encounters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    <div className="text-muted mt-2">
                      New encounter creation is not available in this view.
                    </div>
                  </Tab>

                  <Tab eventKey="vitals" title={t('Vitals')}>
                    <div className="mb-2 text-muted">{t('Vital signs over time (BP, HR, temp, SpO₂, weight).')}</div>
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>{t('Recorded')}</th>
                          <th>{t('BP')}</th>
                          <th>{t('HR')}</th>
                          <th>{t('RR')}</th>
                          <th>{t('Temp (°C)')}</th>
                          <th>{t('SpO₂')}</th>
                          <th>{t('Wt (kg)')}</th>
                          <th>{t('Ht (cm)')}</th>
                          {!readOnly && <th style={{ width: 90 }}>{t('Actions')}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {[...(draft.vitals || [])]
                          .sort((a, b) => String(b?.recordedAt || '').localeCompare(String(a?.recordedAt || '')))
                          .map((v, idx) => (
                            <tr key={`${v.recordedAt || 'v'}-${idx}`}>
                              <td>{v.recordedAt || ''}</td>
                              <td>{v.bp || ''}</td>
                              <td>{v.hr ?? ''}</td>
                              <td>{v.rr ?? ''}</td>
                              <td>{v.tempC ?? ''}</td>
                              <td>{typeof v.spo2 === 'number' ? `${v.spo2}%` : (v.spo2 ?? '')}</td>
                              <td>{v.weightKg ?? ''}</td>
                              <td>{v.heightCm ?? ''}</td>
                              {!readOnly && (
                                <td>
                                  <Button size="sm" variant="outline-danger" onClick={() => removeItem('vitals', idx)}>
                                    {t('Remove')}
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                        {!(draft.vitals || []).length && (
                          <tr>
                            <td colSpan={readOnly ? 8 : 9} className="text-muted text-center">
                              {t('No vitals recorded.')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={3}>
                          <Form.Label>{t('Recorded At')}</Form.Label>
                          <Form.Control type="datetime-local" id="mr-new-vitals-at" defaultValue={new Date().toISOString().slice(0, 16)} />
                        </Col>
                        <Col md={2}>
                          <Form.Label>{t('BP')}</Form.Label>
                          <Form.Control id="mr-new-vitals-bp" placeholder="120/80" />
                        </Col>
                        <Col md={1}>
                          <Form.Label>{t('HR')}</Form.Label>
                          <Form.Control id="mr-new-vitals-hr" placeholder="78" />
                        </Col>
                        <Col md={1}>
                          <Form.Label>{t('RR')}</Form.Label>
                          <Form.Control id="mr-new-vitals-rr" placeholder="16" />
                        </Col>
                        <Col md={1}>
                          <Form.Label>{t('Temp')}</Form.Label>
                          <Form.Control id="mr-new-vitals-temp" placeholder="36.8" />
                        </Col>
                        <Col md={1}>
                          <Form.Label>{t('SpO₂')}</Form.Label>
                          <Form.Control id="mr-new-vitals-spo2" placeholder="98" />
                        </Col>
                        <Col md={1}>
                          <Form.Label>{t('Wt')}</Form.Label>
                          <Form.Control id="mr-new-vitals-wt" placeholder="82" />
                        </Col>
                        <Col md={1}>
                          <Form.Label>{t('Ht')}</Form.Label>
                          <Form.Control id="mr-new-vitals-ht" placeholder="175" />
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const recordedAt = document.getElementById('mr-new-vitals-at').value;
                              if (!recordedAt) return;

                              const readStr = (id) => document.getElementById(id).value.trim();
                              const readNum = (id) => {
                                const raw = readStr(id);
                                if (!raw) return undefined;
                                const n = Number(raw);
                                return Number.isFinite(n) ? n : undefined;
                              };

                              addItem('vitals', {
                                recordedAt,
                                bp: readStr('mr-new-vitals-bp') || undefined,
                                hr: readNum('mr-new-vitals-hr'),
                                rr: readNum('mr-new-vitals-rr'),
                                tempC: readNum('mr-new-vitals-temp'),
                                spo2: readNum('mr-new-vitals-spo2'),
                                weightKg: readNum('mr-new-vitals-wt'),
                                heightCm: readNum('mr-new-vitals-ht'),
                              });

                              document.getElementById('mr-new-vitals-bp').value = '';
                              document.getElementById('mr-new-vitals-hr').value = '';
                              document.getElementById('mr-new-vitals-rr').value = '';
                              document.getElementById('mr-new-vitals-temp').value = '';
                              document.getElementById('mr-new-vitals-spo2').value = '';
                              document.getElementById('mr-new-vitals-wt').value = '';
                              document.getElementById('mr-new-vitals-ht').value = '';
                              document.getElementById('mr-new-vitals-at').value = new Date().toISOString().slice(0, 16);
                            }}
                          >
                            {t('Add')}
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>

                  <Tab eventKey="labs" title="Labs">
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>Test</th>
                          <th>Ordered</th>
                          <th>Status</th>
                          <th>Summary</th>
                          {!readOnly && <th style={{ width: 60 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.labs.map((l, idx) => (
                          <tr key={idx}>
                            <td>{l.test}</td>
                            <td>{l.date}</td>
                            <td>
                              <Badge
                                bg={
                                  l.status === 'completed'
                                    ? 'secondary'
                                    : 'warning'
                                }
                              >
                                {l.status || 'pending'}
                              </Badge>
                            </td>
                            <td>{l.summary}</td>
                            {!readOnly && (
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => removeItem('labs', idx)}
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {!draft.labs.length && (
                          <tr>
                            <td
                              colSpan={readOnly ? 4 : 5}
                              className="text-muted text-center"
                            >
                              No labs.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={3}>
                          <Form.Label>Test</Form.Label>
                          <Form.Control
                            id="mr-new-lab-test"
                            placeholder="e.g., CBC"
                          />
                        </Col>
                        <Col md={2}>
                          <Form.Label>Ordered</Form.Label>
                          <Form.Control
                            type="date"
                            id="mr-new-lab-date"
                            defaultValue={today}
                          />
                        </Col>
                        <Col md={2}>
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            id="mr-new-lab-status"
                            defaultValue="pending"
                          >
                            <option value="pending">pending</option>
                            <option value="completed">completed</option>
                          </Form.Select>
                        </Col>
                        <Col md={4}>
                          <Form.Label>Summary</Form.Label>
                          <Form.Control
                            id="mr-new-lab-summary"
                            placeholder="e.g., Normal"
                          />
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const test = document
                                .getElementById('mr-new-lab-test')
                                .value.trim();
                              if (!test) return;
                              const date =
                                document.getElementById('mr-new-lab-date').value;
                              const status = document.getElementById(
                                'mr-new-lab-status'
                              ).value;
                              const summary = document
                                .getElementById('mr-new-lab-summary')
                                .value.trim();
                              addItem('labs', { test, date, status, summary });
                              document.getElementById('mr-new-lab-test').value =
                                '';
                              document.getElementById(
                                'mr-new-lab-summary'
                              ).value = '';
                              document.getElementById(
                                'mr-new-lab-status'
                              ).value = 'pending';
                              document.getElementById('mr-new-lab-date').value =
                                today;
                            }}
                          >
                            Add
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>

                  <Tab eventKey="imaging" title="Imaging">
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>Study</th>
                          <th>Date</th>
                          <th>Status</th>
                          {!readOnly && <th style={{ width: 60 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.imaging.map((i, idx) => (
                          <tr key={idx}>
                            <td>{i.study}</td>
                            <td>{i.date}</td>
                            <td>
                              <Badge
                                bg={
                                  i.status === 'completed'
                                    ? 'secondary'
                                    : 'warning'
                                }
                              >
                                {i.status || 'pending'}
                              </Badge>
                            </td>
                            {!readOnly && (
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => removeItem('imaging', idx)}
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {!draft.imaging.length && (
                          <tr>
                            <td
                              colSpan={readOnly ? 3 : 4}
                              className="text-muted text-center"
                            >
                              No imaging.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={5}>
                          <Form.Label>Study</Form.Label>
                          <Form.Control
                            id="mr-new-imaging-study"
                            placeholder="e.g., Chest X-Ray"
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Date</Form.Label>
                          <Form.Control
                            type="date"
                            id="mr-new-imaging-date"
                            defaultValue={today}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            id="mr-new-imaging-status"
                            defaultValue="pending"
                          >
                            <option value="pending">pending</option>
                            <option value="completed">completed</option>
                          </Form.Select>
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const study = document
                                .getElementById('mr-new-imaging-study')
                                .value.trim();
                              if (!study) return;
                              const date = document.getElementById(
                                'mr-new-imaging-date'
                              ).value;
                              const status = document.getElementById(
                                'mr-new-imaging-status'
                              ).value;
                              addItem('imaging', { study, date, status });
                              document.getElementById(
                                'mr-new-imaging-study'
                              ).value = '';
                              document.getElementById(
                                'mr-new-imaging-status'
                              ).value = 'pending';
                              document.getElementById(
                                'mr-new-imaging-date'
                              ).value = today;
                            }}
                          >
                            Add
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>

                  <Tab eventKey="immunizations" title="Immunizations">
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>Vaccine</th>
                          <th>Date</th>
                          {!readOnly && <th style={{ width: 60 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.immunizations.map((imm, idx) => (
                          <tr key={idx}>
                            <td>{imm.vaccine}</td>
                            <td>{imm.date}</td>
                            {!readOnly && (
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() =>
                                    removeItem('immunizations', idx)
                                  }
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {!draft.immunizations.length && (
                          <tr>
                            <td
                              colSpan={readOnly ? 2 : 3}
                              className="text-muted text-center"
                            >
                              No immunizations.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={8}>
                          <Form.Label>Vaccine</Form.Label>
                          <Form.Control
                            id="mr-new-imm"
                            placeholder="e.g., Influenza"
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Date</Form.Label>
                          <Form.Control
                            type="date"
                            id="mr-new-imm-date"
                            defaultValue={today}
                          />
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const vaccine = document
                                .getElementById('mr-new-imm')
                                .value.trim();
                              if (!vaccine) return;
                              const date =
                                document.getElementById('mr-new-imm-date').value;
                              addItem('immunizations', { vaccine, date });
                              document.getElementById('mr-new-imm').value = '';
                              document.getElementById('mr-new-imm-date').value =
                                today;
                            }}
                          >
                            Add
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>

                  <Tab eventKey="documents" title="Documents">
                    <Table bordered responsive size="sm" className="mb-3">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Uploaded</th>
                          <th>Size</th>
                          {!readOnly && <th style={{ width: 140 }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.documents.map((d, idx) => (
                          <tr key={idx}>
                            <td>{d.title}</td>
                            <td>{d.date}</td>
                            <td>{d.size || '—'}</td>
                            {!readOnly && (
                              <td className="d-flex gap-2">
                                <Button size="sm" variant="outline-primary">
                                  Download
                                </Button>
                                <Button size="sm" variant="outline-secondary">
                                  Replace
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => removeItem('documents', idx)}
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {!draft.documents.length && (
                          <tr>
                            <td
                              colSpan={readOnly ? 3 : 4}
                              className="text-muted text-center"
                            >
                              No documents.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    {!readOnly && (
                      <Row className="g-2 align-items-end">
                        <Col md={9}>
                          <Form.Label>Document Title</Form.Label>
                          <Form.Control
                            id="mr-new-doc"
                            placeholder="e.g., Referral Letter.pdf"
                          />
                        </Col>
                        <Col md={2}>
                          <Form.Label>Date</Form.Label>
                          <Form.Control
                            type="date"
                            id="mr-new-doc-date"
                            defaultValue={today}
                          />
                        </Col>
                        <Col md={1} className="d-grid">
                          <Button
                            onClick={() => {
                              const title = document
                                .getElementById('mr-new-doc')
                                .value.trim();
                              if (!title) return;
                              const date =
                                document.getElementById('mr-new-doc-date').value;
                              addItem('documents', { title, date, size: '—' });
                              document.getElementById('mr-new-doc').value = '';
                              document.getElementById('mr-new-doc-date').value =
                                today;
                            }}
                          >
                            Upload
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Tab>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {!readOnly && (
          <Button variant="primary" onClick={save} disabled={!selected}>
            Save
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default MedicalRecordModule;
