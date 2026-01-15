import React, { useMemo, useState } from 'react';
import { Modal, Button, Badge, Card, Row, Col, Form, Alert } from 'react-bootstrap';
import MiniLineChart from './charts/MiniLineChart';

const asDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

const ageFromDob = (dob) => {
  const d = asDate(dob);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
};

const parseBP = (bp) => {
  const s = String(bp || '').trim();
  const m = s.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!m) return null;
  return { sys: Number(m[1]), dia: Number(m[2]) };
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') return [value];
  return [];
};

const getRecord = (patient) => {
  const mr = patient?.medicalRecord;
  return mr && typeof mr === 'object' ? mr : {};
};

const getProfile = (patient) => {
  const mr = getRecord(patient);
  return mr.profile || {};
};

const getAdmin = (patient) => {
  const mr = getRecord(patient);
  return mr.admin || {};
};

const pickName = (patient) => {
  const p = getProfile(patient);
  return patient?.name || p.fullName || 'Patient';
};

const toChipText = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (typeof item === 'object') return item.name || item.title || item.problem || item.condition || null;
  return String(item);
};

const extractNumeric = (v) => {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v);
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
};

const timeWindowCutoff = (window) => {
  const now = Date.now();
  const ms = window === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(now - ms);
};

const PatientChart = ({
  show,
  onHide,
  patient,
  onUpdatePatient,
  onOpenRecords,
  t = (s) => s,
}) => {
  const [trendWindow, setTrendWindow] = useState('24h');
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [saveBanner, setSaveBanner] = useState(null);

  const rec = useMemo(() => getRecord(patient), [patient]);
  const profile = useMemo(() => getProfile(patient), [patient]);
  const admin = useMemo(() => getAdmin(patient), [patient]);

  const allergies = useMemo(() => normalizeList(rec.allergies).map(toChipText).filter(Boolean), [rec.allergies]);
  const conditions = useMemo(() => {
    const list = Array.isArray(rec.problems) ? rec.problems : normalizeList(rec.conditions || rec.problems);
    return list.map(toChipText).filter(Boolean);
  }, [rec.problems, rec.conditions]);

  const cutoff = useMemo(() => timeWindowCutoff(trendWindow), [trendWindow]);

  const vitals = useMemo(() => {
    const list = Array.isArray(rec.vitals) ? rec.vitals : [];
    const parsed = list
      .map((v) => ({ ...v, _dt: asDate(v.recordedAt || v.time || v.date) }))
      .filter((v) => v._dt);
    return parsed
      .filter((v) => v._dt >= cutoff)
      .sort((a, b) => a._dt - b._dt);
  }, [rec.vitals, cutoff]);

  const vitalsSeries = useMemo(() => {
    const base = vitals.map((v) => ({ x: v._dt.getTime(), v }));
    const series = {
      hr: base.map((p) => ({ x: p.x, value: extractNumeric(p.v.hr) })),
      temp: base.map((p) => ({ x: p.x, value: extractNumeric(p.v.tempC ?? p.v.temp) })),
      spo2: base.map((p) => ({ x: p.x, value: extractNumeric(p.v.spo2 ?? p.v.spO2) })),
      weight: base.map((p) => ({ x: p.x, value: extractNumeric(p.v.weightKg ?? p.v.weight) })),
      bpSys: base.map((p) => ({ x: p.x, value: parseBP(p.v.bp)?.sys })),
      bpDia: base.map((p) => ({ x: p.x, value: parseBP(p.v.bp)?.dia })),
    };
    return series;
  }, [vitals]);

  const latestVitals = useMemo(() => (vitals.length ? vitals[vitals.length - 1] : null), [vitals]);

  const labSeries = useMemo(() => {
    const list = Array.isArray(rec.labs) ? rec.labs : [];

    // Try to build numeric lab trends from record.labs entries if they contain values.
    // Supported shapes (best-effort):
    // - { test, date, value }
    // - { test, recordedAt, resultValue }
    // - { test, summary: 'Glucose 120 mg/dL' }
    const toPoint = (lab) => {
      const dt = asDate(lab.recordedAt || lab.resultedAt || lab.date);
      if (!dt) return null;
      const value = extractNumeric(lab.value ?? lab.resultValue ?? lab.result ?? lab.summary);
      if (value == null) return null;
      return { x: dt.getTime(), value };
    };

    const byTest = new Map();
    list.forEach((lab) => {
      const test = String(lab.test || lab.name || '').trim();
      if (!test) return;
      const p = toPoint(lab);
      if (!p) return;
      if (!byTest.has(test)) byTest.set(test, []);
      byTest.get(test).push(p);
    });

    const wanted = ['Glucose', 'Creatinine', 'WBC', 'Hgb', 'Platelets'];
    const normalized = [];

    wanted.forEach((key) => {
      const points = Array.from(byTest.entries())
        .filter(([test]) => test.toLowerCase().includes(key.toLowerCase()))
        .flatMap(([, pts]) => pts)
        .filter((p) => new Date(p.x) >= cutoff)
        .sort((a, b) => a.x - b.x);

      if (points.length) {
        normalized.push({ key, points });
      }
    });

    // If no numeric lab trends exist, provide a clearly labeled demo trend.
    if (!normalized.length) {
      const now = Date.now();
      const step = trendWindow === '24h' ? 4 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const demo = (base, jitter) =>
        Array.from({ length: trendWindow === '24h' ? 7 : 8 }).map((_, i) => ({
          x: now - step * (trendWindow === '24h' ? (6 - i) : (7 - i)),
          value: base + Math.sin(i / 2) * jitter,
        }));

      return {
        isDemo: true,
        glucose: demo(108, 10),
        creatinine: demo(1.0, 0.15),
        wbc: demo(7.5, 1.2),
      };
    }

    return {
      isDemo: false,
      glucose: normalized.find((x) => x.key === 'Glucose')?.points || [],
      creatinine: normalized.find((x) => x.key === 'Creatinine')?.points || [],
      wbc: normalized.find((x) => x.key === 'WBC')?.points || [],
    };
  }, [rec.labs, cutoff, trendWindow]);

  const timeline = useMemo(() => {
    const encounters = Array.isArray(rec.encounters) ? rec.encounters : [];
    const orders = rec.orders || {};
    const orderedLabs = Array.isArray(orders.labs) ? orders.labs : [];
    const resultsLabs = Array.isArray(rec.labs) ? rec.labs : [];

    const items = [];

    encounters.forEach((e, idx) => {
      const dt = asDate(e.date || e.startedAt || e.time);
      items.push({
        id: `enc-${idx}`,
        when: dt || new Date(0),
        kind: 'encounter',
        label: e.type || 'Encounter',
        detail: e.provider ? `${t('Provider')}: ${e.provider}` : '',
        marker: (e.type || '').toLowerCase().includes('tele') ? 'telehealth' : (e.type || '').toLowerCase().includes('home') ? 'homecare' : (e.type || '').toLowerCase().includes('er') ? 'er' : 'visit',
      });
    });

    orderedLabs.forEach((o, idx) => {
      const dt = asDate(o.orderedAt || o.date);
      items.push({
        id: `ord-lab-${idx}`,
        when: dt || new Date(0),
        kind: 'order',
        label: `${t('Lab order')}: ${o.test || o.name || 'Lab'}`,
        detail: `${t('Status')}: ${o.status || 'ordered'}`,
        marker: 'order',
      });
    });

    resultsLabs.forEach((r, idx) => {
      const dt = asDate(r.resultedAt || r.date);
      items.push({
        id: `res-lab-${idx}`,
        when: dt || new Date(0),
        kind: 'result',
        label: `${t('Lab result')}: ${r.test || r.name || 'Lab'}`,
        detail: `${t('Status')}: ${r.status || 'resulted'}`,
        marker: r.status === 'pending' ? 'pending' : 'result',
      });
    });

    return items
      .filter((i) => i.when && Number.isFinite(i.when.getTime()))
      .sort((a, b) => b.when - a.when)
      .slice(0, 14);
  }, [rec.encounters, rec.orders, rec.labs, t]);

  const displayMRN = admin.mrn || patient?.mrn || patient?.id || '';
  const displayDob = profile.dob || patient?.dob || null;
  const age = ageFromDob(displayDob);

  const [newVitals, setNewVitals] = useState({
    recordedAt: new Date().toISOString().slice(0, 16),
    hr: '',
    bp: '',
    tempC: '',
    spo2: '',
    weightKg: '',
  });

  const [newNote, setNewNote] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: '',
    text: '',
  });

  const pushVitals = () => {
    if (!patient?.id) return;
    const next = {
      recordedAt: newVitals.recordedAt,
      hr: extractNumeric(newVitals.hr),
      bp: String(newVitals.bp || '').trim(),
      tempC: extractNumeric(newVitals.tempC),
      spo2: extractNumeric(newVitals.spo2),
      weightKg: extractNumeric(newVitals.weightKg),
    };

    const existing = getRecord(patient);
    const updated = {
      ...patient,
      medicalRecord: {
        ...existing,
        vitals: [...(Array.isArray(existing.vitals) ? existing.vitals : []), next],
      },
    };

    onUpdatePatient?.(updated);
    setShowVitalsModal(false);
    setSaveBanner({ variant: 'success', text: t('Vitals entry saved to medical record.') });
  };

  const pushNote = () => {
    if (!patient?.id) return;
    if (!String(newNote.text || '').trim()) {
      setSaveBanner({ variant: 'warning', text: t('Note text is required.') });
      return;
    }

    const existing = getRecord(patient);
    const entry = {
      date: newNote.date,
      type: 'clinician',
      author: 'Clinician',
      title: String(newNote.title || '').trim() || t('Note'),
      text: String(newNote.text || '').trim(),
    };

    const updated = {
      ...patient,
      medicalRecord: {
        ...existing,
        clinicalNotes: [...(Array.isArray(existing.clinicalNotes) ? existing.clinicalNotes : []), entry],
      },
    };

    onUpdatePatient?.(updated);
    setShowNoteModal(false);
    setNewNote({ date: new Date().toISOString().slice(0, 10), title: '', text: '' });
    setSaveBanner({ variant: 'success', text: t('Note created in medical record (not shown in chart).') });
  };

  const headerName = pickName(patient);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{t('Patient Chart')} — {headerName}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {saveBanner && (
          <Alert variant={saveBanner.variant} onClose={() => setSaveBanner(null)} dismissible className="mb-3">
            {saveBanner.text}
          </Alert>
        )}

        <div className="patient-chart__summary">
          <div className="patient-chart__summary-main">
            <div className="patient-chart__name">{headerName}</div>
            <div className="patient-chart__meta text-muted">
              {age != null ? `${age}y` : t('Age unknown')} • {t('MRN')}: {displayMRN}
            </div>
          </div>
          <div className="patient-chart__chips">
            <div className="patient-chart__chip-group">
              <div className="patient-chart__chip-label text-muted">{t('Allergies')}</div>
              <div className="d-flex flex-wrap gap-2">
                {(allergies.length ? allergies : [t('None')]).slice(0, 6).map((a, idx) => (
                  <Badge key={idx} bg={a === t('None') ? 'secondary' : 'danger'} className="patient-chart__chip">{a}</Badge>
                ))}
              </div>
            </div>
            <div className="patient-chart__chip-group">
              <div className="patient-chart__chip-label text-muted">{t('Conditions')}</div>
              <div className="d-flex flex-wrap gap-2">
                {(conditions.length ? conditions : [t('None')]).slice(0, 6).map((c, idx) => (
                  <Badge key={idx} bg={c === t('None') ? 'secondary' : 'info'} className="patient-chart__chip">{c}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Row className="g-3">
          <Col xl={8}>
            <Card className="patient-chart__panel">
              <Card.Body>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <div>
                    <div className="patient-chart__panel-title">{t('Trends')}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {t('Vitals + labs (at a glance)')}{labSeries.isDemo ? ` • ${t('Demo data')}` : ''}
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Select size="sm" value={trendWindow} onChange={(e) => setTrendWindow(e.target.value)} style={{ width: 120 }}>
                      <option value="24h">{t('Last 24h')}</option>
                      <option value="7d">{t('Last 7d')}</option>
                    </Form.Select>
                    <Button size="sm" variant="outline-primary" onClick={() => setShowVitalsModal(true)}>
                      {t('Add vitals entry')}
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => setShowNoteModal(true)}>
                      {t('Add note')}
                    </Button>
                    <Button size="sm" variant="outline-dark" onClick={() => onOpenRecords?.(patient)}>
                      {t('Records')}
                    </Button>
                  </div>
                </div>

                <Row className="g-3">
                  <Col md={6}>
                    <Card className="patient-chart__subpanel">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold">{t('Vitals')}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {latestVitals?._dt ? `${t('Latest')}: ${latestVitals._dt.toLocaleString()}` : t('No vitals in window')}
                            </div>
                          </div>
                        </div>

                        <div className="patient-chart__grid">
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('HR')}</div>
                            <MiniLineChart series={[{ color: '#0d6efd', data: vitalsSeries.hr }]} />
                          </div>
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('BP')}</div>
                            <MiniLineChart
                              series={[
                                { color: '#198754', data: vitalsSeries.bpSys },
                                { color: '#dc3545', data: vitalsSeries.bpDia },
                              ]}
                            />
                          </div>
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('Temp (°C)')}</div>
                            <MiniLineChart series={[{ color: '#fd7e14', data: vitalsSeries.temp }]} />
                          </div>
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('SpO₂')}</div>
                            <MiniLineChart series={[{ color: '#6f42c1', data: vitalsSeries.spo2 }]} />
                          </div>
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('Weight')}</div>
                            <MiniLineChart series={[{ color: '#0dcaf0', data: vitalsSeries.weight }]} />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="patient-chart__subpanel">
                      <Card.Body>
                        <div className="fw-semibold">{t('Labs')}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {labSeries.isDemo ? t('No numeric lab values found; showing demo trends.') : t('Numeric trends (when available).')}
                        </div>

                        <div className="patient-chart__grid">
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('Glucose')}</div>
                            <MiniLineChart series={[{ color: '#0d6efd', data: labSeries.glucose }]} />
                          </div>
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('Creatinine')}</div>
                            <MiniLineChart series={[{ color: '#198754', data: labSeries.creatinine }]} />
                          </div>
                          <div className="patient-chart__metric">
                            <div className="patient-chart__metric-label">{t('WBC')}</div>
                            <MiniLineChart series={[{ color: '#6f42c1', data: labSeries.wbc }]} />
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="patient-chart__panel mt-3">
              <Card.Body>
                <div className="patient-chart__panel-title">{t('Timeline')}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>{t('Encounters + orders/results')}</div>

                <div className="patient-chart__timeline">
                  {timeline.map((item) => (
                    <div key={item.id} className="patient-chart__timeline-item">
                      <div className="patient-chart__timeline-left">
                        <Badge bg={item.kind === 'encounter' ? 'primary' : item.kind === 'order' ? 'warning' : 'success'} className="text-uppercase">
                          {item.marker}
                        </Badge>
                        <div className="text-muted" style={{ fontSize: 12 }}>{item.when.toLocaleString()}</div>
                      </div>
                      <div className="patient-chart__timeline-main">
                        <div className="fw-semibold">{item.label}</div>
                        {item.detail && <div className="text-muted" style={{ fontSize: 12 }}>{item.detail}</div>}
                      </div>
                    </div>
                  ))}
                  {!timeline.length && <div className="text-muted">{t('No timeline events available.')}</div>}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={4}>
            <Card className="patient-chart__panel">
              <Card.Body>
                <div className="patient-chart__panel-title">{t('Quick summary')}</div>
                <div className="d-grid gap-2">
                  <div className="patient-chart__kv">
                    <div className="text-muted">{t('DOB')}</div>
                    <div>{displayDob ? String(displayDob) : t('Unknown')}</div>
                  </div>
                  <div className="patient-chart__kv">
                    <div className="text-muted">{t('Last vitals')}</div>
                    <div>
                      {latestVitals ? (
                        <span>
                          {latestVitals.bp ? `${t('BP')} ${latestVitals.bp} • ` : ''}
                          {Number.isFinite(latestVitals.hr) ? `${t('HR')} ${latestVitals.hr} • ` : ''}
                          {Number.isFinite(latestVitals.spo2) ? `${t('SpO₂')} ${latestVitals.spo2}` : ''}
                        </span>
                      ) : (
                        <span className="text-muted">{t('No vitals')}</span>
                      )}
                    </div>
                  </div>
                  <div className="patient-chart__kv">
                    <div className="text-muted">{t('Orders pending')}</div>
                    <div>
                      {Array.isArray(rec?.orders?.labs) && rec.orders.labs.filter((o) => ['ordered', 'pending', 'requested'].includes(String(o.status || 'ordered'))).length}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Modal show={showVitalsModal} onHide={() => setShowVitalsModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('Add vitals entry')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form className="d-grid gap-2">
              <Form.Group>
                <Form.Label>{t('Recorded at')}</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newVitals.recordedAt}
                  onChange={(e) => setNewVitals((p) => ({ ...p, recordedAt: e.target.value }))}
                />
              </Form.Group>
              <Row className="g-2">
                <Col>
                  <Form.Group>
                    <Form.Label>{t('HR')}</Form.Label>
                    <Form.Control value={newVitals.hr} onChange={(e) => setNewVitals((p) => ({ ...p, hr: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>{t('BP')}</Form.Label>
                    <Form.Control placeholder="120/80" value={newVitals.bp} onChange={(e) => setNewVitals((p) => ({ ...p, bp: e.target.value }))} />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-2">
                <Col>
                  <Form.Group>
                    <Form.Label>{t('Temp (°C)')}</Form.Label>
                    <Form.Control value={newVitals.tempC} onChange={(e) => setNewVitals((p) => ({ ...p, tempC: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>{t('SpO₂')}</Form.Label>
                    <Form.Control value={newVitals.spo2} onChange={(e) => setNewVitals((p) => ({ ...p, spo2: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>{t('Weight (kg)')}</Form.Label>
                    <Form.Control value={newVitals.weightKg} onChange={(e) => setNewVitals((p) => ({ ...p, weightKg: e.target.value }))} />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowVitalsModal(false)}>{t('Cancel')}</Button>
            <Button variant="primary" onClick={pushVitals}>{t('Save')}</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('Add note')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" className="mb-2">
              {t('This creates a note in Medical Records but does not display notes inside the chart.')}
            </Alert>
            <Form className="d-grid gap-2">
              <Row className="g-2">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>{t('Date')}</Form.Label>
                    <Form.Control type="date" value={newNote.date} onChange={(e) => setNewNote((p) => ({ ...p, date: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>{t('Title')}</Form.Label>
                    <Form.Control value={newNote.title} onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group>
                <Form.Label>{t('Note')}</Form.Label>
                <Form.Control as="textarea" rows={5} value={newNote.text} onChange={(e) => setNewNote((p) => ({ ...p, text: e.target.value }))} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>{t('Cancel')}</Button>
            <Button variant="primary" onClick={pushNote}>{t('Create note')}</Button>
          </Modal.Footer>
        </Modal>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-dark" onClick={() => onOpenRecords?.(patient)}>{t('Open records')}</Button>
        <Button variant="secondary" onClick={onHide}>{t('Close')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PatientChart;
