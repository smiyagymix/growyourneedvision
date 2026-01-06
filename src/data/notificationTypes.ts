export interface NotificationType {
  id: string;
  name: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  icon: string;
}

export const notificationTypes: NotificationType[] = [
  { id: 'system', name: 'System Update', priority: 'High', icon: 'Cog' },
  { id: 'assignment', name: 'New Assignment', priority: 'Medium', icon: 'BookOpen' },
  { id: 'grade', name: 'Grade Posted', priority: 'Medium', icon: 'AcademicCap' },
  { id: 'attendance', name: 'Attendance Alert', priority: 'High', icon: 'Clock' },
  { id: 'message', name: 'New Message', priority: 'Medium', icon: 'Chat' },
  { id: 'event', name: 'Event Reminder', priority: 'Low', icon: 'Calendar' },
  { id: 'security', name: 'Security Alert', priority: 'Critical', icon: 'ShieldExclamation' },
  { id: 'payment', name: 'Payment Due', priority: 'High', icon: 'CreditCard' },
];
