import React, { useMemo } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col, Alert } from 'react-bootstrap';

const TelehealthWorkspace = ({
  patients = [],
  appointments = [],
  labs = [],
  triageQueue = [],
  onOpenVisitSummary,
  onOpenChat,
  onOpenAssignments,
  onStartVisit,
  onAssignProvider,
  onEscalate,
  onCreateFollowUp,
  onOrderLab,
  onSendIntake,
  onMarkTriageComplete,
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

  const pendingLabs = useMemo(
    () => (labs || []).filter((l) => l.status === 'pending_review'),
    [labs]
  );

  const triage = Array.isArray(triageQueue) ? triageQueue : [];

  const stub = (msg) => {
    window.alert(msg || 'Action triggered (stub).');
  };

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <Card.Title className="mb-0">Telehealth Workspace</Card.Title>
            <Card.Subtitle className="text-muted">Unit of work: Visit / Encounter</Card.Subtitle>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" onClick={onOpenChat}>Open chat</Button>
            <Button variant="outline-secondary" size="sm" onClick={onOpenAssignments}>Manage patients</Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Row>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Today's Visits / Encounters</div>
                  <div style={{ fontSize: 26 }}>{todaysAppts.length}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Pending Labs</div>
                  <div style={{ fontSize: 26 }}>{pendingLabs.length}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={4} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Triage Queue</div>
                  <div style={{ fontSize: 26 }}>{triage.length}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col lg={7} className="d-flex flex-column gap-3">
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Visit Queue</Card.Title>
              <ListGroup variant="flush">
                {upcoming.map((a) => (
                  <ListGroup.Item key={a.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{a.patientName || 'Patient'}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {a.type || 'Visit'} • {a.startAt ? new Date(a.startAt).toLocaleString() : 'TBD'}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <Badge bg="secondary" className="text-uppercase">{a.status || 'scheduled'}</Badge>
                      <Button size="sm" variant="outline-primary" onClick={() => onOpenVisitSummary && onOpenVisitSummary({ id: a.patientId, name: a.patientName })}>
                        Visit summary
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!upcoming.length && <ListGroup.Item className="text-muted">No upcoming visits.</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Lab Review</Card.Title>
              <ListGroup variant="flush">
                {pendingLabs.map((lab) => (
                  <ListGroup.Item key={lab.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{lab.testName || 'Lab test'}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {lab.patientName || 'Patient'} • {lab.date || ''}
                      </div>
                    </div>
                    <Badge bg="warning" text="dark">Pending review</Badge>
                  </ListGroup.Item>
                ))}
                {!pendingLabs.length && <ListGroup.Item className="text-muted">No pending labs.</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5} className="d-flex flex-column gap-3">
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Quick actions (Visits / Triage)</Card.Title>
              <div className="d-grid gap-2">
                <Button size="sm" variant="primary" onClick={onStartVisit || (() => stub('Join visit room'))}>Join visit room</Button>
                <Button size="sm" variant="outline-primary" onClick={onAssignProvider || (() => stub('Request provider assignment'))}>Request provider assignment</Button>
                <Button size="sm" variant="outline-primary" onClick={onEscalate || (() => stub('Escalate to provider'))}>Escalate to provider</Button>
                <Button size="sm" variant="outline-secondary" onClick={onCreateFollowUp || (() => stub('Create follow-up appointment'))}>Create follow-up</Button>
                <Button size="sm" variant="outline-secondary" onClick={onOrderLab || (() => stub('Request labs'))}>Request labs</Button>
                <Button size="sm" variant="outline-secondary" onClick={onSendIntake || (() => stub('Send patient intake form'))}>Send intake form</Button>
                <Button size="sm" variant="outline-success" onClick={onMarkTriageComplete || (() => stub('Mark triage complete'))}>Mark triage complete</Button>
                <Button size="sm" variant="outline-dark" onClick={onOpenChat}>Open chat</Button>
              </div>
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
                      <Button size="sm" variant="outline-primary" onClick={() => onOpenVisitSummary && onOpenVisitSummary(p)}>
                        Visit summary
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={onOpenChat}>
                        Chat
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!patients.length && <ListGroup.Item className="text-muted">No patients assigned.</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Triage Queue</Card.Title>
              {triage.length === 0 && (
                <Alert variant="light" className="mb-0 border">No active triage items.</Alert>
              )}
              {triage.length > 0 && (
                <ListGroup variant="flush">
                  {triage.map((item, idx) => (
                    <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{item.title}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{item.patientName}</div>
                      </div>
                      <Badge bg={item.severity === 'high' ? 'danger' : 'warning'} className="text-uppercase">{item.severity}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TelehealthWorkspace;
