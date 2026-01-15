const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ['active', 'canceled', 'paused'], default: 'active', index: true },
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ userId: 1, planId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);