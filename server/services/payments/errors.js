class PaymentsNotConfiguredError extends Error {
  constructor(message = 'Payments provider is not configured') {
    super(message);
    this.name = 'PaymentsNotConfiguredError';
    this.statusCode = 501;
  }
}

module.exports = {
  PaymentsNotConfiguredError,
};
