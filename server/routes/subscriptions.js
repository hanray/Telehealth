const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { isMongoReady } = require('../helpers/dbReady');
const Subscription = require('../models/Subscription');

const router = express.Router();

const fallbackState = {
  subscriptions: [],
};

const normalize = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = obj;
  return { id: _id?.toString?.() || obj.id, ...rest };
};

router.get('/', requireAuth, async (req, res) => {
  const useMongo = isMongoReady();
  if (!useMongo) {
    const items = fallbackState.subscriptions.filter((s) => s.userId === req.user.id);
    return res.json({ subscriptions: items });
  }
  try {
    const docs = await Subscription.find({ userId: req.user.id }).lean();
    return res.json({ subscriptions: docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch subscriptions' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { planId, status = 'active' } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    const base = { userId: req.user.id, planId, status };

    if (isMongoReady()) {
      const doc = await Subscription.create(base);
      return res.status(201).json({ subscription: normalize(doc) });
    }
    const id = `sub_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const now = new Date().toISOString();
    const record = { id, ...base, createdAt: now, updatedAt: now };
    fallbackState.subscriptions.push(record);
    return res.status(201).json({ subscription: record });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create subscription' });
  }
});

module.exports = router;