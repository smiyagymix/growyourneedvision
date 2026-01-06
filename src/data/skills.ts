export interface Skill {
  id: string;
  name: string;
  category: 'Technical' | 'Soft' | 'Creative' | 'Academic';
  description: string;
}

export const skills: Skill[] = [
  { id: 'math-algebra', name: 'Algebra', category: 'Academic', description: 'Understanding of algebraic structures and equations.' },
  { id: 'coding-python', name: 'Python Programming', category: 'Technical', description: 'Ability to write and debug Python code.' },
  { id: 'comm-public-speaking', name: 'Public Speaking', category: 'Soft', description: 'Effective verbal communication in front of groups.' },
  { id: 'art-digital-design', name: 'Digital Design', category: 'Creative', description: 'Creating visual content using digital tools.' },
  { id: 'sci-biology', name: 'Biology', category: 'Academic', description: 'Study of living organisms and their structure.' },
  { id: 'lead-team-mgmt', name: 'Team Management', category: 'Soft', description: 'Leading and coordinating team efforts.' },
  { id: 'tech-data-analysis', name: 'Data Analysis', category: 'Technical', description: 'Interpreting complex data sets.' },
  { id: 'lang-creative-writing', name: 'Creative Writing', category: 'Creative', description: 'Expressing ideas through narrative writing.' },
];
