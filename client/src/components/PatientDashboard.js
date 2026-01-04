import React, { useMemo, useState } from 'react';
import { Card, Button, ListGroup, Badge, Modal, Form, Row, Col, Alert, Table } from 'react-bootstrap';

const formatList = (value) => {
  if (!value) return '—';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    if (typeof value[0] === 'object') {
      return value.map((v) => v.name || v.vaccine || v.study || v.test || v.title).filter(Boolean).join(', ') || '—';
    }
    return value.join(', ');
  }
  return value;
};

const PatientDashboard = ({ patient, appointments = [], labs = [], onOpenRecords, onOpenLab, onOpenChat }) => {
  const [showRequest, setShowRequest] = useState(false);
  const [requestText, setRequestText] = useState('');

  const record = useMemo(() => patient?.medicalRecord || {}, [patient]);

  if (!patient) return null;

  const mineAppts = appointments.filter((a) => a.patientId === patient.id);
  const mineLabs = labs.filter((l) => l.patientId === patient.id);
  const medications = Array.isArray(record.medications) ? record.medications : [];
  const demoMeds = [
    {
      name: 'Lisinopril 10mg',
      sig: '10mg once daily',
      status: 'active',
      refillsRemaining: 2,
      prescribedBy: 'Dr. Demo',
      datePrescribed: '2025-12-15',
      instructions: 'Take with food. Monitor BP.',
    },
    {
      name: 'Metformin 500mg',
      sig: '500mg twice daily with meals',
      status: 'active',
      refillsRemaining: 1,
      prescribedBy: 'Dr. Demo',
      datePrescribed: '2025-12-10',
      instructions: 'Take with meals.',
    },
  ];
  const medsForView = medications.length ? medications : demoMeds;
  const allergies = Array.isArray(record.allergies) ? record.allergies : record.allergies ? [record.allergies] : [];
  const problems = Array.isArray(record.problems) ? record.problems : record.problems ? [record.problems] : (record.conditions ? [record.conditions] : []);
  const messages = Array.isArray(patient.messages) ? patient.messages : [];

  const sortedAppts = [...mineAppts].sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));
  const upcoming = sortedAppts.filter((a) => a.status !== 'completed');
  const activeMeds = medsForView.filter((m) => (m.status || '').toLowerCase() === 'active');
  const pendingTests = mineLabs.filter((l) => ['pending_review', 'pending'].includes((l.status || '').toLowerCase()));
  const unreadMessages = messages.filter((m) => m.unread).length;

  const labsSorted = [...mineLabs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recentLabs = labsSorted.slice(0, 3);
  const recentMessages = [...messages].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 4);

  const metrics = [
    { label: 'Upcoming Appointments', value: upcoming.length },
    { label: 'Active Prescriptions', value: activeMeds.length },
    { label: 'Pending Test Results', value: pendingTests.length },
    { label: 'Unread Messages', value: unreadMessages },
  ];

  const badgeForStatus = (status) => {
    const key = (status || '').toLowerCase();
    if (['scheduled', 'active', 'completed'].includes(key)) return 'success';
    if (['pending', 'pending_review'].includes(key)) return 'warning';
    return 'secondary';
  };

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <Card.Title className="mb-0">Welcome, {patient.name}</Card.Title>
          <Card.Subtitle className="text-muted">Patient ID: {patient.id}</Card.Subtitle>
          <Card.Text className="mt-2 mb-0">Stay on top of your care plan and message your care team.</Card.Text>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Row>
            {metrics.map((m) => (
              <Col md={6} lg={3} key={m.label} className="mb-3">
                <Card className="text-center h-100">
                  <Card.Body>
                    <div className="fw-semibold">{m.label}</div>
                    <div style={{ fontSize: 28 }}>{m.value}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">My Appointments</Card.Title>
            <Button size="sm" variant="outline-primary" onClick={() => setShowRequest(true)}>Request appointment</Button>
          </div>
          <Table responsive borderless className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Complaint</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="fw-semibold">{a.startAt ? new Date(a.startAt).toLocaleDateString() : 'TBD'}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{a.startAt ? new Date(a.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </td>
                  <td>{a.type}</td>
                  <td><Badge bg={badgeForStatus(a.status)} className="text-uppercase">{a.status}</Badge></td>
                  <td>{a.notes || '—'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => onOpenLab && a.labId ? onOpenLab(labs.find((l) => l.id === a.labId)) : null} disabled={!a.labId}>
                        View
                      </Button>
                      <Button size="sm" variant="outline-secondary">Reschedule</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!sortedAppts.length && (
                <tr>
                  <td colSpan={5} className="text-muted text-center">No appointments scheduled.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Row>
        <Col lg={6} className="mb-3">
          <Card className="card-plain h-100">
            <Card.Body>
              <Card.Title>Recent Test Results</Card.Title>
              <ListGroup variant="flush">
                {recentLabs.map((lab) => (
                  <ListGroup.Item key={lab.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{lab.test}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{lab.date}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={badgeForStatus(lab.status)} className="text-uppercase">{lab.status}</Badge>
                      <Button size="sm" variant="outline-primary" onClick={() => onOpenLab(lab)}>View</Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!recentLabs.length && (
                  <ListGroup.Item className="text-muted">No recent test results.</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-3">
          <Card className="card-plain h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="mb-0">Recent Messages</Card.Title>
                <Button size="sm" variant="outline-primary" onClick={onOpenChat}>View all messages</Button>
              </div>
              <ListGroup variant="flush">
                {recentMessages.map((msg, idx) => (
                  <ListGroup.Item
                    key={idx}
                    action
                    onClick={onOpenChat}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="fw-semibold">{msg.from}</div>
                      <div>{msg.subject}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{msg.date}</div>
                    </div>
                    {msg.unread && <Badge bg="primary">New</Badge>}
                  </ListGroup.Item>
                ))}
                {!recentMessages.length && (
                  <ListGroup.Item className="text-muted">No messages yet.</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>Active Prescriptions</Card.Title>
          <ListGroup variant="flush">
            {medsForView.map((m, idx) => (
              <ListGroup.Item key={`${m.name}-${idx}`} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{m.name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{m.sig || 'As directed'}</div>
                </div>
                <Badge bg={badgeForStatus(m.status)} className="text-uppercase">{m.status || 'active'}</Badge>
              </ListGroup.Item>
            ))}
            {!medsForView.length && <ListGroup.Item className="text-muted">No active prescriptions.</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>Care Snapshot</Card.Title>
          <Row>
            <Col md={6} className="mb-3">
              <div className="fw-semibold mb-1">Allergies</div>
              <div>{formatList(allergies)}</div>
            </Col>
            <Col md={6} className="mb-3">
              <div className="fw-semibold mb-1">Conditions</div>
              <div>{formatList(problems)}</div>
            </Col>
            <Col md={6} className="mb-3">
              <div className="fw-semibold mb-1">Medications</div>
              <div>{formatList(medications)}</div>
            </Col>
            <Col md={6} className="mb-3">
              <div className="fw-semibold mb-1">Notes</div>
              <div>{record.notes || '—'}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Modal show={showRequest} onHide={() => setShowRequest(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request an appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="secondary">This sends a request to the care team (stub).</Alert>
          <Form>
            <Form.Group>
              <Form.Label>Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Reason, preferred times, symptoms"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequest(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setShowRequest(false)} disabled={!requestText.trim()}>
            Submit request
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatientDashboard;
