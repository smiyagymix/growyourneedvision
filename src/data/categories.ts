export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const contentCategories: Category[] = [
  { id: 'edu', name: 'Education', slug: 'education', description: 'Learning resources and academic news.' },
  { id: 'tech', name: 'Technology', slug: 'technology', description: 'Latest tech trends and tutorials.' },
  { id: 'well', name: 'Wellness', slug: 'wellness', description: 'Health, fitness, and mental well-being.' },
  { id: 'life', name: 'Lifestyle', slug: 'lifestyle', description: 'Daily living, hobbies, and culture.' },
  { id: 'news', name: 'School News', slug: 'school-news', description: 'Announcements and updates from the administration.' },
  { id: 'evt', name: 'Events', slug: 'events', description: 'Upcoming gatherings and activities.' },
];
