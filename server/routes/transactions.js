const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { isMongoReady } = require('../helpers/dbReady');
const { normalizeDoc } = require('../helpers/normalizeId');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

const router = express.Router();

const fallbackState = {
  transactions: [],
  notifications: [],
};

const mapId = (doc) => normalizeDoc(doc);

const createNotifications = async (notifications) => {
  if (!notifications?.length) return;
  if (!isMongoReady()) {
    fallbackState.notifications.push(
      ...notifications.map((n) => ({ ...n, id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }))
    );
    return;
  }
  await Notification.insertMany(notifications, { ordered: false });
};

router.post('/', requireAuth, async (req, res) => {
  try {
    const { prescriptionId, amount = 0, currency = 'CAD', method = 'Card', demoAutoApprove = false } = req.body || {};
    if (!prescriptionId) return res.status(400).json({ error: 'prescriptionId is required' });

    const base = {
      userId: req.user.id,
      prescriptionId,
      amount,
      currency,
      method,
      paymentStatus: 'pending',
      transactionId: `demo_txn_${Date.now()}`,
      demoAutoApprove: Boolean(demoAutoApprove),
    };

    let record;
    if (isMongoReady()) {
      let doc = await Transaction.create(base);
      if (demoAutoApprove && process.env.NODE_ENV !== 'production') {
        doc = await Transaction.findByIdAndUpdate(doc._id, { paymentStatus: 'paid' }, { new: true });
      }
      record = mapId(doc);
    } else {
      const id = `txn_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const now = new Date().toISOString();
      record = { id, ...base, paymentStatus: demoAutoApprove ? 'paid' : 'pending', createdAt: now, updatedAt: now };
      fallbackState.transactions.push(record);
    }

    await createNotifications([
      {
        recipientId: req.user.id,
        type: 'transaction_created',
        contextType: 'transaction',
        contextId: record.id,
        message: `Payment ${record.paymentStatus === 'paid' ? 'completed' : 'pending'} for prescription ${prescriptionId}.`,
      },
    ]);

    return res.status(201).json({ transaction: record });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create transaction' });
  }
});

router.post('/:id/confirm', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });

    let record;
    if (isMongoReady()) {
      const doc = await Transaction.findByIdAndUpdate(id, { paymentStatus: 'paid', updatedAt: new Date() }, { new: true });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      record = mapId(doc);
    } else {
      const idx = fallbackState.transactions.findIndex((t) => t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const now = new Date().toISOString();
      fallbackState.transactions[idx] = { ...fallbackState.transactions[idx], paymentStatus: 'paid', updatedAt: now };
      record = fallbackState.transactions[idx];
    }

    await createNotifications([
      {
        recipientId: req.user.id,
        type: 'transaction_paid',
        contextType: 'transaction',
        contextId: record.id,
        message: 'Payment confirmed.',
      },
    ]);

    return res.json({ transaction: record });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to confirm transaction' });
  }
});

module.exports = router;