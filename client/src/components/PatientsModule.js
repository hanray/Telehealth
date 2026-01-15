import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Form, InputGroup, ListGroup, Modal, Row, Card } from 'react-bootstrap';

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const normalizeSex = (value) => {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'M' || v === 'F' || v === 'O') return v;
  if (v === 'MALE') return 'M';
  if (v === 'FEMALE') return 'F';
  if (v === 'OTHER') return 'O';
  return '';
};

const getPatientField = (patient, key) => {
  if (!patient) return '';
  if (patient[key] != null && String(patient[key] || '').trim() !== '') return patient[key];
  const profile = patient.medicalRecord?.profile || {};
  if (key === 'fullName') return profile.fullName || patient.name || '';
  if (key === 'dob') return profile.dob || '';
  if (key === 'sex') return normalizeSex(profile.sex || patient.sex);
  if (key === 'bloodType') return profile.bloodType || patient.bloodType || '';
  if (key === 'address') return profile.address || patient.address || '';
  if (key === 'phone') return profile.phone || patient.phone || '';
  if (key === 'email') return profile.email || patient.email || '';
  return patient[key] || '';
};

const buildPatientForSave = ({ existing, draft, allowClinicalFields }) => {
  const base = existing ? { ...existing } : {};
  const safeDraft = { ...draft };

  const fullName = String(safeDraft.fullName || '').trim();
  const email = String(safeDraft.email || '').trim();
  const phone = String(safeDraft.phone || '').trim();
  const dob = String(safeDraft.dob || '').trim();
  const address = String(safeDraft.address || '').trim();

  const sex = allowClinicalFields ? normalizeSex(safeDraft.sex) : normalizeSex(getPatientField(base, 'sex'));
  const bloodType = allowClinicalFields ? String(safeDraft.bloodType || '').trim() : String(getPatientField(base, 'bloodType') || '').trim();

  const next = {
    ...base,
    // UI-facing schema (MVP)
    fullName,
    dob,
    phone,
    email,
    sex: sex || undefined,
    bloodType: bloodType || undefined,
    address,

    // Back-compat for existing UI
    name: fullName || base.name,
  };

  const profile = { ...(next.medicalRecord?.profile || {}) };
  next.medicalRecord = { ...(next.medicalRecord || {}), profile };

  // keep profile in sync (existing modules use it)
  profile.fullName = fullName || profile.fullName;
  if (dob) profile.dob = dob;
  if (phone) profile.phone = phone;
  if (email) profile.email = email;
  if (address) profile.address = address;
  if (sex) profile.sex = sex;
  if (bloodType) profile.bloodType = bloodType;

  return next;
};

