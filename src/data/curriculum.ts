export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
}

export const curriculumSubjects: Subject[] = [
  { id: 'math', name: 'Mathematics', code: 'MATH', department: 'STEM' },
  { id: 'sci', name: 'Science', code: 'SCI', department: 'STEM' },
  { id: 'eng', name: 'English Literature', code: 'ENG', department: 'Humanities' },
  { id: 'hist', name: 'History', code: 'HIST', department: 'Humanities' },
  { id: 'art', name: 'Visual Arts', code: 'ART', department: 'Arts' },
  { id: 'pe', name: 'Physical Education', code: 'PE', department: 'Health' },
  { id: 'cs', name: 'Computer Science', code: 'CS', department: 'STEM' },
  { id: 'mus', name: 'Music', code: 'MUS', department: 'Arts' },
  { id: 'geo', name: 'Geography', code: 'GEO', department: 'Humanities' },
  { id: 'lang', name: 'Foreign Languages', code: 'LANG', department: 'Humanities' },
];
