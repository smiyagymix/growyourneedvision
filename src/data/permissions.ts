export type Role = 'Owner' | 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export const rolePermissions: Record<Role, Permission[]> = {
  Owner: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete'] },
  ],
  Admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'classes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'finance', actions: ['read', 'update'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
  Teacher: [
    { resource: 'classes', actions: ['read', 'update'] },
    { resource: 'grades', actions: ['create', 'read', 'update'] },
    { resource: 'attendance', actions: ['create', 'read', 'update'] },
    { resource: 'students', actions: ['read'] },
  ],
  Student: [
    { resource: 'classes', actions: ['read'] },
    { resource: 'grades', actions: ['read'] },
    { resource: 'assignments', actions: ['read', 'update'] }, // update = submit
    { resource: 'profile', actions: ['read', 'update'] },
  ],
  Parent: [
    { resource: 'children', actions: ['read'] },
    { resource: 'grades', actions: ['read'] },
    { resource: 'attendance', actions: ['read'] },
    { resource: 'finance', actions: ['read', 'update'] }, // update = pay fees
  ],
  Individual: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'wellness', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'market', actions: ['read', 'create'] }, // create = buy
  ],
};
