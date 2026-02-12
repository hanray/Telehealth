import React, { useMemo, useState } from 'react';
import { Modal, Button, Badge, Form, Alert } from 'react-bootstrap';

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const normalizeTier = (tier) => {
  const v = String(tier || '').trim().toLowerCase();
  if (v === 'free') return 'free';
  if (v === 'basic') return 'basic';
  if (v === 'premium') return 'premium';
  if (v === 'gold') return 'gold';
  if (v === 'pro') return 'premium';
  return 'free';
};
const normalizeStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'trialing') return 'trialing';
  if (s === 'expired') return 'expired';
  return 'active';
};

const normalizeIntentTier = (tier) => {
  const v = String(tier || '').trim().toLowerCase();
  if (v === 'free') return 'free';
  if (v === 'basic') return 'basic';
  if (v === 'premium') return 'premium';
  if (v === 'gold') return 'gold';
  return null;
};

const SubscriptionSettingsModal = ({
  show,
  onHide,
  subscription,
  isAdmin,
  billingStatus,
  billingActionError,
  onManageBilling,
  onStartBillingUpgrade,
  onUpgradeToPro,
  onDowngradeToFree,
  onSetTier,
  t = (text) => text,
}) => {
  const tier = normalizeTier(subscription?.tier);
  const status = normalizeStatus(subscription?.status);
  const planIntentTier = normalizeIntentTier(subscription?.planIntent?.tier);
  const planIntentSelectedAt = subscription?.planIntent?.selectedAt || null;

  const [adminTier, setAdminTier] = useState(tier);

  const statusBadge = useMemo(() => {
    if (status === 'trialing') return { bg: 'info', label: t('TRIALING') };
    if (status === 'expired') return { bg: 'warning', label: t('EXPIRED') };
    return { bg: 'success', label: t('ACTIVE') };
  }, [status, t]);

  return (
    <Modal show={!!show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('Subscription Settings')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!!billingActionError && (
          <Alert variant="danger" className="mb-3">
            {billingActionError}
          </Alert>
        )}

        <Alert variant="light" className="border mb-3">
          {(billingStatus?.configured && (billingStatus?.capabilities?.checkout || billingStatus?.capabilities?.portal))
            ? t('Billing is available.')
            : t('Billing not available yet.')}
          <div className="text-muted small mt-1">{t('Provider')}: {String(billingStatus?.provider || 'none')}</div>
        </Alert>

        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <div className="text-muted small">{t('Current tier')}</div>
            <div className="fw-bold text-uppercase">{tier}</div>
          </div>
          <Badge bg={statusBadge.bg}>{statusBadge.label}</Badge>
        </div>

        <div className="text-muted small">{t('Started')}: {fmt(subscription?.startedAt)}</div>
        {subscription?.trialEndsAt && (
          <div className="text-muted small">{t('Trial ends')}: {fmt(subscription?.trialEndsAt)}</div>
        )}
        {subscription?.expiresAt && (
          <div className="text-muted small">{t('Expired at')}: {fmt(subscription?.expiresAt)}</div>
        )}

        <div className="text-muted small mt-2">
          {t('Selected plan (intent)')}: <strong>{planIntentTier ? planIntentTier.toUpperCase() : '—'}</strong>
          {planIntentSelectedAt ? (
            <span className="ms-2">({t('selected')} {fmt(planIntentSelectedAt)})</span>
          ) : null}
        </div>

        <div className="text-muted small mt-1">
          {t('Note')}: {t('Trial and tier controls are demo-mode until billing is live.')}
        </div>

        <hr />

        <div className="fw-semibold mb-2">{t('Billing')}</div>
        <div className="d-grid gap-2 mb-3">
          <Button
            variant="outline-primary"
            onClick={onManageBilling}
            disabled={!billingStatus?.configured || !billingStatus?.capabilities?.portal}
          >
            {t('Manage subscription')}
          </Button>
          <Button
            variant="primary"
            onClick={onStartBillingUpgrade}
            disabled={!billingStatus?.configured || !billingStatus?.capabilities?.checkout}
          >
            {t('Upgrade')}
          </Button>
        </div>

        <hr />

        {isAdmin && (
          <>
            <hr />
            <div className="fw-semibold mb-2">{t('Admin / tester override')}</div>
            <div className="text-muted small mb-2">{t('This is for demos/testing only.')}</div>

            <div className="d-grid gap-2 mb-3">
              <Button variant="primary" onClick={onUpgradeToPro}>
                {t('Upgrade (demo mode)')}
              </Button>
              <Button variant="outline-secondary" onClick={onDowngradeToFree}>
                {t('Downgrade to Free')}
              </Button>
            </div>

            <Form.Select
              value={adminTier}
              onChange={(e) => setAdminTier(e.target.value)}
              aria-label="Set subscription tier"
              className="mb-2"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="gold">Gold</option>
            </Form.Select>
            <Button
              variant="outline-primary"
              onClick={() => onSetTier?.(adminTier)}
            >
              {t('Force tier')}
            </Button>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>{t('Close')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SubscriptionSettingsModal;
