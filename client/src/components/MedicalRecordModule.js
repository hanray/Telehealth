// src/components/MedicalRecordModule.js
import React, { useMemo, useState } from 'react';
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

const MedicalRecordModule = ({
  show,
  onHide,
  patients = [],
  readOnly = false,
  onUpdatePatient,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const today = new Date().toISOString().slice(0, 10);

  const emptyRecord = {
    profile: {
      fullName: '',
      dob: '',
      sex: 'Other',
      phone: '',
      email: '',
      address: '',
      bloodType: '',
    },
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
    encounters: [],
    labs: [],
    imaging: [],
    immunizations: [],
    documents: [],
  };

  // Seeded fallback record used when a patient has no stored medicalRecord
  const seededRecord = {
    profile: {
      fullName: 'Sample Patient',
      dob: '1992-04-10',
      sex: 'Female',
      phone: '+1 (555) 010-9000',
      email: 'sample.patient@example.com',
      address: '456 Market St, Accra, Ghana',
      bloodType: 'A+',
    },
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
  };

  const [draft, setDraft] = useState(emptyRecord);

  const normalizeList = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') return [value];
    return [];
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.id || '').toLowerCase().includes(q)
    );
  }, [patients, query]);

  const pick = (p) => {
    setSelected(p);
    const mr = p?.medicalRecord || {};
    const hasRecord = mr && Object.keys(mr).length > 0;
    const base = hasRecord ? mr : seededRecord;

    setDraft({
      profile: {
        ...emptyRecord.profile,
        ...(base.profile || {}),
        fullName:
          (base.profile && base.profile.fullName) || p?.name || '',
        phone: (base.profile && base.profile.phone) || p?.phone || '',
        email: (base.profile && base.profile.email) || p?.email || '',
        address: (base.profile && base.profile.address) || p?.address || '',
      },
      insurance: { ...emptyRecord.insurance, ...(base.insurance || {}) },
      allergies: normalizeList(base.allergies),
      medications: Array.isArray(base.medications) ? base.medications : [],
      problems: Array.isArray(base.problems)
        ? base.problems
        : normalizeList(base.conditions),
      encounters: Array.isArray(base.encounters) ? base.encounters : [],
      labs: Array.isArray(base.labs) ? base.labs : [],
      imaging: Array.isArray(base.imaging) ? base.imaging : [],
      immunizations: Array.isArray(base.immunizations) ? base.immunizations : [],
      documents: Array.isArray(base.documents) ? base.documents : [],
    });
    setActiveTab('profile');
  };

  const save = () => {
    if (!selected) return;
    const updated = { ...selected, medicalRecord: { ...draft } };
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
        <Modal.Title>Medical Record</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="info" className="mb-3">
          Select a patient to view or edit their record. Patients are view-only.
        </Alert>

        {!readOnly && (
          <Form className="mb-3">
            <Form.Group>
              <Form.Label>Search Patients</Form.Label>
              <Form.Control
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID..."
              />
            </Form.Group>
          </Form>
        )}

        <div className="d-flex gap-3">
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
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {p.id}
                  </div>
                </ListGroup.Item>
              ))}
              {!filtered.length && (
                <ListGroup.Item className="text-muted">
                  No patients match.
                </ListGroup.Item>
              )}
            </ListGroup>
          </div>

          <div className="flex-grow-1">
            {!selected ? (
              <div className="text-muted">Pick a patient to view details.</div>
            ) : (
              <>
                <div className="fw-semibold mb-2">
                  {selected.name} ({selected.id})
                </div>
                <div className="text-muted mb-3">
                  Viewing as{' '}
                  {readOnly ? 'patient (view only)' : 'care team (editable)'}
                </div>

                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || 'profile')}
                  className="mb-3"
                >
                  <Tab eventKey="profile" title="Profile">
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label>Full Name</Form.Label>
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
                          <Form.Label>Date of Birth</Form.Label>
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

                  <Tab eventKey="insurance" title="Insurance">
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
