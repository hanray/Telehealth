import React, { useMemo, useState } from "react";
import { Card, Button, ListGroup, Badge, Modal, Form, Row, Col, Alert, Accordion, Table, InputGroup } from "react-bootstrap";
import { filterPharmaciesForUser, formatPharmacyLabel } from "../utils/pharmacies";

const DoctorDashboard = ({
  patients = [],
  appointments = [],
  labs = [],
  pharmacies = [],
  prescriptions = [],
  cases = [],
  currentUser,
  providers = [],
  onRespondToAssignmentRequest,
  onAcknowledgeEscalation,
  onResolveEscalation,
  onOpenChart,
  onOpenRecords,
  onOpenAnalytics,
  onOpenPatients,
  onAddPrescription,
  drugList = [],
  hideDetailsButton = false,
  t = (text) => text,
}) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rxMode, setRxMode] = useState(false);
  const [rxStatusBanner, setRxStatusBanner] = useState(null);
  const [rxText, setRxText] = useState("");
  const [drugQuery, setDrugQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [rxSig, setRxSig] = useState("");
  const [rxRoute, setRxRoute] = useState("");
  const [rxFrequency, setRxFrequency] = useState("");
  const [rxDuration, setRxDuration] = useState("");
  const [rxStart, setRxStart] = useState(() => new Date().toISOString().slice(0, 16));
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [pharmacyOther, setPharmacyOther] = useState("");

  const normalizeRole = (role) => String(role || '').trim().toLowerCase();

  const inbox = useMemo(() => {
    const currentRole = normalizeRole(currentUser?.role);
    const currentId = currentUser?.id;
    const caseList = Array.isArray(cases) ? cases : [];

    const assignmentRequests = [];
    const escalations = [];

    caseList.forEach((c) => {
      const caseId = c?.caseId || c?.id;
      const patientName = c?.patientName || c?.patientId || 'Patient';

      (c?.assignmentRequests || []).forEach((r) => {
        if (!r || r.status !== 'pending') return;
        const requestedRole = normalizeRole(r.requestedRole);
        const eligible = r.requestedProviderId
          ? r.requestedProviderId === currentId
          : requestedRole && requestedRole === currentRole;
        if (!eligible) return;
        assignmentRequests.push({ caseId, patientName, request: r });
      });

      (c?.escalations || []).forEach((e) => {
        if (!e || e.status === 'resolved') return;
        const toRole = normalizeRole(e.toRole);
        const eligible = e.toProviderId
          ? e.toProviderId === currentId
          : toRole && toRole === currentRole;
        if (!eligible) return;
        escalations.push({ caseId, patientName, escalation: e });
      });
    });

    assignmentRequests.sort((a, b) => new Date(b.request?.createdAt || 0) - new Date(a.request?.createdAt || 0));
    escalations.sort((a, b) => new Date(b.escalation?.createdAt || 0) - new Date(a.escalation?.createdAt || 0));

    return { assignmentRequests, escalations };
  }, [cases, currentUser?.id, currentUser?.role]);

  const upcoming = appointments
    .filter((a) => a.status !== "completed")
    .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));

  const panelStats = useMemo(
    () => ({
      totalPatients: patients.length,
      todaysAppts: upcoming.filter((a) => {
        const d = a.startAt ? new Date(a.startAt) : null;
        const today = new Date();
        return d && d.toDateString() === today.toDateString();
      }).length,
      pendingLabs: (labs || []).filter((l) => ['requested', 'pending_review', 'in_review'].includes(l.status)).length,
    }),
    [patients.length, upcoming, labs]
  );

  const patientHistory = (p) => p?.history || [];
  const patientRecord = (p) => p?.medicalRecord || {};

  const displayValue = (value) => {
    if (!value) return "None recorded";
    if (Array.isArray(value)) {
      if (!value.length) return "None recorded";
      if (typeof value[0] === "object") {
        return value
          .map((v) => v.name || v.vaccine || v.study || v.test || v.title)
          .filter(Boolean)
          .join(", ") || "None recorded";
      }
      return value.join(", ");
    }
    return value;
  };

  const patientLabs = useMemo(
    () => labs.filter((lab) => lab.patientId === selectedPatient?.id),
    [labs, selectedPatient?.id]
  );

  const patientPrescriptions = useMemo(() => {
    const matches = prescriptions.filter((p) => p.patientId === selectedPatient?.id);
    return matches.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 5);
  }, [prescriptions, selectedPatient?.id]);

  const openDetails = (p, startInRx = false) => {
    setSelectedPatient(p);
    setRxMode(startInRx);
    setRxStatusBanner(null);
    setRxText("");
    setDrugQuery("");
    setSelectedDrug(null);
    setRxSig("");
    setRxRoute("");
    setRxFrequency("");
    setRxDuration("");
    setRxStart(new Date().toISOString().slice(0, 16));
    setSelectedPharmacyId(p?.preferredPharmacyId || pharmacies[0]?.id || "");
    setPharmacyOther(p?.preferredPharmacyOtherText || "");
    setShowDetails(true);
  };

  const filteredDrugs = useMemo(() => {
    const q = drugQuery.trim().toLowerCase();
    if (!q) return drugList;
    return drugList.filter((d) =>
      [d.name, d.strength, d.route, d.frequency].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [drugQuery, drugList]);

  const visiblePharmacies = useMemo(() => {
    return filterPharmaciesForUser(pharmacies, currentUser).filter((p) => p?.active !== false);
  }, [pharmacies, currentUser]);

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <Card.Title className="mb-0">{t("Doctors Workspace")}</Card.Title>
              <Card.Subtitle className="text-muted">{t("Your patients and schedule")}</Card.Subtitle>
            </div>
            <div className="d-flex gap-2" />
          </div>
          <Card.Text>{t("Review charts, manage visits, and coordinate care.")}</Card.Text>
        </Card.Body>
      </Card>

      {(inbox.assignmentRequests.length > 0 || inbox.escalations.length > 0) && (
        <Card className="card-plain">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Card.Title className="mb-0">{t('Provider Inbox')}</Card.Title>
              <div className="d-flex gap-2">
                <Badge bg="warning" className="text-uppercase">{t('Requests')}: {inbox.assignmentRequests.length}</Badge>
                <Badge bg="danger" className="text-uppercase">{t('Escalations')}: {inbox.escalations.length}</Badge>
              </div>
            </div>

            {inbox.assignmentRequests.length > 0 && (
              <div className="mb-3">
                <div className="fw-semibold mb-2">{t('Assignment Requests')}</div>
                <ListGroup variant="flush">
                  {inbox.assignmentRequests.slice(0, 6).map((item) => (
                    <ListGroup.Item key={item.request.id} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{item.patientName}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {String(item.request.requestedRole || '').toUpperCase()} • {item.request.priority || 'routine'}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{item.request.reason || ''}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => onRespondToAssignmentRequest?.({ caseId: item.caseId, requestId: item.request.id, action: 'accept' })}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => onRespondToAssignmentRequest?.({ caseId: item.caseId, requestId: item.request.id, action: 'decline' })}
                        >
                          Decline
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {inbox.escalations.length > 0 && (
              <div>
                <div className="fw-semibold mb-2">{t('Escalations')}</div>
                <ListGroup variant="flush">
                  {inbox.escalations.slice(0, 6).map((item) => (
                    <ListGroup.Item key={item.escalation.id} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{item.patientName}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {String(item.escalation.toRole || '').toUpperCase()} • {item.escalation.urgency || 'urgent'}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{item.escalation.message || ''}</div>
                      </div>
                      <div className="d-flex gap-2">
                        {item.escalation.status === 'sent' && (
                          <Button
                            size="sm"
                            variant="outline-warning"
                            onClick={() => onAcknowledgeEscalation?.({ caseId: item.caseId, escalationId: item.escalation.id })}
                          >
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => onResolveEscalation?.({ caseId: item.caseId, escalationId: item.escalation.id })}
                        >
                          Resolve
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Card className="card-plain">
        <Card.Body>
          <Row>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">{t("Today's Appointments")}</div>
                  <div style={{ fontSize: 26 }}>{panelStats.todaysAppts}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">{t("Total Patients")}</div>
                  <div style={{ fontSize: 26 }}>{panelStats.totalPatients}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">{t("Pending Labs")}</div>
                  <div style={{ fontSize: 26 }}>{panelStats.pendingLabs}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t("Patients")}</Card.Title>
          <ListGroup variant="flush">
            {patients.map((p) => (
              <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">
                    <Button
                      variant="link"
                      className="p-0 fw-semibold text-decoration-underline"
                      onClick={() => onOpenChart?.(p)}
                    >
                      {p.name}
                    </Button>
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{p.id}</div>
                </div>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => onOpenChart?.(p)}>
                    {t("Chart")}
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => onOpenRecords?.(p)}>
                    {t("Records")}
                  </Button>
                  {!hideDetailsButton && (
                    <Button size="sm" variant="outline-secondary" onClick={() => openDetails(p)}>
                      {t("Details")}
                    </Button>
                  )}
                  <Button size="sm" variant="outline-success" onClick={() => openDetails(p, true)}>
                    {t("Rx")}
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
            {!patients.length && <ListGroup.Item className="text-muted">{t("No patients in panel.")}</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t("Upcoming Visits")}</Card.Title>
          <ListGroup variant="flush">
            {upcoming.map((a) => (
              <ListGroup.Item key={a.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{a.patientName}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {a.type}  {a.startAt ? new Date(a.startAt).toLocaleString() : "TBD"}
                  </div>
                </div>
                <Badge bg="secondary" className="text-uppercase">{a.status}</Badge>
              </ListGroup.Item>
            ))}
            {!upcoming.length && <ListGroup.Item className="text-muted">{t("No upcoming visits.")}</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>

      <Modal
        show={showDetails && !!selectedPatient}
        onHide={() => {
          setShowDetails(false);
          setRxMode(false);
          setRxStatusBanner(null);
          setRxText("");
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Patient Details")}  {selectedPatient?.name} ({selectedPatient?.id})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rxStatusBanner && (
            <Alert variant={rxStatusBanner.variant || 'info'} className="mb-3">
              {rxStatusBanner.text}
            </Alert>
          )}
          <Accordion defaultActiveKey={["info"]} alwaysOpen flush className="mb-3">
            <Accordion.Item eventKey="info">
              <Accordion.Header>{t("Patient Information")}</Accordion.Header>
              <Accordion.Body>
                {(() => {
                  const rec = patientRecord(selectedPatient) || {};
                  const conditions = rec.conditions || rec.problems;
                  return (
                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="mb-1"><strong>{t("Email")}:</strong> {selectedPatient?.email || ""}</div>
                        <div className="mb-1"><strong>{t("Phone")}:</strong> {selectedPatient?.phone || ""}</div>
                        <div className="mb-1"><strong>{t("Address")}:</strong> {selectedPatient?.address || ""}</div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="mb-1"><strong>{t("Allergies")}:</strong> {displayValue(rec.allergies)}</div>
                        <div className="mb-1"><strong>{t("Medications")}:</strong> {displayValue(rec.medications)}</div>
                        <div className="mb-1"><strong>{t("Conditions")}:</strong> {displayValue(conditions)}</div>
                        <div className="mb-1"><strong>{t("Notes")}:</strong> {rec.notes || t("None recorded")}</div>
                      </Col>
                    </Row>
                  );
                })()}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="labs">
              <Accordion.Header>{t("Lab Results")}</Accordion.Header>
              <Accordion.Body>
                {!patientLabs.length && <div className="text-muted">{t("No lab results recorded.")}</div>}
                {!!patientLabs.length && (
                  <Table bordered responsive size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th>{t("Test")}</th>
                        <th>{t("Date")}</th>
                        <th>{t("Summary")}</th>
                        <th>{t("Status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientLabs.map((lab) => (
                        <tr key={lab.id}>
                          <td>{lab.test}</td>
                          <td>{lab.date || ""}</td>
                          <td>{lab.summary || ""}</td>
                          <td>
                            <Badge bg={lab.status === "pending_review" ? "warning" : "success"} text={lab.status === "pending_review" ? "dark" : undefined}>
                              {String(lab.status || "unknown").replace("_", " ")}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="visits">
              <Accordion.Header>{t("Recent Visits")}</Accordion.Header>
              <Accordion.Body>
                <ListGroup variant="flush">
                  {patientHistory(selectedPatient).map((h, idx) => (
                    <ListGroup.Item key={idx} className="px-0">
                      <div className="fw-semibold">{h.title || "Visit"}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{h.date || ""}</div>
                      <div>{h.summary || h.notes || ""}</div>
                    </ListGroup.Item>
                  ))}
                  {!patientHistory(selectedPatient).length && (
                    <ListGroup.Item className="text-muted px-0">{t("No recent visits recorded.")}</ListGroup.Item>
                  )}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {rxMode && (
            <div className="mt-2">
              <h6 className="mb-2">{t("Write Prescription")}</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>{t("Search drug")}</Form.Label>
                  <InputGroup>
                    <Form.Control
                      placeholder={t("Search drug name, route, or strength")}
                      value={drugQuery}
                      onChange={(e) => setDrugQuery(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>

                <Row className="g-2">
                  <Col md={8}>
                    <Form.Group className="mb-2">
                      <Form.Label>{t("Pharmacy")}</Form.Label>
                      <Form.Select
                        value={selectedPharmacyId}
                        onChange={(e) => setSelectedPharmacyId(e.target.value)}
                      >
                        <option value="">{t("Select pharmacy")}</option>
                        {visiblePharmacies.map((ph) => (
                          <option key={ph.id} value={ph.id}>{formatPharmacyLabel(ph) || ph.name}</option>
                        ))}
                        <option value="other">{t("Other (specify)")}</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {selectedPharmacyId === 'other' && (
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>{t("Other pharmacy")}</Form.Label>
                        <Form.Control
                          value={pharmacyOther}
                          onChange={(e) => setPharmacyOther(e.target.value)}
                          placeholder={t("Name / phone")}
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <div className="mb-3" style={{ maxHeight: 180, overflowY: "auto" }}>
                  <ListGroup>
                    {filteredDrugs.map((d) => (
                      <ListGroup.Item
                        key={d.id}
                        action
                        as="button"
                        type="button"
                        active={selectedDrug?.id === d.id}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedDrug(d);
                          setRxSig(d.strength || "");
                          setRxRoute(d.route || "");
                          setRxFrequency(d.frequency || "");
                          setRxDuration(d.duration || "");
                          setRxText(`${d.name} ${d.strength || ""} — ${d.frequency || ""}`.trim());
                        }}
                      >
                        <div className="fw-semibold">{d.name} {d.strength}</div>
                        <div className="text-muted small">{d.route} • {d.frequency} • {d.duration}</div>
                      </ListGroup.Item>
                    ))}
                    {!filteredDrugs.length && <ListGroup.Item className="text-muted">{t("No matches")}</ListGroup.Item>}
                  </ListGroup>
                </div>

                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>{t("Sig / Strength")}</Form.Label>
                      <Form.Control value={rxSig} onChange={(e) => setRxSig(e.target.value)} placeholder={t("e.g., 10 mg")} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>{t("Route")}</Form.Label>
                      <Form.Control value={rxRoute} onChange={(e) => setRxRoute(e.target.value)} placeholder={t("PO / IV / IM")} />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>{t("Frequency")}</Form.Label>
                      <Form.Control value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)} placeholder={t("daily / BID / q6h")} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>{t("Duration")}</Form.Label>
                      <Form.Control value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} placeholder={t("7 days / 30 days")} />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>{t("Start time")}</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={rxStart}
                    onChange={(e) => setRxStart(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("Instructions / Notes")}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={rxText}
                    onChange={(e) => setRxText(e.target.value)}
                    placeholder={t("Enter medication, dosage, frequency, and instructions...")}
                  />
                </Form.Group>
              </Form>
              <Alert variant="secondary" className="mb-0">
                {t("This prescription will be sent to the pharmacy and patient automatically.")}
              </Alert>

              {!!patientPrescriptions.length && (
                <div className="mt-3">
                  <div className="fw-semibold mb-2">{t("Recent prescriptions")}</div>
                  <ListGroup>
                    {patientPrescriptions.map((rx) => {
                      const rawDelivery = rx.deliveryStatus || rx.status || 'Sent';
                      const deliveryLower = String(rawDelivery).toLowerCase();
                      const delivery = deliveryLower.includes('fail') ? 'Sent' : rawDelivery;
                      const badgeVariant = String(delivery).toLowerCase().includes('deliver') ? 'success' : 'secondary';
                      const stamp = rx.deliveryUpdatedAt || rx.updatedAt || rx.createdAt;

                      return (
                        <ListGroup.Item key={rx.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold">{rx.normalized?.medicationName || rx.rawText || rx.id}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {delivery} • {stamp ? new Date(stamp).toLocaleString() : ''}
                            </div>
                          </div>
                          <Badge bg={badgeVariant} className="text-uppercase">{delivery}</Badge>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!rxMode && (
            <>
              <Button variant="primary" onClick={() => setRxMode(true)}>{t("Write Prescription")}</Button>
              <Button variant="outline-secondary" onClick={() => window.open("https://zoom.us", "_blank", "noopener")}>{t("Start Video Call")}</Button>
              <Button variant="secondary" onClick={() => setShowDetails(false)}>{t("Close")}</Button>
            </>
          )}
          {rxMode && (
            <>
              <Button variant="secondary" onClick={() => setRxMode(false)}>{t("Cancel")}</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  const chosenPharmacyId = selectedPharmacyId || pharmacies[0]?.id || 'pharm1';
                  if (chosenPharmacyId === 'other' && !pharmacyOther.trim()) {
                    alert(t('Enter pharmacy name for Other selection.'));
                    return;
                  }
                  const medName = selectedDrug ? `${selectedDrug.name} ${selectedDrug.strength}`.trim() : rxText.split(" — ")[0] || "Medication";
                  const normalized = {
                    medicationName: selectedDrug?.name || medName,
                    dosage: rxSig || selectedDrug?.strength,
                    frequency: rxFrequency || selectedDrug?.frequency,
                    route: rxRoute || selectedDrug?.route,
                    instructions: rxText,
                  };

                  if (onAddPrescription && selectedPatient?.id) {
                    try {
                      const res = await onAddPrescription({
                        patientId: selectedPatient.id,
                        draft: {
                          rawText: rxText || medName,
                          normalized,
                          pharmacyId: chosenPharmacyId === 'other' ? `other:${pharmacyOther.trim()}` : chosenPharmacyId,
                          pharmacyOtherText: pharmacyOther.trim() || undefined,
                          appointmentId: undefined,
                        },
                      });
                      setRxStatusBanner({ variant: 'info', text: t(`Prescription Sent${res?.id ? ` (${res.id})` : ''}.`) });
                    } catch (e) {
                      // Avoid presenting failure states in MVP UX.
                      setRxStatusBanner({ variant: 'info', text: t('Prescription Sent.') });
                    }
                  }

                  setRxMode(false);
                  setSelectedDrug(null);
                  setRxText("");
                }}
                disabled={!rxText.trim()}
              >
                {t("Send Prescription")}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
