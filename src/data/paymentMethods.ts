export interface PaymentMethod {
  id: string;
  name: string;
  type: 'Card' | 'Bank' | 'Wallet';
  icon: string;
}

export const paymentMethods: PaymentMethod[] = [
  { id: 'visa', name: 'Visa', type: 'Card', icon: 'visa-logo' },
  { id: 'mastercard', name: 'Mastercard', type: 'Card', icon: 'mastercard-logo' },
  { id: 'amex', name: 'American Express', type: 'Card', icon: 'amex-logo' },
  { id: 'paypal', name: 'PayPal', type: 'Wallet', icon: 'paypal-logo' },
  { id: 'apple-pay', name: 'Apple Pay', type: 'Wallet', icon: 'apple-pay-logo' },
  { id: 'google-pay', name: 'Google Pay', type: 'Wallet', icon: 'google-pay-logo' },
  { id: 'bank-transfer', name: 'Bank Transfer', type: 'Bank', icon: 'bank-icon' },
];
