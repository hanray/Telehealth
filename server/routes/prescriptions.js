const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isMongoReady } = require('../helpers/dbReady');
const { normalizeDoc, normalizeMany } = require('../helpers/normalizeId');
const Prescription = require('../models/Prescription');
const Pharmacy = require('../models/Pharmacy');
const Notification = require('../models/Notification');
const pharmacyRoutes = require('./pharmacies');

const router = express.Router();

// In-memory fallback for demo/offline mode
const fallbackState = {
  prescriptions: [],
  notifications: [],
};

const SEED_PHARMACIES = (pharmacyRoutes && pharmacyRoutes.SEED_PHARMACIES)
  ? pharmacyRoutes.SEED_PHARMACIES.map((p) => ({ id: p._id || p.id, name: p.name, address: p.address, phone: p.phone }))
  : [
      { id: 'pharm1', name: 'City Pharmacy', address: '123 Main St', phone: '+1-555-1111' },
      { id: 'pharm2', name: 'Community Pharmacy', address: '45 Elm Ave', phone: '+1-555-2222' },
      { id: 'pharm3', name: 'Downtown Pharmacy', address: '77 Market Rd', phone: '+1-555-3333' },
    ];

const ensureSeedPharmacies = (pharmacyRoutes && pharmacyRoutes.ensureSeeds) ? pharmacyRoutes.ensureSeeds : async () => {};

const findPharmacy = async (pharmacyId) => {
  if (!pharmacyId) return null;
  if (!isMongoReady()) {
    return SEED_PHARMACIES.find((p) => p.id === pharmacyId) || null;
  }
  await ensureSeedPharmacies();
  const doc = await Pharmacy.findById(pharmacyId).lean();
  if (doc) return { id: doc._id.toString(), name: doc.name, address: doc.address, phone: doc.phone };
  return null;
};

const createNotifications = async (notifications) => {
  if (!notifications?.length) return;
  if (!isMongoReady()) {
    fallbackState.notifications.push(
      ...notifications.map((n) => ({ ...n, id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }))
    );
    return;
  }
  const docs = notifications.map((n) => ({ ...n }));
  await Notification.insertMany(docs, { ordered: false });
};

// Role-based scoping helper
const buildScopeQuery = (user, queryParams = {}) => {
  if (!user) return {};
  if (user.role === 'patient') {
    return { patientId: user.patientId || user.id };
  }
  if (user.role === 'doctor') {
    return { doctorId: user.id };
  }
  if (user.role === 'pharmacy') {
    const pid = queryParams.pharmacyId || user.id;
    return { pharmacyId: pid };
  }
  return {}; // admin or others
};

router.post('/', requireAuth, requireRole(['doctor']), async (req, res) => {
  try {
    const { patientId, pharmacyId, rawText, normalized, appointmentId, pharmacySnapshot } = req.body || {};
    if (!patientId || !pharmacyId || !rawText) {
      return res.status(400).json({ error: 'patientId, pharmacyId, and rawText are required' });
    }

    let pharmacy = await findPharmacy(pharmacyId);
    if (!pharmacy && pharmacySnapshot) {
      pharmacy = { id: pharmacyId, ...pharmacySnapshot };
    }
    if (!pharmacy) {
      return res.status(400).json({ error: 'Invalid pharmacyId' });
    }

    const base = {
      patientId,
      doctorId: req.user.id,
      pharmacyId: pharmacy.id || pharmacyId,
      pharmacySnapshot: { name: pharmacy.name, address: pharmacy.address, phone: pharmacy.phone },
      rawText,
      normalized: normalized || undefined,
      status: 'Sent',
      appointmentId: appointmentId || undefined,
    };

    let response;
    if (isMongoReady()) {
      const doc = await Prescription.create(base);
      response = normalizeDoc(doc);
    } else {
      const id = `rx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const now = new Date().toISOString();
      const record = { id, ...base, createdAt: now, updatedAt: now };
      fallbackState.prescriptions.push(record);
      response = record;
    }

    await createNotifications([
      {
        recipientId: patientId,
        type: 'prescription_created',
        contextType: 'prescription',
        contextId: response.id,
        message: 'A new prescription was created for you.',
      },
      {
        recipientId: req.user.id,
        type: 'prescription_created',
        contextType: 'prescription',
        contextId: response.id,
        message: 'Prescription sent.',
      },
      {
        recipientId: pharmacyId,
        type: 'prescription_created',
        contextType: 'prescription',
        contextId: response.id,
        message: 'New prescription received.',
      },
    ]);

    return res.status(201).json({ prescription: response });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create prescription' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const scope = buildScopeQuery(req.user, req.query);
    const useMongo = isMongoReady();
    if (!useMongo) {
      const items = fallbackState.prescriptions.filter((p) => {
        if (scope.patientId && p.patientId !== scope.patientId) return false;
        if (scope.doctorId && p.doctorId !== scope.doctorId) return false;
        if (scope.pharmacyId && p.pharmacyId !== scope.pharmacyId) return false;
        return true;
      });
      return res.json({ prescriptions: items });
    }

    const docs = await Prescription.find(scope).sort({ createdAt: -1 }).lean();
    return res.json({ prescriptions: normalizeMany(docs) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch prescriptions' });
  }
});

router.patch('/:id/status', requireAuth, requireRole(['pharmacy', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'id and status are required' });
    const valid = ['Sent', 'Received', 'Processing', 'Ready', 'Dispensed'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    let record;
    if (isMongoReady()) {
      const updated = await Prescription.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!updated) return res.status(404).json({ error: 'Not found' });
      record = normalizeDoc(updated);
    } else {
      const idx = fallbackState.prescriptions.findIndex((p) => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const now = new Date().toISOString();
      fallbackState.prescriptions[idx] = { ...fallbackState.prescriptions[idx], status, updatedAt: now };
      record = fallbackState.prescriptions[idx];
    }

    await createNotifications([
      {
        recipientId: record.patientId,
        type: 'prescription_status',
        contextType: 'prescription',
        contextId: record.id,
        message: `Prescription status updated to ${status}.`,
      },
      {
        recipientId: record.doctorId,
        type: 'prescription_status',
        contextType: 'prescription',
        contextId: record.id,
        message: `Prescription status updated to ${status}.`,
      },
    ]);

    return res.json({ prescription: record });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update status' });
  }
});

module.exports = router;