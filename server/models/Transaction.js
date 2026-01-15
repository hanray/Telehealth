const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    prescriptionId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CAD' },
    method: { type: String, enum: ['Card', 'PayPal', 'Remitly', 'MoMo'], default: 'Card' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
    transactionId: { type: String, required: true },
    demoAutoApprove: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ prescriptionId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);