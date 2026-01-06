export interface Integration {
  id: string;
  name: string;
  category: 'LMS' | 'Communication' | 'Productivity' | 'Payment';
  logo: string;
}

export const integrations: Integration[] = [
  { id: 'google-classroom', name: 'Google Classroom', category: 'LMS', logo: 'google-classroom.png' },
  { id: 'canvas', name: 'Canvas LMS', category: 'LMS', logo: 'canvas.png' },
  { id: 'zoom', name: 'Zoom', category: 'Communication', logo: 'zoom.png' },
  { id: 'slack', name: 'Slack', category: 'Communication', logo: 'slack.png' },
  { id: 'microsoft-teams', name: 'Microsoft Teams', category: 'Communication', logo: 'teams.png' },
  { id: 'stripe', name: 'Stripe', category: 'Payment', logo: 'stripe.png' },
  { id: 'google-drive', name: 'Google Drive', category: 'Productivity', logo: 'drive.png' },
  { id: 'dropbox', name: 'Dropbox', category: 'Productivity', logo: 'dropbox.png' },
];
