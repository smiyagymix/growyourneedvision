/**
 * Role-based routing utilities
 * Centralizes the logic for routing users to their appropriate dashboards
 */

export type UserRole = 'Owner' | 'Admin' | 'SchoolAdmin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';

/**
 * Maps user roles to their corresponding dashboard routes
 */
export const ROLE_ROUTES: Record<UserRole, string> = {
    Owner: '/admin',
    Admin: '/school-admin/finance',
    SchoolAdmin: '/school-admin/finance',
    Teacher: '/teacher',
    Student: '/student',
    Parent: '/parent',
    Individual: '/individual',
};

/**
 * Get the dashboard route for a given user role
 * Handles case-insensitive role matching (e.g., "owner" → "Owner")
 * @param role - The user's role
 * @returns The route path for the role's dashboard
 */
export function getRoleBasedRoute(role: string): string {
    if (!role) return ROLE_ROUTES.Individual;

    const lower = role.toLowerCase();
    if (lower.includes('schooladmin')) return ROLE_ROUTES.SchoolAdmin;

    // Capitalize first letter to match our ROLE_ROUTES keys
    // "owner" becomes "Owner", "admin" becomes "Admin", etc.
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    // Default to individual dashboard if role is unknown
    return ROLE_ROUTES[normalizedRole as UserRole] || ROLE_ROUTES.Individual;
}

/**
 * Get a user-friendly display name for a role
 * @param role - The user's role
 * @returns Display name for the role
 */
export function getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
        Owner: 'Platform Owner',
        Admin: 'School Administrator',
        SchoolAdmin: 'School Administrator',
        Teacher: 'Teacher',
        Student: 'Student',
        Parent: 'Parent',
        Individual: 'Individual User',
    };
    return displayNames[role] || role;
}
