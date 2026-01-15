import React from 'react';
import { Navbar, Container, Nav, Badge, Button, Form } from 'react-bootstrap';

const Navigation = ({
  user,
  onLogout,
  isAdmin,
  onOpenSettings,
  onLogin,
  showLoginAction,
  languages = [],
  selectedLanguage,
  onLanguageChange,
  t = (text) => text,
}) => (
  <Navbar
    expand="md"
    variant="dark"
    className="mb-3 border-bottom"
    style={{ background: 'var(--color-surface-black, #272626)', color: 'var(--color-text-inverse, #ffffff)' }}
  >
    <Container fluid>
      <Navbar.Brand className="text-white">{t('Telehealth Console')}</Navbar.Brand>
      <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav">
        <Nav className="me-auto">
          {user?.role && <Badge bg="secondary" className="me-2 text-uppercase">{user.role}</Badge>}
          {user?.email && <span className="text-white-50 small">{user.email}</span>}
        </Nav>
        <div className="d-flex gap-2 align-items-center">
          {languages.length > 0 && (
            <Form.Select
              size="sm"
              aria-label="Language selector"
              style={{ width: 190 }}
              value={selectedLanguage}
              onChange={(e) => onLanguageChange?.(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag ? `${lang.flag} ${lang.label}` : lang.label}
                </option>
              ))}
            </Form.Select>
          )}
          {showLoginAction && !user && (
            <Button variant="light" className="text-primary" size="sm" onClick={onLogin}>
              {t('Login action')}
            </Button>
          )}
          {isAdmin && (
            <Button variant="light" className="text-secondary" size="sm" onClick={onOpenSettings} disabled={!user}>
              ⚙ {t('Settings')}
            </Button>
          )}
          {user && (
            <Button variant="light" className="text-danger" size="sm" onClick={onLogout}>
              {t('Logout')}
            </Button>
          )}
        </div>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Navigation;
