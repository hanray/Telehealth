const { PaymentProvider } = require('../PaymentProvider');
const { PaymentsNotConfiguredError } = require('../errors');

class NullProvider extends PaymentProvider {
  constructor() {
    super('none');
  }

  isConfigured() {
    return false;
  }

  async createCheckoutSession() {
    throw new PaymentsNotConfiguredError('Billing is not available yet (payments provider not configured).');
  }

  async handleWebhook() {
    throw new PaymentsNotConfiguredError('Billing webhooks are not available yet (payments provider not configured).');
  }

  async getCustomerPortalUrl() {
    throw new PaymentsNotConfiguredError('Billing portal is not available yet (payments provider not configured).');
  }
}

module.exports = {
  NullProvider,
};
