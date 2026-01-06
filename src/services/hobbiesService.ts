import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface HobbyProject {
    id: string;
    user: string;
    title: string;
    description: string;
    category: 'Arts & Crafts' | 'Collections' | 'Gaming' | 'Music' | 'Sports' | 'Technology' | 'Other';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    progress: number;
    start_date: string;
    target_completion?: string;
    time_spent: number;
    image_url?: string;
    status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
    tags: string[];
    created: string;
}

export interface HobbyResource {
    id: string;
    title: string;
    description: string;
    category: string;
    resource_type: 'Tutorial' | 'Tool' | 'Article' | 'Video' | 'Community';
    url?: string;
    rating: number;
    created: string;
}

export interface HobbySkill {
    id: string;
    user: string;
    skill_name: string;
    category: string;
    proficiency: 'Novice' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    years_experience: number;
    projects_completed: number;
    created: string;
}

// Mock Data
const MOCK_PROJECTS: HobbyProject[] = [
    {
        id: 'hobby-1',
        user: 'user-1',
        title: 'Knitting a Sweater',
        description: 'Creating a warm winter sweater with a custom pattern',
        category: 'Arts & Crafts',
        difficulty: 'Intermediate',
        progress: 45,
        start_date: '2024-01-10',
        target_completion: '2024-03-01',
        time_spent: 1200,
        image_url: 'https://example.com/sweater.jpg',
        status: 'In Progress',
        tags: ['knitting', 'clothing', 'winter'],
        created: '2024-01-10T00:00:00Z'
    },
    {
        id: 'hobby-2',
        user: 'user-1',
        title: 'Vintage Coin Collection',
        description: 'Building a collection of pre-1950 coins',
        category: 'Collections',
        difficulty: 'Beginner',
        progress: 30,
        start_date: '2023-06-15',
        time_spent: 480,
        status: 'In Progress',
        tags: ['coins', 'vintage', 'history'],
        created: '2023-06-15T00:00:00Z'
    },
    {
        id: 'hobby-3',
        user: 'user-1',
        title: 'Learn Guitar',
        description: 'Learning to play acoustic guitar from scratch',
        category: 'Music',
        difficulty: 'Advanced',
        progress: 60,
        start_date: '2023-01-01',
        target_completion: '2024-12-31',
        time_spent: 4500,
        status: 'In Progress',
        tags: ['guitar', 'music', 'learning'],
        created: '2023-01-01T00:00:00Z'
    },
    {
        id: 'hobby-4',
        user: 'user-1',
        title: 'Raspberry Pi Home Server',
        description: 'Setting up a home media server with Raspberry Pi',
        category: 'Technology',
        difficulty: 'Intermediate',
        progress: 100,
        start_date: '2023-11-01',
        time_spent: 960,
        status: 'Completed',
        tags: ['raspberry-pi', 'server', 'home-lab'],
        created: '2023-11-01T00:00:00Z'
    }
];

const MOCK_RESOURCES: HobbyResource[] = [
    {
        id: 'resource-1',
        title: 'Knitting for Beginners',
        description: 'Complete guide to starting with knitting',
        category: 'Arts & Crafts',
        resource_type: 'Tutorial',
        url: 'https://example.com/knitting-guide',
        rating: 4.8,
        created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'resource-2',
        title: 'Coin Grading Standards',
        description: 'Official guide to coin grading and valuation',
        category: 'Collections',
        resource_type: 'Article',
        url: 'https://example.com/coin-grading',
        rating: 4.9,
        created: '2024-01-02T00:00:00Z'
    },
    {
        id: 'resource-3',
        title: 'JustinGuitar',
        description: 'Free online guitar lessons for all levels',
        category: 'Music',
        resource_type: 'Video',
        url: 'https://justinguitar.com',
        rating: 4.9,
        created: '2024-01-03T00:00:00Z'
    },
    {
        id: 'resource-4',
        title: 'r/homelab',
        description: 'Reddit community for home lab enthusiasts',
        category: 'Technology',
        resource_type: 'Community',
        url: 'https://reddit.com/r/homelab',
        rating: 4.7,
        created: '2024-01-04T00:00:00Z'
    }
];

const MOCK_SKILLS: HobbySkill[] = [
    {
        id: 'skill-1',
        user: 'user-1',
        skill_name: 'Knitting',
        category: 'Arts & Crafts',
        proficiency: 'Intermediate',
        years_experience: 2,
        projects_completed: 5,
        created: '2022-01-01T00:00:00Z'
    },
    {
        id: 'skill-2',
        user: 'user-1',
        skill_name: 'Guitar',
        category: 'Music',
        proficiency: 'Beginner',
        years_experience: 1,
        projects_completed: 0,
        created: '2023-01-01T00:00:00Z'
    },
    {
        id: 'skill-3',
        user: 'user-1',
        skill_name: 'Linux Administration',
        category: 'Technology',
        proficiency: 'Advanced',
        years_experience: 5,
        projects_completed: 12,
        created: '2019-01-01T00:00:00Z'
    }
];

