const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { findByEmail, addUser, nextId, allUsers, updateUser } = require('../utils/userStore');
const { sendEmail } = require('../utils/mailer');
const { parseCountryOfOrigin, hasCountryOfOrigin } = require('../utils/countryOfOrigin');

const ALLOWED_ROLES = ['patient', 'doctor', 'nurse', 'pharmacy', 'admin'];
const DEMO_LABEL = 'Demo / MVP auth';

const sha256Hex = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');
const getPrimaryClientUrl = () => {
	const raw = process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000';
	return raw.split(',').map((s) => s.trim()).filter(Boolean)[0] || 'http://localhost:3000';
};

const getPublicApiBase = (req) => {
	const env = String(process.env.API_PUBLIC_BASE || '').trim().replace(/\/$/, '');
	if (env) return env;
	const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString().split(',')[0].trim();
	const host = (req.headers['x-forwarded-host'] || req.get('host') || '').toString().split(',')[0].trim();
	if (!host) return 'http://localhost:5000';
	return `${proto}://${host}`;
};

const shouldExposeMagicLinkInResponse = () => {
	const flag = String(process.env.EXPOSE_MAGIC_LINK_IN_RESPONSE || '').toLowerCase();
	if (flag === 'true' || flag === '1' || flag === 'yes') return true;
	if (flag === 'false' || flag === '0' || flag === 'no') return false;
	return process.env.NODE_ENV !== 'production';
};

const handleSignup = async (req, res) => {
	try {
		const { email, password, role, customRole, org_id, patientId, patient_id, name, product } = req.body || {};

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

		const countryParsed = parseCountryOfOrigin(req.body || {}, { source: 'signup', required: true });
		if (!countryParsed.ok) {
			return res.status(400).json({ error: countryParsed.error || 'Invalid country of origin', context: DEMO_LABEL });
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
			country: countryParsed.value.countryCode || null,
			countryOfOrigin: countryParsed.value,
		};

		await addUser(user);

		req.session.user = {
			id: user.id,
			email: user.email,
			role: user.role,
			org_id: user.org_id,
			patientId: user.patientId,
			name: user.name,
			product: user.product,
			countryOfOrigin: user.countryOfOrigin,
			country: user.country,
		};
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

		req.session.user = {
			id: user.id,
			email: user.email,
			role: user.role,
			org_id: user.org_id || null,
			patientId: user.patientId || null,
			name: user.name || null,
			product: user.product || null,
			countryOfOrigin: user.countryOfOrigin || null,
			country: user.country || null,
			hasCountryOfOrigin: hasCountryOfOrigin(user),
		};
		return res.json({ user: req.session.user, context: DEMO_LABEL });
	} catch (err) {
		console.error('[auth/login] error', err);
		return res.status(500).json({ error: 'Failed to login', context: DEMO_LABEL });
	}
});

// Magic link (forgot password) - sends a one-time sign-in link.
// Always returns OK to avoid account enumeration.
router.post('/forgot-password', async (req, res) => {
	try {
		const { email } = req.body || {};
		const normalizedEmail = String(email || '').trim().toLowerCase();
		if (!normalizedEmail) {
			return res.status(200).json({ ok: true, link: null, context: DEMO_LABEL });
		}

		const token = crypto.randomBytes(32).toString('hex');
		const tokenHash = sha256Hex(token);
		const apiBase = getPublicApiBase(req);
		const link = `${apiBase}/api/auth/magic?token=${encodeURIComponent(token)}`;

		const user = await findByEmail(normalizedEmail);
		if (user) {
			const expiresAt = new Date(Date.now() + 1000 * 60 * 20).toISOString(); // 20 minutes
			const nextUser = {
				...user,
				magicLink: {
					tokenHash,
					expiresAt,
					consumedAt: null,
					createdAt: new Date().toISOString(),
				},
			};

			await updateUser(nextUser);

			const subject = 'Your Telehealth sign-in link';
			const text = `Use this link to sign in to Telehealth (expires in 20 minutes):\n\n${link}\n\nIf you did not request this, you can ignore this email.`;

			await sendEmail({
				to: nextUser.email,
				subject,
				text,
				html: `<p>Use this link to sign in to Telehealth (expires in 20 minutes):</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can ignore this email.</p>`,
			});
		}

		return res.status(200).json({ ok: true, link: shouldExposeMagicLinkInResponse() ? link : null, context: DEMO_LABEL });
	} catch (err) {
		console.error('[auth/forgot-password] error', err);
		// Still return OK so we don't leak info.
		return res.status(200).json({ ok: true, link: null, context: DEMO_LABEL });
	}
});

// Consumes a magic link token and signs the user in (sets session), then redirects to the client.
router.get('/magic', async (req, res) => {
	const clientBase = getPrimaryClientUrl().replace(/\/$/, '');
	const redirectTo = `${clientBase}/?magic=done`;
	try {
		const token = String(req.query?.token || '').trim();
		if (!token) {
			return res.redirect(redirectTo);
		}

		const tokenHash = sha256Hex(token);
		const users = await allUsers();
		const now = Date.now();

		const user = users.find((u) => u?.magicLink?.tokenHash === tokenHash);
		const expiresAtMs = user?.magicLink?.expiresAt ? Date.parse(user.magicLink.expiresAt) : 0;
		const isExpired = !expiresAtMs || Number.isNaN(expiresAtMs) || expiresAtMs <= now;
		const isConsumed = !!user?.magicLink?.consumedAt;

		if (!user || isExpired || isConsumed) {
			return res.redirect(redirectTo);
		}

		const nextUser = {
			...user,
			magicLink: {
				...user.magicLink,
				tokenHash: null,
				consumedAt: new Date().toISOString(),
			},
		};
		await updateUser(nextUser);

		req.session.user = {
			id: nextUser.id,
			email: nextUser.email,
			role: nextUser.role,
			org_id: nextUser.org_id || null,
			patientId: nextUser.patientId || null,
		};

		return res.redirect(redirectTo);
	} catch (err) {
		console.error('[auth/magic] error', err);
		return res.redirect(redirectTo);
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
