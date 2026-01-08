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
  { id: 'sendgrid', name: 'SendGrid', category: 'Email', logo: 'sendgrid.png' },
  { id: 'resend', name: 'Resend', category: 'Email', logo: 'resend.png' },
  { id: 'mailgun', name: 'Mailgun', category: 'Email', logo: 'mailgun.png' },
  { id: 'google-analytics', name: 'Google Analytics', category: 'Analytics', logo: 'google-analytics.png' },
  { id: 'mixpanel', name: 'Mixpanel', category: 'Analytics', logo: 'mixpanel.png' },
  { id: 'amplitude', name: 'Amplitude', category: 'Analytics', logo: 'amplitude.png' },
  { id: 'aws-s3', name: 'AWS S3', category: 'Storage', logo: 'aws-s3.png' },
  { id: 'cloudflare-r2', name: 'Cloudflare R2', category: 'Storage', logo: 'cloudflare-r2.png' },
  { id: 'digitalocean-spaces', name: 'DigitalOcean Spaces', category: 'Storage', logo: 'digitalocean-spaces.png' },
];
