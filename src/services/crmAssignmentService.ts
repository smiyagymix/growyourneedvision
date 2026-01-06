/**
 * CRM Deal Assignment Service
 * Assign deals to team members with role management
 */

import pb from '../lib/pocketbase';
import { auditLogger } from './auditLogger';
import { isMockEnv } from '../utils/mockData';

export interface DealAssignment {
    id: string;
    deal_id: string;
    assigned_to: string;
    assigned_by: string;
    role: 'owner' | 'collaborator' | 'viewer';
    assigned_at: string;
    notes?: string;
    created: string;
    updated: string;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

// Mock team members - in production, fetch from users collection
const MOCK_TEAM_MEMBERS: TeamMember[] = [
    { id: 'user-1', name: 'Alice Johnson', email: 'alice@growyourneed.com', role: 'Sales Manager' },
    { id: 'user-2', name: 'Bob Smith', email: 'bob@growyourneed.com', role: 'Account Executive' },
    { id: 'user-3', name: 'Charlie Brown', email: 'charlie@growyourneed.com', role: 'SDR' },
    { id: 'user-4', name: 'Diana Ross', email: 'diana@growyourneed.com', role: 'Customer Success' },
    { id: 'user-5', name: 'Edward Chen', email: 'edward@growyourneed.com', role: 'Sales Rep' }
];

const MOCK_ASSIGNMENTS: DealAssignment[] = [
    {
        id: 'assign-1',
        deal_id: 'deal-1',
        assigned_to: 'user-1',
        assigned_by: 'user-1',
        role: 'owner',
        assigned_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Primary account manager',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'assign-2',
        deal_id: 'deal-1',
        assigned_to: 'user-3',
        assigned_by: 'user-1',
        role: 'collaborator',
        assigned_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Supporting on technical demos',
        created: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'assign-3',
        deal_id: 'deal-2',
        assigned_to: 'user-2',
        assigned_by: 'user-1',
        role: 'owner',
        assigned_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'assign-4',
        deal_id: 'deal-3',
        assigned_to: 'user-5',
        assigned_by: 'user-1',
        role: 'owner',
        assigned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

class CRMAssignmentService {
    private collection = 'deal_assignments';

    /**
     * Get all available team members for assignment
     */
    async getTeamMembers(): Promise<TeamMember[]> {
        if (isMockEnv()) {
            return [...MOCK_TEAM_MEMBERS];
        }

        try {
            // Fetch users with sales-related roles
            const users = await pb.collection('users').getFullList({
                filter: 'role ~ "sales" || role ~ "account" || role ~ "sdr" || role ~ "manager"',
                requestKey: null
            });
            return users.map(u => ({
                id: u.id,
                name: u.name || u.email?.split('@')[0] || 'Unknown',
                email: u.email,
                role: u.role || 'Team Member',
                avatar: u.avatar
            }));
        } catch (error) {
            console.error('Error fetching team members:', error);
            return [...MOCK_TEAM_MEMBERS];
        }
    }

    async assignDeal(dealId: string, userId: string, role: 'owner' | 'collaborator' | 'viewer', assignedBy: string, notes?: string): Promise<DealAssignment> {
        const assignment: DealAssignment = {
            id: `assign-${Date.now()}`,
            deal_id: dealId,
            assigned_to: userId,
            assigned_by: assignedBy,
            role,
            assigned_at: new Date().toISOString(),
            notes,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_ASSIGNMENTS.unshift(assignment);
            return assignment;
        }

        try {
            const created = await pb.collection(this.collection).create<DealAssignment>({
                deal_id: dealId,
                assigned_to: userId,
                assigned_by: assignedBy,
                role,
                assigned_at: new Date().toISOString(),
                notes
            });

            await auditLogger.log({
                action: 'dealAssign',
                resource_type: 'deal_assignment',
                resource_id: created.id,
                severity: 'info',
                metadata: { deal_id: dealId, assigned_to: userId, role }
            });

            return created;
        } catch (error) {
            console.error('Error assigning deal:', error);
            throw error;
        }
    }

    async reassignDeal(dealId: string, newUserId: string, assignedBy: string): Promise<DealAssignment> {
        if (isMockEnv()) {
            // Remove current owner
            const ownerIndex = MOCK_ASSIGNMENTS.findIndex(a => a.deal_id === dealId && a.role === 'owner');
            if (ownerIndex > -1) {
                MOCK_ASSIGNMENTS.splice(ownerIndex, 1);
            }
            // Assign new owner
            return this.assignDeal(dealId, newUserId, 'owner', assignedBy);
        }

        try {
            // Get current owner assignment
            const currentAssignments = await pb.collection(this.collection).getFullList<DealAssignment>({
                filter: `deal_id="${dealId}" && role="owner"`,
                requestKey: null
            });

            // Remove current owner
            for (const assignment of currentAssignments) {
                await pb.collection(this.collection).delete(assignment.id);
            }

            // Assign new owner
            return await this.assignDeal(dealId, newUserId, 'owner', assignedBy);
        } catch (error) {
            console.error('Error reassigning deal:', error);
            throw error;
        }
    }

    async getAssignedDeals(userId: string): Promise<DealAssignment[]> {
        if (isMockEnv()) {
            return MOCK_ASSIGNMENTS.filter(a => a.assigned_to === userId);
        }

        try {
            return await pb.collection(this.collection).getFullList<DealAssignment>({
                filter: `assigned_to="${userId}"`,
                sort: '-assigned_at',
                expand: 'deal_id',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching assigned deals:', error);
            return MOCK_ASSIGNMENTS.filter(a => a.assigned_to === userId);
        }
    }

    async getDealTeam(dealId: string): Promise<DealAssignment[]> {
        if (isMockEnv()) {
            return MOCK_ASSIGNMENTS.filter(a => a.deal_id === dealId);
        }

        try {
            return await pb.collection(this.collection).getFullList<DealAssignment>({
                filter: `deal_id="${dealId}"`,
                expand: 'assigned_to',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching deal team:', error);
            return MOCK_ASSIGNMENTS.filter(a => a.deal_id === dealId);
        }
    }

    async removeAssignment(assignmentId: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_ASSIGNMENTS.findIndex(a => a.id === assignmentId);
            if (index > -1) {
                MOCK_ASSIGNMENTS.splice(index, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(assignmentId);
            await auditLogger.log({
                action: 'dealUnassign',
                resource_type: 'deal_assignment',
                resource_id: assignmentId,
                severity: 'info'
            });
            return true;
        } catch (error) {
            console.error('Error removing assignment:', error);
            throw error;
        }
    }

    async updateAssignmentRole(assignmentId: string, newRole: 'owner' | 'collaborator' | 'viewer'): Promise<DealAssignment> {
        if (isMockEnv()) {
            const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);
            if (assignment) {
                assignment.role = newRole;
                assignment.updated = new Date().toISOString();
                return assignment;
            }
            throw new Error('Assignment not found');
        }

        try {
            const updated = await pb.collection(this.collection).update<DealAssignment>(assignmentId, {
                role: newRole
            });
            await auditLogger.log({
                action: 'dealRoleUpdate',
                resource_type: 'deal_assignment',
                resource_id: assignmentId,
                severity: 'info',
                metadata: { role: newRole }
            });
            return updated;
        } catch (error) {
            console.error('Error updating assignment role:', error);
            throw error;
        }
    }

    /**
     * Get assignment statistics for dashboard
     */
    async getAssignmentStats(): Promise<{
        totalAssignments: number;
        byRole: { owner: number; collaborator: number; viewer: number };
        byUser: { userId: string; name: string; count: number }[];
    }> {
        const assignments = isMockEnv() 
            ? MOCK_ASSIGNMENTS 
            : await pb.collection(this.collection).getFullList<DealAssignment>({ requestKey: null }).catch(() => MOCK_ASSIGNMENTS);
        
        const byRole = {
            owner: assignments.filter(a => a.role === 'owner').length,
            collaborator: assignments.filter(a => a.role === 'collaborator').length,
            viewer: assignments.filter(a => a.role === 'viewer').length
        };

        const userCounts = new Map<string, number>();
        assignments.forEach(a => {
            userCounts.set(a.assigned_to, (userCounts.get(a.assigned_to) || 0) + 1);
        });

        const teamMembers = await this.getTeamMembers();
        const byUser = Array.from(userCounts.entries()).map(([userId, count]) => ({
            userId,
            name: teamMembers.find(m => m.id === userId)?.name || 'Unknown',
            count
        })).sort((a, b) => b.count - a.count);

        return {
            totalAssignments: assignments.length,
            byRole,
            byUser
        };
    }
}

export const crmAssignmentService = new CRMAssignmentService();
