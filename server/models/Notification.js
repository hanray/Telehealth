const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    contextType: String,
    contextId: String,
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);