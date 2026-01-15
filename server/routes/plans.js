const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isMongoReady } = require('../helpers/dbReady');
const Plan = require('../models/Plan');

const router = express.Router();

const SEED_PLANS = [
  { _id: 'plan_basic', name: 'Basic', price: 20, currency: 'CAD', interval: 'month' },
  { _id: 'plan_plus', name: 'Plus', price: 40, currency: 'CAD', interval: 'month' },
];

const normalize = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = obj;
  return { id: _id?.toString?.() || obj.id, ...rest };
};

const ensureSeedPlans = async () => {
  if (!isMongoReady()) return;
  const count = await Plan.countDocuments();
  if (count > 0) return;
  try {
    await Plan.insertMany(SEED_PLANS.map((p) => ({ ...p })), { ordered: false });
  } catch (err) {
    // ignore duplicate insert errors
  }
};

router.get('/', async (_req, res) => {
  const useMongo = isMongoReady();
  if (!useMongo) {
    return res.json({ plans: SEED_PLANS.map(({ _id, ...rest }) => ({ id: _id, ...rest })) });
  }
  try {
    await ensureSeedPlans();
    const items = await Plan.find({ active: { $ne: false } }).lean();
    return res.json({ plans: items.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load plans' });
  }
});

router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    if (!isMongoReady()) return res.status(503).json({ error: 'Mongo not ready' });
    const { name, price, currency = 'CAD', interval = 'month', active = true } = req.body || {};
    if (!name || price === undefined) return res.status(400).json({ error: 'name and price are required' });
    const doc = await Plan.create({ name, price, currency, interval, active });
    return res.status(201).json({ plan: normalize(doc) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create plan' });
  }
});

module.exports = router;