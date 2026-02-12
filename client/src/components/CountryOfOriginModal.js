import React, { useMemo, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { getCountryOptions, isOtherCountry, OTHER_COUNTRY_CODE } from '../utils/countries';

const normalizeCode = (value) => {
  const v = String(value || '').trim().toUpperCase();
  if (!v) return 'US';
  if (v === OTHER_COUNTRY_CODE) return OTHER_COUNTRY_CODE;
  if (/^[A-Z]{2}$/.test(v)) return v;
  return 'US';
};

const CountryOfOriginModal = ({
  show,
  allowClose = false,
  locale = 'en-US',
  t = (s) => s,
  initialCountryCode = 'US',
  initialOtherText = '',
  serverError,
  onCancel,
  onSave,
}) => {
  const [countryCode, setCountryCode] = useState(() => normalizeCode(initialCountryCode));
  const [countryOtherText, setCountryOtherText] = useState(() => String(initialOtherText || ''));
  const [error, setError] = useState('');

  const options = useMemo(() => getCountryOptions(locale, t), [locale, t]);

  const needsOther = isOtherCountry(countryCode);

  const validate = () => {
    if (!countryCode) return t('Country is required');
    if (needsOther) {
      const cleaned = String(countryOtherText || '').trim();
      if (cleaned.length < 2) return t('Specify country must be at least 2 characters');
      if (cleaned.length > 64) return t('Specify country is too long (max 64 characters)');
    }
    return '';
  };

  const submit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    await onSave?.({ countryCode, countryOtherText: needsOther ? String(countryOtherText || '').trim() : null });
  };

  return (
    <Modal show={!!show} onHide={allowClose ? onCancel : undefined} centered backdrop={allowClose ? true : 'static'} keyboard={allowClose}>
      <Modal.Header closeButton={allowClose}>
        <Modal.Title>{t('Country of origin')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="light" className="border">
          {t('Please tell us where you are subscribing from. This helps reporting and compliance.')}
        </Alert>

        {!!serverError && <Alert variant="danger">{serverError}</Alert>}
        {!!error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>{t('Country')}</Form.Label>
          <Form.Select
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              setError('');
            }}
            aria-label="Country of origin"
          >
            {options.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {needsOther && (
          <Form.Group>
            <Form.Label>{t('Specify country')}</Form.Label>
            <Form.Control
              value={countryOtherText}
              onChange={(e) => {
                setCountryOtherText(e.target.value);
                setError('');
              }}
              minLength={2}
              maxLength={64}
              placeholder={t('e.g., Côte d\'Ivoire')}
              autoFocus
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        {allowClose && (
          <Button variant="outline-secondary" onClick={onCancel}>
            {t('Cancel')}
          </Button>
        )}
        <Button variant="primary" onClick={submit}>
          {t('Save')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CountryOfOriginModal;
