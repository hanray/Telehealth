// server/server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const https = require('https');

dns.setDefaultResultOrder?.('ipv4first');

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URLS = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map(s => s.trim()).filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI;

console.log('ENV check:', {
  NODE_ENV,
  CLIENT_URLS,
  hasMongo: !!MONGODB_URI
});

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set');
  process.exit(1);
}

const app = express();

/* ----------- Middleware ----------- */
app.use(
  cors({
    origin: (origin, cb) => (!origin || CLIENT_URLS.includes(origin) ? cb(null, true) : cb(new Error(`Not allowed by CORS: ${origin}`))),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    
    if (retryCount < maxRetries - 1) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      console.log(`⏰ Retrying in ${delay/1000} seconds...`);
      setTimeout(() => connectWithRetry(retryCount + 1), delay);
    } else {
      console.error('❌ Failed to connect after maximum retries. Check IP whitelist in Atlas & MONGODB_URI credentials.');
      process.exit(1);
    }
  }
};

// Initial connection
connectWithRetry();

// MongoDB connection event handlers for auto-reconnection
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

/* ----------- Routes ----------- */
app.get('/', (_req, res) => {
  res.json({ message: 'Telemedicine API Server is running!' });
});

app.get('/api/health', (_req, res) => {
  const dbState = ['disconnected','connected','connecting','disconnecting'][mongoose.connection.readyState] || 'unknown';
  
  res.json({
    status: dbState === 'connected' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: NODE_ENV,
    dbState,
    poolInfo: {
      maxPoolSize: mongoOptions.maxPoolSize,
      minPoolSize: mongoOptions.minPoolSize,
      heartbeatFrequency: mongoOptions.heartbeatFrequencyMS,
    }
  });
});

/* Middleware to check DB connection before processing requests */
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ Database not connected, current state:', mongoose.connection.readyState);
    return res.status(503).json({ 
      error: 'Database temporarily unavailable. Please try again in a moment.',
      dbState: mongoose.connection.readyState 
    });
  }
  next();
};

/* Mount messages with DB check middleware */
try {
  const messageRoutes = require('./routes/messages');
  app.use('/api/messages', checkDbConnection, messageRoutes);
  console.log('✅ Message routes loaded');
} catch (e) {
  console.log('ℹ️  /routes/messages not found, skipping…');
}

/* ----------- Start ----------- */
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 CORS allowed: ${CLIENT_URLS.join(', ') || '(none)'}`);
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