/**
 * PaymentProvider interface (JS).
 * Implementations should throw PaymentsNotConfiguredError when unavailable.
 */
class PaymentProvider {
  constructor(name = 'unknown') {
    this.name = name;
  }

  capabilities() {
    return {
      checkout: false,
      portal: false,
      webhook: false,
    };
  }

  isConfigured() {
    return false;
  }

  /**
   * @param {{userId: string, planId: string, successUrl?: string, cancelUrl?: string}} _params
   * @returns {Promise<{url?: string, sessionId?: string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async createCheckoutSession(_params) {
    throw new Error('Not implemented');
  }

  /**
   * @param {*} _req Express request
   */
  // eslint-disable-next-line no-unused-vars
  async handleWebhook(_req) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} _userId
   * @returns {Promise<{url: string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async getCustomerPortalUrl(_userId) {
    throw new Error('Not implemented');
  }
}

module.exports = {
  PaymentProvider,
};
