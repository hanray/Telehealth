import React, { useMemo, useState } from 'react';
import { Modal, Button, Badge, Form, Alert } from 'react-bootstrap';

const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const normalizeTier = (tier) => (String(tier || '').trim().toLowerCase() === 'pro' ? 'pro' : 'free');
const normalizeStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'trialing') return 'trialing';
  if (s === 'expired') return 'expired';
  return 'active';
};

const SubscriptionSettingsModal = ({
  show,
  onHide,
  subscription,
  isAdmin,
  onUpgradeToPro,
  onDowngradeToFree,
  onSetTier,
  t = (text) => text,
}) => {
  const tier = normalizeTier(subscription?.tier);
  const status = normalizeStatus(subscription?.status);

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
        <Alert variant="light" className="border mb-3">
          {t('Billing integration coming soon.')}
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

        <hr />

        <div className="d-grid gap-2">
          <Button variant="primary" onClick={onUpgradeToPro}>
            {t('Upgrade to Pro (demo mode)')}
          </Button>
          <Button variant="outline-secondary" onClick={onDowngradeToFree}>
            {t('Downgrade to Free')}
          </Button>
        </div>

        {isAdmin && (
          <>
            <hr />
            <div className="fw-semibold mb-2">{t('Admin / tester override')}</div>
            <div className="text-muted small mb-2">{t('This is for demos/testing only.')}</div>
            <Form.Select
              value={adminTier}
              onChange={(e) => setAdminTier(e.target.value)}
              aria-label="Set subscription tier"
              className="mb-2"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </Form.Select>
            <Button
              variant="outline-primary"
              onClick={() => onSetTier?.(adminTier)}
            >
              {t('Set subscription tier')}
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
