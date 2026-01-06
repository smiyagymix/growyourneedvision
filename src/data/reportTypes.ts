export interface ReportType {
  id: string;
  name: string;
  description: string;
  format: ('PDF' | 'CSV' | 'Excel')[];
}

export const reportTypes: ReportType[] = [
  { id: 'attendance-summary', name: 'Attendance Summary', description: 'Overview of student attendance records.', format: ['PDF', 'CSV'] },
  { id: 'grade-report', name: 'Grade Report / Report Card', description: 'Detailed academic performance per student.', format: ['PDF'] },
  { id: 'financial-statement', name: 'Financial Statement', description: 'Income and expense summary.', format: ['PDF', 'Excel'] },
  { id: 'user-activity', name: 'User Activity Log', description: 'System usage statistics.', format: ['CSV', 'Excel'] },
  { id: 'health-stats', name: 'Health & Wellness Stats', description: 'Aggregated wellness data.', format: ['PDF', 'CSV'] },
  { id: 'enrollment', name: 'Enrollment Statistics', description: 'Student population breakdown.', format: ['PDF', 'Excel'] },
];
