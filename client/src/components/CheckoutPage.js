import React, { useMemo, useState } from 'react';
import { Card, Button, Row, Col, Form, Alert, Badge } from 'react-bootstrap';

const normalizeTier = (tier) => {
  const v = String(tier || '').trim().toLowerCase();
  if (v === 'free') return 'free';
  if (v === 'basic') return 'basic';
  if (v === 'premium') return 'premium';
  if (v === 'gold') return 'gold';
  return 'premium';
};

const tierLabel = (tier) => {
  const t = normalizeTier(tier);
  if (t === 'basic') return 'Basic';
  if (t === 'premium') return 'Premium';
  if (t === 'gold') return 'Gold';
  return 'Free';
};

const CheckoutPage = ({
  user,
  planTier,
  onBack,
  onConfirm,
  t = (s) => s,
}) => {
  const tier = useMemo(() => normalizeTier(planTier), [planTier]);

  const [name, setName] = useState(() => String(user?.name || user?.email || ''));
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [error, setError] = useState('');

  const isPaid = tier !== 'free';

  return (
    <Row className="justify-content-center">
      <Col xl={8}>
        <Card className="card-plain">
          <Card.Body>
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div>
                <Card.Title className="mb-1">{t('Checkout')}</Card.Title>
                <div className="text-muted">
                  {t('This checkout is simulated for demonstration purposes only.')}
                </div>
              </div>
              <Badge bg={isPaid ? 'primary' : 'secondary'} className="text-uppercase">
                {tierLabel(tier)}
              </Badge>
            </div>

            <Alert variant="light" className="border mt-3">
              {isPaid
                ? t('You are purchasing a paid tier. No real payment will be processed.')
                : t('Free tier does not require payment.')}
            </Alert>

            {!!error && <Alert variant="danger">{error}</Alert>}

            <Form
              onSubmit={(e) => {
                e.preventDefault();

                if (!isPaid) {
                  onConfirm?.({ tier, name, cardNumber: '', cardExp: '', cardCvc: '', billingZip: '' });
                  return;
                }

                if (!String(name || '').trim()) {
                  setError(t('Name is required'));
                  return;
                }

                if (!String(cardNumber || '').trim()) {
                  setError(t('Card number is required (demo)'));
                  return;
                }

                setError('');
                onConfirm?.({ tier, name, cardNumber, cardExp, cardCvc, billingZip });
              }}
            >
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>{t('Name')}</Form.Label>
                    <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Your name')} />
                  </Form.Group>
                </Col>

                {isPaid && (
                  <>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>{t('Card number')}</Form.Label>
                        <Form.Control
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                        />
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
                  </>
                )}
              </Row>

              <div className="d-flex flex-wrap gap-2 mt-4 justify-content-end">
                <Button variant="outline-secondary" type="button" onClick={onBack}>
                  {t('Back')}
                </Button>
                <Button variant="primary" type="submit">
                  {isPaid ? t('Pay & activate (demo)') : t('Activate Free')}
                </Button>
              </div>
            </Form>

            <div className="text-muted small mt-3">
              {t('No vendor integration is used. This screen exists to simulate a real checkout flow.')}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default CheckoutPage;
