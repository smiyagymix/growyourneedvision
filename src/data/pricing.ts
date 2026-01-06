export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  recommended?: boolean;
  targetAudience: 'Individual' | 'School' | 'Enterprise';
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'basic-individual',
    name: 'Starter',
    price: 0,
    currency: 'USD',
    period: 'monthly',
    features: [
      'Access to basic wellness tools',
      'Personal dashboard',
      'Community forums access',
      'Basic storage (5GB)',
    ],
    targetAudience: 'Individual',
  },
  {
    id: 'pro-individual',
    name: 'Pro Achiever',
    price: 12.99,
    currency: 'USD',
    period: 'monthly',
    features: [
      'Advanced wellness analytics',
      'Unlimited storage',
      'Priority support',
      'Exclusive learning content',
      'Gamification badges',
    ],
    recommended: true,
    targetAudience: 'Individual',
  },
  {
    id: 'school-standard',
    name: 'School Essentials',
    price: 499,
    currency: 'USD',
    period: 'monthly',
    features: [
      'Up to 500 students',
      'Teacher & Parent portals',
      'Attendance tracking',
      'Gradebook management',
      'Standard reporting',
    ],
    targetAudience: 'School',
  },
  {
    id: 'school-enterprise',
    name: 'District Unlimited',
    price: 1999,
    currency: 'USD',
    period: 'monthly',
    features: [
      'Unlimited students',
      'Advanced AI analytics',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
    ],
    targetAudience: 'School',
  },
];
