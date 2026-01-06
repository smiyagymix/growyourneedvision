export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company?: string;
  content: string;
  avatarUrl?: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    author: 'Sarah Jenkins',
    role: 'Principal',
    company: 'Oakwood High School',
    content: 'Grow Your Need Vision has transformed how we manage our school. The integration between academic tracking and student wellness is a game-changer.',
    rating: 5,
  },
  {
    id: '2',
    author: 'Michael Chen',
    role: 'Student',
    content: 'I love the gamification features! Earning badges for completing my homework and tracking my workouts makes everything more fun.',
    rating: 5,
  },
  {
    id: '3',
    author: 'Emily Rodriguez',
    role: 'Parent',
    content: 'Finally, a platform that keeps me connected with my child\'s education without being overwhelming. The parent dashboard is intuitive and helpful.',
    rating: 4,
  },
  {
    id: '4',
    author: 'David Smith',
    role: 'IT Administrator',
    company: 'TechEd Solutions',
    content: 'The security features and role-based access control give us peace of mind. Deployment was smooth and the support team is excellent.',
    rating: 5,
  },
];
