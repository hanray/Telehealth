import React from 'react';
import { Card, Badge } from 'react-bootstrap';

export const PRODUCT_CATALOG = [
  {
    key: 'telehealth',
    title: 'Telehealth',
    subtitle: 'Doctor & Nurse workflows',
    description: 'Visits, charts, triage, labs, coordination',
    badge: 'Login required',
    monogram: 'TH',
    accent: 'teal',
  },
  {
    key: 'homecare',
    title: 'HomeCare',
    subtitle: 'Nurses & PSWs',
    description: 'Shifts, checklists, home visits, care notes',
    badge: 'Login required',
    monogram: 'HC',
    accent: 'indigo',
  },
  {
    key: 'myhealth',
    title: 'MyHealth',
    subtitle: 'Patient portal',
    description: 'Appointments, messages, refills, records',
    badge: 'Login required',
    monogram: '♥',
    accent: 'sky',
  },
  {
    key: 'admin',
    title: 'Admin Console',
    subtitle: 'System controls',
    description: 'Provisioning, audit, environment toggles',
    badge: 'Admin only',
    monogram: 'AD',
    accent: 'amber',
  },
];

const ProductPicker = ({ onSelectProduct, isAdmin, selectedProduct }) => {
  const visibleProducts = PRODUCT_CATALOG.filter((p) => p.key !== 'admin' || isAdmin);

  return (
    <Card className="card-plain product-picker">
      <Card.Body>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3 mb-4">
          <div>
            <div className="text-muted text-uppercase small fw-semibold mb-1">Choose a workspace</div>
            <h3 className="mb-1">One suite, three apps</h3>
            <div className="text-muted">
              Pick where you want to work. We only ask you to sign in after you pick a product.
            </div>
          </div>
        </div>

        <div className="product-grid">
          {visibleProducts.map((product) => {
            const isActive = selectedProduct === product.key;
            return (
              <button
                key={product.key}
                className={`product-card ${product.accent} ${isActive ? 'active' : ''}`}
                type="button"
                onClick={() => onSelectProduct(product.key)}
              >
                <div className="d-flex align-items-start justify-content-between">
                  <div className="product-icon" aria-hidden>
                    {product.monogram}
                  </div>
                  <Badge bg="light" text="dark">
                    {product.badge}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-uppercase small fw-semibold text-muted">{product.subtitle}</div>
                  <h5 className="mb-1">{product.title}</h5>
                  <div className="text-muted small">{product.description}</div>
                </div>
                <div className="mt-3 d-flex align-items-center justify-content-between">
                  <span className="text-muted small">Opens its own workspace</span>
                  <span className="product-cta">Launch</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductPicker;
