const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

const { requireRole } = require('../middleware/auth');
const { findByEmail, addUser, nextId } = require('../utils/userStore');

const ALLOWED_ROLES = ['patient', 'doctor', 'nurse', 'admin'];
const DEMO_LABEL = 'Demo / MVP auth';

router.post('/provision-user', requireRole(['admin']), async (req, res) => {
  try {
    const { email, password, role, org_id } = req.body || {};
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password, and role are required', context: DEMO_LABEL });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role', allowed: ALLOWED_ROLES, context: DEMO_LABEL });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists', context: DEMO_LABEL });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = {
      id: nextId(),
      email: email.toLowerCase().trim(),
      role,
      password_hash,
      org_id: org_id || null,
    };

    await addUser(user);

    return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role, org_id: user.org_id }, context: DEMO_LABEL });
  } catch (err) {
    console.error('[admin/provision-user] error', err);
    return res.status(500).json({ error: 'Failed to provision user', context: DEMO_LABEL });
  }
});

module.exports = router;