const PatientsModule = ({
  show,
  onHide,
  currentUser,
  patients = [],
  providers = [],
  homecareTasks = [],
  onSavePatient,
  onStartEncounter,
  onCreateHomecareTask,
  onOpenChart,
  onOpenRecords,
  t = (s) => s,
}) => {
  const role = normalizeRole(currentUser?.role);
  const canCreateEdit = role === 'nurse' || role === 'psw';
  const allowClinicalFields = role === 'nurse';

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const [mode, setMode] = useState('list'); // list | edit
  const [editingId, setEditingId] = useState(null);
  const [inlineError, setInlineError] = useState('');

  const [taskModal, setTaskModal] = useState(false);
  const [taskDraft, setTaskDraft] = useState({ title: 'Homecare visit', notes: '' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(patients) ? patients : [];
    if (!q) return list;
    return list.filter((p) => {
      const fullName = String(getPatientField(p, 'fullName') || '').toLowerCase();
      const email = String(getPatientField(p, 'email') || '').toLowerCase();
      const phone = String(getPatientField(p, 'phone') || '').toLowerCase();
      return [fullName, email, phone, String(p?.id || '').toLowerCase()].some((v) => v.includes(q));
    });
  }, [patients, query]);

  const selectedPatient = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    return list.find((p) => p.id === selectedId) || null;
  }, [patients, selectedId]);

  const startCreate = () => {
    setInlineError('');
    setMode('edit');
    setEditingId(null);
  };

  const startEdit = () => {
    if (!selectedPatient) return;
    setInlineError('');
    setMode('edit');
    setEditingId(selectedPatient.id);
  };

  const resetAndClose = () => {
    setInlineError('');
    setMode('list');
    setEditingId(null);
    setTaskModal(false);
    setTaskDraft({ title: 'Homecare visit', notes: '' });
    onHide?.();
  };

  const editingPatient = useMemo(() => {
    if (!editingId) return null;
    return (patients || []).find((p) => p.id === editingId) || null;
  }, [editingId, patients]);

  const [draft, setDraft] = useState({
    fullName: '',
    dob: '',
    phone: '',
    email: '',
    sex: 'M',
    bloodType: '',
    address: '',
  });

  const loadDraftFromPatient = (p) => {
    setDraft({
      fullName: getPatientField(p, 'fullName') || '',
      dob: getPatientField(p, 'dob') || '',
      phone: getPatientField(p, 'phone') || '',
      email: getPatientField(p, 'email') || '',
      sex: normalizeSex(getPatientField(p, 'sex')) || 'M',
      bloodType: getPatientField(p, 'bloodType') || '',
      address: getPatientField(p, 'address') || '',
    });
  };

  // refresh draft when entering edit mode
  useMemo(() => {
    if (mode !== 'edit') return null;
    if (editingPatient) {
      loadDraftFromPatient(editingPatient);
    } else {
      setDraft({ fullName: '', dob: '', phone: '', email: '', sex: 'M', bloodType: '', address: '' });
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editingId]);

  const emailConflict = (email, ignoreId) => {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return false;
    return (patients || []).some((p) => {
      if (ignoreId && p?.id === ignoreId) return false;
      const existing = String(getPatientField(p, 'email') || '').trim().toLowerCase();
      return existing && existing === e;
    });
  };

  const save = () => {
    if (!canCreateEdit) return;
    const fullName = String(draft.fullName || '').trim();
    const email = String(draft.email || '').trim();

    if (!fullName) {
      setInlineError('Full name is required.');
      return;
    }
    if (!email) {
      setInlineError('Email is required.');
      return;
    }
    if (emailConflict(email, editingPatient?.id)) {
      setInlineError('Email must be unique.');
      return;
    }

    const next = buildPatientForSave({ existing: editingPatient, draft, allowClinicalFields });
    onSavePatient?.(next);
    setInlineError('');
    setMode('list');
    setEditingId(null);
  };

  const openTaskModal = () => {
    if (!selectedPatient) return;
    setTaskDraft({ title: 'Homecare visit', notes: '' });
    setTaskModal(true);
  };

  const submitTask = () => {
    if (!selectedPatient) return;
    const title = String(taskDraft.title || '').trim();
    if (!title) return;
    onCreateHomecareTask?.({ patientId: selectedPatient.id, title, notes: String(taskDraft.notes || '').trim() });
    setTaskModal(false);
  };

  const assignedToPswCount = useMemo(() => {
    if (role !== 'psw') return null;
    const me = currentUser?.id;
    return (homecareTasks || []).filter((t) => t?.assignedToUserId === me && t?.status !== 'completed').length;
  }, [currentUser?.id, homecareTasks, role]);

  const providerLabelById = (id) => {
    const p = (providers || []).find((x) => x.id === id);
    return p?.name || id;
  };

  return (
    <>
      <Modal show={show} onHide={resetAndClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {t('Patients')}
            {role === 'doctor' && <span className="text-muted" style={{ fontSize: 12 }}> {t('(view)')}</span>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {role === 'psw' && typeof assignedToPswCount === 'number' && (
            <Alert variant="light" className="border">
              {t('Open homecare tasks')}: <strong>{assignedToPswCount}</strong>
            </Alert>
          )}

          <Row className="g-3">
            <Col md={5}>
              <Card className="card-plain">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">{t('Patient list')}</div>
                    {canCreateEdit && (
                      <Button size="sm" variant="outline-primary" onClick={startCreate}>
                        {t('New')}
                      </Button>
                    )}
                  </div>
                  <InputGroup className="mb-2">
                    <Form.Control
                      placeholder={t('Search patients')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button variant="outline-secondary" onClick={() => setQuery('')}>{t('Clear')}</Button>
                  </InputGroup>

                  <ListGroup variant="flush" style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {filtered.map((p) => {
                      const fullName = getPatientField(p, 'fullName') || p.name || 'Patient';
                      const email = getPatientField(p, 'email') || '';
                      const active = selectedId === p.id;
                      return (
                        <ListGroup.Item
                          key={p.id}
                          action
                          active={active}
                          onClick={() => setSelectedId(p.id)}
                          className="d-flex justify-content-between align-items-start"
                        >
                          <div>
                            <div className="fw-semibold">{fullName}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{email}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{p.id}</div>
                          </div>
                          {p.preferredPharmacyId && (
                            <Badge bg="secondary" className="text-uppercase">{t('Pharm')}</Badge>
                          )}
                        </ListGroup.Item>
                      );
                    })}
                    {!filtered.length && <ListGroup.Item className="text-muted">{t('No patients found.')}</ListGroup.Item>}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            <Col md={7}>
              {mode === 'list' && (
                <Card className="card-plain">
                  <Card.Body>
                    {!selectedPatient && <Alert variant="light" className="border mb-0">{t('Select a patient to view actions.')}</Alert>}
                    {selectedPatient && (
                      <>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <div className="text-muted text-uppercase small fw-semibold">{t('Selected')}</div>
                            <div className="fw-bold">{getPatientField(selectedPatient, 'fullName') || selectedPatient.name}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{selectedPatient.id}</div>
                          </div>
                          {canCreateEdit && (
                            <Button size="sm" variant="outline-secondary" onClick={startEdit}>{t('Edit')}</Button>
                          )}
                        </div>

                        <div className="d-grid gap-2">
                          <Button
                            variant="primary"
                            onClick={() => onStartEncounter?.({ patientId: selectedPatient.id })}
                          >
                            {t('Start Telehealth Encounter')}
                          </Button>

                          <Button
                            variant="outline-primary"
                            onClick={openTaskModal}
                            disabled={role !== 'psw' && role !== 'nurse'}
                          >
                            {t('Create Homecare Visit Task')}
                          </Button>

                          <Button
                            variant="outline-secondary"
                            onClick={() => onOpenChart?.(selectedPatient)}
                          >
                            {t('Open Patient Chart')}
                          </Button>

                          <Button
                            variant="outline-secondary"
                            onClick={() => onOpenRecords?.(selectedPatient)}
                          >
                            {t('Open Records')}
                          </Button>
                        </div>

                        <hr />
                        <div className="d-grid gap-2">
                          <div className="fw-semibold">{t('MVP fields')}</div>
                          <div style={{ fontSize: 13 }}><strong>{t('DOB')}:</strong> {getPatientField(selectedPatient, 'dob') || '—'}</div>
                          <div style={{ fontSize: 13 }}><strong>{t('Sex')}:</strong> {getPatientField(selectedPatient, 'sex') || '—'}</div>
                          <div style={{ fontSize: 13 }}><strong>{t('Blood type')}:</strong> {getPatientField(selectedPatient, 'bloodType') || '—'}</div>
                          <div style={{ fontSize: 13 }}><strong>{t('Phone')}:</strong> {getPatientField(selectedPatient, 'phone') || '—'}</div>
                          <div style={{ fontSize: 13 }}><strong>{t('Email')}:</strong> {getPatientField(selectedPatient, 'email') || '—'}</div>
                          <div style={{ fontSize: 13 }}><strong>{t('Address')}:</strong> {getPatientField(selectedPatient, 'address') || '—'}</div>
                          {selectedPatient.preferredPharmacyId && (
                            <div style={{ fontSize: 13 }}><strong>{t('Preferred pharmacy')}:</strong> {providerLabelById(selectedPatient.preferredPharmacyId) || selectedPatient.preferredPharmacyId}</div>
                          )}

                          <Form.Group className="mt-2">
                            <Form.Label className="text-muted">{t('Emergency contact (disabled for now)')}</Form.Label>
                            <Form.Control disabled value="" placeholder={t('Not implemented')} />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label className="text-muted">{t('Insurance (disabled)')}</Form.Label>
                            <Form.Control disabled value="" placeholder={t('Not implemented')} />
                          </Form.Group>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              )}

              {mode === 'edit' && (
                <Card className="card-plain">
                  <Card.Body>
                    {!canCreateEdit && <Alert variant="light" className="border">{t('Your role is view-only for patients.')}</Alert>}
                    {inlineError && <Alert variant="danger">{inlineError}</Alert>}
                    <Form>
                      <Row className="g-2">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>{t('Full name')}</Form.Label>
                            <Form.Control
                              value={draft.fullName}
                              onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                              disabled={!canCreateEdit}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>{t('DOB')}</Form.Label>
                            <Form.Control
                              type="date"
                              value={draft.dob}
                              onChange={(e) => setDraft((d) => ({ ...d, dob: e.target.value }))}
                              disabled={!canCreateEdit}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>{t('Phone')}</Form.Label>
                            <Form.Control
                              value={draft.phone}
                              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                              disabled={!canCreateEdit}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>{t('Email')}</Form.Label>
                            <Form.Control
                              type="email"
                              value={draft.email}
                              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                              disabled={!canCreateEdit}
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>{t('Sex')}</Form.Label>
                            <Form.Select
                              value={draft.sex}
                              onChange={(e) => setDraft((d) => ({ ...d, sex: e.target.value }))}
                              disabled={!canCreateEdit || !allowClinicalFields}
                            >
                              <option value="M">M</option>
                              <option value="F">F</option>
                              <option value="O">O</option>
                            </Form.Select>
                            {!allowClinicalFields && (
                              <div className="text-muted" style={{ fontSize: 12 }}>{t('PSW cannot edit sex in MVP.')}</div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>{t('Blood type')}</Form.Label>
                            <Form.Control
                              value={draft.bloodType}
                              onChange={(e) => setDraft((d) => ({ ...d, bloodType: e.target.value }))}
                              disabled={!canCreateEdit || !allowClinicalFields}
                            />
                            {!allowClinicalFields && (
                              <div className="text-muted" style={{ fontSize: 12 }}>{t('PSW cannot edit blood type in MVP.')}</div>
                            )}
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>{t('Address')}</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={draft.address}
                              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                              disabled={!canCreateEdit}
                            />
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="text-muted">{t('Emergency contact (disabled for now)')}</Form.Label>
                            <Form.Control disabled placeholder={t('Not implemented')} />
                          </Form.Group>
                        </Col>
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="text-muted">{t('Insurance (placeholder, disabled)')}</Form.Label>
                            <Form.Control disabled placeholder={t('Not implemented')} />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => { setMode('list'); setEditingId(null); setInlineError(''); }}>
                      {t('Back')}
                    </Button>
                    <div className="d-flex gap-2">
                      <Button variant="outline-secondary" onClick={resetAndClose}>{t('Close')}</Button>
                      <Button variant="primary" onClick={save} disabled={!canCreateEdit}>{t('Save')}</Button>
                    </div>
                  </Card.Footer>
                </Card>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={resetAndClose}>{t('Close')}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={taskModal} onHide={() => setTaskModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('Create Homecare Visit Task')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedPatient && <Alert variant="light" className="border">{t('No patient selected.')}</Alert>}
          {selectedPatient && (
            <>
              <div className="mb-2"><strong>{t('Patient')}:</strong> {getPatientField(selectedPatient, 'fullName') || selectedPatient.name}</div>
              <Form.Group className="mb-2">
                <Form.Label>{t('Title')}</Form.Label>
                <Form.Control value={taskDraft.title} onChange={(e) => setTaskDraft((d) => ({ ...d, title: e.target.value }))} />
              </Form.Group>
              <Form.Group>
                <Form.Label>{t('Notes')}</Form.Label>
                <Form.Control as="textarea" rows={3} value={taskDraft.notes} onChange={(e) => setTaskDraft((d) => ({ ...d, notes: e.target.value }))} />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setTaskModal(false)}>{t('Cancel')}</Button>
          <Button variant="primary" onClick={submitTask} disabled={!selectedPatient}>{t('Create')}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PatientsModule;
