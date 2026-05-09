// Common validation rules (e.g. email, phone format)
exports.isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
