const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'CAD' },
    interval: { type: String, enum: ['month', 'year'], default: 'month' },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Plan', PlanSchema);