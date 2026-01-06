export interface AssignmentType {
  id: string;
  name: string;
  weight: number; // Default weight in grading
}

export const assignmentTypes: AssignmentType[] = [
  { id: 'hw', name: 'Homework', weight: 0.15 },
  { id: 'quiz', name: 'Quiz', weight: 0.20 },
  { id: 'test', name: 'Test / Exam', weight: 0.35 },
  { id: 'project', name: 'Project', weight: 0.20 },
  { id: 'participation', name: 'Participation', weight: 0.10 },
  { id: 'essay', name: 'Essay / Paper', weight: 0.20 },
  { id: 'lab', name: 'Lab Report', weight: 0.15 },
  { id: 'presentation', name: 'Presentation', weight: 0.15 },
];
