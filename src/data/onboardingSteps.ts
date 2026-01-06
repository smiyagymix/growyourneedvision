export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
}

export const onboardingSteps: OnboardingStep[] = [
  { id: 'profile', title: 'Complete Your Profile', description: 'Add your photo and personal details.', actionLabel: 'Edit Profile' },
  { id: 'preferences', title: 'Set Preferences', description: 'Choose your theme and notification settings.', actionLabel: 'Go to Settings' },
  { id: 'connect', title: 'Connect Accounts', description: 'Link your Google or Microsoft account.', actionLabel: 'Connect' },
  { id: 'tour', title: 'Take a Tour', description: 'Learn how to navigate the dashboard.', actionLabel: 'Start Tour' },
  { id: 'first-task', title: 'Create First Task', description: 'Add an item to your to-do list.', actionLabel: 'Add Task' },
];
