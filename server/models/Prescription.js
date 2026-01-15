const mongoose = require('mongoose');

const NormalizedSchema = new mongoose.Schema(
  {
    medicationName: String,
    dosage: String,
    frequency: String,
    refillsAllowed: Number,
    instructions: String,
  },
  { _id: false }
);

const PharmacySnapshotSchema = new mongoose.Schema(
  {
    name: String,
    address: String,
    phone: String,
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    pharmacyId: { type: String, required: true, index: true },
    pharmacySnapshot: PharmacySnapshotSchema,

    rawText: { type: String, required: true },
    normalized: NormalizedSchema,

    status: {
      type: String,
      enum: ['Sent', 'Received', 'Processing', 'Ready', 'Dispensed'],
      default: 'Sent',
      index: true,
    },

    appointmentId: { type: String },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ pharmacyId: 1, status: 1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);