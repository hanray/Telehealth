import React, { useMemo, useState } from 'react';
import { Modal, Button, Alert, ListGroup, Badge, Form, Spinner } from 'react-bootstrap';

const statusBadge = (refills) => {
  if (refills > 0) return <Badge bg="success">{refills} refills</Badge>;
  return <Badge bg="danger">0 refills</Badge>;
};

const RefillModal = ({ show, onHide, medications = [], onSubmit }) => {
  const medsArray = Array.isArray(medications) ? medications : [];

  // Demo fallback prescriptions if none are present
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

  const meds = useMemo(() => {
    const actives = medsArray.filter((m) => (m.status || '').toLowerCase() === 'active');
    if (actives.length) return actives;
    return demoMeds; // ensure the modal always has refillable demo meds
  }, [medsArray]);
  const [selected, setSelected] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
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

  const demoAmount = 15; // fixed consult fee (simulated gateway)

  const reset = () => {
    setSelected(null);
    setProcessing(false);
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
    setProcessing(true);
    // Simulate a successful demo payment and refill submission
    setTimeout(() => {
      const mockTxnId = `demo_txn_${Date.now()}`;
      onSubmit?.({
        medication: selected,
        payment: {
          method: paymentMethod,
          amount: demoAmount,
          status: 'approved',
          transactionId: mockTxnId,
          note: 'Simulated payment; no real charge processed.',
          card: {
            last4: (card.number || '').slice(-4),
            name: card.name,
            expiry: card.expiry,
            zip: card.zip,
          },
          billing: {
            address1: card.address1,
            city: card.city,
            country: card.country,
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
        <Modal.Title>Request Prescription Refill</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!selected && (
          <>
            <Alert variant="light" className="border">
              Select a prescription to refill:
            </Alert>
            <ListGroup>
              {meds.map((m, idx) => (
                <ListGroup.Item
                  key={`${m.name}-${idx}`}
                  action
                  className="d-flex justify-content-between align-items-center"
                  onClick={() => setSelected(m)}
                >
                  <div>
                    <div className="fw-semibold">{m.name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{m.sig || 'As directed'}</div>
                  </div>
                  {statusBadge(Number(m.refillsRemaining || 0))}
                </ListGroup.Item>
              ))}
              {!meds.length && (
                <ListGroup.Item className="text-muted">No active prescriptions available.</ListGroup.Item>
              )}
            </ListGroup>
          </>
        )}

        {selected && (
          <div className="d-grid gap-3">
            <Alert variant="primary" className="mb-0">
              You are requesting a refill for: <strong>{selected.name}</strong>
            </Alert>
            <div>
              <div className="fw-semibold mb-2">Prescription Details:</div>
              <div className="mb-1"><strong>Medication:</strong> {selected.name}</div>
              <div className="mb-1"><strong>Dosage:</strong> {selected.sig || 'As directed'}</div>
              <div className="mb-1"><strong>Refills Remaining:</strong> {selected.refillsRemaining ?? '—'}</div>
              <div className="mb-1"><strong>Prescribed By:</strong> {selected.prescribedBy || '—'}</div>
              <div className="mb-1"><strong>Date Prescribed:</strong> {selected.datePrescribed || '—'}</div>
              <div className="mb-1"><strong>Instructions:</strong> {selected.instructions || '—'}</div>
              <div className="mb-1"><strong>Status:</strong> {(selected.status || 'active').toUpperCase()}</div>
            </div>

            <div className="p-3 border rounded">
              <div className="fw-semibold mb-2">Payment</div>
              <div className="text-muted mb-3">Enter billing details, then click Pay Now. This is a simulated checkout.</div>
              <Form className="d-grid gap-2">
                <Form.Group>
                  <Form.Label>Cardholder Name</Form.Label>
                  <Form.Control
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Card Number</Form.Label>
                  <Form.Control
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Form.Group className="flex-grow-1">
                    <Form.Label>Expiry</Form.Label>
                    <Form.Control
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group style={{ width: 120 }}>
                    <Form.Label>CVC</Form.Label>
                    <Form.Control
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="d-flex gap-2">
                  <Form.Group className="flex-grow-1">
                    <Form.Label>Billing Address</Form.Label>
                    <Form.Control
                      value={card.address1}
                      onChange={(e) => setCard({ ...card, address1: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group style={{ width: 140 }}>
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      value={card.city}
                      onChange={(e) => setCard({ ...card, city: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="d-flex gap-2">
                  <Form.Group style={{ width: 140 }}>
                    <Form.Label>Zip / Postal</Form.Label>
                    <Form.Control
                      value={card.zip}
                      onChange={(e) => setCard({ ...card, zip: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="flex-grow-1">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      value={card.country}
                      onChange={(e) => setCard({ ...card, country: e.target.value })}
                    />
                  </Form.Group>
                </div>
                <div className="mt-1 small text-muted">Amount due: ${demoAmount}. A transaction ID will be generated on submit.</div>
              </Form>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={processing}>Cancel</Button>
        {selected && (
          <Button variant="primary" onClick={handleSubmit} disabled={processing}>
            {processing ? (<><Spinner animation="border" size="sm" className="me-2" />Submitting…</>) : 'Request Refill'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RefillModal;
