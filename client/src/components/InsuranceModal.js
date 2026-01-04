import React, { useEffect, useState } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';

const emptyInsurance = {
  provider: '',
  policyNumber: '',
  groupNumber: '',
  memberId: '',
  effectiveDate: '',
  expirationDate: '',
  planType: '',
};

const InsuranceModal = ({ show, onHide, patient, onSave, readOnly = false }) => {
  const [draft, setDraft] = useState(emptyInsurance);

  useEffect(() => {
    if (!patient) return;
    const current = patient.medicalRecord?.insurance || emptyInsurance;
    setDraft({ ...emptyInsurance, ...current });
  }, [patient]);

  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!patient) return;
    onSave?.(patient.id, draft);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Insurance Information</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col md={6} className="mb-3">
            <Form.Label>Insurance Provider *</Form.Label>
            <Form.Control
              value={draft.provider}
              onChange={(e) => update('provider', e.target.value)}
              placeholder="Insurance provider"
              disabled={readOnly}
            />
          </Col>
          <Col md={6} className="mb-3">
            <Form.Label>Policy Number *</Form.Label>
            <Form.Control
              value={draft.policyNumber}
              onChange={(e) => update('policyNumber', e.target.value)}
              placeholder="Policy number"
              disabled={readOnly}
            />
          </Col>
          <Col md={6} className="mb-3">
            <Form.Label>Group Number</Form.Label>
            <Form.Control
              value={draft.groupNumber}
              onChange={(e) => update('groupNumber', e.target.value)}
              placeholder="Group number"
              disabled={readOnly}
            />
          </Col>
          <Col md={6} className="mb-3">
            <Form.Label>Member ID *</Form.Label>
            <Form.Control
              value={draft.memberId}
              onChange={(e) => update('memberId', e.target.value)}
              placeholder="Member ID"
              disabled={readOnly}
            />
          </Col>
          <Col md={6} className="mb-3">
            <Form.Label>Effective Date</Form.Label>
            <Form.Control
              type="date"
              value={draft.effectiveDate}
              onChange={(e) => update('effectiveDate', e.target.value)}
              disabled={readOnly}
            />
          </Col>
          <Col md={6} className="mb-3">
            <Form.Label>Expiration Date</Form.Label>
            <Form.Control
              type="date"
              value={draft.expirationDate}
              onChange={(e) => update('expirationDate', e.target.value)}
              disabled={readOnly}
            />
          </Col>
          <Col md={12} className="mb-3">
            <Form.Label>Plan Type</Form.Label>
            <Form.Control
              value={draft.planType}
              onChange={(e) => update('planType', e.target.value)}
              placeholder="Gold Plus"
              disabled={readOnly}
            />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        {!readOnly && (
          <Button variant="primary" onClick={handleSave} disabled={!draft.provider || !draft.policyNumber || !draft.memberId}>
            Update Insurance
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default InsuranceModal;
