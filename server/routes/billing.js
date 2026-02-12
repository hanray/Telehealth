const express = require('express');

const { requireAuth } = require('../middleware/auth');
const { getPaymentsProvider, getProviderName } = require('../services/payments');

const router = express.Router();

const handleProviderError = (res, err) => {
  const status = Number(err?.statusCode) || 500;
  const message = err?.message || 'Billing request failed';
  return res.status(status).json({ error: message, provider: getProviderName() });
};

router.get('/status', requireAuth, (_req, res) => {
  const provider = getPaymentsProvider();
  return res.json({ provider: provider.name, configured: provider.isConfigured(), capabilities: provider.capabilities() });
});

router.post('/checkout-session', requireAuth, async (req, res) => {
  try {
    const provider = getPaymentsProvider();
    const { planId, successUrl, cancelUrl } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });

    const result = await provider.createCheckoutSession({
      userId: req.user.id,
      planId: String(planId),
      successUrl: successUrl ? String(successUrl) : undefined,
      cancelUrl: cancelUrl ? String(cancelUrl) : undefined,
    });

    return res.json({ provider: provider.name, ...result });
  } catch (err) {
    return handleProviderError(res, err);
  }
});

router.get('/portal', requireAuth, async (req, res) => {
  try {
    const provider = getPaymentsProvider();
    const result = await provider.getCustomerPortalUrl(req.user.id);
    return res.json({ provider: provider.name, ...result });
  } catch (err) {
    return handleProviderError(res, err);
  }
});

// Webhooks are typically unauthenticated. This is a stub for later.
router.post('/webhook', async (req, res) => {
  try {
    const provider = getPaymentsProvider();
    if (!provider.isConfigured()) {
      return res.status(501).json({ error: 'Billing provider not configured', provider: provider.name });
    }
    await provider.handleWebhook(req);
    return res.json({ ok: true, provider: provider.name });
  } catch (err) {
    return handleProviderError(res, err);
  }
});

module.exports = router;
