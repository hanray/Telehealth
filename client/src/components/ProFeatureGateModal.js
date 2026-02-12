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
        <Modal.Title>{t('Upgrade required')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="light" className="border">
          {isExpired
            ? t('Your trial has ended. Choose a paid tier (Basic, Premium, or Gold) to continue using this feature.')
            : t('This feature requires a paid tier (Basic, Premium, or Gold). Start a free trial?')}
        </Alert>

        <div className="text-muted small">
          {t('Feature')}: <strong>{String(featureKey || 'gated_feature')}</strong>
        </div>
        <div className="text-muted small mt-2">{t('Billing integration coming soon (demo mode).')}</div>
        {!isExpired && (
          <div className="text-muted small mt-2">{t('7 days • No credit card required')}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>{t('Not now')}</Button>
        {isExpired ? (
          <Button variant="primary" onClick={onUpgrade}>{t('Choose paid tier (demo mode)')}</Button>
        ) : (
          <Button variant="primary" onClick={onStartTrial}>{t('Start free trial')}</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProFeatureGateModal;
