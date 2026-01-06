export interface SchoolType {
  id: string;
  name: string;
  description: string;
}

export const schoolTypes: SchoolType[] = [
  { id: 'public', name: 'Public School', description: 'Government-funded educational institution.' },
  { id: 'private', name: 'Private School', description: 'Independently funded and managed institution.' },
  { id: 'charter', name: 'Charter School', description: 'Publicly funded school with independent management.' },
  { id: 'magnet', name: 'Magnet School', description: 'Public school with specialized courses or curricula.' },
  { id: 'international', name: 'International School', description: 'School following an international curriculum (e.g., IB).' },
  { id: 'boarding', name: 'Boarding School', description: 'School where students live on campus.' },
  { id: 'homeschool', name: 'Homeschooling', description: 'Education conducted at home.' },
  { id: 'online', name: 'Online School', description: 'Virtual education delivered via the internet.' },
];
