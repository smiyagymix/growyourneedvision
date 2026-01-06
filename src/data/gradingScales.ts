export interface GradeScale {
  grade: string;
  min: number;
  max: number;
  gpa: number;
}

export const standardGradingScale: GradeScale[] = [
  { grade: 'A+', min: 97, max: 100, gpa: 4.0 },
  { grade: 'A', min: 93, max: 96, gpa: 4.0 },
  { grade: 'A-', min: 90, max: 92, gpa: 3.7 },
  { grade: 'B+', min: 87, max: 89, gpa: 3.3 },
  { grade: 'B', min: 83, max: 86, gpa: 3.0 },
  { grade: 'B-', min: 80, max: 82, gpa: 2.7 },
  { grade: 'C+', min: 77, max: 79, gpa: 2.3 },
  { grade: 'C', min: 73, max: 76, gpa: 2.0 },
  { grade: 'C-', min: 70, max: 72, gpa: 1.7 },
  { grade: 'D+', min: 67, max: 69, gpa: 1.3 },
  { grade: 'D', min: 63, max: 66, gpa: 1.0 },
  { grade: 'D-', min: 60, max: 62, gpa: 0.7 },
  { grade: 'F', min: 0, max: 59, gpa: 0.0 },
];
