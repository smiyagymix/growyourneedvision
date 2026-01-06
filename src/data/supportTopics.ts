export interface SupportTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const supportTopics: SupportTopic[] = [
  { id: 'account', title: 'Account & Login', description: 'Issues with signing in or profile settings.', icon: 'User' },
  { id: 'billing', title: 'Billing & Payments', description: 'Invoices, subscriptions, and payment methods.', icon: 'CreditCard' },
  { id: 'technical', title: 'Technical Issues', description: 'Bugs, errors, and performance problems.', icon: 'Chip' },
  { id: 'academic', title: 'Academic Tools', description: 'Help with grades, assignments, and classes.', icon: 'BookOpen' },
  { id: 'wellness', title: 'Wellness Features', description: 'Using the health tracker and mindfulness tools.', icon: 'Heart' },
  { id: 'privacy', title: 'Privacy & Security', description: 'Data protection and safety concerns.', icon: 'ShieldCheck' },
];
