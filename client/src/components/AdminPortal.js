import React, { useMemo, useState } from 'react';
import { Card, Form, Button, Badge, ListGroup, Stack, Row, Col } from 'react-bootstrap';
import { getClinicConfig, getClinicData, updateClinicData } from '../config/dataStore';
import { setFeatureFlag, setBanner, setAppointmentTypes } from '../config/AdminSettings';

const AdminPortal = ({ t = (str) => str }) => {
  const [config, setConfig] = useState(() => getClinicConfig());
  const [data, setData] = useState(() => getClinicData());
  const [newType, setNewType] = useState('');
  const [bannerDraft, setBannerDraft] = useState(config.banner || '');
  const [patientDraft, setPatientDraft] = useState({ name: '', email: '' });

  const refresh = () => {
    setConfig(getClinicConfig());
    setData(getClinicData());
  };

  const types = useMemo(() => config.appointmentTypes || [], [config]);

  const addType = () => {
    if (!newType.trim()) return;
    setAppointmentTypes([...types, newType.trim()]);
    setNewType('');
    refresh();
  };

  const removeType = (type) => {
    setAppointmentTypes(types.filter((t) => t !== type));
    refresh();
  };

  const saveBanner = () => {
    setBanner(bannerDraft.trim() || null);
    refresh();
  };

  const addPatient = () => {
    if (!patientDraft.name.trim()) return;
    const id = `P${Date.now().toString().slice(-6)}`;
    const next = updateClinicData((prev) => ({
      ...prev,
      patients: [...prev.patients, { id, name: patientDraft.name.trim(), email: patientDraft.email.trim(), medicalRecord: {} }],
    }));
    setData(next);
    setPatientDraft({ name: '', email: '' });
  };

  const togglePharmacy = (id) => {
    const next = updateClinicData((prev) => ({
      ...prev,
      pharmacies: (prev.pharmacies || []).map((p) => (p.id === id ? { ...p, active: !p.active, updatedAt: new Date().toISOString() } : p)),
    }));
    setData(next);
  };

  const resetPharmacies = () => {
    const seeds = getClinicData().pharmacies || [];
    const next = updateClinicData((prev) => ({ ...prev, pharmacies: seeds }));
    setData(next);
  };

  const removePatient = (id) => {
    const next = updateClinicData((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== id),
      appointments: prev.appointments.filter((a) => a.patientId !== id),
      labs: prev.labs.filter((l) => l.patientId !== id),
    }));
    setData(next);
  };

  const products = [
    {
      key: 'telemedicine',
      title: 'Telemedicine',
      unit: 'Visit / Provider chart',
      focus: 'Doctors, providers, clinic visits',
      actions: ['Appointments', 'Labs', 'Chart access'],
    },
    {
      key: 'telehealth',
      title: 'Telehealth',
      unit: 'Visit / Encounter / Triage',
      focus: 'Telehealth nurses & coordinators',
      actions: ['Triage queue', 'Visit queue', 'Lab review'],
    },
    {
      key: 'homecare',
      title: 'HomeCare',
      unit: 'Shift / Route / Tasks',
      focus: 'Homecare nurses & PSWs',
      actions: ['Shift start/end', 'Route list', 'Checklist / meds / vitals'],
    },
  ];

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Admin Settings')}</Card.Title>
          <Card.Text className="text-muted">{t('Feature toggles, clinic content, and roster management.')}</Card.Text>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Workspaces overview')}</Card.Title>
          <Row className="g-3">
            {products.map((p) => (
              <Col md={4} key={p.key}>
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="text-uppercase text-muted small fw-semibold">{t(p.unit)}</div>
                        <Card.Title className="mb-1">{t(p.title)}</Card.Title>
                        <div className="text-muted" style={{ fontSize: 13 }}>{t(p.focus)}</div>
                      </div>
                      <Badge bg="secondary" className="text-uppercase">{t('Active')}</Badge>
                    </div>
                    <div className="mt-3 d-grid gap-2">
                      {p.actions.map((a, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                          <span aria-hidden>•</span>
                          <span>{t(a)}</span>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Feature Flags')}</Card.Title>
          <Form>
            {Object.entries(config.features || {}).map(([key, value]) => (
              <Form.Check
                key={key}
                type="switch"
                id={`flag-${key}`}
                label={key}
                checked={!!value}
                onChange={(e) => {
                  setFeatureFlag(key, e.target.checked);
                  refresh();
                }}
              />
            ))}
          </Form>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Appointment Types')}</Card.Title>
          <Stack direction="horizontal" gap={2} className="mb-2">
            <Form.Control
              placeholder={t('Add type')}
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            />
            <Button variant="primary" onClick={addType}>{t('Add')}</Button>
          </Stack>
          <div className="d-flex flex-wrap gap-2">
            {types.map((t) => (
              <Badge bg="secondary" key={t} className="d-flex align-items-center gap-2">
                {t}
                <Button size="sm" variant="light" onClick={() => removeType(t)}>x</Button>
              </Badge>
            ))}
            {!types.length && <span className="text-muted">{t('No types defined.')}</span>}
          </div>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Broadcast Banner')}</Card.Title>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder={t('Set a short banner message')}
            value={bannerDraft}
            onChange={(e) => setBannerDraft(e.target.value)}
          />
          <Button className="mt-2" variant="primary" onClick={saveBanner}>
            {t('Save Banner')}
          </Button>
          {config.banner && (
            <Card className="mt-2">
              <Card.Body>
                <strong>{t('Preview:')}</strong>
                <div>{config.banner}</div>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Pharmacies')}</Card.Title>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="text-muted">{t('Toggle active status for pharmacy entries.')}</div>
            <Button size="sm" variant="outline-secondary" onClick={resetPharmacies}>{t('Reset')}</Button>
          </div>
          <ListGroup>
            {(data.pharmacies || []).map((p) => (
              <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{p.name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{p.address || ''}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg={p.active === false ? 'secondary' : 'success'}>{p.active === false ? t('Inactive') : t('Active')}</Badge>
                  <Button size="sm" variant="outline-primary" onClick={() => togglePharmacy(p.id)}>
                    {p.active === false ? t('Activate') : t('Deactivate')}
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
            {!(data.pharmacies || []).length && (
              <ListGroup.Item className="text-muted">{t('No pharmacies configured.')}</ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Card.Title>{t('Manage Patients')}</Card.Title>
          <Row className="mb-3">
            <Col md={5} className="mb-2">
              <Form.Control
                placeholder={t('Full name')}
                value={patientDraft.name}
                onChange={(e) => setPatientDraft({ ...patientDraft, name: e.target.value })}
              />
            </Col>
            <Col md={5} className="mb-2">
              <Form.Control
                placeholder={t('Email (optional)')}
                value={patientDraft.email}
                onChange={(e) => setPatientDraft({ ...patientDraft, email: e.target.value })}
              />
            </Col>
            <Col md={2} className="mb-2 d-grid">
              <Button onClick={addPatient} disabled={!patientDraft.name.trim()}>{t('Add')}</Button>
            </Col>
          </Row>

          <ListGroup>
            {data.patients.map((p) => (
              <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">{p.name}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{p.id} {p.email ? `• ${p.email}` : ''}</div>
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="secondary">{t('Record')}</Badge>
                  <Button size="sm" variant="outline-danger" onClick={() => removePatient(p.id)}>{t('Remove')}</Button>
                </div>
              </ListGroup.Item>
            ))}
            {!data.patients.length && <ListGroup.Item className="text-muted">{t('No patients yet.')}</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminPortal;
