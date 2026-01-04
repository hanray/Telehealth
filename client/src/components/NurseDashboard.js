import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, ListGroup, Modal, Row } from 'react-bootstrap';

const seedPatients = [
  {
    id: 'patient-001',
    name: 'John Doe',
    age: 45,
    address: '123 Maple St',
    window: '9:00 - 10:00 AM',
    focus: 'Post-op wound check',
    accessNotes: 'Gate code 1234; dog in yard',
    status: 'stable',
    priority: 'high',
    lastVitals: '08:00 AM',
    overdue: true,
    provider: 'Dr. Smith',
    medication: {
      name: 'Morphine 5mg',
      time: '09:00 AM',
      route: 'IV',
      instructions: 'For pain management',
      status: 'pending',
    },
  },
  {
    id: 'patient-002',
    name: 'Jane Smith',
    age: 32,
    address: '45 Pine Ave',
    window: '10:00 - 11:00 AM',
    focus: 'Diabetes monitoring, foot check',
    accessNotes: 'Apt 5B; ring buzzer',
    status: 'monitoring',
    priority: 'normal',
    lastVitals: '07:30 AM',
    overdue: true,
    provider: 'Dr. Johnson',
    medication: {
      name: 'Insulin 10 units',
      time: '08:00 AM',
      route: 'Subcutaneous',
      instructions: 'Before breakfast',
      status: 'administered',
    },
  },
  {
    id: 'patient-003',
    name: 'Bob Johnson',
    age: 67,
    address: '88 Oak Rd',
    window: '11:00 - 12:00 PM',
    focus: 'Cardiac monitoring, med adherence',
    accessNotes: 'Call daughter on arrival',
    status: 'critical',
    priority: 'urgent',
    lastVitals: '08:30 AM',
    overdue: true,
    provider: 'Dr. Brown',
    medication: {
      name: 'Lisinopril 10mg',
      time: '09:30 AM',
      route: 'Oral',
      instructions: 'With water',
      status: 'overdue',
    },
  },
  {
    id: 'patient-004',
    name: 'Emily Chen',
    age: 58,
    address: '12 Harbor Way',
    window: '1:00 - 2:00 PM',
    focus: 'CHF check, edema, weight',
    accessNotes: 'Street parking only',
    status: 'monitoring',
    priority: 'high',
    lastVitals: '08:45 AM',
    overdue: false,
    provider: 'Dr. Patel',
    medication: {
      name: 'Furosemide 40mg',
      time: '10:00 AM',
      route: 'IV',
      instructions: 'Push over 2 minutes',
      status: 'pending',
    },
  },
  {
    id: 'patient-005',
    name: 'Carlos Rivera',
    age: 51,
    address: '7 Cedar Ct',
    window: '2:00 - 3:00 PM',
    focus: 'COPD follow-up, inhaler technique',
    accessNotes: 'Back entrance; stairs',
    status: 'stable',
    priority: 'normal',
    lastVitals: '07:50 AM',
    overdue: false,
    provider: 'Dr. Lee',
    medication: {
      name: 'Prednisone 40mg',
      time: '11:00 AM',
      route: 'Oral',
      instructions: 'Give with food',
      status: 'pending',
    },
  },
  {
    id: 'patient-006',
    name: 'Lily Harper',
    age: 40,
    address: '34 Lakeview Dr',
    window: '3:00 - 4:00 PM',
    focus: 'Pneumonia recovery, O2 sat check',
    accessNotes: 'Call ahead; big dog',
    status: 'stable',
    priority: 'normal',
    lastVitals: '08:10 AM',
    overdue: false,
    provider: 'Dr. Green',
    medication: {
      name: 'Ceftriaxone 1g',
      time: '08:00 AM',
      route: 'IV',
      instructions: 'Infuse over 30 minutes',
      status: 'administered',
    },
  },
];

