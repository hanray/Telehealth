const { PaymentProvider } = require('../PaymentProvider');
const { PaymentsNotConfiguredError } = require('../errors');

const hasEnv = (key) => {
  const v = String(process.env[key] || '').trim();
  return !!v;
};

class StripeProvider extends PaymentProvider {
  constructor() {
    super('stripe');
  }

  capabilities() {
    // Skeleton only: real checkout/portal/webhook handling will be implemented later.
    return {
      checkout: false,
      portal: false,
      webhook: false,
    };
  }

  isConfigured() {
    if (!hasEnv('STRIPE_SECRET_KEY')) return false;
    if (!hasEnv('APP_BASE_URL')) return false;
    try {
      // Optional dependency: only required when PAYMENTS_PROVIDER=stripe.
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      require('stripe');
      return true;
    } catch (_err) {
      return false;
    }
  }

  getStripeClient() {
    if (!hasEnv('STRIPE_SECRET_KEY')) {
      throw new PaymentsNotConfiguredError('Stripe is selected but STRIPE_SECRET_KEY is missing.');
    }

    let Stripe;
    try {
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      Stripe = require('stripe');
    } catch (err) {
      throw new PaymentsNotConfiguredError('Stripe provider is enabled but the stripe package is not installed.');
    }

    return new Stripe(String(process.env.STRIPE_SECRET_KEY).trim());
  }

  async createCheckoutSession({ userId, planId, successUrl, cancelUrl }) {
    if (!this.isConfigured()) {
      throw new PaymentsNotConfiguredError('Stripe billing is not configured yet.');
    }

    // Skeleton only: do not create real sessions until product confirms plan mapping.
    // We return a clear Not Implemented response for now.
    throw new PaymentsNotConfiguredError(
      `Stripe checkout session not implemented yet (userId=${userId || 'n/a'}, planId=${planId || 'n/a'}).`
    );
  }

  async getCustomerPortalUrl(userId) {
    if (!this.isConfigured()) {
      throw new PaymentsNotConfiguredError('Stripe billing portal is not configured yet.');
    }

    throw new PaymentsNotConfiguredError(`Stripe customer portal not implemented yet (userId=${userId || 'n/a'}).`);
  }

  async handleWebhook() {
    if (!this.isConfigured()) {
      throw new PaymentsNotConfiguredError('Stripe webhooks are not configured yet.');
    }

    throw new PaymentsNotConfiguredError('Stripe webhook handling not implemented yet.');
  }
}

module.exports = {
  StripeProvider,
};
