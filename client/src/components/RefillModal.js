import React, { useMemo, useState } from 'react';
import { Modal, Button, Alert, ListGroup, Badge, Form, Spinner } from 'react-bootstrap';

const statusBadge = (refills, t) => {
  if (refills > 0) return <Badge bg="success">{refills} {t('refills')}</Badge>;
  return <Badge bg="danger">0 {t('refills')}</Badge>;
};

const RefillModal = ({ show, onHide, medications = [], prescriptions = [], patientId, patient, currentUser, enableOHIP = false, onSubmit, t = (str) => str }) => {
  const medsArray = Array.isArray(medications) ? medications : [];

  // Demo fallback prescriptions if none are present
  const prescribed = Array.isArray(prescriptions) ? prescriptions : [];

  const demoMeds = [
    {
      id: 'demo-rx-1',
      name: 'Lisinopril 10mg',
      sig: '10mg once daily',
      status: 'active',
      refillsRemaining: 2,
      prescribedBy: 'Dr. Demo',
      datePrescribed: '2025-12-15',
      instructions: 'Take with food. Monitor BP.',
      prescriptionId: 'demo-rx-1',
    },
    {
      id: 'demo-rx-2',
      name: 'Metformin 500mg',
      sig: '500mg twice daily with meals',
      status: 'active',
      refillsRemaining: 1,
      prescribedBy: 'Dr. Demo',
      datePrescribed: '2025-12-10',
      instructions: 'Take with meals.',
      prescriptionId: 'demo-rx-2',
    },
  ];

  const meds = useMemo(() => {
    const rxMeds = prescribed.map((p) => ({
      id: p.id,
      name: p.normalized?.medicationName || p.rawText || p.id,
      sig: p.normalized?.dosage || p.normalized?.frequency || p.rawText,
      status: p.status || 'active',
      refillsRemaining: p.refillsAllowed ?? p.refillsRemaining ?? 0,
      prescribedBy: p.doctorId || 'Provider',
      datePrescribed: p.createdAt,
      instructions: p.normalized?.instructions || p.rawText,
      prescriptionId: p.id,
    }));
    const actives = [...rxMeds, ...medsArray.map((m, idx) => ({ ...m, id: m.id || `med-${idx}`, prescriptionId: m.prescriptionId }))]
      .filter((m) => (m.status || '').toLowerCase() !== 'completed');
    if (actives.length) return actives;
    return demoMeds;
  }, [demoMeds, medsArray, prescribed]);
  const [selected, setSelected] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [processing, setProcessing] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [ohip, setOhip] = useState({ partA: '', partB: '', partC: '', versionCode: '' });
  const [card, setCard] = useState({
    name: 'Jane Demo',
    number: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
    zip: '94107',
    address1: '123 Demo St',
    city: 'Accra',
    country: 'Ghana',
  });

  const canUseOHIP = Boolean(enableOHIP || currentUser?.role === 'admin');
  const demoAmount = paymentMethod === 'OHIP' ? 0 : 15; // fixed consult fee (simulated gateway)

  const reset = () => {
    setSelected(null);
    setProcessing(false);
    setInlineError('');
    setOhip({ partA: '', partB: '', partC: '', versionCode: '' });
    setCard({
      name: 'Jane Demo',
      number: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '123',
      zip: '94107',
      address1: '123 Demo St',
      city: 'Accra',
      country: 'Ghana',
    });
  };

  const handleClose = () => {
    reset();
    onHide?.();
  };

  const handleSubmit = () => {
    if (!selected) return;

    if (paymentMethod === 'OHIP') {
      const partA = String(ohip.partA || '').trim();
      const partB = String(ohip.partB || '').trim();
      const partC = String(ohip.partC || '').trim();
      const versionCode = String(ohip.versionCode || '').trim().toUpperCase();

      if (!partA || !partB || !partC || !versionCode) {
        setInlineError(t('OHIP Health Number and Version Code are required.'));
        return;
      }
      if (!/^[0-9]+$/.test(partA + partB + partC)) {
        setInlineError(t('OHIP Health Number must be numeric.'));
        return;
      }
      if (!/^[A-Z0-9]{2,3}$/.test(versionCode)) {
        setInlineError(t('Version Code must be 2–3 characters.'));
        return;
      }
    }

    setInlineError('');
    setProcessing(true);
    // Simulate a successful demo payment and refill submission
    setTimeout(() => {
      const mockTxnId = `demo_txn_${Date.now()}`;
      const ohipHealthNumber = paymentMethod === 'OHIP'
        ? `${String(ohip.partA || '').trim()}-${String(ohip.partB || '').trim()}-${String(ohip.partC || '').trim()}`
        : null;
      const ohipVersionCode = paymentMethod === 'OHIP' ? String(ohip.versionCode || '').trim().toUpperCase() : null;
      onSubmit?.({
        medication: selected,
        patientId,
        prescriptionId: selected.prescriptionId,
        payment: {
          method: paymentMethod,
          amount: demoAmount,
          status: 'approved',
          transactionId: mockTxnId,
          note: 'Simulated payment; no real charge processed.',
          card: paymentMethod === 'OHIP' ? null : {
            last4: (card.number || '').slice(-4),
            name: card.name,
            expiry: card.expiry,
            zip: card.zip,
          },
          ohip: paymentMethod === 'OHIP' ? {
            healthNumber: ohipHealthNumber,
            versionCode: ohipVersionCode,
          } : null,
          billing: {
            address1: card.address1,
            city: card.city,
            country: card.country,
            zip: card.zip,
          },
        },
      });
      setProcessing(false);
      handleClose();
    }, 600);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('Request Prescription Refill')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!selected && (
          <>
            <Alert variant="light" className="border">
              {t('Select a prescription to refill:')}
            </Alert>
            <ListGroup>
              {meds.map((m, idx) => (
                <ListGroup.Item
                  key={m.id || idx}
                  action
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => setSelected(m)}
                >
                  <div>
                    <div className="fw-semibold">{m.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{m.sig || t('As directed')}</div>
                  </div>
                  {statusBadge(Number(m.refillsRemaining || 0), t)}
                </ListGroup.Item>
              ))}
              {!meds.length && (
                <ListGroup.Item className="text-muted">{t('No active prescriptions available.')}</ListGroup.Item>
              )}
            </ListGroup>
          </>
        )}

        {selected && (
          <div className="d-grid gap-3">
            <Alert variant="primary" className="mb-0">
              {t('You are requesting a refill for:')} <strong>{selected.name}</strong>
            </Alert>
            <div>
              <div className="fw-semibold mb-2">{t('Prescription Details:')}</div>
              <div className="mb-1"><strong>{t('Medication')}:</strong> {selected.name}</div>
              <div className="mb-1"><strong>{t('Dosage')}:</strong> {selected.sig || t('As directed')}</div>
              <div className="mb-1"><strong>{t('Refills Remaining')}:</strong> {selected.refillsRemaining ?? '—'}</div>
              <div className="mb-1"><strong>{t('Prescribed By')}:</strong> {selected.prescribedBy || '—'}</div>
              <div className="mb-1"><strong>{t('Date Prescribed')}:</strong> {selected.datePrescribed || '—'}</div>
              <div className="mb-1"><strong>{t('Instructions')}:</strong> {selected.instructions || '—'}</div>
              <div className="mb-1"><strong>{t('Status')}:</strong> {(selected.status || t('active')).toUpperCase()}</div>
            </div>

            <div className="p-3 border rounded">
              <div className="fw-semibold mb-2">{t('Payment')}</div>
              <div className="text-muted mb-3">{t('Enter billing details, then click Pay Now. This is a simulated checkout.')}</div>
              <Form className="d-grid gap-2">
                <Form.Group>
                  <Form.Label>{t('Payment Method')}</Form.Label>
                  <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {canUseOHIP && <option value="OHIP">OHIP</option>}
                    <option value="Card">{t('Card')}</option>
                    <option value="PayPal">{t('PayPal')}</option>
                    <option value="Remitly">{t('Remitly')}</option>
                    <option value="MoMo">{t('MoMo')}</option>
                  </Form.Select>
                </Form.Group>

                {paymentMethod === 'OHIP' && (
                  <>
                    <Alert variant="success" className="mb-0">
                      {t('Covered by OHIP. No payment required.')}
                    </Alert>

                    <div className="mt-2">
                      <div className="fw-semibold mb-2">{t('OHIP')}</div>
                      <div className="d-flex flex-wrap align-items-end gap-2">
                        <Form.Group>
                          <Form.Label className="mb-1">{t('Health Number')}</Form.Label>
                          <div className="d-flex align-items-center gap-1">
                            <Form.Control
                              value={ohip.partA}
                              onChange={(e) => setOhip((prev) => ({ ...prev, partA: e.target.value.replace(/\D+/g, '').slice(0, 4) }))}
                              placeholder="####"
                              inputMode="numeric"
                              style={{ width: 88 }}
                            />
                            <span>-</span>
                            <Form.Control
                              value={ohip.partB}
                              onChange={(e) => setOhip((prev) => ({ ...prev, partB: e.target.value.replace(/\D+/g, '').slice(0, 3) }))}
                              placeholder="###"
                              inputMode="numeric"
                              style={{ width: 70 }}
                            />
                            <span>-</span>
                            <Form.Control
                              value={ohip.partC}
                              onChange={(e) => setOhip((prev) => ({ ...prev, partC: e.target.value.replace(/\D+/g, '').slice(0, 3) }))}
                              placeholder="###"
                              inputMode="numeric"
                              style={{ width: 70 }}
                            />
                          </div>
                        </Form.Group>

                        <Form.Group>
                          <Form.Label className="mb-1">{t('Version code')}</Form.Label>
                          <Form.Control
                            value={ohip.versionCode}
                            onChange={(e) => setOhip((prev) => ({ ...prev, versionCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) }))}
                            placeholder="AA"
                            style={{ width: 90 }}
                          />
                        </Form.Group>
                      </div>
                    </div>
                  </>
                )}

                {inlineError && (
                  <div className="text-danger small">{inlineError}</div>
                )}

                {paymentMethod !== 'OHIP' && (
                  <>
                    <Form.Group>
                      <Form.Label>{t('Cardholder Name')}</Form.Label>
                      <Form.Control
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>{t('Card Number')}</Form.Label>
                      <Form.Control
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: e.target.value })}
                      />
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Form.Group className="flex-grow-1">
                        <Form.Label>{t('Expiry')}</Form.Label>
                        <Form.Control
                          value={card.expiry}
                          onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                        />
                      </Form.Group>
                      <Form.Group style={{ width: 120 }}>
                        <Form.Label>{t('CVC')}</Form.Label>
                        <Form.Control
                          value={card.cvc}
                          onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                        />
                      </Form.Group>
                    </div>
                  </>
                )}

                <div className="d-flex gap-2">
                  <Form.Group className="flex-grow-1">
                    <Form.Label>{t('Billing Address')}</Form.Label>
                    <Form.Control
                      value={card.address1}
                      onChange={(e) => setCard({ ...card, address1: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group style={{ width: 140 }}>
                    <Form.Label>{t('City')}</Form.Label>
                    <Form.Control
                      value={card.city}
                      onChange={(e) => setCard({ ...card, city: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="d-flex gap-2">
                  <Form.Group style={{ width: 140 }}>
                    <Form.Label>{t('Zip / Postal')}</Form.Label>
                    <Form.Control
                      value={card.zip}
                      onChange={(e) => setCard({ ...card, zip: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="flex-grow-1">
                    <Form.Label>{t('Country')}</Form.Label>
                    <Form.Control
                      value={card.country}
                      onChange={(e) => setCard({ ...card, country: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="mt-1 small text-muted">{t('Amount due:')} ${demoAmount}. {t('A transaction ID will be generated on submit.')}</div>
              </Form>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={processing}>{t('Cancel')}</Button>
        {selected && (
          <Button variant="primary" onClick={handleSubmit} disabled={processing}>
            {processing ? (<><Spinner animation="border" size="sm" className="me-2" />{t('Submitting…')}</>) : t('Request Refill')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RefillModal;
