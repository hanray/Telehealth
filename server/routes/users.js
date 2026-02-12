const express = require('express');

const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const { findById, updateUser } = require('../utils/userStore');
const { parseCountryOfOrigin } = require('../utils/countryOfOrigin');

const mockPatients = {
	'patient-001': {
		id: 'patient-001',
		name: 'Demo Patient',
		age: 42,
		conditions: ['hypertension'],
	},
	'patient-002': {
		id: 'patient-002',
		name: 'Demo Patient 2',
		age: 37,
		conditions: ['asthma'],
	},
};

// Patients can only fetch their own record; clinicians/admins can fetch any.
router.get('/patients/:id', requireAuth, requireRole(['patient', 'doctor', 'nurse', 'admin']), (req, res) => {
	const requestedId = req.params.id;
	const user = req.user;

	const patientIdentifier = user.patientId || user.id;
	if (user.role === 'patient' && patientIdentifier !== requestedId) {
		return res.status(403).json({ error: 'Patients may only access their own record', context: 'Demo / MVP auth', patientId: patientIdentifier });
	}

	const patient = mockPatients[requestedId] || { id: requestedId, name: 'Unknown patient', conditions: [] };
	return res.json({ patient, context: 'Demo / MVP auth' });
});

// Update current user's profile (Demo / MVP)
router.patch('/users/me', requireAuth, async (req, res) => {
	try {
		const source = String(req.body?.countrySource || 'profile').trim().toLowerCase();
		const resolvedSource = (source === 'onboarding' || source === 'profile') ? source : 'profile';

		const parsed = parseCountryOfOrigin(req.body || {}, { source: resolvedSource, required: true });
		if (!parsed.ok) {
			return res.status(400).json({ error: parsed.error || 'Invalid country of origin', context: 'Demo / MVP auth' });
		}

		const stored = await findById(req.user.id);
		if (!stored) {
			return res.status(404).json({ error: 'User not found', context: 'Demo / MVP auth' });
		}

		const nextUser = {
			...stored,
			countryOfOrigin: parsed.value,
			country: parsed.value.countryCode || stored.country || null,
		};

		await updateUser(nextUser);

		// Keep the session identity in sync.
		req.session.user = {
			...req.session.user,
			countryOfOrigin: nextUser.countryOfOrigin,
			country: nextUser.country,
		};
		req.user = { ...req.user, countryOfOrigin: nextUser.countryOfOrigin, country: nextUser.country, hasCountryOfOrigin: true };

		return res.json({ user: req.user, context: 'Demo / MVP auth' });
	} catch (err) {
		console.error('[users/me] patch error', err);
		return res.status(500).json({ error: 'Failed to update profile', context: 'Demo / MVP auth' });
	}
});

module.exports = router;
