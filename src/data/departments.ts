export interface Department {
  id: string;
  name: string;
  head?: string; // Role or Title
}

export const departments: Department[] = [
  { id: 'admin', name: 'Administration' },
  { id: 'math', name: 'Mathematics' },
  { id: 'sci', name: 'Science' },
  { id: 'eng', name: 'English & Language Arts' },
  { id: 'soc', name: 'Social Studies' },
  { id: 'arts', name: 'Fine & Performing Arts' },
  { id: 'pe', name: 'Physical Education & Athletics' },
  { id: 'tech', name: 'Technology & Computer Science' },
  { id: 'lang', name: 'World Languages' },
  { id: 'sped', name: 'Special Education' },
  { id: 'counseling', name: 'Counseling & Student Services' },
];
