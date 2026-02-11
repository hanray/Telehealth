import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, ListGroup, Badge, Modal, Form, Row, Col, Alert, Table } from 'react-bootstrap';
import { filterPharmaciesForUser, formatPharmacyLabel } from '../utils/pharmacies';

const formatList = (value) => {
  if (!value) return '—';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    if (typeof value[0] === 'object') {
      return value.map((v) => v.name || v.vaccine || v.study || v.test || v.title).filter(Boolean).join(', ') || '—';
    }
    return value.join(', ');
  }
  return value;
};

const DASHBOARD_CARD_KEYS = ['preferredPharmacy', 'recentTests', 'recentMessages', 'activePrescriptions', 'careSnapshot'];

const PatientDashboard = ({
  patient,
  appointments = [],
  labs = [],
  prescriptions = [],
  pharmacies = [],
  notifications = [],
  currentUser,
  onUpdatePreferredPharmacy,
  onOpenRecords,
  onOpenLab,
  onOpenChat,
  t = (str) => str,
}) => {
  const [showRequest, setShowRequest] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [cardOrder, setCardOrder] = useState(DASHBOARD_CARD_KEYS);
  const [requestDate, setRequestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [requestTime, setRequestTime] = useState('');
  const dragKeyRef = useRef(null);

  const [pharmacyQuery, setPharmacyQuery] = useState('');
  const [preferredPharmacyId, setPreferredPharmacyId] = useState('');
  const [preferredPharmacyOther, setPreferredPharmacyOther] = useState('');
  const [pharmacySavedBanner, setPharmacySavedBanner] = useState('');

  const record = useMemo(() => patient?.medicalRecord || {}, [patient]);
  const patientId = patient?.id || null;

  useEffect(() => {
    setPreferredPharmacyId(patient?.preferredPharmacyId || '');
    setPreferredPharmacyOther(patient?.preferredPharmacyOtherText || '');
  }, [patient?.preferredPharmacyId, patient?.preferredPharmacyOtherText]);

  const visiblePharmacies = useMemo(() => {
    const list = filterPharmaciesForUser(pharmacies, currentUser).filter((p) => p?.active !== false);
    const q = String(pharmacyQuery || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const hay = [p.name, p.address, p.city, p.province, p.country].map((v) => String(v || '').toLowerCase());
      return hay.some((v) => v.includes(q));
    });
  }, [pharmacies, currentUser, pharmacyQuery]);

  const preferredPharmacyLabel = useMemo(() => {
    if (!preferredPharmacyId || preferredPharmacyId === 'other') return null;
    const found = (pharmacies || []).find((p) => p.id === preferredPharmacyId);
    return formatPharmacyLabel(found) || found?.name || preferredPharmacyId;
  }, [pharmacies, preferredPharmacyId]);

  const mineAppts = patientId ? appointments.filter((a) => a.patientId === patientId) : [];
  const mineLabs = patientId ? labs.filter((l) => l.patientId === patientId) : [];
  const medications = Array.isArray(record.medications) ? record.medications : [];

  const displayName = (entry) => {
    if (!entry) return '';
    const normalized = entry.normalized || {};
    if (normalized.medicationName) return normalized.medicationName;
    if (entry.medicationName) return entry.medicationName;
    const raw = entry.rawText || entry.name || '';
    const tokens = raw.split(/\s+/).slice(0, 2).join(' ');
    return tokens || raw;
  };

  const prescribedMeds = (prescriptions || [])
    .filter((p) => patientId && p.patientId === patientId)
    .map((p) => ({
      id: p.id,
      displayName: displayName(p),
      sig: p.normalized?.dosage || p.normalized?.frequency || p.rawText,
      status: p.status || 'Sent',
      updatedAt: p.updatedAt || p.createdAt,
      source: 'prescribed',
      pharmacyId: p.pharmacyId,
    }));

  const seededMeds = medications.map((m, idx) => ({
    id: m.id || `seed-${idx}`,
    displayName: displayName(m) || m.name,
    sig: m.sig,
    status: m.status || 'active',
    updatedAt: null,
    source: 'seeded',
  }));

  const dedupedMeds = () => {
    const map = new Map();
    prescribedMeds.forEach((m) => map.set(m.displayName.toLowerCase().trim(), m));
    seededMeds.forEach((m) => {
      const key = m.displayName.toLowerCase().trim();
      if (!map.has(key)) map.set(key, m);
    });
    const items = Array.from(map.values());
    return items.length ? items : seededMeds;
  };

  const medsForView = dedupedMeds();
  const allergies = Array.isArray(record.allergies) ? record.allergies : record.allergies ? [record.allergies] : [];
  const problems = Array.isArray(record.problems) ? record.problems : record.problems ? [record.problems] : (record.conditions ? [record.conditions] : []);
  const messages = Array.isArray(patient?.messages) ? patient.messages : [];

  const sortedAppts = [...mineAppts].sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0));
  const upcoming = sortedAppts.filter((a) => a.status !== 'completed');
  const activeMeds = medsForView.filter((m) => !['completed', 'stopped'].includes((m.status || '').toLowerCase()));
  const pendingTests = mineLabs.filter((l) => ['pending_review', 'pending'].includes((l.status || '').toLowerCase()));
  const unreadMessages = messages.filter((m) => m.unread).length;

  const labsSorted = [...mineLabs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recentLabs = labsSorted.slice(0, 3);
  const recentMessages = [...messages].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 4);

  const metrics = [
    { label: 'Upcoming Appointments', value: upcoming.length },
    { label: 'Active Prescriptions', value: activeMeds.length },
    { label: 'Pending Test Results', value: pendingTests.length },
    { label: 'Unread Messages', value: unreadMessages },
  ];

  const storageKey = patientId ? `patient-dashboard-order-${patientId}` : null;

  const timeSlots = useMemo(
    () => [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ],
    []
  );

  const normalizeOrder = (order = []) => {
    const filtered = order.filter((key) => DASHBOARD_CARD_KEYS.includes(key));
    const missing = DASHBOARD_CARD_KEYS.filter((key) => !filtered.includes(key));
    return [...filtered, ...missing];
  };

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved) && saved.length) {
        setCardOrder(normalizeOrder(saved));
      }
    } catch (err) {
      // ignore malformed saved state
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(normalizeOrder(cardOrder)));
  }, [cardOrder, storageKey]);

  const handleDrop = (targetKey) => {
    const sourceKey = dragKeyRef.current;
    if (!sourceKey || sourceKey === targetKey) return;
    setCardOrder((prev) => {
      const order = normalizeOrder(prev);
      const withoutSource = order.filter((k) => k !== sourceKey);
      const targetIndex = withoutSource.indexOf(targetKey);
      if (targetIndex === -1) return order;
      withoutSource.splice(targetIndex, 0, sourceKey);
      return normalizeOrder(withoutSource);
    });
  };

  if (!patient) return null;

  const badgeForStatus = (status) => {
    const key = (status || '').toLowerCase();
    if (['scheduled', 'active', 'completed'].includes(key)) return 'success';
    if (['pending', 'pending_review'].includes(key)) return 'warning';
    return 'secondary';
  };

  const renderCardByKey = (key) => {
    switch (key) {
      case 'preferredPharmacy':
        return (
          <Card className="card-plain h-100">
            <Card.Body>
              <Card.Title>{t('Preferred Pharmacy')}</Card.Title>
              <Card.Text className="text-muted" style={{ fontSize: 13 }}>
                {t('Choose where prescriptions should be sent by default.')}
              </Card.Text>

              {pharmacySavedBanner && (
                <Alert variant="success" onClose={() => setPharmacySavedBanner('')} dismissible>
                  {pharmacySavedBanner}
                </Alert>
              )}

              <div className="mb-2">
                <div className="text-muted small">{t('Current')}</div>
                <div className="fw-semibold">
                  {preferredPharmacyId === 'other'
                    ? (preferredPharmacyOther || t('Other'))
                    : (preferredPharmacyLabel || t('Not set'))}
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label className="small text-muted">{t('Search pharmacies')}</Form.Label>
                <Form.Control
                  value={pharmacyQuery}
                  onChange={(e) => setPharmacyQuery(e.target.value)}
                  placeholder={t('Search by name, city, address')}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small text-muted">{t('Select pharmacy')}</Form.Label>
                <Form.Select value={preferredPharmacyId} onChange={(e) => setPreferredPharmacyId(e.target.value)}>
                  <option value="">{t('Select pharmacy')}</option>
                  {visiblePharmacies.map((ph) => (
                    <option key={ph.id} value={ph.id}>{formatPharmacyLabel(ph) || ph.name}</option>
                  ))}
                  <option value="other">{t('Other (specify)')}</option>
                </Form.Select>
              </Form.Group>

              {preferredPharmacyId === 'other' && (
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted">{t('Other pharmacy details')}</Form.Label>
                  <Form.Control
                    value={preferredPharmacyOther}
                    onChange={(e) => setPreferredPharmacyOther(e.target.value)}
                    placeholder={t('Name / address / phone')}
                  />
                </Form.Group>
              )}

              <div className="d-flex gap-2 mt-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!patientId) return;
                    if (preferredPharmacyId === 'other' && !String(preferredPharmacyOther || '').trim()) return;
                    onUpdatePreferredPharmacy?.({
                      patientId,
                      preferredPharmacyId: preferredPharmacyId || '',
                      preferredPharmacyOtherText: preferredPharmacyId === 'other' ? String(preferredPharmacyOther || '').trim() : '',
                    });
                    setPharmacySavedBanner(t('Preferred pharmacy saved.'));
                  }}
                >
                  {t('Save')}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setPreferredPharmacyId(patient?.preferredPharmacyId || '');
                    setPreferredPharmacyOther(patient?.preferredPharmacyOtherText || '');
                    setPharmacyQuery('');
                    setPharmacySavedBanner('');
                  }}
                >
                  {t('Reset')}
                </Button>
              </div>

              <div className="text-muted small mt-2">
                {t('For MVP, results are limited to your country. Admins can search across all countries in the database.')}
              </div>
            </Card.Body>
          </Card>
        );
      case 'recentTests':
        return (
          <Card className="card-plain h-100">
            <Card.Body>
              <Card.Title>{t('Recent Test Results')}</Card.Title>
              <ListGroup variant="flush">
                {recentLabs.map((lab) => (
                  <ListGroup.Item key={lab.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{lab.test}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{lab.date}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={badgeForStatus(lab.status)} className="text-uppercase">{lab.status}</Badge>
                      <Button size="sm" variant="outline-primary" onClick={() => onOpenLab(lab)}>{t('View')}</Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!recentLabs.length && (
                  <ListGroup.Item className="text-muted">{t('No recent test results.')}</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        );
      case 'recentMessages':
        return (
          <Card className="card-plain h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="mb-0">{t('Recent Messages')}</Card.Title>
                <Button size="sm" variant="outline-primary" onClick={onOpenChat}>{t('View all messages')}</Button>
              </div>
              <ListGroup variant="flush">
                {recentMessages.map((msg, idx) => (
                  <ListGroup.Item
                    key={idx}
                    action
                    onClick={onOpenChat}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="fw-semibold">{msg.from}</div>
                      <div>{msg.subject}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{msg.date}</div>
                    </div>
                    {msg.unread && <Badge bg="primary">{t('New')}</Badge>}
                  </ListGroup.Item>
                ))}
                {!recentMessages.length && (
                  <ListGroup.Item className="text-muted">{t('No messages yet.')}</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        );
      case 'activePrescriptions':
        return (
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Active Prescriptions')}</Card.Title>
              <ListGroup variant="flush">
                {medsForView.map((m, idx) => (
                  <ListGroup.Item key={m.id || idx} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{m.displayName || m.name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{m.sig || t('As directed')}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {m.status || t('active')}{m.updatedAt ? ` • ${new Date(m.updatedAt).toLocaleString()}` : ''}
                      </div>
                    </div>
                    <Badge bg={badgeForStatus(m.status)} className="text-uppercase">{m.status || t('active')}</Badge>
                  </ListGroup.Item>
                ))}
                {!medsForView.length && <ListGroup.Item className="text-muted">{t('No active prescriptions.')}</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>
        );
      case 'careSnapshot':
      default:
        return (
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>{t('Care Snapshot')}</Card.Title>
              <Row>
                <Col md={6} className="mb-3">
                  <div className="fw-semibold mb-1">{t('Allergies')}</div>
                  <div>{formatList(allergies)}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="fw-semibold mb-1">{t('Conditions')}</div>
                  <div>{formatList(problems)}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="fw-semibold mb-1">{t('Medications')}</div>
                  <div>{formatList(medications)}</div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="fw-semibold mb-1">{t('Notes')}</div>
                  <div>{record.notes || '—'}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
    }
  };

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <Card.Title className="mb-0">{t('Welcome')}, {patient.name}</Card.Title>
          <Card.Subtitle className="text-muted">{t('Patient ID')}: {patient.id}</Card.Subtitle>
          <Card.Text className="mt-2 mb-0">{t('Stay on top of your care plan and message your care team.')}</Card.Text>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Row>
            {metrics.map((m) => (
              <Col md={6} lg={3} key={m.label} className="mb-3">
                <Card className="text-center h-100">
                  <Card.Body>
                    <div className="fw-semibold">{t(m.label)}</div>
                    <div style={{ fontSize: 28 }}>{m.value}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">{t('My Appointments')}</Card.Title>
            <Button size="sm" variant="outline-primary" onClick={() => setShowRequest(true)}>{t('Request appointment')}</Button>
          </div>
          <Table responsive borderless className="mb-0 align-middle">
            <thead>
              <tr>
                <th>{t('Date & Time')}</th>
                <th>{t('Type')}</th>
                <th>{t('Status')}</th>
                <th>{t('Complaint')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="fw-semibold">{a.startAt ? new Date(a.startAt).toLocaleDateString() : 'TBD'}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{a.startAt ? new Date(a.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </td>
                  <td>{a.type}</td>
                  <td><Badge bg={badgeForStatus(a.status)} className="text-uppercase">{a.status}</Badge></td>
                  <td>{a.notes || '—'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => onOpenLab && a.labId ? onOpenLab(labs.find((l) => l.id === a.labId)) : null} disabled={!a.labId}>
                        {t('View')}
                      </Button>
                      <Button size="sm" variant="outline-secondary">{t('Reschedule')}</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!sortedAppts.length && (
                <tr>
                  <td colSpan={5} className="text-muted text-center">{t('No appointments scheduled.')}</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Row className="g-3">
        {normalizeOrder(cardOrder).map((key) => (
          <Col
            key={key}
            lg={['recentTests', 'recentMessages'].includes(key) ? 6 : 12}
            className="mb-3"
            draggable
            onDragStart={() => { dragKeyRef.current = key; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(key)}
            onDragEnd={() => { dragKeyRef.current = null; }}
            style={{ cursor: 'grab' }}
          >
            {renderCardByKey(key)}
          </Col>
        ))}
      </Row>

      <Modal show={showRequest} onHide={() => setShowRequest(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('Request an appointment')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="secondary">{t('This sends a request to the care team (stub).')}</Alert>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    <span role="img" aria-label="calendar">📅</span> {t('Select preferred date')}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                  />
                  <div className="text-muted" style={{ fontSize: 12 }}>{t('Your local timezone is used.')}</div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                    <span role="img" aria-label="clock">⏰</span> {t('Select time slot')}
                  </Form.Label>
                  <Form.Select
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                  >
                    <option value="">{t('Select a time')}</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </Form.Select>
                  <div className="text-muted" style={{ fontSize: 12 }}>{t('Time slots reflect your selected location timezone')}</div>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mt-3">
              <Form.Label>{t('Details')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder={t('Reason, preferred times, symptoms')}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequest(false)}>{t('Cancel')}</Button>
          <Button
            variant="primary"
            onClick={() => setShowRequest(false)}
            disabled={!requestText.trim() || !requestDate || !requestTime}
          >
            {t('Submit request')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatientDashboard;
