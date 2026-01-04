import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Button,
  Table,
  Form,
  Badge,
  Alert,
  Row,
  Col,
  InputGroup,
  Card,
  Tab,
  Tabs,
  ProgressBar,
  Accordion,
} from 'react-bootstrap';

// Patient triage, assignment, and coordination workspace (UI-only)
const PatientAssignmentModule = ({
  show,
  onHide,
  currentUser,
  onAssignmentUpdate,
  onViewDetails,
  onViewRecord,
  enableRecordQuickOpen = false,
}) => {
  const [activeTab, setActiveTab] = useState('unassigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');

  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [allAssignedPatients, setAllAssignedPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);

  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [patientToReassign, setPatientToReassign] = useState(null);
  const [reassignStaffId, setReassignStaffId] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('info');

  const [coordTasks, setCoordTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    patientId: '',
    title: '',
    ownerId: '',
    due: '',
    priority: 'normal',
    type: 'other',
    notes: '',
  });
  const [consultForm, setConsultForm] = useState({
    patientId: '',
    toDept: 'cardiology',
    urgency: 'routine',
    reason: '',
  });
  const [commNote, setCommNote] = useState('');
  const [commLog, setCommLog] = useState([]);

  const [intakeData, setIntakeData] = useState({
    name: '',
    dob: '',
    sex: 'M',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    insurance: '',
    policyNumber: '',
    chiefComplaint: '',
    symptoms: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      painLevel: '',
    },
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    triageLevel: '3',
    department: 'emergency',
    notes: '',
  });

  useEffect(() => {
    loadMockData();
    loadAvailableStaff();
  }, []);

  useEffect(() => {
    if (coordTasks.length === 0 && (myPatients.length > 0 || unassignedPatients.length > 0)) {
      const anyPatient = myPatients[0] || unassignedPatients[0];
      if (anyPatient) {
        const nurse = availableStaff.find((s) => s.id === currentUser?.id) || availableStaff[0];
        setCoordTasks([
          {
            id: 'T' + Date.now(),
            patientId: anyPatient.id,
            patientName: anyPatient.name,
            title: 'Request PT assessment',
            ownerId: nurse?.id || '',
            ownerName: nurse?.name || 'Unassigned',
            due: '',
            priority: 'normal',
            type: 'followup',
            status: 'todo',
            notes: 'PT/OT for mobility eval',
          },
        ]);
      }
    }
  }, [myPatients, unassignedPatients, availableStaff, coordTasks.length, currentUser?.id]);

  const loadMockData = () => {
    const mockUnassigned = [
      {
        id: 'P2024001',
        name: 'Emmanuel Kwame',
        age: 34,
        sex: 'M',
        arrivalTime: '2025-01-14 08:30',
        chiefComplaint: 'Severe chest pain',
        triageLevel: 1,
        department: 'emergency',
        waitTime: '15 mins',
        vitalSigns: {
          bloodPressure: '160/95',
          heartRate: 110,
          temperature: 98.6,
          oxygenSaturation: 94,
        },
        insurance: 'NHIS',
        notes: 'History of hypertension',
      },
      {
        id: 'P2024002',
        name: 'Abena Osei',
        age: 28,
        sex: 'F',
        arrivalTime: '2025-01-14 09:00',
        chiefComplaint: 'Pregnancy complications',
        triageLevel: 2,
        department: 'obstetrics',
        waitTime: '45 mins',
        vitalSigns: {
          bloodPressure: '140/85',
          heartRate: 88,
          temperature: 99.1,
          oxygenSaturation: 98,
        },
        insurance: 'Private - MaxLife',
        notes: '32 weeks pregnant, experiencing contractions',
      },
      {
        id: 'P2024003',
        name: 'Kofi Mensah',
        age: 67,
        sex: 'M',
        arrivalTime: '2025-01-14 09:15',
        chiefComplaint: 'Difficulty breathing',
        triageLevel: 2,
        department: 'emergency',
        waitTime: '30 mins',
        vitalSigns: {
          bloodPressure: '145/90',
          heartRate: 95,
          temperature: 100.2,
          oxygenSaturation: 89,
        },
        insurance: 'NHIS',
        notes: 'COPD patient, uses inhaler',
      },
      {
        id: 'P2024004',
        name: 'Ama Darko',
        age: 5,
        sex: 'F',
        arrivalTime: '2025-01-14 09:30',
        chiefComplaint: 'High fever and rash',
        triageLevel: 2,
        department: 'pediatrics',
        waitTime: '20 mins',
        vitalSigns: {
          bloodPressure: '90/60',
          heartRate: 120,
          temperature: 103.5,
          oxygenSaturation: 97,
        },
        insurance: 'Parents - Corporate',
        notes: 'Possible measles, not vaccinated',
      },
      {
        id: 'P2024005',
        name: 'Yaw Adu',
        age: 45,
        sex: 'M',
        arrivalTime: '2025-01-14 10:00',
        chiefComplaint: 'Severe abdominal pain',
        triageLevel: 3,
        department: 'emergency',
        waitTime: '1 hr',
        vitalSigns: {
          bloodPressure: '130/80',
          heartRate: 82,
          temperature: 99.8,
          oxygenSaturation: 98,
        },
        insurance: 'NHIS',
        notes: 'Pain started after eating',
      },
      {
        id: 'P2024006',
        name: 'Adjoa Amponsah',
        age: 22,
        sex: 'F',
        arrivalTime: '2025-01-14 10:15',
        chiefComplaint: 'Sprained ankle',
        triageLevel: 4,
        department: 'orthopedics',
        waitTime: '1.5 hrs',
        vitalSigns: {
          bloodPressure: '120/75',
          heartRate: 72,
          temperature: 98.6,
          oxygenSaturation: 99,
        },
        insurance: 'Student Insurance',
        notes: 'Sports injury during football',
      },
    ];

    const nursePanel = [
      {
        id: 'P2024010',
        name: 'John Doe',
        age: 45,
        sex: 'M',
        room: 'A101',
        condition: 'Post-Op Recovery',
        assignedTime: '2025-01-14 07:00',
        triageLevel: 3,
        department: 'surgery',
        doctor: 'Dr. Smith',
        nextMedTime: '12:00 PM',
        lastVitalsCheck: '08:00 AM',
      },
      {
        id: 'P2024011',
        name: 'Jane Smith',
        age: 32,
        sex: 'F',
        room: 'B205',
        condition: 'Diabetes Management',
        assignedTime: '2025-01-14 07:00',
        triageLevel: 3,
        department: 'internal',
        doctor: 'Dr. Johnson',
        nextMedTime: '01:00 PM',
        lastVitalsCheck: '09:30 AM',
      },
    ];

    const doctorPanel = [
      {
        id: 'P2024012',
        name: 'Samuel Boateng',
        age: 58,
        sex: 'M',
        room: 'C310',
        condition: 'Hypertension follow-up',
        assignedTime: '2025-01-14 08:30',
        triageLevel: 3,
        department: 'internal',
        doctor: 'Dr. Johnson',
        nextMedTime: '—',
        lastVitalsCheck: '07:45 AM',
      },
      {
        id: 'P2024013',
        name: 'Linda Mensimah',
        age: 41,
        sex: 'F',
        room: 'S215',
        condition: 'Post-op check (lap chole)',
        assignedTime: '2025-01-14 09:00',
        triageLevel: 2,
        department: 'surgery',
        doctor: 'Dr. Smith',
        nextMedTime: '—',
        lastVitalsCheck: '09:10 AM',
      },
    ];

    const mockMyPatients = currentUser?.role === 'nurse'
      ? nursePanel
      : currentUser?.role === 'doctor'
        ? doctorPanel
        : nursePanel; // default seed so tab is not empty in demos

    const mockAllAssigned = [
      {
        id: 'P2024020',
        name: 'Robert Chen',
        age: 55,
        sex: 'M',
        room: 'ICU-01',
        assignedTo: 'Nurse Williams',
        assignedToId: 'N002',
        doctor: 'Dr. Brown',
        condition: 'Critical - Cardiac',
        triageLevel: 1,
        department: 'icu',
      },
      {
        id: 'P2024021',
        name: 'Maria Garcia',
        age: 38,
        sex: 'F',
        room: 'MAT-03',
        assignedTo: 'Nurse Davis',
        assignedToId: 'N003',
        doctor: 'Dr. Wilson',
        condition: 'Labor - Active',
        triageLevel: 2,
        department: 'obstetrics',
      },
    ];

    setUnassignedPatients(mockUnassigned);
    setMyPatients(mockMyPatients);
    setAllAssignedPatients(mockAllAssigned);
  };

  const loadAvailableStaff = () => {
    const mockStaff = [
      {
        id: 'N001',
        name: 'Nurse Johnson',
        role: 'nurse',
        department: 'emergency',
        currentLoad: 3,
        maxLoad: 6,
        shift: 'Day (7AM-7PM)',
        specializations: ['Emergency', 'Trauma'],
      },
      {
        id: 'N002',
        name: 'Nurse Williams',
        role: 'nurse',
        department: 'icu',
        currentLoad: 2,
        maxLoad: 3,
        shift: 'Day (7AM-7PM)',
        specializations: ['ICU', 'Cardiac'],
      },
      {
        id: 'N003',
        name: 'Nurse Davis',
        role: 'nurse',
        department: 'obstetrics',
        currentLoad: 4,
        maxLoad: 5,
        shift: 'Day (7AM-7PM)',
        specializations: ['Maternity', 'Neonatal'],
      },
      {
        id: 'D001',
        name: 'Dr. Smith',
        role: 'doctor',
        department: 'surgery',
        currentLoad: 8,
        maxLoad: 12,
        shift: 'Day',
        specializations: ['General Surgery'],
      },
      {
        id: 'D002',
        name: 'Dr. Johnson',
        role: 'doctor',
        department: 'internal',
        currentLoad: 10,
        maxLoad: 15,
        shift: 'Day',
        specializations: ['Internal Medicine', 'Endocrinology'],
      },
    ];
    setAvailableStaff(mockStaff);
  };

  const staffNameById = (id) => availableStaff.find((s) => s.id === id)?.name || 'Unassigned';

  const allPatientOptions = () => {
    const map = new Map();
    [...unassignedPatients, ...myPatients, ...allAssignedPatients].forEach((p) => {
      if (p && p.id) map.set(p.id, { id: p.id, name: p.name });
    });
    return Array.from(map.values());
  };

  const patientNameById = (id) => allPatientOptions().find((p) => p.id === id)?.name || 'Unknown';

  const getTriageBadge = (level) => {
    const config = {
      1: { bg: 'danger', text: 'Critical' },
      2: { bg: 'warning', text: 'Urgent' },
      3: { bg: 'info', text: 'Less Urgent' },
      4: { bg: 'success', text: 'Non-Urgent' },
      5: { bg: 'secondary', text: 'Minor' },
    };
    const { bg, text } = config[level] || config[3];
    return <Badge bg={bg}>{text}</Badge>;
  };

  const getDepartmentBadge = (dept) => {
    const config = {
      emergency: 'danger',
      icu: 'dark',
      surgery: 'primary',
      internal: 'info',
      pediatrics: 'warning',
      obstetrics: 'success',
      orthopedics: 'secondary',
    };
    return <Badge bg={config[dept] || 'secondary'}>{dept.toUpperCase()}</Badge>;
  };

  const togglePatientSelection = (patientId) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId) ? prev.filter((id) => id !== patientId) : [...prev, patientId]
    );
  };

  const handleAssignPatients = () => {
    if (!selectedStaffId || selectedPatients.length === 0) {
      setAlertMessage('Please select both staff member and patients');
      setAlertVariant('warning');
      return;
    }

    const staff = availableStaff.find((s) => s.id === selectedStaffId);
    if (staff && staff.currentLoad + selectedPatients.length > staff.maxLoad) {
      setAlertMessage(`${staff.name} cannot take ${selectedPatients.length} more patients (max: ${staff.maxLoad})`);
      setAlertVariant('danger');
      return;
    }

    const assignedPts = unassignedPatients.filter((p) => selectedPatients.includes(p.id));
    setUnassignedPatients((prev) => prev.filter((p) => !selectedPatients.includes(p.id)));

    if (selectedStaffId === currentUser?.id) {
      setMyPatients((prev) => [
        ...prev,
        ...assignedPts.map((p) => ({
          ...p,
          assignedTime: new Date().toLocaleString(),
          room: `${p.department.charAt(0).toUpperCase()}${Math.floor(Math.random() * 300) + 100}`,
        })),
      ]);
    }

    setSelectedPatients([]);
    setSelectedStaffId('');
    setAlertMessage(`Successfully assigned ${assignedPts.length} patient(s) to ${staff?.name || 'staff'}`);
    setAlertVariant('success');

    onAssignmentUpdate?.();
  };

  const handleIntakeSubmit = () => {
    const newPatient = {
      id: `P${Date.now()}`,
      name: intakeData.name,
      age: calculateAge(intakeData.dob),
      sex: intakeData.sex,
      arrivalTime: new Date().toLocaleString(),
      chiefComplaint: intakeData.chiefComplaint,
      triageLevel: parseInt(intakeData.triageLevel, 10),
      department: intakeData.department,
      waitTime: '0 mins',
      vitalSigns: intakeData.vitalSigns,
      insurance: intakeData.insurance,
      notes: intakeData.notes,
      allergies: intakeData.allergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };

    setUnassignedPatients((prev) => [...prev, newPatient]);
    setShowIntakeForm(false);
    resetIntakeForm();
    setAlertMessage('Patient intake completed successfully');
    setAlertVariant('success');
  };

  const calculateAge = (dob) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const resetIntakeForm = () => {
    setIntakeData({
      name: '',
      dob: '',
      sex: 'M',
      phone: '',
      email: '',
      emergencyContact: '',
      emergencyPhone: '',
      address: '',
      insurance: '',
      policyNumber: '',
      chiefComplaint: '',
      symptoms: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        painLevel: '',
      },
      medicalHistory: '',
      currentMedications: '',
      allergies: '',
      triageLevel: '3',
      department: 'emergency',
      notes: '',
    });
  };

  const filterPatients = (patients) =>
    patients.filter((p) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (p.name || '').toLowerCase().includes(search) || (p.id || '').toLowerCase().includes(search);
      const matchesDept = selectedDepartment === 'all' || p.department === selectedDepartment;
      const matchesUrgency =
        selectedUrgency === 'all' ||
        (selectedUrgency === 'critical' && p.triageLevel <= 2) ||
        (selectedUrgency === 'normal' && p.triageLevel > 2);
      return matchesSearch && matchesDept && matchesUrgency;
    });

  const getWorkloadBar = (current, max) => {
    const percentage = (current / max) * 100;
    const variant = percentage > 80 ? 'danger' : percentage > 60 ? 'warning' : 'success';
    return (
      <ProgressBar
        now={percentage}
        variant={variant}
        label={`${current}/${max}`}
        style={{ height: '20px' }}
      />
    );
  };

  const priorityBadge = (p) => {
    const map = { urgent: 'danger', high: 'warning', normal: 'secondary', low: 'light' };
    return <Badge bg={map[p] || 'secondary'}>{(p || 'normal').toUpperCase()}</Badge>;
  };

  const statusBadge = (s) => {
    const map = { todo: 'secondary', doing: 'info', done: 'success' };
    return <Badge bg={map[s] || 'secondary'}>{(s || 'todo').toUpperCase()}</Badge>;
  };

  const addCoordinationTask = () => {
    if (!newTask.patientId || !newTask.title) {
      setAlertMessage('Please select a patient and enter a task title.');
      setAlertVariant('warning');
      return;
    }
    const ownerId = newTask.ownerId || currentUser?.id || '';
    const task = {
      id: 'T' + Date.now(),
      patientId: newTask.patientId,
      patientName: patientNameById(newTask.patientId),
      title: newTask.title.trim(),
      ownerId,
      ownerName: staffNameById(ownerId),
      due: newTask.due,
      priority: newTask.priority || 'normal',
      type: newTask.type || 'other',
      status: 'todo',
      notes: newTask.notes || '',
    };
    setCoordTasks((prev) => [task, ...prev]);
    setNewTask({ patientId: '', title: '', ownerId: '', due: '', priority: 'normal', type: 'other', notes: '' });
  };

  const requestConsult = () => {
    if (!consultForm.patientId || !consultForm.reason.trim()) {
      setAlertMessage('Select a patient and enter a brief reason for the consult.');
      setAlertVariant('warning');
      return;
    }
    const task = {
      id: 'T' + (Date.now() + 1),
      patientId: consultForm.patientId,
      patientName: patientNameById(consultForm.patientId),
      title: `Consult: ${consultForm.toDept}`,
      ownerId: '',
      ownerName: 'Unassigned',
      due: '',
      priority: consultForm.urgency === 'stat' ? 'urgent' : 'high',
      type: 'consult',
      status: 'todo',
      notes: consultForm.reason,
    };
    setCoordTasks((prev) => [task, ...prev]);
    setCommLog((prev) => [
      ...prev,
      {
        id: 'C' + Date.now(),
        timestamp: new Date().toISOString(),
        with: consultForm.toDept,
        method: 'page',
        summary: `Consult requested (${consultForm.urgency}) – ${consultForm.reason}`,
        patientId: consultForm.patientId,
      },
    ]);
    setConsultForm({ patientId: '', toDept: 'cardiology', urgency: 'routine', reason: '' });
    setAlertMessage('Consult request logged.');
    setAlertVariant('success');
  };

  const updateTaskStatus = (id, status) => {
    setCoordTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };
  const markTaskDone = (id) => updateTaskStatus(id, 'done');
  const deleteTask = (id) => setCoordTasks((prev) => prev.filter((t) => t.id !== id));

  const escalateTask = (t) => {
    setCommLog((prev) => [
      ...prev,
      {
        id: 'C' + (Date.now() + 1),
        timestamp: new Date().toISOString(),
        with: 'On-call',
        method: 'page',
        summary: `Escalated: ${t.title}`,
        patientId: t.patientId,
      },
    ]);
    setAlertMessage(`Paged on-call about "${t.title}".`);
    setAlertVariant('info');
  };

  const logCommunication = () => {
    if (!commNote.trim()) return;
    setCommLog((prev) => [
      ...prev,
      {
        id: 'C' + (Date.now() + 2),
        timestamp: new Date().toISOString(),
        with: 'Team',
        method: 'note',
        summary: commNote.trim(),
        patientId: '',
      },
    ]);
    setCommNote('');
  };

  const filteredUnassigned = useMemo(() => filterPatients(unassignedPatients), [unassignedPatients, searchTerm, selectedDepartment, selectedUrgency]);
  const filteredAllAssigned = useMemo(() => filterPatients(allAssignedPatients), [allAssignedPatients, searchTerm, selectedDepartment, selectedUrgency]);

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title>👥 Patient Assignment & Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alertMessage && (
            <Alert variant={alertVariant} dismissible onClose={() => setAlertMessage('')}>
              {alertMessage}
            </Alert>
          )}

          <Row className="mb-3">
            <Col md={4} className="mb-2">
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mb-2">
              <Form.Select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                <option value="all">All Departments</option>
                <option value="emergency">Emergency</option>
                <option value="icu">ICU</option>
                <option value="surgery">Surgery</option>
                <option value="internal">Internal Medicine</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="obstetrics">Obstetrics</option>
                <option value="orthopedics">Orthopedics</option>
              </Form.Select>
            </Col>
            <Col md={3} className="mb-2">
              <Form.Select value={selectedUrgency} onChange={(e) => setSelectedUrgency(e.target.value)}>
                <option value="all">All Urgency Levels</option>
                <option value="critical">Critical/Urgent Only</option>
                <option value="normal">Non-Urgent</option>
              </Form.Select>
            </Col>
            <Col md={2} className="mb-2">
              <Button
                variant="success"
                className="w-100 intake-btn"
                onClick={() => setShowIntakeForm(true)}
              >
                <span className="intake-icon">+</span>
                <span>New Intake</span>
              </Button>
            </Col>
          </Row>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'unassigned')} className="mb-3">
            <Tab eventKey="unassigned" title={`Unassigned (${unassignedPatients.length})`}>
              {selectedPatients.length > 0 && (
                <Card className="mb-3 border-primary">
                  <Card.Body>
                    <Row>
                      <Col md={8} className="mb-2">
                        <Form.Select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                          <option value="">Select Staff Member to Assign To...</option>
                          {availableStaff.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name} - {staff.role} ({staff.department}) - Load: {staff.currentLoad}/{staff.maxLoad}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={4} className="mb-2">
                        <Button variant="primary" className="w-100" onClick={handleAssignPatients}>
                          Assign {selectedPatients.length} Patient(s)
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Chief Complaint</th>
                    <th>Triage</th>
                    <th>Dept</th>
                    <th>Wait Time</th>
                    <th>Vitals</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnassigned.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => togglePatientSelection(patient.id)}
                        />
                      </td>
                      <td>
                        <small>{patient.id}</small>
                      </td>
                      <td>
                        <strong>{patient.name}</strong>
                        <br />
                        <small>
                          {patient.age}y {patient.sex}
                        </small>
                      </td>
                      <td>{patient.chiefComplaint}</td>
                      <td>{getTriageBadge(patient.triageLevel)}</td>
                      <td>{getDepartmentBadge(patient.department)}</td>
                      <td>
                        <Badge bg={patient.waitTime.includes('hr') ? 'danger' : 'warning'}>⏰ {patient.waitTime}</Badge>
                      </td>
                      <td>
                        <small>
                          BP: {patient.vitalSigns.bloodPressure}
                          <br />
                          HR: {patient.vitalSigns.heartRate}
                          <br />
                          O2: {patient.vitalSigns.oxygenSaturation}%
                        </small>
                      </td>
                      <td>
                        <div className="d-flex">
                          <Button size="sm" variant="outline-primary" onClick={() => onViewDetails?.(patient)}>
                            View Details
                          </Button>
                          {enableRecordQuickOpen && (
                            <Button
                              size="sm"
                              variant="outline-dark"
                              className="ms-1"
                              onClick={() => onViewRecord?.(patient)}
                            >
                              History
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>

            <Tab eventKey="mypatients" title={`My Patients (${myPatients.length})`}>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Room</th>
                    <th>Condition</th>
                    <th>Assigned</th>
                    <th>Doctor</th>
                    <th>Next Med</th>
                    <th>Last Vitals</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <strong>{patient.name}</strong>
                        <br />
                        <small>
                          {patient.age}y {patient.sex}
                        </small>
                      </td>
                      <td>
                        <Badge bg="light" text="dark">
                          {patient.room}
                        </Badge>
                      </td>
                      <td>{patient.condition}</td>
                      <td>
                        <small>{patient.assignedTime}</small>
                      </td>
                      <td>{patient.doctor}</td>
                      <td>
                        <Badge bg="info">⏰ {patient.nextMedTime}</Badge>
                      </td>
                      <td>{patient.lastVitalsCheck}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={() => {
                            setPatientToReassign(patient);
                            setShowReassignModal(true);
                            setReassignStaffId('');
                          }}
                        >
                          Reassign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>

            <Tab eventKey="allassigned" title="All Assigned">
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Room</th>
                    <th>Assigned To</th>
                    <th>Doctor</th>
                    <th>Condition</th>
                    <th>Triage</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllAssigned.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <strong>{patient.name}</strong>
                        <br />
                        <small>
                          {patient.age}y {patient.sex}
                        </small>
                      </td>
                      <td>
                        <Badge bg="light" text="dark">
                          {patient.room}
                        </Badge>
                      </td>
                      <td>{patient.assignedTo}</td>
                      <td>{patient.doctor}</td>
                      <td>{patient.condition}</td>
                      <td>{getTriageBadge(patient.triageLevel)}</td>
                      <td>{getDepartmentBadge(patient.department)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>

            <Tab eventKey="coordination" title={`Care Coordination (${coordTasks.filter((t) => t.status !== 'done').length})`}>
              <Row className="g-3 mb-3">
                <Col lg={7}>
                  <Card>
                    <Card.Header>
                      <strong>Quick Task</strong>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-2">
                        <Col md={4}>
                          <Form.Select
                            value={newTask.patientId}
                            onChange={(e) => setNewTask({ ...newTask, patientId: e.target.value })}
                          >
                            <option value="">Select patient...</option>
                            {allPatientOptions().map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={8}>
                          <Form.Control
                            placeholder="Task title (e.g., Arrange imaging transport)"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Select
                            value={newTask.type}
                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                          >
                            <option value="followup">Follow-up</option>
                            <option value="handoff">Handoff</option>
                            <option value="discharge">Discharge</option>
                            <option value="transport">Transport</option>
                            <option value="consult">Consult</option>
                            <option value="other">Other</option>
                          </Form.Select>
                        </Col>
                        <Col md={3}>
                          <Form.Select
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          >
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </Form.Select>
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="datetime-local"
                            value={newTask.due}
                            onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Select
                            value={newTask.ownerId}
                            onChange={(e) => setNewTask({ ...newTask, ownerId: e.target.value })}
                          >
                            <option value="">Assign to...</option>
                            {availableStaff.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.role})
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={12}>
                          <InputGroup>
                            <InputGroup.Text>📝</InputGroup.Text>
                            <Form.Control
                              placeholder="Notes (optional)"
                              value={newTask.notes}
                              onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                            />
                            <Button variant="primary" onClick={addCoordinationTask}>
                              Add Task
                            </Button>
                          </InputGroup>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <Card>
                    <Card.Header>
                      <strong>Quick Consult</strong>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-2">
                        <Col md={6}>
                          <Form.Select
                            value={consultForm.patientId}
                            onChange={(e) => setConsultForm({ ...consultForm, patientId: e.target.value })}
                          >
                            <option value="">Select patient...</option>
                            {allPatientOptions().map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={6}>
                          <Form.Select
                            value={consultForm.toDept}
                            onChange={(e) => setConsultForm({ ...consultForm, toDept: e.target.value })}
                          >
                            <option value="cardiology">Cardiology</option>
                            <option value="surgery">Surgery</option>
                            <option value="radiology">Radiology</option>
                            <option value="pharmacy">Pharmacy</option>
                            <option value="lab">Lab</option>
                            <option value="social work">Social Work</option>
                            <option value="pt/ot">PT/OT</option>
                          </Form.Select>
                        </Col>
                        <Col md={12}>
                          <Form.Control
                            placeholder="Reason / question"
                            value={consultForm.reason}
                            onChange={(e) => setConsultForm({ ...consultForm, reason: e.target.value })}
                          />
                        </Col>
                        <Col md={7}>
                          <Form.Select
                            value={consultForm.urgency}
                            onChange={(e) => setConsultForm({ ...consultForm, urgency: e.target.value })}
                          >
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="stat">STAT</option>
                          </Form.Select>
                        </Col>
                        <Col md={5} className="d-grid">
                          <Button variant="warning" onClick={requestConsult}>
                            Request Consult
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="mb-3">
                <Card.Header>
                  <strong>Task Board</strong>
                </Card.Header>
                <Card.Body style={{ maxHeight: 360, overflowY: 'auto' }}>
                  <Table responsive hover size="sm">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Task</th>
                        <th>Type</th>
                        <th>Owner</th>
                        <th>Due</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th style={{ width: 220 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coordTasks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted">
                            No coordination tasks yet
                          </td>
                        </tr>
                      ) : (
                        coordTasks.map((t) => (
                          <tr key={t.id} className={t.status === 'done' ? 'table-success' : ''}>
                            <td>
                              <strong>{t.patientName}</strong>
                            </td>
                            <td>
                              {t.title}
                              {t.notes && <div className="small text-muted">{t.notes}</div>}
                            </td>
                            <td>
                              <Badge bg="dark">{(t.type || 'other').toUpperCase()}</Badge>
                            </td>
                            <td>{t.ownerName}</td>
                            <td>{t.due ? new Date(t.due).toLocaleString() : <span className="text-muted">—</span>}</td>
                            <td>{priorityBadge(t.priority)}</td>
                            <td>
                              <Form.Select size="sm" value={t.status} onChange={(e) => updateTaskStatus(t.id, e.target.value)}>
                                <option value="todo">To Do</option>
                                <option value="doing">Doing</option>
                                <option value="done">Done</option>
                              </Form.Select>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button size="sm" variant="success" onClick={() => markTaskDone(t.id)}>
                                  Done
                                </Button>
                                <Button size="sm" variant="outline-danger" onClick={() => escalateTask(t)}>
                                  Escalate
                                </Button>
                                <Button size="sm" variant="outline-secondary" onClick={() => deleteTask(t.id)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <strong>Communication Log</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="g-2 align-items-center">
                    <Col md={10}>
                      <Form.Control
                        placeholder="Add brief team note (e.g., 'Spoke with pharmacy about dose timing')"
                        value={commNote}
                        onChange={(e) => setCommNote(e.target.value)}
                      />
                    </Col>
                    <Col md={2} className="d-grid">
                      <Button variant="outline-primary" onClick={logCommunication}>
                        Log
                      </Button>
                    </Col>
                  </Row>
                  <hr />
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {commLog.length === 0 ? (
                      <div className="text-muted small">No communications logged yet</div>
                    ) : (
                      commLog
                        .slice()
                        .reverse()
                        .map((c) => (
                          <div key={c.id} className="mb-2">
                            <div className="small text-muted">{new Date(c.timestamp).toLocaleString()}</div>
                            <div>
                              <Badge bg="secondary" className="me-1">
                                {c.method.toUpperCase()}
                              </Badge>
                              <strong>{c.with}</strong> — {c.summary}
                              {c.patientId && <span className="ms-2 text-muted">({patientNameById(c.patientId)})</span>}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="staff" title="Staff Workload">
              <Row>
                {availableStaff.map((staff) => (
                  <Col md={6} key={staff.id} className="mb-3">
                    <Card>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6>{staff.name}</h6>
                            <small className="text-muted">
                              {staff.role === 'nurse' ? 'RN' : 'MD'} - {staff.department}
                            </small>
                          </div>
                          <Badge bg={staff.role === 'nurse' ? 'info' : 'primary'}>{staff.shift}</Badge>
                        </div>
                        {getWorkloadBar(staff.currentLoad, staff.maxLoad)}
                        <small className="text-muted d-block mt-2">
                          Specializations: {staff.specializations.join(', ')}
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showIntakeForm} onHide={() => setShowIntakeForm(false)} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>New Patient Intake</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Basic Information</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={intakeData.name}
                        onChange={(e) => setIntakeData({ ...intakeData, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth *</Form.Label>
                      <Form.Control
                        type="date"
                        value={intakeData.dob}
                        onChange={(e) => setIntakeData({ ...intakeData, dob: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sex *</Form.Label>
                      <Form.Select
                        value={intakeData.sex}
                        onChange={(e) => setIntakeData({ ...intakeData, sex: e.target.value })}
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={intakeData.phone}
                        onChange={(e) => setIntakeData({ ...intakeData, phone: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={intakeData.email}
                        onChange={(e) => setIntakeData({ ...intakeData, email: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Emergency Contact</Form.Label>
                      <Form.Control
                        type="text"
                        value={intakeData.emergencyContact}
                        onChange={(e) => setIntakeData({ ...intakeData, emergencyContact: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Emergency Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        value={intakeData.emergencyPhone}
                        onChange={(e) => setIntakeData({ ...intakeData, emergencyPhone: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={intakeData.address}
                    onChange={(e) => setIntakeData({ ...intakeData, address: e.target.value })}
                  />
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="1">
              <Accordion.Header>Insurance Information</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Insurance Provider</Form.Label>
                      <Form.Control
                        type="text"
                        value={intakeData.insurance}
                        onChange={(e) => setIntakeData({ ...intakeData, insurance: e.target.value })}
                        placeholder="e.g., NHIS, Private - MaxLife"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Policy Number</Form.Label>
                      <Form.Control
                        type="text"
                        value={intakeData.policyNumber}
                        onChange={(e) => setIntakeData({ ...intakeData, policyNumber: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2">
              <Accordion.Header>Medical Information</Accordion.Header>
              <Accordion.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Chief Complaint *</Form.Label>
                  <Form.Control
                    type="text"
                    value={intakeData.chiefComplaint}
                    onChange={(e) => setIntakeData({ ...intakeData, chiefComplaint: e.target.value })}
                    placeholder="Primary reason for visit"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Symptoms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={intakeData.symptoms}
                    onChange={(e) => setIntakeData({ ...intakeData, symptoms: e.target.value })}
                    placeholder="Describe symptoms in detail"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Medical History</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={intakeData.medicalHistory}
                    onChange={(e) => setIntakeData({ ...intakeData, medicalHistory: e.target.value })}
                    placeholder="Previous conditions, surgeries, hospitalizations"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Current Medications</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={intakeData.currentMedications}
                    onChange={(e) => setIntakeData({ ...intakeData, currentMedications: e.target.value })}
                    placeholder="List all current medications and dosages"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Allergies</Form.Label>
                  <Form.Control
                    type="text"
                    value={intakeData.allergies}
                    onChange={(e) => setIntakeData({ ...intakeData, allergies: e.target.value })}
                    placeholder="Separate multiple allergies with commas"
                  />
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3">
              <Accordion.Header>Vital Signs</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Pressure</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="120/80"
                        value={intakeData.vitalSigns.bloodPressure}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            vitalSigns: { ...intakeData.vitalSigns, bloodPressure: e.target.value },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heart Rate (bpm)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="72"
                        value={intakeData.vitalSigns.heartRate}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            vitalSigns: { ...intakeData.vitalSigns, heartRate: e.target.value },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Temperature (°F)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        placeholder="98.6"
                        value={intakeData.vitalSigns.temperature}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            vitalSigns: { ...intakeData.vitalSigns, temperature: e.target.value },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Respiratory Rate</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="16"
                        value={intakeData.vitalSigns.respiratoryRate}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            vitalSigns: { ...intakeData.vitalSigns, respiratoryRate: e.target.value },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>O2 Saturation (%)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="98"
                        value={intakeData.vitalSigns.oxygenSaturation}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            vitalSigns: { ...intakeData.vitalSigns, oxygenSaturation: e.target.value },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pain Level (0-10)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="10"
                        placeholder="0"
                        value={intakeData.vitalSigns.painLevel}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            vitalSigns: { ...intakeData.vitalSigns, painLevel: e.target.value },
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="4">
              <Accordion.Header>Triage Assessment</Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Triage Level *</Form.Label>
                      <Form.Select
                        value={intakeData.triageLevel}
                        onChange={(e) => setIntakeData({ ...intakeData, triageLevel: e.target.value })}
                      >
                        <option value="1">1 - Critical (Immediate)</option>
                        <option value="2">2 - Urgent (15 min)</option>
                        <option value="3">3 - Less Urgent (30 min)</option>
                        <option value="4">4 - Non-Urgent (60 min)</option>
                        <option value="5">5 - Minor (120 min)</option>
                      </Form.Select>
                      <Form.Text className="text-muted">Based on ESI triage system</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Department *</Form.Label>
                      <Form.Select
                        value={intakeData.department}
                        onChange={(e) => setIntakeData({ ...intakeData, department: e.target.value })}
                      >
                        <option value="emergency">Emergency</option>
                        <option value="icu">ICU</option>
                        <option value="surgery">Surgery</option>
                        <option value="internal">Internal Medicine</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="obstetrics">Obstetrics</option>
                        <option value="orthopedics">Orthopedics</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={intakeData.notes}
                    onChange={(e) => setIntakeData({ ...intakeData, notes: e.target.value })}
                    placeholder="Any additional observations or special considerations"
                  />
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowIntakeForm(false);
              resetIntakeForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleIntakeSubmit}
            disabled={!intakeData.name || !intakeData.dob || !intakeData.chiefComplaint}
          >
            Complete Intake
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showReassignModal} onHide={() => setShowReassignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reassign Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {patientToReassign && (
            <>
              <Alert variant="info">
                Reassigning: <strong>{patientToReassign.name}</strong>{' '}
                {patientToReassign.room ? `(Room ${patientToReassign.room})` : ''}
              </Alert>
              <Form.Group>
                <Form.Label>Select New Staff Member</Form.Label>
                <Form.Select value={reassignStaffId} onChange={(e) => setReassignStaffId(e.target.value)}>
                  <option value="">Choose...</option>
                  {availableStaff
                    .filter((s) => s.id !== currentUser?.id)
                    .map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role} - Load: {staff.currentLoad}/{staff.maxLoad}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mt-3">
                <Form.Label>Reason for Reassignment</Form.Label>
                <Form.Control as="textarea" rows={2} placeholder="Optional" />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReassignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setShowReassignModal(false);
              setPatientToReassign(null);
              setReassignStaffId('');
              setAlertMessage('Patient successfully reassigned');
              setAlertVariant('success');
            }}
            disabled={!reassignStaffId}
          >
            Confirm Reassignment
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PatientAssignmentModule;
