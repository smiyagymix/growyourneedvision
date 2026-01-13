/**
 * Component Exports Index
 * 
 * Centralized exports for all feature components
 */

// Grade Management
export { default as GradeManager } from './GradeManager';
export { default as GradeForm } from './grades/GradeForm';
export { default as GradeTable } from './grades/GradeTable';
export { default as GradeStats } from './grades/GradeStats';

// Attendance Tracking
export { default as AttendanceTracker } from './AttendanceTracker';
export { default as AttendanceForm } from './attendance/AttendanceForm';
export { default as AttendanceSheet } from './attendance/AttendanceSheet';
export { default as LowAttendanceAlert } from './attendance/LowAttendanceAlert';

// Notification Management
export { default as NotificationCenter } from './NotificationCenter';
export { default as NotificationList } from './notifications/NotificationList';
export { default as NotificationPreferencesPanel } from './notifications/PreferencesPanel';

// Types
export type { GradeManagerProps } from './GradeManager';
export type { GradeFormProps } from './grades/GradeForm';
export type { GradeTableProps } from './grades/GradeTable';
export type { GradeStatsProps } from './grades/GradeStats';

export type { AttendanceTrackerProps } from './AttendanceTracker';
export type { AttendanceFormProps } from './attendance/AttendanceForm';
export type { AttendanceSheetProps } from './attendance/AttendanceSheet';
export type { LowAttendanceAlertProps } from './attendance/LowAttendanceAlert';

export type { NotificationCenterProps } from './NotificationCenter';
export type { NotificationListProps } from './notifications/NotificationList';
export type { NotificationPreferencesPanelProps } from './notifications/PreferencesPanel';
