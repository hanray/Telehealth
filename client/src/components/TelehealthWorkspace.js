import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col, Alert, Form, InputGroup, Modal, Accordion } from 'react-bootstrap';

const TelehealthWorkspace = ({
  patients = [],
  appointments = [],
  labs = [],
  triageQueue = [],
  activeTelehealthVisit,
  currentUser,
  providers = [],
  notifications = [],
  intakeStatusByPatientId = {},
  onCloseVisit,
  onOpenVisitSummary,
  onOpenLab,
  onOpenChat,
  onOpenAssignments,
  onStartVisit,
  onAssignProvider,
  onEscalate,
  onRequestProviderAssignment,
  onCreateEscalation,
  onCreateFollowUp,
  onOrderLab,
  onSendIntake,
  onMarkTriageComplete,
  t = (str) => str,
}) => {
  const upcoming = useMemo(
    () => (appointments || [])
      .filter((a) => a.status !== 'completed')
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0)),
    [appointments]
  );

  const todaysAppts = useMemo(() => {
    const today = new Date().toDateString();
    return upcoming.filter((a) => {
      if (!a.startAt) return false;
      const d = new Date(a.startAt);
      return d.toDateString() === today;
    });
  }, [upcoming]);

  const pendingLabs = useMemo(() => {
    const pending = new Set(['requested', 'pending_review', 'in_review']);
    return (labs || []).filter((l) => pending.has(l.status));
  }, [labs]);

  const triage = useMemo(() => (Array.isArray(triageQueue) ? triageQueue : []), [triageQueue]);
  const activeTriage = useMemo(() => triage.filter((i) => i.triageStatus !== 'complete'), [triage]);
  const completedTriage = useMemo(() => triage.filter((i) => i.triageStatus === 'complete'), [triage]);

  const allSelectablePatients = useMemo(() => {
    const map = new Map();

    (activeTriage || []).forEach((item) => {
      const resolved = (patients || []).find((p) => p.id === item.patientId) || (patients || []).find((p) => p.name === item.patientName);
      if (resolved?.id && !map.has(resolved.id)) {
        map.set(resolved.id, { id: resolved.id, name: resolved.name || resolved.id });
      }
    });

    (todaysAppts || []).forEach((a) => {
      if (a?.patientId && !map.has(a.patientId)) {
        map.set(a.patientId, { id: a.patientId, name: a.patientName || a.patientId });
      }
    });

    (patients || []).forEach((p) => {
      if (p?.id && !map.has(p.id)) {
        map.set(p.id, { id: p.id, name: p.name || p.id });
      }
    });

    return Array.from(map.values());
  }, [activeTriage, patients, todaysAppts]);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appliedBanner, setAppliedBanner] = useState('');

  const [labType, setLabType] = useState('CBC');
  const [labOther, setLabOther] = useState('');
  const [labPriority, setLabPriority] = useState('Routine');
  const [labAssigneeId, setLabAssigneeId] = useState('');

  const [intakeReason, setIntakeReason] = useState('');
  const [intakeSymptomsDuration, setIntakeSymptomsDuration] = useState('');
  const [intakeAllergies, setIntakeAllergies] = useState('');
  const [intakeCurrentMeds, setIntakeCurrentMeds] = useState('');
  const [intakeInlineError, setIntakeInlineError] = useState('');

  const [showCompletedTriage, setShowCompletedTriage] = useState(false);

  const actionableProviders = useMemo(() => {
    const list = Array.isArray(providers) ? providers : [];
    return list.filter((p) => p?.id && (p.role === 'doctor' || p.role === 'specialist'));
  }, [providers]);

  useEffect(() => {
    if (labAssigneeId) return;
    const doctor = actionableProviders.find((p) => p.role === 'doctor') || actionableProviders[0];
    if (doctor?.id) setLabAssigneeId(doctor.id);
  }, [actionableProviders, labAssigneeId]);

  const resolvePatient = (id) => (patients || []).find((p) => p.id === id) || null;

  const getDefaultTarget = () => {
    const firstTriage = (activeTriage || [])[0];
    if (firstTriage) {
      const resolved = resolvePatient(firstTriage.patientId) || (patients || []).find((p) => p.name === firstTriage.patientName);
      if (resolved) return resolved;
    }
    const firstAppt = (todaysAppts || [])[0];
    if (firstAppt?.patientId) {
      const resolved = resolvePatient(firstAppt.patientId) || (patients || []).find((p) => p.name === firstAppt.patientName);
      if (resolved) return resolved;
      return { id: firstAppt.patientId, name: firstAppt.patientName || firstAppt.patientId };
    }
    return (patients || [])[0] || null;
  };

  const getActionTarget = () => {
    const selected = selectedPatientId ? resolvePatient(selectedPatientId) || { id: selectedPatientId, name: selectedPatientId } : null;
    if (selected?.id) return { patient: selected, usedDefault: false };
    const fallback = getDefaultTarget();
    return { patient: fallback, usedDefault: true };
  };

  const providerLabelById = (id) => {
    const p = (providers || []).find((x) => x.id === id);
    return p?.name || null;
  };

  const patientLabelById = (id) => {
    const p = (patients || []).find((x) => x.id === id);
    return p?.name || id || t('Patient');
  };

  const handleRequestLabs = () => {
    const { patient, usedDefault } = getActionTarget();
    if (!patient?.id) return;
    setAppliedBanner(usedDefault ? `${t('Applied to')}: ${patient.name || patient.id}` : '');

    const assignee = actionableProviders.find((p) => p.id === labAssigneeId);
    const payload = {
      patientId: patient.id,
      patientName: patient.name || patientLabelById(patient.id),
      labType,
      labTypeOther: labType === 'Other' ? labOther : '',
      priority: labPriority,
      assignedToUserId: assignee?.id || (labAssigneeId || 'unassigned'),
      assignedToRole: assignee?.role || (labAssigneeId ? 'doctor' : 'unassigned'),
      requestedByUserId: currentUser?.id,
    };

    onOrderLab?.(payload);
  };

  const handleSendIntake = () => {
    const { patient, usedDefault } = getActionTarget();
    if (!patient?.id) return;
    if (!String(intakeReason || '').trim()) {
      setIntakeInlineError(t('Reason for visit is required.'));
      return;
    }
    setIntakeInlineError('');
    setAppliedBanner(usedDefault ? `${t('Applied to')}: ${patient.name || patient.id}` : '');

    onSendIntake?.({
      patientId: patient.id,
      patientName: patient.name || patientLabelById(patient.id),
      reasonForVisit: intakeReason.trim(),
      symptomsDuration: intakeSymptomsDuration.trim(),
      allergies: intakeAllergies.trim(),
      currentMeds: intakeCurrentMeds.trim(),
    });
  };

  const handleMarkComplete = () => {
    const { patient, usedDefault } = getActionTarget();
    if (!patient?.id) return;
    setAppliedBanner(usedDefault ? `${t('Applied to')}: ${patient.name || patient.id}` : '');
    onMarkTriageComplete?.({ patientId: patient.id, patientName: patient.name || patientLabelById(patient.id) });
  };

  const readyByPatientId = useMemo(() => {
    const map = new Map();
    completedTriage.forEach((i) => {
      if (i.patientId) map.set(i.patientId, true);
    });
    return map;
  }, [completedTriage]);

  const activity = useMemo(() => {
    const list = Array.isArray(notifications) ? notifications : [];
    // Include case workflow notifications (assignment requests, escalations) so
    // nurse/psw sees immediate feedback after quick actions.
    const allowed = new Set(['lab', 'intake', 'triage', 'case']);
    return list
      .filter((n) => allowed.has(n.contextType))
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 6);
  }, [notifications]);

  const normalizeRole = (role) => String(role || '').trim().toLowerCase();

  const providerOptionsByRole = useMemo(() => {
    const map = new Map();
    (providers || []).forEach((p) => {
      const r = normalizeRole(p?.role);
      if (!r) return;
      if (!map.has(r)) map.set(r, []);
      map.get(r).push(p);
    });
    return map;
  }, [providers]);

  const resolveCaseForPatient = useCallback((patient) => {
    if (!patient?.id) return null;
    const list = Array.isArray(triageQueue) ? triageQueue : [];
    return list.find((c) => c?.patientId === patient.id) || list.find((c) => c?.patientName === patient.name) || null;
  }, [triageQueue]);

  const currentRole = normalizeRole(currentUser?.role);
  const canRequestAssignment = ['nurse', 'psw', 'doctor', 'admin'].includes(currentRole);
  const allowedEscalationTargets = useMemo(() => {
    if (currentRole === 'nurse' || currentRole === 'psw') return ['doctor'];
    if (currentRole === 'doctor') return ['specialist', 'pharmacist'];
    if (currentRole === 'admin') return ['doctor', 'specialist', 'pharmacist'];
    return [];
  }, [currentRole]);
  const canEscalate = allowedEscalationTargets.length > 0;

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqRole, setReqRole] = useState('doctor');
  const [reqProviderId, setReqProviderId] = useState('');
  const [reqPriority, setReqPriority] = useState('routine');
  const [reqReason, setReqReason] = useState('');
  const [reqInlineError, setReqInlineError] = useState('');

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escRole, setEscRole] = useState(allowedEscalationTargets[0] || 'doctor');
  const [escProviderId, setEscProviderId] = useState('');
  const [escUrgency, setEscUrgency] = useState('urgent');
  const [escMessage, setEscMessage] = useState('');
  const [escInlineError, setEscInlineError] = useState('');

  useEffect(() => {
    if (!allowedEscalationTargets.length) return;
    if (!allowedEscalationTargets.includes(escRole)) {
      setEscRole(allowedEscalationTargets[0]);
      setEscProviderId('');
    }
  }, [allowedEscalationTargets, escRole]);

  const openRequestModal = () => {
    setReqInlineError('');
    setReqRole('doctor');
    setReqProviderId('');
    setReqPriority('routine');
    setReqReason('');
    setShowRequestModal(true);
  };

  const openEscalateModal = () => {
    setEscInlineError('');
    const first = allowedEscalationTargets[0] || 'doctor';
    setEscRole(first);
    setEscProviderId('');
    setEscUrgency('urgent');
    setEscMessage('');
    setShowEscalateModal(true);
  };

  const submitRequest = () => {
    const { patient, usedDefault } = getActionTarget();
    if (!patient?.id) return;
    const caseItem = resolveCaseForPatient(patient);
    if (!caseItem?.caseId) {
      setReqInlineError(t('No active case found for this patient.'));
      return;
    }

    const reason = String(reqReason || '').trim();
    if (!reason) {
      setReqInlineError(t('Reason is required.'));
      return;
    }

    setAppliedBanner(usedDefault ? `${t('Applied to')}: ${patient.name || patient.id}` : '');

    if (onRequestProviderAssignment) {
      onRequestProviderAssignment({
        caseId: caseItem.caseId,
        requestedRole: normalizeRole(reqRole),
        requestedProviderId: reqProviderId || null,
        priority: reqPriority,
        reason,
      });
    } else {
      // Back-compat: older wiring creates a generic request.
      onAssignProvider?.();
    }

    setShowRequestModal(false);
  };

  const submitEscalation = () => {
    const { patient, usedDefault } = getActionTarget();
    if (!patient?.id) return;
    const caseItem = resolveCaseForPatient(patient);
    if (!caseItem?.caseId) {
      setEscInlineError(t('No active case found for this patient.'));
      return;
    }

    const message = String(escMessage || '').trim();
    if (!message) {
      setEscInlineError(t('Message is required.'));
      return;
    }

    setAppliedBanner(usedDefault ? `${t('Applied to')}: ${patient.name || patient.id}` : '');

    if (onCreateEscalation) {
      onCreateEscalation({
        caseId: caseItem.caseId,
        toRole: normalizeRole(escRole),
        toProviderId: escProviderId || null,
        urgency: escUrgency,
        message,
      });
    } else {
      // Back-compat: older wiring creates a generic escalation.
      onEscalate?.();
    }

    setShowEscalateModal(false);
  };

  const currentCaseId = useMemo(() => {
    const { patient } = getActionTarget();
    return resolveCaseForPatient(patient)?.caseId || '';
  }, [resolveCaseForPatient, selectedPatientId, activeTriage, todaysAppts, patients]);

  return (
    <>
    <div className="d-grid gap-3">
      {activeTelehealthVisit && (
        <Alert variant="primary" className="d-flex justify-content-between align-items-center mb-0">
          <div>
            <strong>{t('Active visit')}:</strong> {activeTelehealthVisit.patientName} • {new Date(activeTelehealthVisit.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {onCloseVisit && (
            <Button size="sm" variant="outline-light" onClick={onCloseVisit}>{t('Close visit')}</Button>
          )}
        </Alert>
      )}

      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">{t('Care Coordination Tools')}</Card.Title>
            {appliedBanner && <span className="small text-muted">{appliedBanner}</span>}
          </div>

          <Form.Group className="mb-2">
            <Form.Label className="small text-muted mb-1">{t('Apply actions to')}</Form.Label>
            <Form.Select size="sm" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              <option value="">{t('Auto (triage/visit queue)')}</option>
              {allSelectablePatients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Accordion alwaysOpen>
            <Accordion.Item eventKey="0">
              <Accordion.Header>{t('Request labs')}</Accordion.Header>
              <Accordion.Body>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Select size="sm" value={labType} onChange={(e) => setLabType(e.target.value)}>
                      <option value="CBC">CBC</option>
                      <option value="Lipid Panel">Lipid Panel</option>
                      <option value="A1C">A1C</option>
                      <option value="Other">Other…</option>
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Select size="sm" value={labPriority} onChange={(e) => setLabPriority(e.target.value)}>
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                    </Form.Select>
                  </Col>
                  {labType === 'Other' && (
                    <Col md={12}>
                      <Form.Control
                        size="sm"
                        placeholder={t('Specify lab')}
                        value={labOther}
                        onChange={(e) => setLabOther(e.target.value)}
                      />
                    </Col>
                  )}
                  <Col md={12}>
                    <Form.Select size="sm" value={labAssigneeId} onChange={(e) => setLabAssigneeId(e.target.value)}>
                      <option value="">{t('Assign to (unassigned)')}</option>
                      {actionableProviders.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
                <div className="d-grid mt-2">
                  <Button size="sm" variant="outline-secondary" onClick={handleRequestLabs}>{t('Request labs')}</Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="1">
              <Accordion.Header>{t('Send intake form')}</Accordion.Header>
              <Accordion.Body>
                <InputGroup className="mb-2">
                  <InputGroup.Text>{t('Reason')}</InputGroup.Text>
                  <Form.Control
                    size="sm"
                    placeholder={t('Reason for visit')}
                    value={intakeReason}
                    onChange={(e) => setIntakeReason(e.target.value)}
                  />
                </InputGroup>
                {intakeInlineError && <div className="small text-danger mb-2">{intakeInlineError}</div>}
                <Row className="g-2">
                  <Col md={12}>
                    <Form.Control
                      size="sm"
                      placeholder={t('Symptoms duration (optional)')}
                      value={intakeSymptomsDuration}
                      onChange={(e) => setIntakeSymptomsDuration(e.target.value)}
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Control
                      size="sm"
                      placeholder={t('Allergies (optional)')}
                      value={intakeAllergies}
                      onChange={(e) => setIntakeAllergies(e.target.value)}
                    />
                  </Col>
                  <Col md={12}>
                    <Form.Control
                      size="sm"
                      placeholder={t('Current meds (optional)')}
                      value={intakeCurrentMeds}
                      onChange={(e) => setIntakeCurrentMeds(e.target.value)}
                    />
                  </Col>
                </Row>
                <div className="d-grid mt-2">
                  <Button size="sm" variant="outline-secondary" onClick={handleSendIntake}>{t('Send intake form')}</Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2">
              <Accordion.Header>{t('Provider workflows')}</Accordion.Header>
              <Accordion.Body>
                <div className="d-grid gap-2">
                  <Button size="sm" variant="primary" onClick={onStartVisit || (() => {})}>{t('Join visit room')}</Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={openRequestModal}
                    disabled={!canRequestAssignment}
                  >
                    {t('Request provider assignment')}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={openEscalateModal}
                    disabled={!canEscalate}
                  >
                    {t('Escalate to provider')}
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={onCreateFollowUp}>{t('Create follow-up')}</Button>
                  <Button size="sm" variant="outline-secondary" onClick={handleMarkComplete}>{t('Mark triage complete')}</Button>
                  <Button size="sm" variant="outline-secondary" onClick={onOpenChat}>{t('Open chat')}</Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col lg={7} className="d-flex flex-column gap-3">
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Visit Queue')}</Card.Title>
              <ListGroup variant="flush">
                {upcoming.map((a) => (
                  <ListGroup.Item key={a.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{a.patientName || t('Patient')}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {a.type || t('Visit')} • {a.startAt ? new Date(a.startAt).toLocaleString() : t('TBD')}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <Badge bg="light" text="dark" className="text-uppercase">{a.status || t('scheduled')}</Badge>
                      {a.patientId && readyByPatientId.get(a.patientId) && (
                        <Badge bg="success" className="text-uppercase">{t('Ready for provider')}</Badge>
                      )}
                      <Button size="sm" variant="outline-secondary" onClick={() => onOpenVisitSummary && onOpenVisitSummary({ id: a.patientId, name: a.patientName })}>
                        {t('Visit summary')}
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!upcoming.length && <ListGroup.Item className="text-muted">{t('No upcoming visits.')}</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Lab Review')}</Card.Title>
              <ListGroup variant="flush">
                {pendingLabs.map((lab) => (
                  <ListGroup.Item key={lab.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{lab.testName || lab.labType || t('Lab test')}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {lab.patientName || t('Patient')} • {lab.date || ''}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {t('Requested by')} {String(lab.requestedByRole || 'nurse').toUpperCase()} • {t('Assigned to')} {providerLabelById(lab.assignedToUserId)} • {String(lab.status || '').replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      {onOpenLab && (
                        <Button size="sm" variant="outline-secondary" onClick={() => onOpenLab(lab)}>
                          {t('Open')}
                        </Button>
                      )}
                      <Badge bg={lab.status === 'in_review' ? 'warning' : 'light'} text="dark">
                        {t(String(lab.status || 'pending_review').replace(/_/g, ' '))}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                ))}
                {!pendingLabs.length && <ListGroup.Item className="text-muted">{t('No pending labs.')}</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5} className="d-flex flex-column gap-3">

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Activity')}</Card.Title>
              <ListGroup variant="flush">
                {activity.map((n) => (
                  <ListGroup.Item key={n.id} className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold">{n.message || n.type}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {t('To')}: {providerLabelById(n.recipientId) || patientLabelById(n.recipientId)} • {n.contextType}{n.contextId ? ` • ${n.contextId}` : ''}
                      </div>
                    </div>
                    <Badge bg="light" text="dark" className="text-uppercase">{String(n.type || 'notice').replace(/_/g, ' ')}</Badge>
                  </ListGroup.Item>
                ))}
                {!activity.length && <ListGroup.Item className="text-muted">{t('No recent activity.')}</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Patients')}</Card.Title>
              <ListGroup variant="flush">
                {patients.map((p) => (
                  <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <span>{p.name}</span>
                        {intakeStatusByPatientId?.[p.id] === 'sent' && (
                          <Badge bg="warning" className="text-uppercase">{t('Intake sent')}</Badge>
                        )}
                        {intakeStatusByPatientId?.[p.id] === 'received' && (
                          <Badge bg="success" className="text-uppercase">{t('Intake received')}</Badge>
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{p.id}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-secondary" onClick={() => onOpenVisitSummary && onOpenVisitSummary(p)}>
                        {t('Visit summary')}
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={onOpenChat}>
                        {t('Chat')}
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!patients.length && <ListGroup.Item className="text-muted">{t('No patients assigned.')}</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Triage Queue')}</Card.Title>
              {activeTriage.length === 0 && (
                <Alert variant="light" className="mb-0 border">{t('No active triage items.')}</Alert>
              )}
              {activeTriage.length > 0 && (
                <ListGroup variant="flush">
                  {activeTriage.map((item, idx) => (
                    <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{item.title}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{item.patientName}</div>
                        {item.assignedToUserId && (
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {t('Next owner')}: {providerLabelById(item.assignedToUserId)}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        {item.status && <Badge bg="light" text="dark" className="text-uppercase">{item.status}</Badge>}
                        {item.needsProvider && <Badge bg="warning" className="text-uppercase">{t('Needs provider')}</Badge>}
                        <Badge bg={item.severity === 'high' ? 'danger' : 'warning'} className="text-uppercase">{t(item.severity)}</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {completedTriage.length > 0 && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setShowCompletedTriage((v) => !v)}
                  >
                    {showCompletedTriage ? t('Hide completed today') : `${t('Completed today')} (${completedTriage.length})`}
                  </Button>
                  {showCompletedTriage && (
                    <ListGroup variant="flush" className="mt-2">
                      {completedTriage.map((item, idx) => (
                        <ListGroup.Item key={`done-${idx}`} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold">{item.patientName}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {t('Triage complete')} • {item.triageCompletedAt ? new Date(item.triageCompletedAt).toLocaleString() : ''}
                            </div>
                          </div>
                          <Badge bg="success" className="text-uppercase">{t('Complete')}</Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>

    <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('Request Provider Assignment')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!canRequestAssignment && (
          <Alert variant="light" className="border">{t('Your role cannot request assignment.')}</Alert>
        )}
        {reqInlineError && <Alert variant="danger">{reqInlineError}</Alert>}
        <Form>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Role needed')}</Form.Label>
              <Form.Select value={reqRole} onChange={(e) => { setReqRole(e.target.value); setReqProviderId(''); }}>
                <option value="doctor">{t('Doctor')}</option>
                <option value="specialist">{t('Specialist')}</option>
                <option value="pharmacist">{t('Pharmacist')}</option>
                <option value="nurse">{t('Nurse')}</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Specific provider (optional)')}</Form.Label>
              <Form.Select value={reqProviderId} onChange={(e) => setReqProviderId(e.target.value)}>
                <option value="">{t('Any available')}</option>
                {(providerOptionsByRole.get(normalizeRole(reqRole)) || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Priority')}</Form.Label>
              <Form.Select value={reqPriority} onChange={(e) => setReqPriority(e.target.value)}>
                <option value="routine">{t('Routine')}</option>
                <option value="urgent">{t('Urgent')}</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Case')}</Form.Label>
              <InputGroup>
                <Form.Control value={currentCaseId} disabled />
              </InputGroup>
            </Col>
          </Row>
          <Form.Group className="mb-2">
            <Form.Label>{t('Reason')}</Form.Label>
            <Form.Control as="textarea" rows={3} value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder={t('Why do you need this provider?')} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowRequestModal(false)}>{t('Cancel')}</Button>
        <Button variant="primary" onClick={submitRequest} disabled={!canRequestAssignment}>{t('Submit')}</Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showEscalateModal} onHide={() => setShowEscalateModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('Escalate to Provider')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!canEscalate && (
          <Alert variant="light" className="border">{t('Your role cannot escalate.')}</Alert>
        )}
        {escInlineError && <Alert variant="danger">{escInlineError}</Alert>}
        <Form>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>{t('To role')}</Form.Label>
              <Form.Select value={escRole} onChange={(e) => { setEscRole(e.target.value); setEscProviderId(''); }}>
                {allowedEscalationTargets.map((r) => (
                  <option key={r} value={r}>{String(r).toUpperCase()}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Specific provider (optional)')}</Form.Label>
              <Form.Select value={escProviderId} onChange={(e) => setEscProviderId(e.target.value)}>
                <option value="">{t('Any available')}</option>
                {(providerOptionsByRole.get(normalizeRole(escRole)) || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Urgency')}</Form.Label>
              <Form.Select value={escUrgency} onChange={(e) => setEscUrgency(e.target.value)}>
                <option value="urgent">{t('Urgent')}</option>
                <option value="emergency">{t('Emergency')}</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>{t('Case')}</Form.Label>
              <InputGroup>
                <Form.Control value={currentCaseId} disabled />
              </InputGroup>
            </Col>
          </Row>
          <Form.Group className="mb-2">
            <Form.Label>{t('Message')}</Form.Label>
            <Form.Control as="textarea" rows={3} value={escMessage} onChange={(e) => setEscMessage(e.target.value)} placeholder={t('What needs urgent attention?')} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowEscalateModal(false)}>{t('Cancel')}</Button>
        <Button variant="danger" onClick={submitEscalation} disabled={!canEscalate}>{t('Submit')}</Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default TelehealthWorkspace;
