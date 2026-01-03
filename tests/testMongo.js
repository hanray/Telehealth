const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Set MONGODB_URI before running this script.');
  process.exit(1);
}

(async () => {
  try {
    console.log('Trying to connect to:', uri.replace(/:\/\/[^@]+@/, '://<redacted>@'));
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!');
    await client.close();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
})();
