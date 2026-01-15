import React, { useMemo, useState } from 'react';
import { Modal, Button, Row, Col, Card, Form, Badge } from 'react-bootstrap';

const asDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const fmtDayKey = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (d, days) => {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
};

const avg = (nums) => {
  const list = (nums || []).filter((n) => Number.isFinite(n));
  if (!list.length) return null;
  return list.reduce((a, b) => a + b, 0) / list.length;
};

const KpiCard = ({ label, value, sub, tone = 'primary' }) => (
  <Card className="h-100">
    <Card.Body>
      <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
      <div className="fw-semibold" style={{ fontSize: 26, lineHeight: 1.1 }}>{value}</div>
      {sub && <div className="mt-2"><Badge bg={tone}>{sub}</Badge></div>}
    </Card.Body>
  </Card>
);

const SvgFrame = ({ title, children, height = 220 }) => (
  <Card className="h-100">
    <Card.Body>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-semibold">{title}</div>
      </div>
      <div style={{ width: '100%', height }}>
        {children}
      </div>
    </Card.Body>
  </Card>
);

const LineChart = ({ series = [], labels = [] }) => {
  const width = 560;
  const height = 220;
  const pad = 18;

  const maxY = Math.max(1, ...series);

  const points = series.map((y, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, series.length - 1);
    const yy = height - pad - (y * (height - pad * 2)) / maxY;
    return [x, yy];
  });

  const d = points.length
    ? `M ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')}`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="line chart">
      <rect x="0" y="0" width={width} height={height} rx="8" fill="#ffffff" />
      {/* grid */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={width - pad}
          y1={pad + t * (height - pad * 2)}
          y2={pad + t * (height - pad * 2)}
          stroke="#eef1f5"
        />
      ))}
      {/* line */}
      <path d={d} fill="none" stroke="#0d6efd" strokeWidth="3" />
      {/* points */}
      {points.map(([x, y], idx) => (
        <circle key={idx} cx={x} cy={y} r="4" fill="#0d6efd" />
      ))}
      {/* labels */}
      {labels.slice(-6).map((lab, i) => {
        const idx = labels.length - 6 + i;
        const x = pad + (idx * (width - pad * 2)) / Math.max(1, series.length - 1);
        return (
          <text key={lab} x={x} y={height - 4} fontSize="10" textAnchor="middle" fill="#6c757d">
            {lab.slice(5)}
          </text>
        );
      })}
    </svg>
  );
};

