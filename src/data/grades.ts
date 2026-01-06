export interface GradeLevel {
  id: string;
  name: string;
  shortName: string;
  ageRange: string;
}

export const gradeLevels: GradeLevel[] = [
  { id: 'k', name: 'Kindergarten', shortName: 'K', ageRange: '5-6' },
  { id: '1', name: '1st Grade', shortName: '1st', ageRange: '6-7' },
  { id: '2', name: '2nd Grade', shortName: '2nd', ageRange: '7-8' },
  { id: '3', name: '3rd Grade', shortName: '3rd', ageRange: '8-9' },
  { id: '4', name: '4th Grade', shortName: '4th', ageRange: '9-10' },
  { id: '5', name: '5th Grade', shortName: '5th', ageRange: '10-11' },
  { id: '6', name: '6th Grade', shortName: '6th', ageRange: '11-12' },
  { id: '7', name: '7th Grade', shortName: '7th', ageRange: '12-13' },
  { id: '8', name: '8th Grade', shortName: '8th', ageRange: '13-14' },
  { id: '9', name: '9th Grade (Freshman)', shortName: '9th', ageRange: '14-15' },
  { id: '10', name: '10th Grade (Sophomore)', shortName: '10th', ageRange: '15-16' },
  { id: '11', name: '11th Grade (Junior)', shortName: '11th', ageRange: '16-17' },
  { id: '12', name: '12th Grade (Senior)', shortName: '12th', ageRange: '17-18' },
];
