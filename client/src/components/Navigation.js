import React from 'react';
import { Navbar, Container, Nav, Badge, Button } from 'react-bootstrap';

const Navigation = ({
  user,
  onLogout,
  isAdmin,
  onOpenSettings,
  onLogin,
  showLoginAction,
}) => (
  <Navbar bg="light" expand="md" className="mb-3 border-bottom">
    <Container fluid>
      <Navbar.Brand>Telehealth Console</Navbar.Brand>
      <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav">
        <Nav className="me-auto">
          {user?.role && <Badge bg="secondary" className="me-2 text-uppercase">{user.role}</Badge>}
          {user?.email && <span className="text-muted small">{user.email}</span>}
        </Nav>
        <div className="d-flex gap-2 align-items-center">
          {showLoginAction && !user && (
            <Button variant="primary" size="sm" onClick={onLogin}>
              Login
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline-secondary" size="sm" onClick={onOpenSettings} disabled={!user}>
              ⚙ Settings
            </Button>
          )}
          {user && (
            <Button variant="outline-danger" size="sm" onClick={onLogout}>
              Logout
            </Button>
          )}
        </div>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Navigation;
