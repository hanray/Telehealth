const express = require('express');

const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');

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

module.exports = router;