const NurseDashboard = ({ patients = [], onOpenCarePlan, onOpenRecords, onOpenChat, onOpenAssignments }) => {
  // Merge provided patients with seeds so the card always stays populated and realistic.
  const basePatients = useMemo(() => {
    if (!patients.length) return seedPatients;
    const byId = new Map();
    patients.forEach((p) => {
      const key = p.id || p._id || p.name;
      byId.set(key, p);
    });
    seedPatients.forEach((p) => {
      const key = p.id || p.name;
      if (!byId.has(key)) {
        byId.set(key, p);
      }
    });
    return Array.from(byId.values());
  }, [patients]);

  // Drop demo patients without data per request.
  const filteredPatients = useMemo(
    () => basePatients.filter((p) => !['Alex Carter', 'Jamie Rivera'].includes(p.name)),
    [basePatients]
  );

  // Shift report modal state
  const initialStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(12, 0, 0, 0);
    return start;
  }, []);

  const initialEnd = useMemo(() => {
    const end = new Date(initialStart);
    end.setHours(end.getHours() + 12);
    return end;
  }, [initialStart]);

  const formatInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [shiftStart, setShiftStart] = useState(formatInput(initialStart));
  const [shiftEnd, setShiftEnd] = useState(formatInput(initialEnd));
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selected, setSelected] = useState(null);
  const [showVitals, setShowVitals] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTarget, setAdminTarget] = useState(null);
  const [vitalsDraft, setVitalsDraft] = useState({
    bp: '120/80',
    hr: '72',
    temp: '98.6',
    spo2: '98',
    rr: '16',
    weight: '150',
    height: '68',
  });
  const [noteDraft, setNoteDraft] = useState('');
  const [medList, setMedList] = useState([]);
  const [handoff, setHandoff] = useState({ start: false, end: false, notes: '', endAt: null });
  const [checklist, setChecklist] = useState({
    adls: false,
    woundCare: false,
    meal: false,
    mobility: false,
  });
  const [routeStops, setRouteStops] = useState(() => (patients.length ? patients : seedPatients).slice(0, 4));
  const [outcomeModal, setOutcomeModal] = useState({ show: false, stop: null, outcome: null, note: '', reschedule: false });
  const [showEndModal, setShowEndModal] = useState(false);
  const [endSummary, setEndSummary] = useState('');
  const [ackUnresolved, setAckUnresolved] = useState(false);
  const [endError, setEndError] = useState('');
  const [visitModal, setVisitModal] = useState({ show: false, stop: null, start: '', end: '', note: '' });

  useEffect(() => {
    const mapped = filteredPatients
      .map((p) => ({
        id: p.id,
        name: p.medication?.name,
        patient: p.name,
        time: p.medication?.time,
        route: p.medication?.route,
        instructions: p.medication?.instructions,
        status: p.medication?.status,
      }))
      .filter((m) => m.name);
    setMedList(mapped);
  }, [filteredPatients]);

  const stats = useMemo(() => ({
    assigned: filteredPatients.length,
    pendingMeds: medList.filter((m) => m.status === 'pending').length,
    overdueMeds: medList.filter((m) => m.status === 'overdue').length,
    stable: filteredPatients.filter((p) => p.status === 'stable').length,
  }), [filteredPatients, medList]);

  const outstandingStops = useMemo(
    () => routeStops.filter((stop) => !stop.outcome),
    [routeStops]
  );

  const hasOutstandingMeds = useMemo(
    () => medList.some((m) => m.status === 'pending' || m.status === 'overdue'),
    [medList]
  );

  const openVitals = (p) => {
    setSelected(p);
    setShowVitals(true);
  };

  const openNotes = (p) => {
    setSelected(p);
    setShowNotes(true);
  };

  const parseInputDate = (value) => {
    const parsed = value ? new Date(value) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDisplay = (d) => d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' });

  const buildReport = () => {
    const start = parseInputDate(shiftStart);
    const end = parseInputDate(shiftEnd);
    const lines = [];
    lines.push('NURSE SHIFT REPORT');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Shift Window: ${formatDisplay(start)}  —  ${formatDisplay(end)}`);
    lines.push('Nurse: Nurse Johnson');
    lines.push('------------------------------------------------------------');
    lines.push('');
    lines.push(`PATIENTS (${filteredPatients.length})`);
    if (!filteredPatients.length) {
      lines.push('No patients assigned.');
    } else {
      filteredPatients.forEach((p) => {
        const vitalsLabel = `${p.lastVitals || 'N/A'} ${p.overdue ? '[overdue]' : '[on time]'}`;
        lines.push(
          `- ${p.name} (Rm ${p.room}) • ${p.condition} • Status: ${String(p.status || '').toUpperCase()} • Priority: ${String(p.priority || '').toUpperCase()} • Last Vitals: ${vitalsLabel}`
        );
        if (p.medication?.name) {
          lines.push(
            `  Med: ${p.medication.name} @ ${p.medication.time || 'TBD'} | ${p.medication.route || ''} | ${p.medication.instructions || ''} | ${p.medication.status || 'pending'}`
          );
        }
      });
    }
    lines.push('');
    lines.push('Tip: Use Regenerate after updating vitals, meds, or notes.');
    return lines.join('\n');
  };

  useEffect(() => {
    setReportText(buildReport());
  }, [shiftStart, shiftEnd, filteredPatients]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
    } catch (err) {
      console.warn('Clipboard unavailable', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shift-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;
    win.document.write(`<pre>${reportText.replace(/</g, '&lt;')}</pre>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const quickActions = (
    <div className="d-grid gap-2">
      <Button variant="success">Emergency Call</Button>
      <Button variant="success" onClick={onOpenChat}>Escalate concern</Button>
      <Button variant="success" onClick={onOpenAssignments}>Manage Patients</Button>
      <Button variant="outline-secondary" onClick={() => setShowShiftReport(true)}>Shift Report</Button>
    </div>
  );

  const openAdminModal = (med) => {
    setAdminTarget(med);
    setShowAdminModal(true);
  };

  const openCompleteModal = (stop) => {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setMinutes(now.getMinutes() - 30);
    setVisitModal({
      show: true,
      stop,
      start: formatInput(defaultStart),
      end: formatInput(now),
      note: '',
    });
  };

  const confirmAdministration = () => {
    if (!adminTarget) return;
    setMedList((prev) =>
      prev.map((m) =>
        m.patient === adminTarget.patient && m.name === adminTarget.name
          ? { ...m, status: 'administered' }
          : m
      )
    );
    setShowAdminModal(false);
    setAdminTarget(null);
  };

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <Card.Title className="mb-0">HomeCare Shiftboard</Card.Title>
              <Card.Subtitle className="text-muted">Unit of work: Shift / Route / Home visit tasks</Card.Subtitle>
            </div>
          </div>
          <Card.Text>Work through tasks, document notes, and escalate to providers.</Card.Text>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Row className="gy-3">
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">Shift start / handoff</div>
                <Badge bg={handoff.end ? 'secondary' : handoff.start ? 'success' : 'secondary'}>
                  {handoff.end ? 'Ended' : handoff.start ? 'Started' : 'Not started'}
                </Badge>
              </div>
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant={handoff.start ? 'outline-secondary' : 'primary'}
                  disabled={handoff.start || handoff.end}
                  onClick={() => setHandoff((prev) => ({ ...prev, start: true }))}
                >
                  Mark shift start
                </Button>
                <Button
                  size="sm"
                  variant={handoff.end ? 'outline-secondary' : 'primary'}
                  disabled={!handoff.start || handoff.end}
                  onClick={() => setShowEndModal(true)}
                >
                  Mark handoff / end
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <div className="fw-semibold mb-2">Route / today's homes</div>
              <ListGroup variant="flush" className="small">
                {routeStops.map((p) => (
                  <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{p.name} - {p.room || 'Home visit'}</div>
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!!p.outcome || handoff.end}
                          onClick={() => openCompleteModal(p)}
                        >
                          Complete visit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          disabled={!!p.outcome || handoff.end}
                          onClick={() => setOutcomeModal({ show: true, stop: p, outcome: 'client_not_home', note: '', reschedule: false })}
                        >
                          Client not home
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          disabled={!!p.outcome || handoff.end}
                          onClick={() => setOutcomeModal({ show: true, stop: p, outcome: 'unable_to_complete', note: '', reschedule: false })}
                        >
                          Unable to complete
                        </Button>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <Badge bg={p.outcome ? 'secondary' : 'light'} text={p.outcome ? undefined : 'dark'}>
                        {p.outcome ? 'Outcome recorded' : 'Scheduled'}
                      </Badge>
                      {p.outcomeAt && (
                        <span className="text-muted" style={{ fontSize: 11 }}>
                          {new Date(p.outcomeAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <div className="d-flex gap-2 mt-2 small">
                <Badge bg="light" text="dark">Select an outcome per visit</Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-plain">
        <Card.Body>
          <Row>
            <Col sm={6} md={3} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Assigned Patients</div>
                  <div style={{ fontSize: 26 }}>{stats.assigned}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={3} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Pending Medications</div>
                  <div style={{ fontSize: 26 }}>{stats.pendingMeds}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={3} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Overdue Medications</div>
                  <div style={{ fontSize: 26 }}>{stats.overdueMeds}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} md={3} className="mb-2">
              <Card className="text-center">
                <Card.Body>
                  <div className="fw-semibold">Stable Patients</div>
                  <div style={{ fontSize: 26 }}>{stats.stable}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col lg={8} className="d-flex flex-column gap-3">
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>My Clients</Card.Title>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Client</th>
                      <th>Address / window</th>
                      <th>Focus</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Last Vitals</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="fw-semibold">{p.name}</div>
                          {p.age && <div className="text-muted" style={{ fontSize: 12 }}>Age: {p.age}</div>}
                          <div className="text-muted" style={{ fontSize: 12 }}>Dr: {p.provider}</div>
                        </td>
                        <td>
                          <div>{p.address || 'Address pending'}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{p.window || 'Visit window TBD'}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{p.accessNotes || ''}</div>
                        </td>
                        <td>{p.focus || 'Care plan task'}</td>
                        <td>
                          <Badge bg={p.status === 'stable' ? 'success' : p.status === 'critical' ? 'danger' : 'warning'}>{p.status}</Badge>
                        </td>
                        <td>
                          <Badge bg={p.priority === 'urgent' || p.priority === 'high' ? 'danger' : 'secondary'}>{p.priority}</Badge>
                        </td>
                        <td>
                          <div>{p.lastVitals}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>{p.overdue ? 'Overdue' : 'On time'}</div>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => {
                                if (onOpenCarePlan) onOpenCarePlan(p);
                                else if (onOpenRecords) onOpenRecords(p);
                              }}
                            >
                              Care Plan
                            </Button>
                            <Button size="sm" variant="success" onClick={() => openVitals(p)}>Vitals</Button>
                            <Button size="sm" variant="outline-success" onClick={() => openNotes(p)}>Notes</Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => openAdminModal(p.medication)}>Administer</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!basePatients.length && (
                      <tr>
                        <td colSpan={7} className="text-muted text-center">No patients assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="d-flex flex-column gap-3">
          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Quick actions</Card.Title>
              {quickActions}
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Visit checklist</Card.Title>
              <ListGroup variant="flush">
                {[{ key: 'adls', label: 'ADLs / personal care' }, { key: 'woundCare', label: 'Wound care' }, { key: 'meal', label: 'Meal / nutrition' }, { key: 'mobility', label: 'Mobility / transfers' }].map((item) => (
                  <ListGroup.Item key={item.key} className="d-flex justify-content-between align-items-center">
                    <span>{item.label}</span>
                    <Form.Check
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      label=""
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          <Card className="card-plain">
            <Card.Body>
              <Card.Title>Medication Schedule</Card.Title>
              <ListGroup variant="flush">
                {medList.map((m, idx) => (
                  <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="fw-semibold">{m.name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{m.time} | {m.route}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{m.instructions}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>For {m.patient}</div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-2">
                      <Badge bg={m.status === 'pending' ? 'warning' : m.status === 'overdue' ? 'danger' : 'success'} text={m.status === 'pending' ? 'dark' : undefined}>
                        {m.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant={m.status === 'administered' ? 'outline-secondary' : 'outline-primary'}
                        onClick={() => openAdminModal(m)}
                        disabled={m.status === 'administered'}
                      >
                        Administer
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
                {!medList.length && <ListGroup.Item className="text-muted">No scheduled medications.</ListGroup.Item>}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showShiftReport} onHide={() => setShowShiftReport(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Shift Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6} className="mb-2">
              <Form.Label>Shift Start</Form.Label>
              <Form.Control
                type="datetime-local"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
              />
            </Col>
            <Col md={6} className="mb-2">
              <Form.Label>Shift End</Form.Label>
              <Form.Control
                type="datetime-local"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
              />
            </Col>
          </Row>

          <div className="d-flex flex-wrap gap-2 mb-3">
            <Button variant="primary" onClick={() => setReportText(buildReport())}>Regenerate</Button>
            <Button variant="outline-primary" onClick={handleCopy}>Copy</Button>
            <Button variant="success" onClick={handleDownload}>Download (.txt)</Button>
            <Button variant="outline-secondary" onClick={handlePrint}>Print</Button>
          </div>

          <div className="p-3 bg-light border rounded" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{reportText}</pre>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShiftReport(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAdminModal && !!adminTarget} onHide={() => setShowAdminModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Administer Medication</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <div className="fw-semibold">Patient:</div>
            <div>{adminTarget?.patient}</div>
          </div>
          <div className="mb-3">
            <div className="fw-semibold">Medication:</div>
            <div>{adminTarget?.name}</div>
          </div>
          <div className="mb-3">
            <div className="fw-semibold">Route:</div>
            <div>{adminTarget?.route}</div>
          </div>
          <div className="mb-3">
            <div className="fw-semibold">Time:</div>
            <div>{adminTarget?.time}</div>
          </div>
          <div className="mb-3">
            <div className="fw-semibold">Instructions:</div>
            <div>{adminTarget?.instructions}</div>
          </div>
          <div className="alert alert-warning mb-0">
            Please confirm that you are administering the correct medication to the correct patient.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdminModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmAdministration}>Confirm Administration</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showVitals && !!selected} onHide={() => setShowVitals(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Record Vitals - {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6} className="mb-3">
              <Form.Label>Blood Pressure (mmHg)</Form.Label>
              <Form.Control value={vitalsDraft.bp} onChange={(e) => setVitalsDraft({ ...vitalsDraft, bp: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Heart Rate (bpm)</Form.Label>
              <Form.Control value={vitalsDraft.hr} onChange={(e) => setVitalsDraft({ ...vitalsDraft, hr: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Temperature (°F)</Form.Label>
              <Form.Control value={vitalsDraft.temp} onChange={(e) => setVitalsDraft({ ...vitalsDraft, temp: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Oxygen Saturation (%)</Form.Label>
              <Form.Control value={vitalsDraft.spo2} onChange={(e) => setVitalsDraft({ ...vitalsDraft, spo2: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Respiratory Rate</Form.Label>
              <Form.Control value={vitalsDraft.rr} onChange={(e) => setVitalsDraft({ ...vitalsDraft, rr: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Weight (lbs)</Form.Label>
              <Form.Control value={vitalsDraft.weight} onChange={(e) => setVitalsDraft({ ...vitalsDraft, weight: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Height (in)</Form.Label>
              <Form.Control value={vitalsDraft.height} onChange={(e) => setVitalsDraft({ ...vitalsDraft, height: e.target.value })} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVitals(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setShowVitals(false)}>Save Vitals</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showNotes && !!selected} onHide={() => setShowNotes(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Visit Notes - {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Document visit notes"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotes(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setShowNotes(false)}>Save Notes</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={outcomeModal.show} onHide={() => setOutcomeModal((prev) => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton>
          <Modal.Title>Mark visit outcome</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-3">
            <div>
              <div className="text-muted text-uppercase small fw-semibold">Visit</div>
              <div className="fw-bold">{outcomeModal.stop?.name}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>{outcomeModal.stop?.address || 'Home visit'}</div>
            </div>
            <div>
              <div className="fw-semibold mb-1">Outcome</div>
              <Badge bg="secondary" className="text-uppercase">{outcomeModal.outcome === 'client_not_home' ? 'Client not home' : 'Unable to complete'}</Badge>
            </div>
            <Form.Group>
              <Form.Label>Reason / note</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={outcomeModal.note}
                onChange={(e) => setOutcomeModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Add a brief note for audit and reschedule"
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Flag for reschedule / escalation"
              checked={outcomeModal.reschedule}
              onChange={(e) => setOutcomeModal((prev) => ({ ...prev, reschedule: e.target.checked }))}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setOutcomeModal((prev) => ({ ...prev, show: false }))}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!outcomeModal.note.trim()}
            onClick={() => {
              const now = new Date().toISOString();
              setRouteStops((prev) => prev.map((stop) => (
                stop.id === outcomeModal.stop?.id
                  ? {
                      ...stop,
                      outcome: outcomeModal.outcome,
                      outcomeNote: outcomeModal.note.trim(),
                      reschedule: outcomeModal.reschedule,
                      outcomeAt: now,
                    }
                  : stop
              )));
              setOutcomeModal({ show: false, stop: null, outcome: null, note: '', reschedule: false });
            }}
          >
            Save outcome
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEndModal} onHide={() => setShowEndModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm handoff / end shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-3">
            {(outstandingStops.length > 0 || hasOutstandingMeds) && (
              <Alert variant="warning" className="mb-0">
                Outstanding items:
                <ul className="mb-0">
                  {outstandingStops.length > 0 && <li>{outstandingStops.length} visit(s) without outcome.</li>}
                  {hasOutstandingMeds && <li>Pending or overdue medications.</li>}
                </ul>
              </Alert>
            )}
            <Form.Group>
              <Form.Label>Shift summary / handoff notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={endSummary}
                onChange={(e) => setEndSummary(e.target.value)}
                placeholder="Summarize the shift or note unresolved items"
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="I acknowledge outstanding items and will follow escalation protocols."
              checked={ackUnresolved}
              onChange={(e) => setAckUnresolved(e.target.checked)}
            />
            {endError && (
              <Alert variant="danger" className="mb-0">{endError}</Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => { setShowEndModal(false); setEndError(''); }}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (outstandingStops.length > 0) {
                setEndError('Complete all visits before ending the shift.');
                return;
              }
              if (hasOutstandingMeds && !endSummary.trim() && !ackUnresolved) {
                setEndError('Add a summary or acknowledge outstanding medications before ending the shift.');
                return;
              }
              setEndError('');
              setHandoff((prev) => ({ ...prev, end: true, endAt: new Date().toISOString(), notes: endSummary.trim() }));
              setShowEndModal(false);
            }}
          >
            End shift
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={visitModal.show} onHide={() => setVisitModal({ show: false, stop: null, start: '', end: '', note: '' })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {visitModal.stop?.name || 'Patient'} visit {new Date().toLocaleString()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6} className="mb-2">
              <Form.Label>Visit start</Form.Label>
              <Form.Control
                type="datetime-local"
                value={visitModal.start}
                onChange={(e) => setVisitModal((prev) => ({ ...prev, start: e.target.value }))}
              />
            </Col>
            <Col md={6} className="mb-2">
              <Form.Label>Visit end</Form.Label>
              <Form.Control
                type="datetime-local"
                value={visitModal.end}
                onChange={(e) => setVisitModal((prev) => ({ ...prev, end: e.target.value }))}
              />
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Visit notes (required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={visitModal.note}
              onChange={(e) => setVisitModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Summarize the visit, patient status, and next steps"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setVisitModal({ show: false, stop: null, start: '', end: '', note: '' })}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!visitModal.note.trim() || !visitModal.start || !visitModal.end}
            onClick={() => {
              const now = new Date().toISOString();
              setRouteStops((prev) => prev.map((stop) => (
                stop.id === visitModal.stop?.id
                  ? {
                      ...stop,
                      outcome: 'completed',
                      outcomeNote: visitModal.note.trim(),
                      visitStart: visitModal.start,
                      visitEnd: visitModal.end,
                      outcomeAt: visitModal.end || now,
                    }
                  : stop
              )));
              setVisitModal({ show: false, stop: null, start: '', end: '', note: '' });
            }}
          >
            Save and mark complete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={visitModal.show} onHide={() => setVisitModal({ show: false, stop: null, start: '', end: '', note: '' })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {visitModal.stop?.name || 'Patient'} visit {new Date().toLocaleString()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6} className="mb-2">
              <Form.Label>Visit start</Form.Label>
              <Form.Control
                type="datetime-local"
                value={visitModal.start}
                onChange={(e) => setVisitModal((prev) => ({ ...prev, start: e.target.value }))}
              />
            </Col>
            <Col md={6} className="mb-2">
              <Form.Label>Visit end</Form.Label>
              <Form.Control
                type="datetime-local"
                value={visitModal.end}
                onChange={(e) => setVisitModal((prev) => ({ ...prev, end: e.target.value }))}
              />
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Visit notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={visitModal.note}
              onChange={(e) => setVisitModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Summarize the visit, patient status, and next steps"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setVisitModal({ show: false, stop: null, start: '', end: '', note: '' })}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              const now = new Date().toISOString();
              setRouteStops((prev) => prev.map((stop) => (
                stop.id === visitModal.stop?.id
                  ? {
                      ...stop,
                      outcome: 'completed',
                      outcomeNote: visitModal.note.trim(),
                      visitStart: visitModal.start,
                      visitEnd: visitModal.end,
                      outcomeAt: visitModal.end || now,
                    }
                  : stop
              )));
              setVisitModal({ show: false, stop: null, start: '', end: '', note: '' });
            }}
          >
            Save and mark complete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showVitals && !!selected} onHide={() => setShowVitals(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Record Vitals - {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={6} className="mb-3">
              <Form.Label>Blood Pressure (mmHg)</Form.Label>
              <Form.Control value={vitalsDraft.bp} onChange={(e) => setVitalsDraft({ ...vitalsDraft, bp: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Heart Rate (bpm)</Form.Label>
              <Form.Control value={vitalsDraft.hr} onChange={(e) => setVitalsDraft({ ...vitalsDraft, hr: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Temperature (°F)</Form.Label>
              <Form.Control value={vitalsDraft.temp} onChange={(e) => setVitalsDraft({ ...vitalsDraft, temp: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Oxygen Saturation (%)</Form.Label>
              <Form.Control value={vitalsDraft.spo2} onChange={(e) => setVitalsDraft({ ...vitalsDraft, spo2: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Respiratory Rate</Form.Label>
              <Form.Control value={vitalsDraft.rr} onChange={(e) => setVitalsDraft({ ...vitalsDraft, rr: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Weight (lbs)</Form.Label>
              <Form.Control value={vitalsDraft.weight} onChange={(e) => setVitalsDraft({ ...vitalsDraft, weight: e.target.value })} />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Height (in)</Form.Label>
              <Form.Control value={vitalsDraft.height} onChange={(e) => setVitalsDraft({ ...vitalsDraft, height: e.target.value })} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVitals(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setShowVitals(false)}>Save Vitals</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showNotes && !!selected} onHide={() => setShowNotes(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notes - {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Clinical Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Document assessments, interventions, and escalations"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotes(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowNotes(false); setNoteDraft(''); }}>Save Note</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NurseDashboard;
