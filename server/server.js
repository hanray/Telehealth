// server/server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const https = require('https');
const session = require('express-session');
const cookieParser = require('cookie-parser');

dns.setDefaultResultOrder?.('ipv4first');

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URLS = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001')
  .split(',').map(s => s.trim()).filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI;
const HAS_MONGO = !!MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || 'telehealth-demo-secret';
const TRUST_PROXY = process.env.TRUST_PROXY;

const describeMongoUri = (uri) => {
  if (!uri) return null;
  try {
    const u = new URL(uri);
    return {
      protocol: u.protocol.replace(/:$/, ''),
      host: u.hostname,
      db: u.pathname.replace(/^\//, '') || '(none)',
    };
  } catch (err) {
    return { parseError: err?.message || 'invalid URI' };
  }
};
const mongoInfo = describeMongoUri(MONGODB_URI);

const normalizeOrigin = (value = '') => value.replace(/\/$/, '');
const ALLOWED_ORIGINS = new Set(CLIENT_URLS.map(normalizeOrigin));

console.log('ENV check:', {
  NODE_ENV,
  CLIENT_URLS,
  hasMongo: HAS_MONGO,
  mongoInfo,
});

if (!HAS_MONGO) {
  console.warn('⚠️  MONGODB_URI is not set; Mongo-backed features (messages) are disabled.');
}

const app = express();
const trustProxyValue = (() => {
  if (TRUST_PROXY === undefined) return 1;
  if (TRUST_PROXY === 'false' || TRUST_PROXY === '0') return false;
  if (TRUST_PROXY === 'true') return true;
  return TRUST_PROXY;
})();
app.set('trust proxy', trustProxyValue);

/* ----------- Middleware ----------- */
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalized = normalizeOrigin(origin);
      if (ALLOWED_ORIGINS.has(normalized)) return cb(null, true);
      if (normalized.startsWith('http://localhost:')) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: 'telehealth.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Demo / MVP auth: not using HTTPS in local/dev
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

/* ----------- Enhanced DB Connect with pooling & auto-reconnect ----------- */
mongoose.set('strictQuery', true);
// Avoid buffering forever if DB isn't reachable
mongoose.set('bufferCommands', false);

// Enhanced connection options for better pooling and stability
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,  // 10s to find a server
  socketTimeoutMS: 45000,           // 45s socket idle (increased from 20s)
  maxPoolSize: 10,                  // Increased from 5 for better concurrency
  minPoolSize: 2,                   // Keep minimum connections ready
  maxIdleTimeMS: 60000,             // Close idle connections after 1 minute
  heartbeatFrequencyMS: 10000,      // Check connection health every 10s
  retryWrites: true,                // Retry failed writes automatically
  w: 'majority',                    // Write concern for better consistency
};

// Connection with retry logic
const connectWithRetry = async (retryCount = 0) => {
  const maxRetries = 5;
  
  try {
    console.log(`⏳ Connecting to MongoDB... (attempt ${retryCount + 1}/${maxRetries})`);
    await mongoose.connect(MONGODB_URI, mongoOptions);
    console.log('✅ Connected to MongoDB with connection pooling');
    console.log(`📊 Pool size: min=${mongoOptions.minPoolSize}, max=${mongoOptions.maxPoolSize}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    
    if (retryCount < maxRetries - 1) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      console.log(`⏰ Retrying in ${delay/1000} seconds...`);
      setTimeout(() => connectWithRetry(retryCount + 1), delay);
    } else {
      console.error('❌ Failed to connect after maximum retries. Check IP whitelist in Atlas & MONGODB_URI credentials.');
    }
  }
};

// Initial connection
if (HAS_MONGO) {
  connectWithRetry();
}

// MongoDB connection event handlers for auto-reconnection
if (HAS_MONGO) {
  mongoose.connection.on('connected', () => {
    console.log('📗 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('📕 Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('📙 Mongoose disconnected from MongoDB');
    // Attempt to reconnect after a disconnection
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      connectWithRetry();
    }, 5000);
  });

  // Log connection pool stats periodically (optional - comment out in production)
  if (NODE_ENV !== 'production') {
    setInterval(() => {
      const { readyState } = mongoose.connection;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      console.log(`📊 DB State: ${states[readyState] || 'unknown'}`);
    }, 30000); // Every 30 seconds
  }
}

/* ----------- Routes ----------- */
app.get('/', (_req, res) => {
  res.json({ message: 'Telemedicine API Server is running!' });
});

app.get('/api/health', (_req, res) => {
  const dbState = HAS_MONGO
    ? ['disconnected','connected','connecting','disconnecting'][mongoose.connection.readyState] || 'unknown'
    : 'disabled';
  const status = HAS_MONGO ? (dbState === 'connected' ? 'OK' : 'DEGRADED') : 'DISABLED';
  
  res.json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: NODE_ENV,
    dbState,
    poolInfo: HAS_MONGO ? {
      maxPoolSize: mongoOptions.maxPoolSize,
      minPoolSize: mongoOptions.minPoolSize,
      heartbeatFrequency: mongoOptions.heartbeatFrequencyMS,
    } : null,
    mongoConfigured: HAS_MONGO,
  });
});

/* Middleware to check DB connection before processing requests */
const checkDbConnection = (req, res, next) => {
  if (!HAS_MONGO) {
    return res.status(503).json({
      error: 'MongoDB not configured; messages API is disabled for this environment.',
      dbState: 'disabled',
    });
  }

  if (mongoose.connection.readyState !== 1) {
    console.error('❌ Database not connected, current state:', mongoose.connection.readyState);
    return res.status(503).json({ 
      error: 'Database temporarily unavailable. Please try again in a moment.',
      dbState: mongoose.connection.readyState 
    });
  }
  next();
};

// API route mounts (Demo / MVP auth)
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const pharmacyRoutes = require('./routes/pharmacies');
const prescriptionRoutes = require('./routes/prescriptions');
const transactionRoutes = require('./routes/transactions');
const planRoutes = require('./routes/plans');
const subscriptionRoutes = require('./routes/subscriptions');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api', userRoutes); // exposes /api/patients/:id
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

if (HAS_MONGO) {
  app.use('/api/messages', checkDbConnection, messageRoutes);
} else {
  app.use('/api/messages', (_req, res) => {
    return res.status(503).json({
      error: 'Messages API disabled: MongoDB is not configured for this environment.',
      context: 'Demo / MVP auth',
    });
  });
}
console.log('✅ Core routes loaded (auth, admin, appointments, patients, messages)');

/* ----------- Start ----------- */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 CORS allowed: ${CLIENT_URLS.join(', ') || '(none)'}`);
});
server.on('error', (err) => {
  console.error('❌ Server listen error:', err?.message || err);
  if (err?.stack) console.error(err.stack);
});

/* ----------- Graceful shutdown ----------- */
async function shutdown(signal = 'SIGTERM') {
  try {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully…`);

    // 1) Stop accepting new connections
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ HTTP server closed');
    }

    // 2) Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed');
    }

    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Shutdown error:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log
  if (NODE_ENV !== 'production') {
    process.exit(1);
  }
});