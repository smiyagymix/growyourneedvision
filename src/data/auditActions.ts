export interface AuditAction {
  id: string;
  action: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
}

export const auditActions: AuditAction[] = [
  { id: 'login', action: 'User Login', description: 'User logged into the system.', severity: 'Low' },
  { id: 'logout', action: 'User Logout', description: 'User logged out.', severity: 'Low' },
  { id: 'create_user', action: 'Create User', description: 'New user account created.', severity: 'High' },
  { id: 'delete_user', action: 'Delete User', description: 'User account deleted.', severity: 'High' },
  { id: 'update_grade', action: 'Update Grade', description: 'Student grade modified.', severity: 'Medium' },
  { id: 'export_data', action: 'Data Export', description: 'Bulk data export initiated.', severity: 'Medium' },
  { id: 'change_permission', action: 'Permission Change', description: 'User role or permissions modified.', severity: 'High' },
  { id: 'failed_login', action: 'Failed Login', description: 'Unsuccessful login attempt.', severity: 'Medium' },
];
