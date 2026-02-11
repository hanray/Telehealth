import React, { useMemo, useState } from 'react';
import { Card, Button, Row, Col, Form, Alert } from 'react-bootstrap';

const SubscriptionOnboarding = ({
  t = (s) => s,
  onChooseFree,
  onStartProCheckout,
  onConfirmProCheckout,
  onCancel,
}) => {
  const [step, setStep] = useState('choose');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [billingZip, setBillingZip] = useState('');

  const proFeatures = useMemo(
    () => [
      t('Analytics dashboard'),
      t('Send intake requests'),
      t('Order labs (workflow)'),
      t('Create follow-ups'),
      t('Mark triage complete'),
      t('Provider assignment requests'),
      t('Escalations workflow'),
      t('Clinic ops tools (advanced)'),
      t('Admin configuration'),
    ],
    [t]
  );

  const freeFeatures = useMemo(
    () => [
      t('Telehealth: patient chart & medical records'),
      t('Appointments (basic)'),
      t('Labs (view)'),
      t('Chat / messaging'),
      t('Prescriptions (basic)'),
      t('Notifications'),
    ],
    [t]
  );

  if (step === 'checkout') {
    return (
      <Card className="card-plain">
        <Card.Body>
          <Card.Title className="mb-1">{t('Pro Checkout (Demo)')}</Card.Title>
          <Card.Text className="text-muted">
            {t('This is a pseudo payment screen for demos. No real billing is processed.')}
          </Card.Text>

          <Alert variant="info" className="mb-3">
            {t('You will get Pro features immediately after confirming.')}
          </Alert>

          <Form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirmProCheckout?.({ cardNumber, cardExp, cardCvc, billingZip });
            }}
          >
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>{t('Card number')}</Form.Label>
                  <Form.Control value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('Expiration')}</Form.Label>
                  <Form.Control value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('CVC')}</Form.Label>
                  <Form.Control value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('Billing ZIP')}</Form.Label>
                  <Form.Control value={billingZip} onChange={(e) => setBillingZip(e.target.value)} placeholder="12345" />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2 mt-4">
              <Button variant="outline-secondary" type="button" onClick={() => setStep('choose')}>
                {t('Back')}
              </Button>
              <Button variant="primary" type="submit">
                {t('Confirm (Demo)')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="card-plain">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <Card.Title className="mb-1">{t('Choose your plan')}</Card.Title>
            <Card.Text className="text-muted mb-0">
              {t('Start on Free, or unlock Pro features for clinics and teams.')}
            </Card.Text>
          </div>
          <Button variant="link" className="p-0" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        </div>

        <Row className="g-3 mt-2">
          <Col md={6}>
            <Card className="h-100">
              <Card.Body>
                <div className="fw-bold">{t('Free')}</div>
                <div className="text-muted small mb-2">{t('Core care workflows')}</div>
                <ul className="mb-3">
                  {freeFeatures.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button variant="outline-primary" onClick={onChooseFree}>
                  {t('Continue with Free')}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100 border-primary">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="fw-bold">{t('Pro')}</div>
                  <div className="badge bg-primary">{t('Recommended')}</div>
                </div>
                <div className="text-muted small mb-2">{t('Automation + analytics + ops')}</div>
                <ul className="mb-3">
                  {proFeatures.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      onStartProCheckout?.();
                      setStep('checkout');
                    }}
                  >
                    {t('Choose Pro')}
                  </Button>
                  <Button variant="outline-secondary" onClick={onChooseFree}>
                    {t('Not now')}
                  </Button>
                </div>
                <div className="text-muted small mt-2">
                  {t('If you choose Free, you can still start a trial the first time you try a Pro feature.')}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default SubscriptionOnboarding;
