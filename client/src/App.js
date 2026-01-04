import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import Navigation from './components/Navigation';
import ChatModule from './components/ChatModule';
import MedicalRecordModule from './components/MedicalRecordModule';
import LabResultModal from './components/LabResultModal';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import TelehealthWorkspace from './components/TelehealthWorkspace';
import TelehealthVisitSummary from './components/TelehealthVisitSummary';
import AdminPortal from './components/AdminPortal';
import PatientAssignmentModule from './components/PatientAssignmentModule';
import AppointmentModal from './components/AppointmentModal';
import InsuranceModal from './components/InsuranceModal';
import RefillModal from './components/RefillModal';
import ProductPicker, { PRODUCT_CATALOG } from './components/ProductPicker';
import { getClinicData, updateClinicData, getClinicConfig } from './config/dataStore';
import { createAppointment } from './utils/appointmentUtils';

const API_BASE =
  process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.REACT_APP_API_BASE || 'http://localhost:5000');

const DISPLAY_API_BASE =
  process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.REACT_APP_API_BASE || 'http://localhost:5000');

const api = (path) => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

const fetchJson = async (path, options = {}) => {
  const res = await fetch(api(path), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

const PRODUCT_KEYS = PRODUCT_CATALOG.map((p) => p.key);

const getInitialProductFromPath = () => {
  if (typeof window === 'undefined') return null;
  const slug = window.location.pathname.replace(/^\/+/, '').split('/')[0];
  return PRODUCT_KEYS.includes(slug) ? slug : null;
};

const getInitialLoginView = () => typeof window !== 'undefined' && window.location.pathname === '/login';
const getInitialSignupView = () => typeof window !== 'undefined' && window.location.pathname === '/signup';

const resolvePortalFromProduct = (product, role) => {
  if (!product && role) return role;
  if (product === 'admin') return 'admin';
  if (product === 'telemedicine') return role === 'patient' ? 'patient' : 'doctor';
  if (product === 'telehealth' || product === 'homecare') return role === 'patient' ? 'patient' : 'nurse';
  return role || null;
};

const getProductTitle = (product) => PRODUCT_CATALOG.find((p) => p.key === product)?.title || null;

const App = () => {
  const [user, setUser] = useState(null);
  const [activePortal, setActivePortal] = useState(null); // which dashboard to show after login
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState('');

  const [desiredProduct, setDesiredProduct] = useState(() => {
    const fromPath = getInitialProductFromPath();
    if (fromPath) return fromPath;
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('desiredProduct');
    } catch (err) {
      return null;
    }
  });
  const [showLogin, setShowLogin] = useState(() => getInitialLoginView() || getInitialSignupView() || Boolean(getInitialProductFromPath()));
  const [showSignup, setShowSignup] = useState(() => getInitialSignupView());

  const [clinicData, setClinicData] = useState(() => getClinicData());
  const [clinicConfig, setClinicConfig] = useState(() => getClinicConfig());

  const [showChat, setShowChat] = useState(false);
  const [chatRecipients, setChatRecipients] = useState(null);
  const [recordModal, setRecordModal] = useState(false);
  const [recordPatient, setRecordPatient] = useState(null);
  const [labModal, setLabModal] = useState(null);
  const [showAssignments, setShowAssignments] = useState(false);
  const [quickActionMessage, setQuickActionMessage] = useState('');
  const [quickActionVariant, setQuickActionVariant] = useState('info');
  const [showSettings, setShowSettings] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [telehealthSummaryPatient, setTelehealthSummaryPatient] = useState(null);
  const [showTelehealthSummary, setShowTelehealthSummary] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingUser(true);
        const data = await fetchJson('/api/auth/me');
        setUser(data.user);
        const targetProduct = desiredProduct || (data.user?.role === 'admin' ? 'admin' : null);
        if (targetProduct && targetProduct !== desiredProduct) {
          setDesiredProduct(targetProduct);
        }
        const portal = resolvePortalFromProduct(targetProduct, data.user?.role);
        setActivePortal(portal);
        setShowLogin(false);
        if (portal && targetProduct) {
          window.history.replaceState({}, '', `/${targetProduct}`);
        }
      } catch (err) {
        setUser(null);
        if (getInitialLoginView() || getInitialSignupView() || desiredProduct) {
          setShowLogin(true);
          setShowSignup(getInitialSignupView());
        }
      } finally {
        setLoadingUser(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!desiredProduct) {
      localStorage.removeItem('desiredProduct');
      return;
    }
    localStorage.setItem('desiredProduct', desiredProduct);
  }, [desiredProduct]);

  useEffect(() => {
    setQuickActionMessage('');
  }, [activePortal]);

  const refreshStore = () => {
    setClinicData(getClinicData());
    setClinicConfig(getClinicConfig());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');
    try {
      setAuthError('');
      setLoadingUser(true);
      const data = await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      const targetProduct = desiredProduct || (data.user?.role === 'admin' ? 'admin' : null);
      if (targetProduct && targetProduct !== desiredProduct) {
        setDesiredProduct(targetProduct);
      }
      const portal = resolvePortalFromProduct(targetProduct, data.user?.role);
      setActivePortal(portal);
      setShowLogin(false);
      setShowSignup(false);
      if (portal && targetProduct) {
        window.history.replaceState({}, '', `/${targetProduct}`);
      } else {
        window.history.replaceState({}, '', '/');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get('name');
    const email = form.get('email');
    const password = form.get('password');
    const role = form.get('role');
    const productChoice = form.get('product') || desiredProduct || '';
    try {
      setAuthError('');
      setLoadingUser(true);
      const data = await fetchJson('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, product: productChoice || null }),
      });
      setUser(data.user);
      const targetProduct = productChoice || desiredProduct || (data.user?.role === 'admin' ? 'admin' : null);
      if (targetProduct && targetProduct !== desiredProduct) {
        setDesiredProduct(targetProduct);
      }
      const portal = resolvePortalFromProduct(targetProduct, data.user?.role);
      setActivePortal(portal);
      setShowLogin(false);
      setShowSignup(false);
      if (portal && targetProduct) {
        window.history.replaceState({}, '', `/${targetProduct}`);
      } else {
        window.history.replaceState({}, '', '/');
      }
    } catch (err) {
      setAuthError(err.message || 'Signup failed');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // session might already be gone
    }
    setUser(null);
    setActivePortal(null);
    setShowLogin(false);
    window.history.replaceState({}, '', '/');
  };

  const handleProductSelect = (product) => {
    setDesiredProduct(product);
    setActivePortal(null);
    if (!user) {
      setShowLogin(true);
      window.history.replaceState({}, '', '/login');
      return;
    }
    const portal = resolvePortalFromProduct(product, user.role);
    setActivePortal(portal);
    window.history.replaceState({}, '', `/${product}`);
  };

  const upsertPatient = (updated) => {
    const next = updateClinicData((prev) => {
      const patients = prev.patients.map((p) => (p.id === updated.id ? updated : p));
      return { ...prev, patients };
    });
    setClinicData(next);
  };

  const addDemoAppointment = () => {
    const patient = clinicData.patients[0];
    const provider = clinicData.providers[0];
    if (!patient || !provider) return;
    const appt = createAppointment({
      patientId: patient.id,
      patientName: patient.name,
      providerId: provider.id,
      providerName: provider.name,
      dateISO: new Date().toISOString().slice(0, 10),
      time: '14:00',
    });
    const next = updateClinicData((prev) => ({
      ...prev,
      appointments: [...prev.appointments, appt],
    }));
    setClinicData(next);
  };

  const patientRecord = useMemo(() => {
    if (user?.role === 'patient') {
      return clinicData.patients.find((p) => p.id === user.patientId) || null;
    }
    if (activePortal === 'patient') {
      return clinicData.patients[0] || null;
    }
    return recordPatient;
  }, [user, clinicData.patients, recordPatient, activePortal]);

  const nurseTasks = useMemo(() => [
    { title: 'Call back regarding dizziness', patientName: 'Alex Carter', severity: 'high' },
    { title: 'Schedule follow-up for labs', patientName: 'Jamie Rivera', severity: 'medium' },
  ], []);

  const pendingLabs = useMemo(
    () => (clinicData.labs || []).filter((lab) => lab.status === 'pending_review'),
    [clinicData.labs]
  );

  const renderQuickActions = () => {
    const role = activePortal || user?.role;

    if (role === 'doctor') {
      const handleEmergency = () => {
        setQuickActionVariant('success');
        setQuickActionMessage('Emergency consultation started (UI only stub).');
      };

      const handleManagePatients = () => {
        setQuickActionMessage('');
        setShowAssignments(true);
      };

      const handleReviewLabs = () => {
        if (pendingLabs.length) {
          setQuickActionMessage('');
          setLabModal(pendingLabs[0]);
          return;
        }
        setQuickActionVariant('secondary');
        setQuickActionMessage('No pending labs to review.');
      };

      const handleScheduleAppt = () => {
    setQuickActionMessage('');
    setShowApptModal(true);
      };

      const handlePatientMessage = () => {
    setQuickActionMessage('');
    setChatRecipients((clinicData?.patients || []).map((p) => ({ ...p, role: 'patient' })));
    setShowChat(true);
      };

      return (
        <div className="d-grid gap-2">
          <Button variant="primary" onClick={handleEmergency}>Start Emergency Consultation</Button>
          <Button variant="outline-primary" onClick={handleManagePatients}>Manage Patients</Button>
          <Button variant="outline-primary" onClick={handleReviewLabs}>
            Review Pending Labs ({pendingLabs.length})
          </Button>
          <Button variant="outline-secondary" onClick={handleScheduleAppt}>Schedule Appointment</Button>
          <Button variant="light" onClick={handlePatientMessage}>Send Patient Message</Button>
        </div>
      );
    }

    if (role === 'patient') {
      const openChat = () => {
        setQuickActionMessage('');
        setChatRecipients(clinicData.providers);
        setShowChat(true);
      };

      const handleRefill = () => {
        setQuickActionMessage('');
        setRecordPatient(patientRecord);
        setShowRefillModal(true);
      };

      const handleInsurance = () => {
        setRecordPatient(patientRecord);
        setQuickActionVariant('info');
        setQuickActionMessage('');
        setShowInsuranceModal(true);
      };

      return (
        <div className="d-grid gap-2">
          <Button variant="success" onClick={() => { setQuickActionMessage(''); setShowApptModal(true); }}>Book Appointment</Button>
          <Button variant="outline-primary" onClick={openChat}>Message Provider</Button>
          <Button variant="outline-success" onClick={handleRefill}>Request Prescription Refill</Button>
          <Button variant="outline-secondary" onClick={() => { setQuickActionMessage(''); setRecordModal(true); }}>View Medical Records</Button>
          <Button variant="outline-dark" onClick={handleInsurance}>Update Insurance</Button>
        </div>
      );
    }

    return (
      <div className="d-grid gap-2">
        <Button variant="outline-primary" onClick={() => setShowChat(true)}>Open chat</Button>
        <Button variant="outline-secondary" onClick={() => setRecordModal(true)} disabled={!patientRecord}>
          Edit medical record
        </Button>
        <Button variant="outline-success" onClick={addDemoAppointment}>Add demo appointment</Button>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!user) return null;
    const role = activePortal || user.role;
    switch (role) {
      case 'patient':
        return (
          <PatientDashboard
            patient={patientRecord || clinicData.patients[0]}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            onOpenRecords={() => setRecordModal(true)}
            onOpenLab={(lab) => setLabModal(lab)}
            onOpenChat={() => setShowChat(true)}
          />
        );
      case 'doctor':
        return (
          <DoctorDashboard
            patients={clinicData.patients}
            appointments={clinicData.appointments}
            labs={clinicData.labs}
            onOpenRecords={(p) => {
              setRecordPatient(p);
              setRecordModal(true);
            }}
          />
        );
      case 'nurse':
        if (desiredProduct === 'telehealth') {
          return (
            <TelehealthWorkspace
              patients={clinicData.patients}
              appointments={clinicData.appointments}
              labs={clinicData.labs}
              triageQueue={nurseTasks}
              onOpenVisitSummary={(p) => {
                setTelehealthSummaryPatient(p);
                setShowTelehealthSummary(true);
              }}
              onOpenChat={() => setShowChat(true)}
              onOpenAssignments={() => setShowAssignments(true)}
            />
          );
        }
        return (
          <NurseDashboard
            patients={clinicData.patients}
            onOpenCarePlan={(p) => {
              setTelehealthSummaryPatient(p);
              setShowTelehealthSummary(true);
            }}
            onOpenChat={() => setShowChat(true)}
            onOpenAssignments={() => setShowAssignments(true)}
          />
        );
      case 'admin':
        return <AdminPortal />;
      default:
        return (
          <Card className="card-plain">
            <Card.Body>
              <Card.Text>Unsupported role: {user.role}</Card.Text>
            </Card.Body>
          </Card>
        );
    }
  };

  const shouldShowWorkspace = Boolean(user && activePortal);
  const shouldShowPicker = (!user && !showLogin) || (user && !activePortal);
  const shouldShowLoginForm = !user && (showLogin || !!desiredProduct);

  return (
    <div className="app-shell">
      <Navigation
        user={user}
        onLogout={handleLogout}
        isAdmin={user?.role === 'admin'}
        onOpenSettings={() => setShowSettings(true)}
        onLogin={() => { setShowSignup(false); setShowLogin(true); window.history.replaceState({}, '', '/login'); }}
        showLoginAction={!user}
      />

      {clinicConfig.banner && (
        <Alert variant="info" className="mb-0 rounded-0 text-center">
          {clinicConfig.banner}
        </Alert>
      )}

      <Container className="py-4">
        {shouldShowPicker && (
          <Row className="justify-content-center mb-4">
            <Col xl={10}>
              <ProductPicker
                onSelectProduct={handleProductSelect}
                isAdmin={user?.role === 'admin'}
                selectedProduct={desiredProduct}
              />
            </Col>
          </Row>
        )}

        {shouldShowLoginForm && (
          <Row className="justify-content-center">
            <Col md={5}>
              <Card className="card-plain">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Card.Title className="mb-0">{showSignup ? 'Create account' : 'Login'}</Card.Title>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => {
                        setDesiredProduct(null);
                        setShowLogin(false);
                        setShowSignup(false);
                        setActivePortal(null);
                        window.history.replaceState({}, '', '/');
                      }}
                    >
                      ← Back to products
                    </Button>
                  </div>
                  <hr className="mt-0" />
                  {getProductTitle(desiredProduct) && (
                    <Alert variant="light" className="border mb-3">
                      You selected {getProductTitle(desiredProduct)}. Sign in to enter its workspace.
                    </Alert>
                  )}
                  {authError && <Alert variant="danger">{authError}</Alert>}
                  {!showSignup && (
                    <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control name="email" type="email" placeholder="user@example.com" required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control name="password" type="password" placeholder="Password" required />
                      </Form.Group>
                      <div className="d-grid">
                        <Button type="submit" disabled={loadingUser}>Sign in</Button>
                      </div>
                    </Form>
                  )}

                  {showSignup && (
                    <Form onSubmit={handleSignup}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name (optional)</Form.Label>
                        <Form.Control name="name" type="text" placeholder="Your name" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control name="email" type="email" placeholder="user@example.com" required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Password (min 6)</Form.Label>
                        <Form.Control name="password" type="password" minLength={6} placeholder="Password" required />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Select name="role" defaultValue="patient" required>
                          <option value="patient">Patient</option>
                          <option value="nurse">Nurse</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin (limited to 3)</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Product (optional)</Form.Label>
                        <Form.Select name="product" defaultValue={desiredProduct || ''}>
                          <option value="">Select later</option>
                          <option value="telehealth">Telehealth</option>
                          <option value="telemedicine">Telemedicine</option>
                          <option value="homecare">HomeCare</option>
                          <option value="admin">Admin</option>
                        </Form.Select>
                      </Form.Group>
                      <div className="d-grid">
                        <Button type="submit" disabled={loadingUser}>Create account</Button>
                      </div>
                    </Form>
                  )}

                  <Alert variant="secondary" className="mt-3">
                    Choose a product first to set your destination. Sessions are cookie-based; keep the same origin when testing.
                  </Alert>

                  <div className="mt-3 text-center">
                    {!showSignup && (
                      <Button variant="link" onClick={() => { setShowSignup(true); setShowLogin(true); window.history.replaceState({}, '', '/signup'); }}>
                        Need an account? Create one
                      </Button>
                    )}
                    {showSignup && (
                      <Button variant="link" onClick={() => { setShowSignup(false); setShowLogin(true); window.history.replaceState({}, '', '/login'); }}>
                        Already have an account? Sign in
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {shouldShowWorkspace && (
          <>
            <Row className="mb-3">
              <Col>
                <Card className="card-plain">
                  <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <div className="text-uppercase small text-muted fw-semibold">Workspace</div>
                      <div className="fw-bold">{getProductTitle(desiredProduct) || 'Workspace'}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setActivePortal(null);
                          setShowLogin(false);
                          window.history.replaceState({}, '', '/');
                        }}
                      >
                        Change workspace
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {activePortal === 'nurse' ? (
              <Row>
                <Col lg={12} className="mb-3">
                  {renderDashboard()}
                </Col>
              </Row>
            ) : (
              <Row>
                <Col lg={8} className="mb-3">
                  {renderDashboard()}
                </Col>
                <Col lg={4}>
                  <Card className="card-plain">
                    <Card.Body>
                      <Card.Title>Quick actions</Card.Title>
                      {renderQuickActions()}
                      {quickActionMessage && (
                        <Alert
                          variant={quickActionVariant}
                          className="mt-3 mb-0"
                          dismissible
                          onClose={() => setQuickActionMessage('')}
                        >
                          {quickActionMessage}
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>

      {user && (
        <PatientAssignmentModule
          show={showAssignments}
          onHide={() => setShowAssignments(false)}
          currentUser={{ id: user.id, role: user.role, name: user.email || 'User' }}
          onAssignmentUpdate={refreshStore}
          onViewDetails={(p) => {
            setRecordPatient(p);
            setRecordModal(true);
          }}
          onViewRecord={(p) => {
            setRecordPatient(p);
            setRecordModal(true);
          }}
          enableRecordQuickOpen
        />
      )}

      <ChatModule
        show={showChat}
        onHide={() => { setShowChat(false); setChatRecipients(null); }}
        currentUser={user}
        recipients={chatRecipients || clinicData.providers}
      />

      <AppointmentModal
        show={showApptModal}
        onHide={() => setShowApptModal(false)}
        appointmentTypes={clinicConfig.appointmentTypes || []}
        onScheduled={(appt) => {
          if (!appt) return;
          setClinicData((prev) => ({
            ...prev,
            appointments: [...(prev.appointments || []), { ...appt, id: appt.id || appt._id || appt.createdAt }],
          }));
        }}
      />

      <MedicalRecordModule
        show={recordModal}
        onHide={() => setRecordModal(false)}
        patients={(activePortal || user?.role) === 'patient' ? [patientRecord].filter(Boolean) : clinicData.patients}
        onUpdatePatient={upsertPatient}
        readOnly={(activePortal || user?.role) === 'patient'}
      />

      <InsuranceModal
        show={showInsuranceModal}
        onHide={() => setShowInsuranceModal(false)}
        patient={recordPatient || patientRecord}
        readOnly={false}
        onSave={(patientId, insurance) => {
          const patient = (clinicData.patients || []).find((p) => p.id === patientId);
          if (!patient) return;
          const updated = {
            ...patient,
            medicalRecord: {
              ...patient.medicalRecord,
              insurance,
            },
          };
          upsertPatient(updated);
          setShowInsuranceModal(false);
          setQuickActionVariant('success');
          setQuickActionMessage('Insurance updated and saved to medical record.');
        }}
      />

      <RefillModal
        show={showRefillModal}
        onHide={() => setShowRefillModal(false)}
        medications={(recordPatient || patientRecord)?.medicalRecord?.medications || []}
        onSubmit={(payload) => {
          const med = payload?.medication || payload;
          setReceiptData({
            medication: med,
            payment: payload?.payment || {
              method: 'card',
              amount: 15,
              status: 'approved',
              transactionId: `demo_txn_${Date.now()}`,
            },
            createdAt: new Date().toISOString(),
          });
          setShowRefillModal(false);
          setShowReceipt(true);
          setQuickActionVariant('success');
          setQuickActionMessage(`Refill request submitted for ${med?.name || 'prescription'}.`);
        }}
      />

      <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Refill Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-3">
            <Alert variant="success" className="mb-0">
              Payment approved. Your refill request has been submitted.
            </Alert>
            <div className="p-3 border rounded">
              <div className="fw-semibold mb-2">Receipt</div>
              <div className="mb-1"><strong>Medication:</strong> {receiptData?.medication?.name || '—'}</div>
              <div className="mb-1"><strong>Dosage:</strong> {receiptData?.medication?.sig || '—'}</div>
              <div className="mb-1"><strong>Refills Remaining:</strong> {receiptData?.medication?.refillsRemaining ?? '—'}</div>
              <div className="mb-1"><strong>Prescribed By:</strong> {receiptData?.medication?.prescribedBy || '—'}</div>
              <div className="mb-1"><strong>Date Prescribed:</strong> {receiptData?.medication?.datePrescribed || '—'}</div>
              <div className="mb-1"><strong>Payment Method:</strong> {(receiptData?.payment?.method || 'card').toUpperCase()}</div>
              <div className="mb-1"><strong>Amount:</strong> ${receiptData?.payment?.amount || 15}</div>
              <div className="mb-1"><strong>Status:</strong> {receiptData?.payment?.status || 'approved'}</div>
              <div className="mb-1"><strong>Transaction ID:</strong> {receiptData?.payment?.transactionId || 'demo_txn'}</div>
              <div className="mb-1"><strong>Timestamp:</strong> {receiptData?.createdAt ? new Date(receiptData.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
            </div>
            <Alert variant="light" className="border mb-0">
              For questions or concerns, please contact our support team at (555) 123-0000. This checkout is simulated for demonstration purposes only.
            </Alert>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => window.print()}>Print</Button>
          <Button variant="primary" onClick={() => setShowReceipt(false)}>Return to Dashboard</Button>
        </Modal.Footer>
      </Modal>

      <LabResultModal show={!!labModal} onHide={() => setLabModal(null)} lab={labModal} />

      <TelehealthVisitSummary
        show={showTelehealthSummary}
        onHide={() => setShowTelehealthSummary(false)}
        patient={telehealthSummaryPatient}
        appointments={clinicData.appointments}
        triageQueue={nurseTasks}
      />

      {user?.role === 'admin' && (
        <Modal show={showSettings} onHide={() => setShowSettings(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Admin Tools</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <div className="fw-semibold">API</div>
              <div className="text-muted">{DISPLAY_API_BASE}</div>
            </div>
            <div className="d-grid gap-2">
              <Button variant="outline-primary" onClick={() => { refreshStore(); setShowSettings(false); }}>
                Refresh local data
              </Button>
              <Button variant="link" className="text-start ps-0" onClick={() => { setActivePortal(null); setShowSettings(false); }}>
                Change portal
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default App;
