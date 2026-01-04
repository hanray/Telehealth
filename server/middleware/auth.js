const { findById } = require('../utils/userStore');

const DEMO_LABEL = 'Demo / MVP auth';

async function hydrateUser(req) {
  const sessionUser = req.session?.user;
  if (!sessionUser) return null;

  // Ensure the user still exists in the store; fall back to session identity if lookup fails
  const stored = await findById(sessionUser.id);
  const user = stored
    ? { id: stored.id, email: stored.email, role: stored.role, org_id: stored.org_id || null, patientId: stored.patientId || null }
    : sessionUser;

  req.user = user;
  req.session.user = user;
  return user;
}

async function requireAuth(req, res, next) {
  const user = await hydrateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated', context: DEMO_LABEL });
  }
  next();
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async (req, res, next) => {
    const user = await hydrateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated', context: DEMO_LABEL });
    }
    if (!allowed.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role', required: allowed, context: DEMO_LABEL });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
