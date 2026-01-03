const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Set MONGODB_URI before running this script.');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 7000,   // fast fail
  retryWrites: true,
});

(async () => {
  console.log('NODE:', process.version);
  console.log('URI begins with:', uri.replace(/:\/\/[^@]+@/, '://<redacted>@').slice(0, 60) + '...');
  try {
    console.time('mongoPing');
    await client.db('admin').command({ ping: 1 });
    console.timeEnd('mongoPing');
    console.log('✅ Atlas ping OK');
  } catch (err) {
    console.log('❌ Atlas ping FAILED');
    console.log('name:', err.name);
    console.log('code:', err.code);
    console.log('message:', err.message);
  } finally {
    await client.close().catch(() => {});
    process.exit(0);
  }
})();

