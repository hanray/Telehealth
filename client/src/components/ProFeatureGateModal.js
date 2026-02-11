import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';

const normalizeStatus = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'trialing') return 'trialing';
  if (s === 'expired') return 'expired';
  return 'active';
};

const ProFeatureGateModal = ({
  show,
  onHide,
  subscription,
  featureKey,
  onStartTrial,
  onUpgrade,
  t = (text) => text,
}) => {
  const status = normalizeStatus(subscription?.status);
  const isExpired = status === 'expired';

  return (
    <Modal show={!!show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('Pro feature')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="light" className="border">
          {isExpired
            ? t('Your trial has ended. Upgrade to Pro to continue using this feature.')
            : t('This feature is part of Pro. Start a free trial?')}
        </Alert>

        <div className="text-muted small">
          {t('Feature')}: <strong>{String(featureKey || 'pro_feature')}</strong>
        </div>
        <div className="text-muted small mt-2">{t('Billing integration coming soon.')}</div>
        {!isExpired && (
          <div className="text-muted small mt-2">{t('14 days • No credit card required')}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>{t('Not now')}</Button>
        {isExpired ? (
          <Button variant="primary" onClick={onUpgrade}>{t('Upgrade to Pro (demo mode)')}</Button>
        ) : (
          <Button variant="primary" onClick={onStartTrial}>{t('Start free trial')}</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProFeatureGateModal;
