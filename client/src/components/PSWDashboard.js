import React, { useMemo } from 'react';
import { Alert, Badge, Button, Card, ListGroup } from 'react-bootstrap';

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const PSWDashboard = ({
  currentUser,
  patients = [],
  homecareTasks = [],
  onOpenPatients,
  onStartTask,
  onCompleteTask,
  t = (s) => s,
}) => {
  const role = normalizeRole(currentUser?.role);
  const myId = currentUser?.id;

  const patientNameById = (id) => {
    const p = (patients || []).find((x) => x.id === id);
    return p?.fullName || p?.name || p?.medicalRecord?.profile?.fullName || id;
  };

  const myTasks = useMemo(() => {
    const list = Array.isArray(homecareTasks) ? homecareTasks : [];
    return list
      .filter((t) => !myId || t.assignedToUserId === myId)
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [homecareTasks, myId]);

  const openCount = useMemo(() => myTasks.filter((t) => t.status !== 'completed').length, [myTasks]);

  return (
    <div className="d-grid gap-3">
      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <Card.Title className="mb-0">{t('PSW Shiftboard')}</Card.Title>
              <Card.Subtitle className="text-muted">{t('Unit of work: Shift / Homecare visit tasks')}</Card.Subtitle>
            </div>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-primary" onClick={() => onOpenPatients?.()}>
                {t('Patients')}
              </Button>
            </div>
          </div>
          <Card.Text>{t('Work through home visits and escalate to providers when needed.')}</Card.Text>
        </Card.Body>
      </Card>

      {role !== 'psw' && (
        <Alert variant="warning">{t('This dashboard is intended for PSW role.')}</Alert>
      )}

      <Card className="card-plain">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">{t('My Homecare Tasks')}</Card.Title>
            <Badge bg={openCount ? 'warning' : 'secondary'} className="text-uppercase">
              {t('Open')}: {openCount}
            </Badge>
          </div>

          <ListGroup variant="flush">
            {myTasks.map((task) => (
              <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">{task.title || t('Task')}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t('Patient')}: {patientNameById(task.patientId)}
                  </div>
                  {task.notes && <div className="text-muted" style={{ fontSize: 12 }}>{task.notes}</div>}
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  <Badge bg={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'primary' : 'secondary'} className="text-uppercase">
                    {task.status || 'open'}
                  </Badge>
                  {task.status !== 'completed' && task.status !== 'in_progress' && (
                    <Button size="sm" variant="outline-primary" onClick={() => onStartTask?.({ taskId: task.id })}>
                      {t('Start')}
                    </Button>
                  )}
                  {task.status !== 'completed' && (
                    <Button size="sm" variant="outline-success" onClick={() => onCompleteTask?.({ taskId: task.id })}>
                      {t('Complete')}
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
            {!myTasks.length && <ListGroup.Item className="text-muted">{t('No tasks yet. Create one from Patients.')}</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PSWDashboard;
