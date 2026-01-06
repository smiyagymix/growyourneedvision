export interface RoleDefinition {
  id: string;
  displayName: string;
  description: string;
  isInternal: boolean; // True for staff, false for users
}

export const roleDefinitions: RoleDefinition[] = [
  { id: 'Owner', displayName: 'Platform Owner', description: 'Full system access and configuration control.', isInternal: true },
  { id: 'Admin', displayName: 'School Administrator', description: 'Manages school operations, users, and settings.', isInternal: true },
  { id: 'Teacher', displayName: 'Teacher', description: 'Manages classes, grades, and student interactions.', isInternal: true },
  { id: 'Student', displayName: 'Student', description: 'Access to learning materials, grades, and wellness tools.', isInternal: false },
  { id: 'Parent', displayName: 'Parent / Guardian', description: 'View child progress, attendance, and communicate with school.', isInternal: false },
  { id: 'Individual', displayName: 'Individual User', description: 'Personal use for wellness and self-improvement.', isInternal: false },
  { id: 'Guest', displayName: 'Guest', description: 'Limited read-only access to public information.', isInternal: false },
];
