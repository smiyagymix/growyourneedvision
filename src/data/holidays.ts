export interface Holiday {
  id: string;
  name: string;
  date: string; // MM-DD format for recurring
  type: 'Public' | 'Religious' | 'School';
}

export const commonHolidays: Holiday[] = [
  { id: 'new-year', name: 'New Year\'s Day', date: '01-01', type: 'Public' },
  { id: 'mlk-day', name: 'Martin Luther King Jr. Day', date: '01-15', type: 'Public' }, // Approximate
  { id: 'presidents-day', name: 'Presidents\' Day', date: '02-19', type: 'Public' }, // Approximate
  { id: 'memorial-day', name: 'Memorial Day', date: '05-27', type: 'Public' }, // Approximate
  { id: 'independence-day', name: 'Independence Day', date: '07-04', type: 'Public' },
  { id: 'labor-day', name: 'Labor Day', date: '09-02', type: 'Public' }, // Approximate
  { id: 'thanksgiving', name: 'Thanksgiving Day', date: '11-28', type: 'Public' }, // Approximate
  { id: 'christmas', name: 'Christmas Day', date: '12-25', type: 'Religious' },
  { id: 'winter-break', name: 'Winter Break Starts', date: '12-20', type: 'School' },
  { id: 'spring-break', name: 'Spring Break Starts', date: '03-15', type: 'School' },
];
