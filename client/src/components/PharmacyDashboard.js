import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Row } from 'react-bootstrap';

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const PharmacyDashboard = ({
  prescriptions = [],
  patients = [],
  pharmacies = [],
  currentUser,
  onUpdateMedStatus,
  t = (text) => text,
}) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const patientNameById = useMemo(() => {
    const map = new Map();
    (patients || []).forEach((patient) => {
      map.set(patient.id, patient.name || patient.fullName || patient.id);
    });
    return map;
  }, [patients]);

  const pharmacyNameById = useMemo(() => {
    const map = new Map();
    (pharmacies || []).forEach((pharmacy) => {
      map.set(pharmacy.id, pharmacy.name || pharmacy.id);
    });
    return map;
  }, [pharmacies]);

  const sortedPrescriptions = useMemo(() => {
    return [...(prescriptions || [])].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [prescriptions]);

  const visiblePrescriptions = useMemo(() => {
    if (statusFilter === 'all') return sortedPrescriptions;
    return sortedPrescriptions.filter((prescription) => normalizeStatus(prescription.status) === statusFilter);
  }, [sortedPrescriptions, statusFilter]);

  const queueCounts = useMemo(() => {
    const total = sortedPrescriptions.length;
    const pending = sortedPrescriptions.filter((prescription) => {
      const status = normalizeStatus(prescription.status);
      return ['sent', 'pending', 'pending_review', 'new'].includes(status);
    }).length;
    const ready = sortedPrescriptions.filter((prescription) => normalizeStatus(prescription.status) === 'verified').length;
    const completed = sortedPrescriptions.filter((prescription) => {
      const status = normalizeStatus(prescription.status);
      return ['dispensed', 'completed'].includes(status);
    }).length;
    return { total, pending, ready, completed };
  }, [sortedPrescriptions]);

  const statusTone = (value) => {
    const status = normalizeStatus(value);
    if (['sent', 'pending', 'pending_review', 'new'].includes(status)) return 'warning';
    if (status === 'verified') return 'info';
    if (['dispensed', 'completed'].includes(status)) return 'success';
    if (status === 'on hold') return 'secondary';
    return 'secondary';
  };

  const formatMedication = (prescription) => {
    const normalized = prescription?.normalized || {};
    if (normalized.medicationName) return normalized.medicationName;
    if (prescription?.medicationName) return prescription.medicationName;
    if (prescription?.rawText) return prescription.rawText;
    return t('Prescription');
  };

  const formatSig = (prescription) => {
    const normalized = prescription?.normalized || {};
    if (normalized.dosage || normalized.frequency) {
      return [normalized.dosage, normalized.frequency].filter(Boolean).join(' • ');
    }
    return prescription?.rawText || t('As directed');
  };

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div>
              <Card.Title className="mb-0">{t('Pharmacy Dashboard')}</Card.Title>
              <div className="text-muted" style={{ fontSize: 13 }}>{currentUser?.email || ''}</div>
            </div>
            <Form.Select
              size="sm"
              style={{ maxWidth: 220 }}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">{t('All statuses')}</option>
              <option value="sent">{t('Sent')}</option>
              <option value="verified">{t('Verified')}</option>
              <option value="dispensed">{t('Dispensed')}</option>
              <option value="completed">{t('Completed')}</option>
              <option value="on hold">{t('On Hold')}</option>
            </Form.Select>
          </div>

          <Row className="g-2">
            <Col md={3}><Alert variant="light" className="mb-0 border"><strong>{queueCounts.total}</strong> {t('Total')}</Alert></Col>
            <Col md={3}><Alert variant="warning" className="mb-0 border"><strong>{queueCounts.pending}</strong> {t('Pending')}</Alert></Col>
            <Col md={3}><Alert variant="info" className="mb-0 border"><strong>{queueCounts.ready}</strong> {t('Ready')}</Alert></Col>
            <Col md={3}><Alert variant="success" className="mb-0 border"><strong>{queueCounts.completed}</strong> {t('Completed')}</Alert></Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Prescription Queue')}</Card.Title>
          <ListGroup variant="flush">
            {visiblePrescriptions.map((prescription) => (
              <ListGroup.Item key={prescription.id} className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">{formatMedication(prescription)}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{formatSig(prescription)}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t('Patient')}: {patientNameById.get(prescription.patientId) || prescription.patientId || t('Unknown')}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t('Pharmacy')}: {pharmacyNameById.get(prescription.pharmacyId) || prescription.pharmacyId || t('Unassigned')}
                  </div>
                </div>
                <div className="d-flex flex-column align-items-end gap-2">
                  <Badge bg={statusTone(prescription.status)} className="text-uppercase">{prescription.status || t('Unknown')}</Badge>
                  <div className="d-flex gap-2 flex-wrap justify-content-end">
                    <Button size="sm" variant="outline-primary" onClick={() => onUpdateMedStatus?.({ prescriptionId: prescription.id, status: 'Verified' })}>{t('Verify')}</Button>
                    <Button size="sm" variant="outline-success" onClick={() => onUpdateMedStatus?.({ prescriptionId: prescription.id, status: 'Dispensed' })}>{t('Dispense')}</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => onUpdateMedStatus?.({ prescriptionId: prescription.id, status: 'On Hold' })}>{t('Hold')}</Button>
                    <Button size="sm" variant="outline-dark" onClick={() => onUpdateMedStatus?.({ prescriptionId: prescription.id, status: 'Completed' })}>{t('Complete')}</Button>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
            {!visiblePrescriptions.length && <ListGroup.Item className="text-muted">{t('No prescriptions found for this filter.')}</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PharmacyDashboard;
