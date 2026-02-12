import React, { useMemo } from 'react';
import { Card, Button, Row, Col, Badge, Alert } from 'react-bootstrap';

const TIERS = [
  {
    key: 'free',
    name: 'Free',
    price: 'Free',
    highlight: false,
    bullets: [
      'Telehealth workflows (core)',
      'Messaging + notifications',
      'Appointments (basic)',
      'Labs (view)',
      'Prescriptions (basic)',
    ],
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 'TBD',
    highlight: false,
    bullets: [
      'Everything in Free',
      'Clinic ops tools (starter)',
      'Basic automation',
      'Team workflows (limited)',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 'TBD',
    highlight: true,
    bullets: [
      'Everything in Basic',
      'Automation + escalations',
      'Analytics dashboard',
      'Advanced ops tools',
    ],
  },
  {
    key: 'gold',
    name: 'Gold',
    price: 'TBD',
    highlight: false,
    bullets: [
      'Everything in Premium',
      'Priority support (TBD)',
      'Enterprise controls (TBD)',
      'SLA / compliance add-ons (TBD)',
    ],
  },
];

const PricingPage = ({
  planIntent,
  onChoosePlan,
  onStartTrial,
  onContinue,
  t = (s) => s,
}) => {
  const selectedTier = String(planIntent?.tier || '').toLowerCase() || null;

  const header = useMemo(() => {
    return (
      <div className="mb-3">
        <h2 className="mb-1">{t('Pricing')}</h2>
        <div className="text-muted">
          {t('Start a 1-week free trial (demo mode) on any paid tier. Billing will be enabled later.')}
        </div>
      </div>
    );
  }, [t]);

  return (
    <div>
      {header}

      <Alert variant="light" className="border">
        <div className="fw-semibold">{t('Demo mode')}</div>
        <div className="text-muted small">
          {t('This app currently uses client-side trial state for feature gating. Real billing is not wired yet.')}
        </div>
      </Alert>

      <Row className="g-3">
        {TIERS.map((tier) => {
          const isSelected = selectedTier === tier.key;
          const border = tier.highlight ? 'border-primary' : '';
          return (
            <Col key={tier.key} md={6} xl={3}>
              <Card className={`h-100 ${border}`}>
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{t(tier.name)}</div>
                      <div className="text-muted small">{t('Price')}: {tier.price}</div>
                    </div>
                    {tier.highlight && <Badge bg="primary">{t('Popular')}</Badge>}
                  </div>

                  <ul className="mt-3 mb-3">
                    {tier.bullets.map((b) => (
                      <li key={b}>{t(b)}</li>
                    ))}
                  </ul>

                  <div className="mt-auto d-grid gap-2">
                    {tier.key === 'free' ? (
                      <Button
                        variant={isSelected ? 'secondary' : 'outline-secondary'}
                        onClick={() => onChoosePlan?.('free')}
                      >
                        {isSelected ? t('Selected') : t('Choose Free')}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => {
                            onChoosePlan?.(tier.key);
                            onStartTrial?.(tier.key);
                          }}
                        >
                          {t('Start 1-week trial')}
                        </Button>
                        <Button
                          variant={isSelected ? 'secondary' : 'outline-primary'}
                          onClick={() => onChoosePlan?.(tier.key)}
                        >
                          {isSelected ? t('Selected') : t('Choose plan')}
                        </Button>
                      </>
                    )}

                    <Button
                      variant="link"
                      className="p-0 text-start"
                      onClick={() => {
                        onChoosePlan?.(tier.key);
                        onContinue?.();
                      }}
                    >
                      {t('Continue')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default PricingPage;
