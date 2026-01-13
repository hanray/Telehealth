const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { findByEmail, addUser, nextId, allUsers } = require('../utils/userStore');

const ALLOWED_ROLES = ['patient', 'doctor', 'nurse', 'admin'];
const SUPPORTED_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'IN', 'SG', 'PH', 'BR', 'MX', 'ZA'];
const DEMO_LABEL = 'Demo / MVP auth';

const handleSignup = async (req, res) => {
	try {
		const { email, password, role, customRole, org_id, patientId, patient_id, name, product, country } = req.body || {};

		if (!email || !password || (!role && !customRole)) {
			return res.status(400).json({ error: 'email, password, and a role (or custom role) are required', context: DEMO_LABEL });
		}

		const roleInput = (role || '').trim();
		const customRoleInput = (customRole || '').toString().trim();
		let resolvedRole = null;
		if (ALLOWED_ROLES.includes(roleInput)) {
			resolvedRole = roleInput;
		} else if (roleInput === 'other' && customRoleInput) {
			resolvedRole = customRoleInput;
		} else if (!roleInput && customRoleInput) {
			resolvedRole = customRoleInput;
		} else if (customRoleInput) {
			resolvedRole = customRoleInput;
		}

		if (!resolvedRole) {
			return res.status(400).json({ error: 'Please provide a valid role', allowed: [...ALLOWED_ROLES, 'custom'], context: DEMO_LABEL });
		}

		if (!ALLOWED_ROLES.includes(resolvedRole) && resolvedRole.length < 3) {
			return res.status(400).json({ error: 'Custom role must be at least 3 characters', context: DEMO_LABEL });
		}

		if (!ALLOWED_ROLES.includes(resolvedRole) && resolvedRole.length > 64) {
			return res.status(400).json({ error: 'Custom role is too long (max 64 characters)', context: DEMO_LABEL });
		}

		const countryInput = (country || '').toString().trim().toUpperCase();
		const resolvedCountry = countryInput || 'US';
		if (countryInput && !SUPPORTED_COUNTRIES.includes(resolvedCountry)) {
			return res.status(400).json({ error: 'Unsupported country', allowed: SUPPORTED_COUNTRIES, context: DEMO_LABEL });
		}
		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters', context: DEMO_LABEL });
		}
		const existingUsers = await allUsers();
		const adminCount = existingUsers.filter((u) => u.role === 'admin').length;
		if (resolvedRole === 'admin' && adminCount >= 3) {
			return res.status(403).json({ error: 'Admin slots are limited (max 3)', context: DEMO_LABEL });
		}

		let patient_id_value = null;
		if (resolvedRole === 'patient') {
			const provided = patientId || patient_id || null;
			if (provided && typeof provided === 'string') {
				patient_id_value = provided.trim();
			} else {
				const patientCount = existingUsers.filter(u => u.role === 'patient').length;
				patient_id_value = `patient-${String(patientCount + 1).padStart(3, '0')}`;
			}
		}

		const existing = await findByEmail(email);
		if (existing) {
			return res.status(409).json({ error: 'User already exists', context: DEMO_LABEL });
		}

		const password_hash = await bcrypt.hash(password, 10);
		const user = {
			id: nextId(),
			email: email.toLowerCase().trim(),
			role: resolvedRole,
			name: (name || '').trim() || null,
			product: product || null,
			password_hash,
			org_id: org_id || null,
			patientId: patient_id_value,
			country: resolvedCountry,
		};

		await addUser(user);

		req.session.user = { id: user.id, email: user.email, role: user.role, org_id: user.org_id, patientId: user.patientId };
		return res.status(201).json({ user: req.session.user, context: DEMO_LABEL });
	} catch (err) {
		console.error('[auth/register] error', err);
		return res.status(500).json({ error: 'Failed to register', context: DEMO_LABEL });
	}
};

router.post('/register', handleSignup);
router.post('/signup', handleSignup);

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({ error: 'email and password are required', context: DEMO_LABEL });
		}

		const user = await findByEmail(email);
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials', context: DEMO_LABEL });
		}

		const ok = await bcrypt.compare(password, user.password_hash || '');
		if (!ok) {
			return res.status(401).json({ error: 'Invalid credentials', context: DEMO_LABEL });
		}

		req.session.user = { id: user.id, email: user.email, role: user.role, org_id: user.org_id || null, patientId: user.patientId || null };
		return res.json({ user: req.session.user, context: DEMO_LABEL });
	} catch (err) {
		console.error('[auth/login] error', err);
		return res.status(500).json({ error: 'Failed to login', context: DEMO_LABEL });
	}
});

router.get('/me', requireAuth, async (req, res) => {
	return res.json({ user: req.user, context: DEMO_LABEL });
});

router.post('/logout', requireAuth, (req, res) => {
	const sid = req.sessionID;
	req.session.destroy((err) => {
		if (err) {
			console.error('[auth/logout] destroy error', err);
		}
		res.clearCookie('telehealth.sid');
		return res.json({ ok: true, session: sid, context: DEMO_LABEL });
	});
});

module.exports = router;
