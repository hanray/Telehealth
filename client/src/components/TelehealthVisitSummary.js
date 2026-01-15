import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Card, ListGroup, Badge, Alert, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';

const TelehealthVisitSummary = ({
  show,
  onHide,
  patient,
  appointments = [],
  providers = [],
  triageQueue = [],
  currentUser,
  onRequestProviderAssignment,
  onCancelAssignmentRequest,
  onCreateEscalation,
  onAcknowledgeEscalation,
  onResolveEscalation,
}) => {
  const normalizeRole = (role) => String(role || '').trim().toLowerCase();

  const providerNameById = (id) => {
    const p = (providers || []).find((x) => x.id === id);
    return p?.name || id || '';
  };

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
  const upcoming = useMemo(
    () => (appointments || [])
      .filter((a) => a.patientId === patient?.id)
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0)),
    [appointments, patient?.id]
  );

  const triageItems = useMemo(() => {
    const list = Array.isArray(triageQueue) ? triageQueue : [];
    return list
      .filter((t) => t.patientId === patient?.id || t.patientName === patient?.name)
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [triageQueue, patient?.id, patient?.name]);

  const visit = upcoming[0];

  const activeCase = useMemo(() => {
    const open = triageItems.find((c) => c?.status !== 'closed');
    return open || triageItems[0] || null;
  }, [triageItems]);

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

  const openRequest = useCallback(() => {
    setReqInlineError('');
    setReqRole('doctor');
    setReqProviderId('');
    setReqPriority('routine');
    setReqReason('');
    setShowRequestModal(true);
  }, []);

  const openEscalate = useCallback(() => {
    setEscInlineError('');
    const first = allowedEscalationTargets[0] || 'doctor';
    setEscRole(first);
    setEscProviderId('');
    setEscUrgency('urgent');
    setEscMessage('');
    setShowEscalateModal(true);
  }, [allowedEscalationTargets]);

  const submitRequest = () => {
    if (!activeCase?.caseId) return;
    const reason = String(reqReason || '').trim();
    if (!reason) {
      setReqInlineError('Reason is required.');
      return;
    }
    onRequestProviderAssignment?.({
      caseId: activeCase.caseId,
      requestedRole: normalizeRole(reqRole),
      requestedProviderId: reqProviderId || null,
      priority: reqPriority,
      reason,
    });
    setShowRequestModal(false);
  };

  const submitEscalation = () => {
    if (!activeCase?.caseId) return;
    const msg = String(escMessage || '').trim();
    if (!msg) {
      setEscInlineError('Message is required.');
      return;
    }
    onCreateEscalation?.({
      caseId: activeCase.caseId,
      toRole: normalizeRole(escRole),
      toProviderId: escProviderId || null,
      urgency: escUrgency,
      message: msg,
    });
    setShowEscalateModal(false);
  };

  const cancelRequest = (requestId) => {
    if (!activeCase?.caseId || !requestId) return;
    onCancelAssignmentRequest?.({ caseId: activeCase.caseId, requestId });
  };

  const isEligibleForEscalation = (e) => {
    if (!e) return false;
    if (e.toProviderId) return e.toProviderId === currentUser?.id;
    return normalizeRole(e.toRole) === currentRole;
  };

  // Support quick actions from TelehealthWorkspace by auto-opening the
  // relevant modal when the summary opens.
  const handledIntentRef = useRef(null);
  useEffect(() => {
    if (!show) {
      handledIntentRef.current = null;
      return;
    }

    const intent = patient?.__telehealthIntent;
    if (!intent || handledIntentRef.current === intent) return;
    if (!activeCase?.caseId) return;

    if (intent === 'request_provider_assignment') {
      handledIntentRef.current = intent;
      openRequest();
      return;
    }

    if (intent === 'escalate_to_provider') {
      handledIntentRef.current = intent;
      openEscalate();
    }
  }, [show, patient?.__telehealthIntent, activeCase?.caseId, openRequest, openEscalate]);

  return (
    <>
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Visit Summary</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!patient && <Alert variant="light">No patient selected.</Alert>}
        {patient && (
          <div className="d-grid gap-3">
            <Card className="card-plain">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-uppercase text-muted small fw-semibold">Visit / Encounter</div>
                    <div className="fw-bold">{patient.name}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>{patient.id}</div>
                  </div>
                  <div className="d-flex flex-column gap-2 align-items-end">
                    <Badge bg={activeCase?.status === 'escalated' ? 'danger' : 'secondary'} className="text-uppercase">
                      {activeCase?.status || visit?.status || 'planned'}
                    </Badge>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={openRequest}
                        disabled={!canRequestAssignment || !activeCase?.caseId}
                      >
                        Request Provider Assignment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={openEscalate}
                        disabled={!canEscalate || !activeCase?.caseId}
                      >
                        Escalate
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 d-grid gap-1">
                  <div><strong>Reason:</strong> {visit?.reason || visit?.type || 'Triage / remote visit'}</div>
                  <div><strong>Scheduled:</strong> {visit?.startAt ? new Date(visit.startAt).toLocaleString() : 'TBD'}</div>
                  <div><strong>Escalation:</strong> {visit?.escalation || 'None noted'}</div>
                </div>
              </Card.Body>
            </Card>

            <Card className="card-plain">
              <Card.Body>
                <Card.Title className="mb-2">Case coordination</Card.Title>
                {!activeCase && <Alert variant="light" className="border mb-0">No active case found for this patient.</Alert>}
                {activeCase && (
                  <div className="d-grid gap-3">
                    <div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        <strong>Case:</strong> {activeCase.caseId}
                      </div>
                      {!!(activeCase.assignedProviders || []).length && (
                        <div className="mt-2">
                          <div className="fw-semibold" style={{ fontSize: 13 }}>Assigned providers</div>
                          <ListGroup variant="flush">
                            {(activeCase.assignedProviders || []).map((ap, idx) => (
                              <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-semibold">{providerNameById(ap.userId) || ap.userId}</div>
                                  <div className="text-muted" style={{ fontSize: 12 }}>{String(ap.role || '').toUpperCase()}</div>
                                </div>
                                <Badge bg="secondary" className="text-uppercase">{ap.status || 'assigned'}</Badge>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="fw-semibold" style={{ fontSize: 13 }}>Assignment requests</div>
                        {!(activeCase.assignmentRequests || []).length && (
                          <div className="text-muted" style={{ fontSize: 12 }}>None</div>
                        )}
                        {!!(activeCase.assignmentRequests || []).length && (
                          <ListGroup variant="flush">
                            {(activeCase.assignmentRequests || [])
                              .slice()
                              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                              .map((r) => (
                                <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-semibold">
                                      {String(r.requestedRole || '').toUpperCase()} {r.requestedProviderId ? `→ ${providerNameById(r.requestedProviderId)}` : ''}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>{r.priority || 'routine'} • {r.reason || ''}</div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                                  </div>
                                  <div className="d-flex gap-2 align-items-center">
                                    <Badge bg={r.status === 'pending' ? 'warning' : r.status === 'accepted' ? 'success' : 'secondary'} className="text-uppercase">
                                      {r.status}
                                    </Badge>
                                    {r.status === 'pending' && r.createdByUserId === currentUser?.id && (
                                      <Button size="sm" variant="outline-secondary" onClick={() => cancelRequest(r.id)}>
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </ListGroup.Item>
                              ))}
                          </ListGroup>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="fw-semibold" style={{ fontSize: 13 }}>Escalations</div>
                        {!(activeCase.escalations || []).length && (
                          <div className="text-muted" style={{ fontSize: 12 }}>None</div>
                        )}
                        {!!(activeCase.escalations || []).length && (
                          <ListGroup variant="flush">
                            {(activeCase.escalations || [])
                              .slice()
                              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                              .map((e) => (
                                <ListGroup.Item key={e.id} className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <div className="fw-semibold">
                                      {String(e.toRole || '').toUpperCase()} {e.toProviderId ? `→ ${providerNameById(e.toProviderId)}` : ''}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>{e.urgency || 'urgent'} • {e.message || ''}</div>
                                    <div className="text-muted" style={{ fontSize: 12 }}>{e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</div>
                                  </div>
                                  <div className="d-flex flex-column gap-2 align-items-end">
                                    <Badge bg={e.status === 'sent' ? 'danger' : e.status === 'acknowledged' ? 'warning' : 'success'} className="text-uppercase">
                                      {e.status}
                                    </Badge>
                                    {isEligibleForEscalation(e) && e.status === 'sent' && (
                                      <Button size="sm" variant="outline-warning" onClick={() => onAcknowledgeEscalation?.({ caseId: activeCase.caseId, escalationId: e.id })}>
                                        Acknowledge
                                      </Button>
                                    )}
                                    {isEligibleForEscalation(e) && e.status !== 'resolved' && (
                                      <Button size="sm" variant="outline-success" onClick={() => onResolveEscalation?.({ caseId: activeCase.caseId, escalationId: e.id })}>
                                        Resolve escalation
                                      </Button>
                                    )}
                                  </div>
                                </ListGroup.Item>
                              ))}
                          </ListGroup>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card className="card-plain">
              <Card.Body>
                <Card.Title className="mb-2">Nurse notes (encounter)</Card.Title>
                <Alert variant="light" className="border mb-0">
                  {visit?.nurseNotes || 'Add encounter notes here (stubbed).'}
                </Alert>
              </Card.Body>
            </Card>

            <Card className="card-plain">
              <Card.Body>
                <Card.Title className="mb-2">Triage notes</Card.Title>
                {triageItems.length === 0 && (
                  <Alert variant="light" className="border mb-0">No triage notes for this visit.</Alert>
                )}
                {triageItems.length > 0 && (
                  <ListGroup variant="flush">
                    {triageItems.map((t, idx) => (
                      <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{t.title || 'Triage item'}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{t.patientName || patient.name}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{t.notes || 'No additional notes.'}</div>
                          {t.triageStatus === 'complete' && (
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              <div><strong>Triage:</strong> Complete{t.triageCompletedAt ? ` • ${new Date(t.triageCompletedAt).toLocaleString()}` : ''}</div>
                              {t.assignedToUserId && <div><strong>Next owner:</strong> {providerNameById(t.assignedToUserId)}</div>}
                            </div>
                          )}
                        </div>
                        <div className="d-flex flex-column gap-1 align-items-end">
                          {t.triageStatus === 'complete' && (
                            <Badge bg="success" className="text-uppercase">Complete</Badge>
                          )}
                          <Badge bg={t.severity === 'high' ? 'danger' : 'warning'} className="text-uppercase">{t.severity || 'open'}</Badge>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </div>
        )}
      </Modal.Body>
    </Modal>
    
    <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Request Provider Assignment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!canRequestAssignment && (
          <Alert variant="light" className="border">Your role cannot request assignment.</Alert>
        )}
        {reqInlineError && <Alert variant="danger">{reqInlineError}</Alert>}
        <Form>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Role needed</Form.Label>
              <Form.Select value={reqRole} onChange={(e) => { setReqRole(e.target.value); setReqProviderId(''); }}>
                <option value="doctor">Doctor</option>
                <option value="specialist">Specialist</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="nurse">Nurse</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Specific provider (optional)</Form.Label>
              <Form.Select value={reqProviderId} onChange={(e) => setReqProviderId(e.target.value)}>
                <option value="">Any available</option>
                {(providerOptionsByRole.get(normalizeRole(reqRole)) || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select value={reqPriority} onChange={(e) => setReqPriority(e.target.value)}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Case</Form.Label>
              <InputGroup>
                <Form.Control value={activeCase?.caseId || ''} disabled />
              </InputGroup>
            </Col>
          </Row>
          <Form.Group className="mb-2">
            <Form.Label>Reason</Form.Label>
            <Form.Control as="textarea" rows={3} value={reqReason} onChange={(e) => setReqReason(e.target.value)} placeholder="Why do you need this provider?" />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowRequestModal(false)}>Cancel</Button>
        <Button variant="primary" onClick={submitRequest} disabled={!canRequestAssignment || !activeCase?.caseId}>Submit</Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showEscalateModal} onHide={() => setShowEscalateModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Escalate to Provider</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!canEscalate && (
          <Alert variant="light" className="border">Your role cannot escalate.</Alert>
        )}
        {escInlineError && <Alert variant="danger">{escInlineError}</Alert>}
        <Form>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>To role</Form.Label>
              <Form.Select value={escRole} onChange={(e) => { setEscRole(e.target.value); setEscProviderId(''); }}>
                {allowedEscalationTargets.map((r) => (
                  <option key={r} value={r}>{String(r).toUpperCase()}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Specific provider (optional)</Form.Label>
              <Form.Select value={escProviderId} onChange={(e) => setEscProviderId(e.target.value)}>
                <option value="">Any available</option>
                {(providerOptionsByRole.get(normalizeRole(escRole)) || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Urgency</Form.Label>
              <Form.Select value={escUrgency} onChange={(e) => setEscUrgency(e.target.value)}>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Case</Form.Label>
              <InputGroup>
                <Form.Control value={activeCase?.caseId || ''} disabled />
              </InputGroup>
            </Col>
          </Row>
          <Form.Group className="mb-2">
            <Form.Label>Message</Form.Label>
            <Form.Control as="textarea" rows={3} value={escMessage} onChange={(e) => setEscMessage(e.target.value)} placeholder="What needs urgent attention?" />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setShowEscalateModal(false)}>Cancel</Button>
        <Button variant="danger" onClick={submitEscalation} disabled={!canEscalate || !activeCase?.caseId}>Submit</Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default TelehealthVisitSummary;
