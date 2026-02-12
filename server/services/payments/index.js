const { NullProvider } = require('./providers/NullProvider');
const { StripeProvider } = require('./providers/StripeProvider');

const getProviderName = () => String(process.env.PAYMENTS_PROVIDER || 'none').trim().toLowerCase();

const getPaymentsProvider = () => {
  const name = getProviderName();
  if (name === 'stripe') return new StripeProvider();
  return new NullProvider();
};

module.exports = {
  getPaymentsProvider,
  getProviderName,
};
