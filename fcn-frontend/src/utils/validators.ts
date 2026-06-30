export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidEthiopianPhone = (phone: string): boolean =>
  /^(\+251|0)?9\d{8}$/.test(phone.trim());
