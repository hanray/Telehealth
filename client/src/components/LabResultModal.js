import React from 'react';
import { Modal, Button, Table, Badge } from 'react-bootstrap';

const Pill = ({ children, variant = 'secondary' }) => (
  <Badge bg={variant} className="text-uppercase" style={{ fontSize: '0.7rem' }}>
    {children}
  </Badge>
);

const LabResultModal = ({ show, onHide, lab }) => {
  if (!lab) return null;

  const statusVariant =
    lab.status === 'pending_review'
      ? 'warning'
      : lab.status === 'reviewed'
        ? 'success'
        : 'secondary';

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Lab Result Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <div className="fw-semibold">{lab.test}</div>
            <div style={{ fontSize: 12 }} className="text-muted">
              Date: {lab.date} {lab.orderedBy ? `• Ordered by ${lab.orderedBy}` : ''}
            </div>
          </div>
          <div className="d-flex gap-2">
            <Pill variant={statusVariant}>{String(lab.status || 'unknown').replace('_', ' ')}</Pill>
            {lab.critical && <Pill variant="danger">Critical</Pill>}
          </div>
        </div>

        {lab.summary && <div className="mb-3">{lab.summary}</div>}

        {!!(lab.components && lab.components.length) && (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Component</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {lab.components.map((c, idx) => (
                <tr key={idx}>
                  <td>{c.name}</td>
                  <td>{c.value ?? '-'}</td>
                  <td>{c.unit ?? '-'}</td>
                  <td>{c.range ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LabResultModal;
