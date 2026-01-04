import React, { useMemo, useState } from "react";
import { Card, Button, ListGroup, Badge, Modal, Form, Row, Col, Alert, Accordion, Table } from "react-bootstrap";

const DoctorDashboard = ({ patients = [], appointments = [], labs = [], onOpenRecords }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rxMode, setRxMode] = useState(false);
  const [rxText, setRxText] = useState("");

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
      pendingLabs: (labs || []).filter((l) => l.status === "pending_review").length,
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

  const openDetails = (p, startInRx = false) => {
    setSelectedPatient(p);
    setRxMode(startInRx);
    setRxText("");
    setShowDetails(true);
  };

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <Card.Title className="mb-0">Doctors Workspace</Card.Title>
              <Card.Subtitle className="text-muted">Your patients and schedule</Card.Subtitle>
            </div>
          </div>
          <Card.Text>Review charts, manage visits, and coordinate care.</Card.Text>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Row>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Today's Appointments</div>
                  <div style={{ fontSize: 26 }}>{panelStats.todaysAppts}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Total Patients</div>
                  <div style={{ fontSize: 26 }}>{panelStats.totalPatients}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Pending Labs</div>
                  <div style={{ fontSize: 26 }}>{panelStats.pendingLabs}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>Patients</Card.Title>
          <ListGroup variant="flush">
            {patients.map((p) => (
              <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{p.name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{p.id}</div>
                </div>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => onOpenRecords(p)}>
                    Chart
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => openDetails(p)}>
                    Details
                  </Button>
                  <Button size="sm" variant="outline-success" onClick={() => openDetails(p, true)}>
                    Rx
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
            {!patients.length && <ListGroup.Item className="text-muted">No patients in panel.</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>Upcoming Visits</Card.Title>
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
            {!upcoming.length && <ListGroup.Item className="text-muted">No upcoming visits.</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>

      <Modal
        show={showDetails && !!selectedPatient}
        onHide={() => {
          setShowDetails(false);
          setRxMode(false);
          setRxText("");
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Patient Details  {selectedPatient?.name} ({selectedPatient?.id})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Accordion defaultActiveKey={["info"]} alwaysOpen flush className="mb-3">
            <Accordion.Item eventKey="info">
              <Accordion.Header>Patient Information</Accordion.Header>
              <Accordion.Body>
                {(() => {
                  const rec = patientRecord(selectedPatient) || {};
                  const conditions = rec.conditions || rec.problems;
                  return (
                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="mb-1"><strong>Email:</strong> {selectedPatient?.email || ""}</div>
                        <div className="mb-1"><strong>Phone:</strong> {selectedPatient?.phone || ""}</div>
                        <div className="mb-1"><strong>Address:</strong> {selectedPatient?.address || ""}</div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="mb-1"><strong>Allergies:</strong> {displayValue(rec.allergies)}</div>
                        <div className="mb-1"><strong>Medications:</strong> {displayValue(rec.medications)}</div>
                        <div className="mb-1"><strong>Conditions:</strong> {displayValue(conditions)}</div>
                        <div className="mb-1"><strong>Notes:</strong> {rec.notes || "None recorded"}</div>
                      </Col>
                    </Row>
                  );
                })()}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="labs">
              <Accordion.Header>Lab Results</Accordion.Header>
              <Accordion.Body>
                {!patientLabs.length && <div className="text-muted">No lab results recorded.</div>}
                {!!patientLabs.length && (
                  <Table bordered responsive size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Date</th>
                        <th>Summary</th>
                        <th>Status</th>
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
              <Accordion.Header>Recent Visits</Accordion.Header>
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
                    <ListGroup.Item className="text-muted px-0">No recent visits recorded.</ListGroup.Item>
                  )}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {rxMode && (
            <div className="mt-2">
              <h6 className="mb-2">Write Prescription</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Prescription Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={rxText}
                    onChange={(e) => setRxText(e.target.value)}
                    placeholder="Enter medication, dosage, frequency, and instructions..."
                  />
                </Form.Group>
              </Form>
              <Alert variant="secondary" className="mb-0">
                This prescription will be sent to the pharmacy and patient automatically.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!rxMode && (
            <>
              <Button variant="primary" onClick={() => setRxMode(true)}>Write Prescription</Button>
              <Button variant="outline-secondary" onClick={() => window.open("https://zoom.us", "_blank", "noopener")}>Start Video Call</Button>
              <Button variant="secondary" onClick={() => setShowDetails(false)}>Close</Button>
            </>
          )}
          {rxMode && (
            <>
              <Button variant="secondary" onClick={() => setRxMode(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setRxMode(false);
                  setShowDetails(false);
                  setRxText("");
                }}
                disabled={!rxText.trim()}
              >
                Send Prescription
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
