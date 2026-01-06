export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  includedIn: string[]; // Plan IDs
}

export const subscriptionFeatures: SubscriptionFeature[] = [
  { id: 'basic-access', name: 'Platform Access', description: 'Access to core features.', includedIn: ['basic', 'pro', 'enterprise'] },
  { id: 'storage-5gb', name: '5GB Storage', description: 'Cloud storage limit.', includedIn: ['basic'] },
  { id: 'storage-unlimited', name: 'Unlimited Storage', description: 'No storage limits.', includedIn: ['pro', 'enterprise'] },
  { id: 'analytics', name: 'Advanced Analytics', description: 'Deep dive into performance data.', includedIn: ['pro', 'enterprise'] },
  { id: 'api-access', name: 'API Access', description: 'Developer API keys.', includedIn: ['enterprise'] },
  { id: 'priority-support', name: 'Priority Support', description: '24/7 support access.', includedIn: ['pro', 'enterprise'] },
  { id: 'white-label', name: 'White Labeling', description: 'Custom branding.', includedIn: ['enterprise'] },
];
