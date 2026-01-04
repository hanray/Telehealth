import React, { useMemo, useState } from 'react';
import { Modal, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';

const AppointmentModal = ({ show, onHide, onScheduled, appointmentTypes = [] }) => {
  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientId: '',
    date: '',
    time: '',
    appointmentType: '',
    priority: 'Normal',
    chiefComplaint: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(
    () => !!form.patientName.trim() && !!form.date && !!form.time,
    [form.patientName, form.date, form.time]
  );

  const reset = () => {
    setForm({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      patientId: '',
      date: '',
      time: '',
      appointmentType: '',
      priority: 'Normal',
      chiefComplaint: '',
    });
    setSubmitting(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onHide?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      onScheduled?.(data.appointment || data);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Schedule New Appointment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6} className="mb-3">
              <Form.Label>Patient Name *</Form.Label>
              <Form.Control
                placeholder="Enter patient name"
                value={form.patientName}
                onChange={(e) => update('patientName', e.target.value)}
                required
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Patient Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter patient email"
                value={form.patientEmail}
                onChange={(e) => update('patientEmail', e.target.value)}
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Patient Phone</Form.Label>
              <Form.Control
                placeholder="Enter patient phone"
                value={form.patientPhone}
                onChange={(e) => update('patientPhone', e.target.value)}
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Patient ID (Optional)</Form.Label>
              <Form.Control
                placeholder="Auto-generated if empty"
                value={form.patientId}
                onChange={(e) => update('patientId', e.target.value)}
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                required
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Time *</Form.Label>
              <Form.Control
                type="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                required
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Appointment Type *</Form.Label>
              <Form.Select
                value={form.appointmentType}
                onChange={(e) => update('appointmentType', e.target.value)}
                required
              >
                <option value="">Select type...</option>
                {(appointmentTypes.length ? appointmentTypes : ['Consult', 'Follow-up', 'Physical']).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
              >
                {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={12}>
              <Form.Label>Chief Complaint</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter patient's chief complaint..."
                value={form.chiefComplaint}
                onChange={(e) => update('chiefComplaint', e.target.value)}
              />
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? <Spinner animation="border" size="sm" /> : 'Schedule Appointment'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AppointmentModal;