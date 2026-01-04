import React, { useMemo } from 'react';
import { Modal, Card, ListGroup, Badge, Alert } from 'react-bootstrap';

const TelehealthVisitSummary = ({
  show,
  onHide,
  patient,
  appointments = [],
  triageQueue = [],
}) => {
  const upcoming = useMemo(
    () => (appointments || [])
      .filter((a) => a.patientId === patient?.id)
      .sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0)),
    [appointments, patient?.id]
  );

  const triageItems = useMemo(
    () => (triageQueue || []).filter((t) => t.patientId === patient?.id || t.patientName === patient?.name),
    [triageQueue, patient?.id, patient?.name]
  );

  const visit = upcoming[0];

  return (
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
                  <Badge bg="secondary" className="text-uppercase">{visit?.status || 'planned'}</Badge>
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
                        </div>
                        <Badge bg={t.severity === 'high' ? 'danger' : 'warning'} className="text-uppercase">{t.severity || 'open'}</Badge>
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
  );
};

export default TelehealthVisitSummary;
