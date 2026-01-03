// server/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true }, // e.g. sorted IDs "dr-smith|P001234"
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['patient', 'doctor', 'nurse', 'admin'], required: true },

    recipientId: { type: String, required: true, index: true },
    recipientName: { type: String, required: true },
    recipientRole: { type: String, enum: ['patient', 'doctor', 'nurse', 'admin'], required: true },

    message: { type: String, required: true },
    read: { type: Boolean, default: false },

    attachments: [
      {
        filename: String,
        url: String,
        type: String,
      },
    ],

    messageType: {
      type: String,
      enum: ['text', 'appointment', 'prescription', 'test-result', 'system'],
      default: 'text',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal',
    },

    relatedAppointmentId: String,
    relatedPrescriptionId: String,
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: 1 });      // chronologic reads per convo
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
MessageSchema.index({ read: 1 });

// Optional: TTL to auto-expire messages after N seconds (e.g., 30 days)
// MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// Virtuals
MessageSchema.virtual('formattedTime').get(function () {
  const d = this.createdAt || this.updatedAt || new Date();
  return new Date(d).toLocaleString();
});

module.exports = mongoose.model('Message', MessageSchema);
