import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';

const normalizeMode = (value) => String(value || '').trim().toLowerCase();

const deriveViewMode = (currentUser) => {
  const role = normalizeMode(currentUser?.role);
  const viewMode = normalizeMode(currentUser?.viewMode);

  if (role === 'admin') return viewMode || 'doctor';
  if (role === 'doctor' || role === 'specialist' || role === 'pharmacist') return 'doctor';
  if (role === 'nurse' || role === 'psw') return 'nurse';

  return role || null;
};

const TelehealthShell = ({
  currentUser,
  doctorView,
  nurseView,
  t = (text) => text,
}) => {
  const effectiveMode = useMemo(() => deriveViewMode(currentUser), [currentUser]);

  if (effectiveMode === 'doctor') return doctorView || null;
  if (effectiveMode === 'nurse') return nurseView || null;

  return (
    <Card className="card-plain">
      <Card.Body>
        <Card.Text>{t('Unsupported role for Telehealth')}: {String(currentUser?.role || '')}</Card.Text>
      </Card.Body>
    </Card>
  );
};

export default TelehealthShell;
