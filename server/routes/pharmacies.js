const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const { isMongoReady } = require('../helpers/dbReady');

const router = express.Router();

const SEED_PHARMACIES = [
  // Canada (Ontario)
  { _id: 'pharm1', name: 'Shoppers Drug Mart', address: '100 King St W', city: 'Toronto', province: 'ON', country: 'CA', phone: '+1-416-555-0101', active: true },
  { _id: 'pharm2', name: 'Rexall', address: '250 Yonge St', city: 'Toronto', province: 'ON', country: 'CA', phone: '+1-416-555-0102', active: true },
  { _id: 'pharm3', name: 'Pharmasave', address: '10 Dundas St E', city: 'Toronto', province: 'ON', country: 'CA', phone: '+1-416-555-0103', active: true },
  { _id: 'ca_on_guardian_ottawa', name: 'Guardian Pharmacy', address: '200 Bank St', city: 'Ottawa', province: 'ON', country: 'CA', phone: '+1-613-555-0104', active: true },
  { _id: 'ca_on_ida_mississauga', name: 'IDA Pharmacy', address: '90 Burnhamthorpe Rd W', city: 'Mississauga', province: 'ON', country: 'CA', phone: '+1-905-555-0105', active: true },
  { _id: 'ca_on_walmart_brampton', name: 'Walmart Pharmacy', address: '100 Queen St E', city: 'Brampton', province: 'ON', country: 'CA', phone: '+1-905-555-0106', active: true },
  { _id: 'ca_on_costco_markham', name: 'Costco Pharmacy', address: '15 Yorktech Dr', city: 'Markham', province: 'ON', country: 'CA', phone: '+1-905-555-0107', active: true },
  { _id: 'ca_on_loblaws_northyork', name: 'Loblaws Pharmacy', address: '4000 Bathurst St', city: 'North York', province: 'ON', country: 'CA', phone: '+1-416-555-0108', active: true },

  // Ghana
  { _id: 'gh_accra_ernest_chemists', name: 'Ernest Chemists', address: 'Oxford St (Osu)', city: 'Accra', province: 'Greater Accra', country: 'GH', phone: '+233-30-555-0101', active: true },
  { _id: 'gh_accra_melcom_pharmacy', name: 'Melcom Pharmacy', address: 'Spintex Rd', city: 'Accra', province: 'Greater Accra', country: 'GH', phone: '+233-30-555-0102', active: true },
  { _id: 'gh_kumasi_olympia_pharmacy', name: 'Olympia Pharmacy', address: 'Adum', city: 'Kumasi', province: 'Ashanti', country: 'GH', phone: '+233-32-555-0103', active: true },
  { _id: 'gh_takoradi_community_pharmacy', name: 'Community Pharmacy', address: 'Market Circle', city: 'Sekondi-Takoradi', province: 'Western', country: 'GH', phone: '+233-31-555-0104', active: true },
  { _id: 'gh_tamale_northern_pharmacy', name: 'Northern Pharmacy', address: 'Central Business District', city: 'Tamale', province: 'Northern', country: 'GH', phone: '+233-37-555-0105', active: true },
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