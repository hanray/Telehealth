const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const { isMongoReady } = require('../helpers/dbReady');

const router = express.Router();

const SEED_PHARMACIES = [
  { _id: 'pharm1', name: 'City Pharmacy', address: '123 Main St', phone: '+1-555-1111' },
  { _id: 'pharm2', name: 'Community Pharmacy', address: '45 Elm Ave', phone: '+1-555-2222' },
  { _id: 'pharm3', name: 'Downtown Pharmacy', address: '77 Market Rd', phone: '+1-555-3333' },
];

const normalize = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = obj;
  return { id: _id?.toString?.() || obj.id, ...rest };
};

const ensureSeeds = async () => {
  if (!isMongoReady()) return;
  const count = await Pharmacy.countDocuments();
  if (count > 0) return;
  try {
    await Pharmacy.insertMany(SEED_PHARMACIES.map((p) => ({ ...p })), { ordered: false });
  } catch (err) {
    // ignore duplicate errors on concurrent seed
  }
};

router.get('/', async (_req, res) => {
  const useMongo = isMongoReady();
  if (!useMongo) {
    return res.json({ pharmacies: SEED_PHARMACIES.map(({ _id, ...rest }) => ({ id: _id, ...rest })) });
  }

  try {
    await ensureSeeds();
    const items = await Pharmacy.find({ active: { $ne: false } }).sort({ name: 1 }).lean();
    return res.json({ pharmacies: items.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load pharmacies' });
  }
});

module.exports = router;
module.exports.ensureSeeds = ensureSeeds;
module.exports.SEED_PHARMACIES = SEED_PHARMACIES;