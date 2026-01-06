export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'Academic' | 'Wellness' | 'Social' | 'Special';
}

export const badgeDefinitions: BadgeDefinition[] = [
  { id: 'math-whiz', name: 'Math Whiz', description: 'Scored 95%+ in Mathematics.', imageUrl: '/badges/math.png', category: 'Academic' },
  { id: 'bookworm', name: 'Bookworm', description: 'Read 10 books this semester.', imageUrl: '/badges/book.png', category: 'Academic' },
  { id: 'early-bird', name: 'Early Bird', description: 'Perfect attendance for 1 month.', imageUrl: '/badges/sun.png', category: 'Academic' },
  { id: 'marathoner', name: 'Marathoner', description: 'Logged 50 miles of running.', imageUrl: '/badges/shoe.png', category: 'Wellness' },
  { id: 'helper', name: 'Community Helper', description: 'Volunteered for a school event.', imageUrl: '/badges/hand.png', category: 'Social' },
  { id: 'artist', name: 'Creative Soul', description: 'Submitted 5 art projects.', imageUrl: '/badges/paint.png', category: 'Academic' },
];
