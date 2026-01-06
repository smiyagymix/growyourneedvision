import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import { auditLog } from './auditLogger';

export interface Activity extends RecordModel {
    title: string;
    description?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    address?: string;
    type?: 'sports' | 'social' | 'educational' | 'cultural' | 'community' | 'other';
    category?: string;
    participants?: string[];
    maxParticipants?: number;
    cost?: number;
    currency?: string;
    organizer?: string;
    organizer_contact?: string;
    image_url?: string;
    status?: 'draft' | 'published' | 'cancelled' | 'completed';
    registration_deadline?: string;
    tags?: string[];
    expand?: {
        organizer?: RecordModel & { name?: string };
    };
}

export interface SocialGroup extends RecordModel {
    name: string;
    description?: string;
    members?: string[];
    admin?: string;
    category?: string;
    is_private?: boolean;
    image_url?: string;
}

export interface PlannedEvent extends RecordModel {
    user: string;
    activity?: string;
    title: string;
    date: string;
    notes?: string;
    reminder?: boolean;
    expand?: {
        activity?: Activity;
    };
}

const MOCK_ACTIVITIES: Activity[] = [
    {
        id: 'act-1',
        collectionId: 'mock',
        collectionName: 'activities',
        title: 'Community Soccer Match',
        description: 'Weekly friendly soccer match at the community center. All skill levels welcome!',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        location: 'Community Sports Center',
        address: '123 Sports Lane, City',
        type: 'sports',
        category: 'Team Sports',
        participants: ['user-1', 'user-2'],
        maxParticipants: 22,
        cost: 5,
        currency: 'USD',
        organizer: 'organizer-1',
        status: 'published',
        tags: ['soccer', 'outdoor', 'team'],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'act-2',
        collectionId: 'mock',
        collectionName: 'activities',
        title: 'Book Club Meeting',
        description: 'Monthly book discussion. This month: "The Great Gatsby"',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: '18:00',
        end_time: '20:00',
        location: 'City Library',
        type: 'cultural',
        category: 'Literature',
        participants: ['user-1'],
        maxParticipants: 20,
        cost: 0,
        organizer: 'organizer-2',
        status: 'published',
        tags: ['books', 'reading', 'discussion'],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'act-3',
        collectionId: 'mock',
        collectionName: 'activities',
        title: 'Yoga in the Park',
        description: 'Morning yoga session for beginners and intermediate practitioners.',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: '07:00',
        end_time: '08:30',
        location: 'Central Park',
        type: 'sports',
        category: 'Fitness',
        maxParticipants: 30,
        cost: 10,
        currency: 'USD',
        status: 'published',
        tags: ['yoga', 'fitness', 'outdoor'],
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

const MOCK_SOCIAL_GROUPS: SocialGroup[] = [
    {
        id: 'group-1',
        collectionId: 'mock',
        collectionName: 'social_groups',
        name: 'Local Runners Club',
        description: 'A group for running enthusiasts in the area',
        members: ['user-1', 'user-2', 'user-3'],
        admin: 'user-1',
        category: 'Sports',
        is_private: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'group-2',
        collectionId: 'mock',
        collectionName: 'social_groups',
        name: 'Photography Enthusiasts',
        description: 'Share and discuss photography tips and work',
        members: ['user-2', 'user-4'],
        admin: 'user-2',
        category: 'Arts',
        is_private: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

const MOCK_PLANNED_EVENTS: PlannedEvent[] = [
    {
        id: 'plan-1',
        collectionId: 'mock',
        collectionName: 'planned_events',
        user: 'user-1',
        activity: 'act-1',
        title: 'Soccer Match',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Bring water bottle',
        reminder: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

export const activityService = {
    // =============== ACTIVITIES ===============

    /**
     * Get all local activities
     */
    async getLocalActivities(options?: { 
        type?: string; 
        page?: number; 
        perPage?: number;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const page = options?.page || 1;
        const perPage = options?.perPage || 50;

        if (isMockEnv()) {
            let filtered = [...MOCK_ACTIVITIES].filter(a => a.status === 'published');
            
            if (options?.type) {
                filtered = filtered.filter(a => a.type === options.type);
            }
            if (options?.dateFrom) {
                filtered = filtered.filter(a => a.date && a.date >= options.dateFrom!);
            }
            if (options?.dateTo) {
                filtered = filtered.filter(a => a.date && a.date <= options.dateTo!);
            }

            const start = (page - 1) * perPage;
            const items = filtered.slice(start, start + perPage);
            return {
                items,
                page,
                perPage,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage)
            };
        }

        let filter = 'status = "published"';
        if (options?.type) {
            filter += ` && type = "${options.type}"`;
        }
        if (options?.dateFrom) {
            filter += ` && date >= "${options.dateFrom}"`;
        }
        if (options?.dateTo) {
            filter += ` && date <= "${options.dateTo}"`;
        }

        return await pb.collection('activities_local').getList<Activity>(page, perPage, {
            filter,
            sort: 'date',
            requestKey: null
        });
    },

    /**
     * Get activity by ID
     */
    async getActivity(id: string): Promise<Activity> {
        if (isMockEnv()) {
            const activity = MOCK_ACTIVITIES.find(a => a.id === id);
            if (!activity) throw new Error('Activity not found');
            return activity;
        }
        return await pb.collection('activities_local').getOne<Activity>(id, {
            expand: 'organizer',
            requestKey: null
        });
    },

    /**
     * Create new activity
     */
    async createActivity(data: Partial<Activity>): Promise<Activity> {
        if (isMockEnv()) {
            const newActivity: Activity = {
                id: `act-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'activities',
                title: data.title || 'Untitled Activity',
                description: data.description,
                date: data.date,
                start_time: data.start_time,
                end_time: data.end_time,
                location: data.location,
                type: data.type,
                category: data.category,
                participants: data.participants || [],
                maxParticipants: data.maxParticipants,
                cost: data.cost,
                currency: data.currency || 'USD',
                organizer: data.organizer,
                status: data.status || 'draft',
                tags: data.tags,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_ACTIVITIES.push(newActivity);
            auditLog.log('activity_created', { activityId: newActivity.id, title: newActivity.title }, 'info');
            return newActivity;
        }

        const activity = await pb.collection('activities').create<Activity>(data);
        auditLog.log('activity_created', { activityId: activity.id, title: activity.title }, 'info');
        return activity;
    },

    /**
     * Update activity
     */
    async updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
        if (isMockEnv()) {
            const index = MOCK_ACTIVITIES.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Activity not found');
            MOCK_ACTIVITIES[index] = {
                ...MOCK_ACTIVITIES[index],
                ...data,
                updated: new Date().toISOString()
            };
            return MOCK_ACTIVITIES[index];
        }
        return await pb.collection('activities').update<Activity>(id, data);
    },

    /**
     * Delete activity
     */
    async deleteActivity(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_ACTIVITIES.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Activity not found');
            MOCK_ACTIVITIES.splice(index, 1);
            auditLog.log('activity_deleted', { activityId: id }, 'info');
            return true;
        }
        await pb.collection('activities').delete(id);
        auditLog.log('activity_deleted', { activityId: id }, 'info');
        return true;
    },

    /**
     * Join activity
     */
    async joinActivity(activityId: string, userId: string): Promise<Activity> {
        const activity = await this.getActivity(activityId);
        
        if (activity.participants?.includes(userId)) {
            throw new Error('Already registered for this activity');
        }

        if (activity.maxParticipants && (activity.participants?.length || 0) >= activity.maxParticipants) {
            throw new Error('Activity is full');
        }

        if (activity.registration_deadline && new Date() > new Date(activity.registration_deadline)) {
            throw new Error('Registration deadline has passed');
        }

        const newParticipants = [...(activity.participants || []), userId];
        return await this.updateActivity(activityId, { participants: newParticipants });
    },

    /**
     * Leave activity
     */
    async leaveActivity(activityId: string, userId: string): Promise<Activity> {
        const activity = await this.getActivity(activityId);
        
        if (!activity.participants?.includes(userId)) {
            throw new Error('Not registered for this activity');
        }

        const newParticipants = activity.participants.filter(p => p !== userId);
        return await this.updateActivity(activityId, { participants: newParticipants });
    },

    /**
     * Search activities
     */
    async searchActivities(query: string): Promise<Activity[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_ACTIVITIES.filter(a => 
                a.title.toLowerCase().includes(lowerQuery) ||
                a.description?.toLowerCase().includes(lowerQuery) ||
                a.location?.toLowerCase().includes(lowerQuery) ||
                a.tags?.some(t => t.toLowerCase().includes(lowerQuery))
            );
        }

        return await pb.collection('activities_local').getFullList<Activity>({
            filter: `title ~ "${query}" || description ~ "${query}" || location ~ "${query}"`,
            requestKey: null
        });
    },

    /**
     * Get activities by category
     */
    async getActivitiesByCategory(category: string): Promise<Activity[]> {
        if (isMockEnv()) {
            return MOCK_ACTIVITIES.filter(a => a.category === category && a.status === 'published');
        }

        return await pb.collection('activities_local').getFullList<Activity>({
            filter: `category = "${category}" && status = "published"`,
            sort: 'date',
            requestKey: null
        });
    },

    /**
     * Get upcoming activities for a user
     */
    async getUserUpcomingActivities(userId: string): Promise<Activity[]> {
        const today = new Date().toISOString().split('T')[0];
        
        if (isMockEnv()) {
            return MOCK_ACTIVITIES.filter(a => 
                a.participants?.includes(userId) && 
                a.date && a.date >= today
            ).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        }

        return await pb.collection('activities_local').getFullList<Activity>({
            filter: `participants ~ "${userId}" && date >= "${today}"`,
            sort: 'date',
            requestKey: null
        });
    },

    // =============== SOCIAL GROUPS ===============

    /**
     * Get social groups
     */
    async getSocialGroups(options?: { category?: string; page?: number; perPage?: number }) {
        const page = options?.page || 1;
        const perPage = options?.perPage || 50;

        if (isMockEnv()) {
            let filtered = MOCK_SOCIAL_GROUPS.filter(g => !g.is_private);
            if (options?.category) {
                filtered = filtered.filter(g => g.category === options.category);
            }
            const start = (page - 1) * perPage;
            const items = filtered.slice(start, start + perPage);
            return {
                items,
                page,
                perPage,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage)
            };
        }

        let filter = 'is_private = false';
        if (options?.category) {
            filter += ` && category = "${options.category}"`;
        }

        return await pb.collection('social_groups').getList<SocialGroup>(page, perPage, {
            filter,
            requestKey: null
        });
    },

    /**
     * Get group by ID
     */
    async getGroup(id: string): Promise<SocialGroup> {
        if (isMockEnv()) {
            const group = MOCK_SOCIAL_GROUPS.find(g => g.id === id);
            if (!group) throw new Error('Group not found');
            return group;
        }
        return await pb.collection('social_groups').getOne<SocialGroup>(id, { requestKey: null });
    },

    /**
     * Create social group
     */
    async createGroup(data: Partial<SocialGroup>): Promise<SocialGroup> {
        if (isMockEnv()) {
            const newGroup: SocialGroup = {
                id: `group-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'social_groups',
                name: data.name || 'New Group',
                description: data.description,
                members: data.members || [],
                admin: data.admin,
                category: data.category,
                is_private: data.is_private || false,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_SOCIAL_GROUPS.push(newGroup);
            return newGroup;
        }

        return await pb.collection('social_groups').create<SocialGroup>(data);
    },

    /**
     * Join group
     */
    async joinGroup(groupId: string, userId: string): Promise<SocialGroup> {
        const group = await this.getGroup(groupId);
        
        if (group.members?.includes(userId)) {
            throw new Error('Already a member of this group');
        }

        const newMembers = [...(group.members || []), userId];
        
        if (isMockEnv()) {
            const index = MOCK_SOCIAL_GROUPS.findIndex(g => g.id === groupId);
            if (index !== -1) {
                MOCK_SOCIAL_GROUPS[index].members = newMembers;
                return MOCK_SOCIAL_GROUPS[index];
            }
            throw new Error('Group not found');
        }

        return await pb.collection('social_groups').update<SocialGroup>(groupId, { members: newMembers });
    },

    /**
     * Leave group
     */
    async leaveGroup(groupId: string, userId: string): Promise<SocialGroup> {
        const group = await this.getGroup(groupId);
        
        if (!group.members?.includes(userId)) {
            throw new Error('Not a member of this group');
        }

        const newMembers = group.members.filter(m => m !== userId);
        
        if (isMockEnv()) {
            const index = MOCK_SOCIAL_GROUPS.findIndex(g => g.id === groupId);
            if (index !== -1) {
                MOCK_SOCIAL_GROUPS[index].members = newMembers;
                return MOCK_SOCIAL_GROUPS[index];
            }
            throw new Error('Group not found');
        }

        return await pb.collection('social_groups').update<SocialGroup>(groupId, { members: newMembers });
    },

    /**
     * Get user's groups
     */
    async getUserGroups(userId: string): Promise<SocialGroup[]> {
        if (isMockEnv()) {
            return MOCK_SOCIAL_GROUPS.filter(g => g.members?.includes(userId));
        }

        return await pb.collection('social_groups').getFullList<SocialGroup>({
            filter: `members ~ "${userId}"`,
            requestKey: null
        });
    },

    // =============== PLANNED EVENTS ===============

    /**
     * Get planned events for a user
     */
    async getPlannedEvents(userId: string): Promise<PlannedEvent[]> {
        if (isMockEnv()) {
            return MOCK_PLANNED_EVENTS.filter(e => e.user === userId);
        }

        return await pb.collection('planned_events').getFullList<PlannedEvent>({
            filter: `user = "${userId}"`,
            sort: 'date',
            expand: 'activity',
            requestKey: null
        });
    },

    /**
     * Plan an event
     */
    async planEvent(userId: string, data: { activityId?: string; title: string; date: string; notes?: string; reminder?: boolean }): Promise<PlannedEvent> {
        if (isMockEnv()) {
            const newPlan: PlannedEvent = {
                id: `plan-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'planned_events',
                user: userId,
                activity: data.activityId,
                title: data.title,
                date: data.date,
                notes: data.notes,
                reminder: data.reminder,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_PLANNED_EVENTS.push(newPlan);
            return newPlan;
        }

        return await pb.collection('planned_events').create<PlannedEvent>({
            user: userId,
            activity: data.activityId,
            title: data.title,
            date: data.date,
            notes: data.notes,
            reminder: data.reminder
        });
    },

    /**
     * Remove planned event
     */
    async removePlannedEvent(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_PLANNED_EVENTS.findIndex(e => e.id === id);
            if (index !== -1) {
                MOCK_PLANNED_EVENTS.splice(index, 1);
            }
            return true;
        }

        await pb.collection('planned_events').delete(id);
        return true;
    },

    // =============== STATISTICS ===============

    /**
     * Get activity statistics
     */
    async getStatistics() {
        const activities = isMockEnv() 
            ? MOCK_ACTIVITIES 
            : await pb.collection('activities_local').getFullList<Activity>({ requestKey: null });
        
        const groups = isMockEnv()
            ? MOCK_SOCIAL_GROUPS
            : await pb.collection('social_groups').getFullList<SocialGroup>({ requestKey: null });

        const byType: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        let totalParticipants = 0;

        for (const activity of activities) {
            if (activity.type) {
                byType[activity.type] = (byType[activity.type] || 0) + 1;
            }
            if (activity.category) {
                byCategory[activity.category] = (byCategory[activity.category] || 0) + 1;
            }
            totalParticipants += activity.participants?.length || 0;
        }

        return {
            totalActivities: activities.length,
            publishedActivities: activities.filter(a => a.status === 'published').length,
            totalGroups: groups.length,
            totalParticipants,
            averageParticipants: activities.length > 0 ? Math.round(totalParticipants / activities.length) : 0,
            byType,
            byCategory
        };
    }
};