export const hobbiesService = {
    // Projects
    getUserProjects: async (userId: string): Promise<HobbyProject[]> => {
        if (isMockEnv()) {
            return MOCK_PROJECTS.filter(p => p.user === userId);
        }

        return await pb.collection('hobby_projects').getFullList<HobbyProject>({
            filter: `user = "${userId}"`,
            sort: '-created'
        });
    },

    getProjectById: async (id: string): Promise<HobbyProject | null> => {
        if (isMockEnv()) {
            return MOCK_PROJECTS.find(p => p.id === id) || null;
        }

        try {
            return await pb.collection('hobby_projects').getOne<HobbyProject>(id);
        } catch {
            return null;
        }
    },

    getProjectsByCategory: async (userId: string, category: string): Promise<HobbyProject[]> => {
        if (isMockEnv()) {
            return MOCK_PROJECTS.filter(p => p.user === userId && p.category === category);
        }

        return await pb.collection('hobby_projects').getFullList<HobbyProject>({
            filter: `user = "${userId}" && category = "${category}"`,
            sort: '-progress'
        });
    },

    getProjectsByStatus: async (userId: string, status: string): Promise<HobbyProject[]> => {
        if (isMockEnv()) {
            return MOCK_PROJECTS.filter(p => p.user === userId && p.status === status);
        }

        return await pb.collection('hobby_projects').getFullList<HobbyProject>({
            filter: `user = "${userId}" && status = "${status}"`,
            sort: '-created'
        });
    },

    createProject: async (data: Partial<HobbyProject>): Promise<HobbyProject> => {
        if (isMockEnv()) {
            const newProject: HobbyProject = {
                id: `hobby-${Date.now()}`,
                user: data.user || '',
                title: data.title || 'New Project',
                description: data.description || '',
                category: data.category || 'Other',
                difficulty: data.difficulty || 'Beginner',
                progress: 0,
                start_date: data.start_date || new Date().toISOString().split('T')[0],
                target_completion: data.target_completion,
                time_spent: 0,
                image_url: data.image_url,
                status: 'Planning',
                tags: data.tags || [],
                created: new Date().toISOString()
            };
            MOCK_PROJECTS.push(newProject);
            return newProject;
        }

        return await pb.collection('hobby_projects').create(data);
    },

    updateProject: async (id: string, data: Partial<HobbyProject>): Promise<HobbyProject | null> => {
        if (isMockEnv()) {
            const project = MOCK_PROJECTS.find(p => p.id === id);
            if (project) {
                Object.assign(project, data);
            }
            return project || null;
        }

        return await pb.collection('hobby_projects').update(id, data);
    },

    updateProgress: async (id: string, progress: number): Promise<HobbyProject | null> => {
        if (isMockEnv()) {
            const project = MOCK_PROJECTS.find(p => p.id === id);
            if (project) {
                project.progress = Math.min(100, Math.max(0, progress));
                if (project.progress === 100) {
                    project.status = 'Completed';
                }
            }
            return project || null;
        }

        return await pb.collection('hobby_projects').update(id, { progress });
    },

    addTimeSpent: async (id: string, minutes: number): Promise<HobbyProject | null> => {
        if (isMockEnv()) {
            const project = MOCK_PROJECTS.find(p => p.id === id);
            if (project) {
                project.time_spent += minutes;
            }
            return project || null;
        }

        try {
            const project = await pb.collection('hobby_projects').getOne<HobbyProject>(id);
            return await pb.collection('hobby_projects').update(id, {
                time_spent: project.time_spent + minutes
            });
        } catch {
            return null;
        }
    },

    deleteProject: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_PROJECTS.findIndex(p => p.id === id);
            if (index !== -1) {
                MOCK_PROJECTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('hobby_projects').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    // Resources
    getResources: async (category?: string): Promise<HobbyResource[]> => {
        if (isMockEnv()) {
            if (category) {
                return MOCK_RESOURCES.filter(r => r.category === category);
            }
            return [...MOCK_RESOURCES];
        }

        const filter = category ? `category = "${category}"` : '';
        return await pb.collection('hobby_resources').getFullList<HobbyResource>({
            filter,
            sort: '-rating'
        });
    },

    getResourceById: async (id: string): Promise<HobbyResource | null> => {
        if (isMockEnv()) {
            return MOCK_RESOURCES.find(r => r.id === id) || null;
        }

        try {
            return await pb.collection('hobby_resources').getOne<HobbyResource>(id);
        } catch {
            return null;
        }
    },

    createResource: async (data: Partial<HobbyResource>): Promise<HobbyResource> => {
        if (isMockEnv()) {
            const newResource: HobbyResource = {
                id: `resource-${Date.now()}`,
                title: data.title || 'New Resource',
                description: data.description || '',
                category: data.category || 'Other',
                resource_type: data.resource_type || 'Article',
                url: data.url,
                rating: data.rating || 0,
                created: new Date().toISOString()
            };
            MOCK_RESOURCES.push(newResource);
            return newResource;
        }

        return await pb.collection('hobby_resources').create(data);
    },

    deleteResource: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_RESOURCES.findIndex(r => r.id === id);
            if (index !== -1) {
                MOCK_RESOURCES.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('hobby_resources').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    searchResources: async (query: string): Promise<HobbyResource[]> => {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_RESOURCES.filter(r =>
                r.title.toLowerCase().includes(lowerQuery) ||
                r.description.toLowerCase().includes(lowerQuery)
            );
        }

        return await pb.collection('hobby_resources').getFullList<HobbyResource>({
            filter: `title ~ "${query}" || description ~ "${query}"`,
            sort: '-rating'
        });
    },

    // Skills
    getUserSkills: async (userId: string): Promise<HobbySkill[]> => {
        if (isMockEnv()) {
            return MOCK_SKILLS.filter(s => s.user === userId);
        }

        return await pb.collection('hobby_skills').getFullList<HobbySkill>({
            filter: `user = "${userId}"`,
            sort: '-years_experience'
        });
    },

    getSkillById: async (id: string): Promise<HobbySkill | null> => {
        if (isMockEnv()) {
            return MOCK_SKILLS.find(s => s.id === id) || null;
        }

        try {
            return await pb.collection('hobby_skills').getOne<HobbySkill>(id);
        } catch {
            return null;
        }
    },

    addSkill: async (data: Partial<HobbySkill>): Promise<HobbySkill> => {
        if (isMockEnv()) {
            const newSkill: HobbySkill = {
                id: `skill-${Date.now()}`,
                user: data.user || '',
                skill_name: data.skill_name || 'New Skill',
                category: data.category || 'Other',
                proficiency: data.proficiency || 'Novice',
                years_experience: data.years_experience || 0,
                projects_completed: data.projects_completed || 0,
                created: new Date().toISOString()
            };
            MOCK_SKILLS.push(newSkill);
            return newSkill;
        }

        return await pb.collection('hobby_skills').create(data);
    },

    updateSkill: async (id: string, data: Partial<HobbySkill>): Promise<HobbySkill | null> => {
        if (isMockEnv()) {
            const skill = MOCK_SKILLS.find(s => s.id === id);
            if (skill) {
                Object.assign(skill, data);
            }
            return skill || null;
        }

        return await pb.collection('hobby_skills').update(id, data);
    },

    deleteSkill: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_SKILLS.findIndex(s => s.id === id);
            if (index !== -1) {
                MOCK_SKILLS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('hobby_skills').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    // Statistics
    getHobbyStats: async (userId: string) => {
        if (isMockEnv()) {
            const projects = MOCK_PROJECTS.filter(p => p.user === userId);
            const skills = MOCK_SKILLS.filter(s => s.user === userId);

            const categoryCount: Record<string, number> = {};
            projects.forEach(p => {
                categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
            });

            return {
                total_projects: projects.length,
                completed: projects.filter(p => p.status === 'Completed').length,
                in_progress: projects.filter(p => p.status === 'In Progress').length,
                planning: projects.filter(p => p.status === 'Planning').length,
                on_hold: projects.filter(p => p.status === 'On Hold').length,
                total_time: projects.reduce((sum, p) => sum + p.time_spent, 0),
                total_skills: skills.length,
                top_category: Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None',
                average_progress: projects.length > 0
                    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
                    : 0
            };
        }

        try {
            const [projects, skills] = await Promise.all([
                pb.collection('hobby_projects').getFullList<HobbyProject>({ filter: `user = "${userId}"` }),
                pb.collection('hobby_skills').getFullList<HobbySkill>({ filter: `user = "${userId}"` })
            ]);

            const categoryCount: Record<string, number> = {};
            projects.forEach(p => {
                categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
            });

            return {
                total_projects: projects.length,
                completed: projects.filter(p => p.status === 'Completed').length,
                in_progress: projects.filter(p => p.status === 'In Progress').length,
                planning: projects.filter(p => p.status === 'Planning').length,
                on_hold: projects.filter(p => p.status === 'On Hold').length,
                total_time: projects.reduce((sum, p) => sum + p.time_spent, 0),
                total_skills: skills.length,
                top_category: Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None',
                average_progress: projects.length > 0
                    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
                    : 0
            };
        } catch (error) {
            console.error('Failed to get hobby stats:', error);
            return {
                total_projects: 0,
                completed: 0,
                in_progress: 0,
                planning: 0,
                on_hold: 0,
                total_time: 0,
                total_skills: 0,
                top_category: 'None',
                average_progress: 0
            };
        }
    },

    // Get available categories
    getCategories: (): HobbyProject['category'][] => {
        return ['Arts & Crafts', 'Collections', 'Gaming', 'Music', 'Sports', 'Technology', 'Other'];
    },

    // Get difficulty levels
    getDifficultyLevels: (): HobbyProject['difficulty'][] => {
        return ['Beginner', 'Intermediate', 'Advanced'];
    },

    // Get proficiency levels
    getProficiencyLevels: (): HobbySkill['proficiency'][] => {
        return ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
    }
};
