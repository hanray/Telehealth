// Simple helper to centralize Mongo readiness checks.
// Consider Mongo "ready" only when connected (readyState === 1).
const isMongoReady = () => {
  try {
    const mongoose = require('mongoose');
    return mongoose?.connection?.readyState === 1;
  } catch (err) {
    return false;
  }
};

module.exports = {
  isMongoReady,
};