const BarChart = ({ labels = [], values = [] }) => {
  const width = 560;
  const height = 220;
  const pad = 18;
  const maxY = Math.max(1, ...values);
  const barGap = 10;
  const barW = (width - pad * 2 - barGap * (values.length - 1)) / Math.max(1, values.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="bar chart">
      <rect x="0" y="0" width={width} height={height} rx="8" fill="#ffffff" />
      {values.map((v, i) => {
        const h = (v * (height - pad * 2 - 16)) / maxY;
        const x = pad + i * (barW + barGap);
        const y = height - pad - h - 14;
        const color = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1'][i % 5];
        return (
          <g key={labels[i] || i}>
            <rect x={x} y={y} width={barW} height={h} rx="6" fill={color} opacity="0.9" />
            <text x={x + barW / 2} y={height - pad} fontSize="10" textAnchor="middle" fill="#6c757d">
              {labels[i]}
            </text>
            <text x={x + barW / 2} y={y - 4} fontSize="10" textAnchor="middle" fill="#212529">
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart = ({ items = [] }) => {
  const width = 560;
  const height = 220;
  const cx = 140;
  const cy = 110;
  const r = 70;
  const stroke = 18;

  const total = items.reduce((a, b) => a + (b.value || 0), 0) || 1;
  let acc = 0;

  const palette = ['#0d6efd', '#20c997', '#ffc107', '#dc3545', '#6f42c1', '#0dcaf0'];

  const dash = 2 * Math.PI * r;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="donut chart">
      <rect x="0" y="0" width={width} height={height} rx="8" fill="#ffffff" />

      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1f5" strokeWidth={stroke} />

      {items.map((it, idx) => {
        const v = it.value || 0;
        const frac = v / total;
        const seg = frac * dash;
        const offset = dash * 0.25 - acc; // start at 12 o'clock
        acc += seg;
        return (
          <circle
            key={it.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={palette[idx % palette.length]}
            strokeWidth={stroke}
            strokeDasharray={`${seg} ${dash - seg}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
          />
        );
      })}

      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="18" fill="#212529" fontWeight="600">
        {total === 1 && items.every((i) => (i.value || 0) === 0) ? '0' : String(items.reduce((a, b) => a + (b.value || 0), 0))}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#6c757d">
        visits
      </text>

      {/* legend */}
      <g transform="translate(260, 34)">
        {items.map((it, idx) => (
          <g key={it.label} transform={`translate(0, ${idx * 22})`}>
            <rect x="0" y="-10" width="12" height="12" rx="3" fill={palette[idx % palette.length]} />
            <text x="18" y="0" fontSize="12" fill="#212529">{it.label}</text>
            <text x="190" y="0" fontSize="12" fill="#6c757d" textAnchor="end">{it.value || 0}</text>
          </g>
        ))}
      </g>
    </svg>
  );
};

const AnalyticsDashboard = ({
  show,
  onHide,
  appointments = [],
  labs = [],
  t = (s) => s,
}) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [department, setDepartment] = useState('All');
  const [role, setRole] = useState('All');

  const now = useMemo(() => new Date(), []);

  const rangeStart = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    return startOfDay(addDays(now, -days + 1));
  }, [now, timeRange]);

  // NOTE: Operational aggregation only (no patient.medicalRecord).
  const normalizedAppointments = useMemo(() => {
    return (appointments || [])
      .map((a) => {
        const dt = asDate(a.startAt) || asDate(`${a.date || ''} ${a.time || ''}`) || asDate(a.createdAt) || null;
        const type = a.type || a.appointmentType || a.appointmentType || 'Visit';
        // lightweight mock department mapping
        const dept = /cardio/i.test(a.specialty || '') ? 'Cardiology' : /family/i.test(a.specialty || '') ? 'Family Medicine' : 'General';
        const providerRole = a.providerRole || 'doctor';
        return { ...a, _dt: dt, _type: type, _dept: dept, _role: providerRole };
      })
      .filter((a) => a._dt && a._dt >= rangeStart && a._dt <= now)
      .filter((a) => department === 'All' || a._dept === department)
      .filter((a) => role === 'All' || a._role === role);
  }, [appointments, department, now, rangeStart, role]);

  const normalizedLabs = useMemo(() => {
    return (labs || [])
      .map((l) => {
        const dt = asDate(l.date) || asDate(l.createdAt) || null;
        const status = String(l.status || 'unknown');
        // mock department from lab name
        const dept = /lipid|a1c|cbc/i.test(l.test || '') ? 'General' : 'General';
        return { ...l, _dt: dt, _status: status, _dept: dept };
      })
      .filter((l) => l._dt && l._dt >= rangeStart && l._dt <= now)
      .filter((l) => department === 'All' || l._dept === department);
  }, [department, labs, now, rangeStart]);

  const activeEncounters = useMemo(
    () => normalizedAppointments.filter((a) => String(a.status || '').toLowerCase() !== 'completed').length,
    [normalizedAppointments]
  );

  const appointmentsPerDay = useMemo(() => {
    const byDay = new Map();
    for (const a of normalizedAppointments) {
      const key = fmtDayKey(startOfDay(a._dt));
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    // build continuous series for the date range
    const days = Math.max(1, Math.round((startOfDay(now) - startOfDay(rangeStart)) / (1000 * 60 * 60 * 24)) + 1);
    const labels = [];
    const values = [];
    for (let i = 0; i < days; i += 1) {
      const d = addDays(rangeStart, i);
      const key = fmtDayKey(d);
      labels.push(key);
      values.push(byDay.get(key) || 0);
    }

    return { labels, values };
  }, [normalizedAppointments, now, rangeStart]);

  const labsByStatus = useMemo(() => {
    const order = ['requested', 'pending_review', 'in_review', 'completed', 'cancelled', 'unknown'];
    const map = new Map();
    for (const l of normalizedLabs) {
      const key = String(l._status || 'unknown');
      map.set(key, (map.get(key) || 0) + 1);
    }
    const labels = order.filter((k) => map.has(k) || k === 'unknown');
    return {
      labels,
      values: labels.map((k) => map.get(k) || 0),
    };
  }, [normalizedLabs]);

  const visitTypes = useMemo(() => {
    const map = new Map();
    for (const a of normalizedAppointments) {
      const key = String(a._type || 'Visit');
      map.set(key, (map.get(key) || 0) + 1);
    }
    const items = [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    // keep chart stable when empty
    if (!items.length) return [{ label: 'None', value: 0 }];
    return items;
  }, [normalizedAppointments]);

  // Simple response time mock: treat each appointment as a ticket with an estimated response minutes.
  const avgResponseMinutes = useMemo(() => {
    const minutes = normalizedAppointments.map((a, idx) => {
      const base = String(a.priority || '').toLowerCase() === 'urgent' ? 8 : 18;
      return base + (idx % 7);
    });
    const a = avg(minutes);
    return a == null ? null : Math.round(a);
  }, [normalizedAppointments]);

  const waitingPatients = useMemo(() => {
    // mock waiting = scheduled appointments within the range that are not completed
    return normalizedAppointments
      .filter((a) => String(a.status || '').toLowerCase() === 'scheduled')
      .length;
  }, [normalizedAppointments]);

  const departments = useMemo(() => ['All', 'General', 'Cardiology', 'Family Medicine'], []);
  const roles = useMemo(() => ['All', 'doctor', 'nurse'], []);

  const titleSuffix = `${timeRange.toUpperCase()} · ${department} · ${role}`;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{t('Analytics')} — {titleSuffix}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3 mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('Time Range')}</Form.Label>
              <Form.Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="7d">{t('Last 7 days')}</option>
                <option value="30d">{t('Last 30 days')}</option>
                <option value="90d">{t('Last 90 days')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('Department')}</Form.Label>
              <Form.Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('Role')}</Form.Label>
              <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mb-3">
          <Col md={3}><KpiCard label={t('Active Encounters')} value={activeEncounters} tone="primary" sub={t('in progress')} /></Col>
          <Col md={3}><KpiCard label={t('Waiting Patients')} value={waitingPatients} tone="warning" sub={t('scheduled')} /></Col>
          <Col md={3}><KpiCard label={t('Labs Pending')} value={normalizedLabs.filter((l) => ['requested', 'pending_review', 'in_review'].includes(String(l._status))).length} tone="secondary" sub={t('requires review')} /></Col>
          <Col md={3}><KpiCard label={t('Avg Response Time')} value={avgResponseMinutes == null ? '—' : `${avgResponseMinutes}m`} tone="success" sub={t('mock SLA')} /></Col>
        </Row>

        <Row className="g-3">
          <Col lg={6}>
            <SvgFrame title={t('Volume Over Time')}>
              <LineChart series={appointmentsPerDay.values} labels={appointmentsPerDay.labels} />
            </SvgFrame>
          </Col>
          <Col lg={6}>
            <SvgFrame title={t('Labs by Status')}>
              <BarChart labels={labsByStatus.labels} values={labsByStatus.values} />
            </SvgFrame>
          </Col>
          <Col lg={12}>
            <SvgFrame title={t('Visit Types')}>
              <DonutChart items={visitTypes} />
            </SvgFrame>
          </Col>
        </Row>

        <div className="text-muted mt-3" style={{ fontSize: 12 }}>
          {t('Operational analytics uses appointments/labs only (no patient medical record data).')}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{t('Close')}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AnalyticsDashboard;
