export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Core' | 'Education' | 'Lifestyle' | 'Admin';
}

export const features: Feature[] = [
  {
    id: 'ai-concierge',
    title: 'AI Concierge',
    description: 'An intelligent assistant that helps users navigate the platform, answers questions, and provides personalized recommendations.',
    icon: 'Sparkles',
    category: 'Core',
  },
  {
    id: 'virtual-classroom',
    title: 'Virtual Classroom',
    description: 'Integrated video conferencing and collaboration tools for remote learning and virtual meetings.',
    icon: 'VideoCamera',
    category: 'Education',
  },
  {
    id: 'wellness-tracker',
    title: 'Wellness Tracker',
    description: 'Monitor physical and mental health metrics, set goals, and receive insights to improve overall well-being.',
    icon: 'Heart',
    category: 'Lifestyle',
  },
  {
    id: 'role-management',
    title: 'Advanced Role Management',
    description: 'Granular permission settings for Administrators, Teachers, Students, and Parents to ensure data security.',
    icon: 'ShieldCheck',
    category: 'Admin',
  },
  {
    id: 'gamification-engine',
    title: 'Gamification Engine',
    description: 'Engage users with points, badges, and leaderboards to motivate learning and healthy habits.',
    icon: 'Trophy',
    category: 'Core',
  },
];
