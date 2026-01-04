const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Demo-only fallback data to keep UI flows intact when MongoDB is unavailable
const mockAppointments = [
	{
		id: 'apt-001',
		patientId: 'patient-001',
		patientName: 'Demo Patient',
		providerName: 'Dr. Smith',
		providerRole: 'doctor',
		status: 'scheduled',
		date: '2026-01-05',
		time: '14:00',
		appointmentType: 'follow-up',
		priority: 'Normal',
	},
	{
		id: 'apt-002',
		patientId: 'patient-002',
		patientName: 'Demo Patient 2',
		providerName: 'Nurse Johnson',
		providerRole: 'nurse',
		status: 'in-progress',
		date: '2026-01-05',
		time: '16:00',
		appointmentType: 'vitals-check',
		priority: 'Normal',
	},
];

const hasMongo = () => mongoose.connection?.readyState === 1;

router.get('/', requireAuth, requireRole(['doctor', 'nurse', 'admin', 'patient']), async (req, res) => {
	if (!hasMongo()) {
		return res.json({ appointments: mockAppointments, context: 'Demo / Mongo disabled' });
	}

	try {
		const query = {};
		if (req.user.role === 'patient') {
			query.patientId = req.user.patientId || req.user.id;
		}
		const items = await Appointment.find(query).sort({ date: 1, time: 1 }).lean();
		const normalized = items.map((a) => ({
			id: a._id?.toString(),
			...a,
		}));
		return res.json({ appointments: normalized });
	} catch (err) {
		console.error('[appointments] fetch error', err);
		return res.status(500).json({ error: err.message });
	}
});

router.post('/', requireAuth, requireRole(['doctor', 'nurse', 'admin']), async (req, res) => {
	if (!hasMongo()) {
		return res.status(503).json({ error: 'MongoDB not connected; cannot create appointment' });
	}

	try {
		const body = req.body || {};
		if (!body.patientName || !body.date || !body.time) {
			return res.status(400).json({ error: 'patientName, date, and time are required' });
		}

		const doc = await Appointment.create({
			patientName: body.patientName,
			patientEmail: body.patientEmail || '',
			patientPhone: body.patientPhone || '',
			patientId: body.patientId || `P${Date.now().toString(36)}`,
			providerId: body.providerId || req.user.id,
			providerName: body.providerName || req.user.email,
			providerRole: body.providerRole || req.user.role,
			date: body.date,
			time: body.time,
			appointmentType: body.appointmentType || 'consult',
			priority: body.priority || 'Normal',
			status: 'scheduled',
			chiefComplaint: body.chiefComplaint || '',
			notes: body.notes || '',
		});

		const response = { id: doc._id?.toString(), ...doc.toObject() };
		return res.status(201).json({ appointment: response });
	} catch (err) {
		console.error('[appointments] create error', err);
		return res.status(500).json({ error: err.message });
	}
});

module.exports = router;
