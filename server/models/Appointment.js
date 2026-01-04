const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    patientEmail: String,
    patientPhone: String,
    patientId: String,

    providerId: String,
    providerName: String,
    providerRole: { type: String, default: 'doctor' },

    date: { type: String, required: true },
    time: { type: String, required: true },
    appointmentType: { type: String, default: 'consult' },
    priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },

    chiefComplaint: String,
    notes: String,
  },
  { timestamps: true }
);

AppointmentSchema.index({ patientId: 1, date: 1, time: 1 });
AppointmentSchema.index({ providerId: 1, date: 1, time: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);