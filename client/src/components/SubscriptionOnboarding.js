import React, { useMemo } from 'react';
import { Card, Button, Row, Col, Alert, Badge } from 'react-bootstrap';

const SubscriptionOnboarding = ({
  t = (s) => s,
  onChooseTier,
  onStartTrial,
  onCancel,
}) => {
  const tiers = useMemo(() => [
    {
      key: 'free',
      name: t('Free'),
      price: t('Free'),
      highlight: false,
      bullets: [
        t('Telehealth: patient chart & medical records'),
        t('Appointments (basic)'),
        t('Labs (view)'),
        t('Chat / messaging'),
        t('Prescriptions (basic)'),
        t('Notifications'),
      ],
    },
    {
      key: 'basic',
      name: t('Basic'),
      price: t('TBD'),
      highlight: false,
      bullets: [
        t('Everything in Free'),
        t('Automation basics'),
        t('Follow-ups'),
        t('Triage completion'),
      ],
    },
    {
      key: 'premium',
      name: t('Premium'),
      price: t('TBD'),
      highlight: true,
      bullets: [
        t('Everything in Basic'),
        t('Lab ordering (workflow)'),
        t('Provider assignment requests'),
        t('Escalations workflow'),
        t('Clinic ops tools (advanced)'),
      ],
    },
    {
      key: 'gold',
      name: t('Gold'),
      price: t('TBD'),
      highlight: false,
      bullets: [
        t('Everything in Premium'),
        t('Analytics dashboard'),
        t('Admin configuration'),
        t('Priority support (TBD)'),
      ],
    },
  ], [t]);

  return (
    <Card className="card-plain">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <Card.Title className="mb-1">{t('Choose your plan')}</Card.Title>
            <Card.Text className="text-muted mb-0">
              {t('Start on Free, or start a 1-week trial on any paid tier (demo mode).')}
            </Card.Text>
          </div>
          <Button variant="link" className="p-0" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        </div>

        <Alert variant="light" className="border mt-3 mb-3">
          <div className="fw-semibold">{t('Demo mode')}</div>
          <div className="text-muted small">{t('Billing is not live yet. Trials are stored client-side.')}</div>
          <div className="text-muted small mt-1">{t('7 days • No credit card required')}</div>
        </Alert>

        <Row className="g-3 mt-2">
          {tiers.map((tier) => (
            <Col key={tier.key} md={6} xl={3}>
              <Card className={`h-100 ${tier.highlight ? 'border-primary' : ''}`}>
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div>
                      <div className="fw-bold">{tier.name}</div>
                      <div className="text-muted small">{t('Price')}: {tier.price}</div>
                    </div>
                    {tier.highlight && <Badge bg="primary">{t('Popular')}</Badge>}
                  </div>

                  <ul className="mt-3 mb-3">
                    {tier.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <div className="mt-auto d-grid gap-2">
                    {tier.key === 'free' ? (
                      <Button
                        variant="outline-secondary"
                        onClick={() => onChooseTier?.('free')}
                      >
                        {t('Continue with Free')}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => {
                            onChooseTier?.(tier.key);
                            onStartTrial?.(tier.key);
                          }}
                        >
                          {t('Start 1-week trial')}
                        </Button>
                        <Button
                          variant="outline-primary"
                          onClick={() => onChooseTier?.(tier.key)}
                        >
                          {t('Choose plan')}
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
};

export default SubscriptionOnboarding;
