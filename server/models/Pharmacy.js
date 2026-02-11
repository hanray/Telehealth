const mongoose = require('mongoose');

const PharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    city: String,
    province: String,
    country: String,
    phone: String,
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pharmacy', PharmacySchema);