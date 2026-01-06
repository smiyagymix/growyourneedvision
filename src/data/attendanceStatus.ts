export interface AttendanceStatus {
  code: string;
  label: string;
  color: string;
  description: string;
  isPresent: boolean;
}

export const attendanceStatuses: AttendanceStatus[] = [
  { code: 'P', label: 'Present', color: 'green', description: 'Student is present in class.', isPresent: true },
  { code: 'A', label: 'Absent (Unexcused)', color: 'red', description: 'Student is absent without a valid reason.', isPresent: false },
  { code: 'E', label: 'Excused Absence', color: 'blue', description: 'Student is absent with a valid reason (e.g., medical).', isPresent: false },
  { code: 'T', label: 'Tardy', color: 'yellow', description: 'Student arrived late.', isPresent: true },
  { code: 'L', label: 'Left Early', color: 'orange', description: 'Student left class before dismissal.', isPresent: true },
];
