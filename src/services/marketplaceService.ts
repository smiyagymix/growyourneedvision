import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface MarketplaceApp extends RecordModel {
    name: string;
    provider: string;
    category: string;
    rating: number;
    installs: number;
    price: string;
    description: string;
    icon: string;
    verified: boolean;
    screenshots?: string[];
    version?: string;
    updated?: string;
    requirements?: string[];
}

export interface AppReview extends RecordModel {
    app: string;
    user: string;
    rating: number;
    comment: string;
    helpful_count: number;
    created: string;
}

export interface AppInstallation extends RecordModel {
    app: string;
    user: string;
    tenant?: string;
    installed_at: string;
    status: 'active' | 'disabled' | 'uninstalled';
}

// Mock Data
const MOCK_APPS: MarketplaceApp[] = [
    {
        id: 'app-1',
        name: 'Advanced Analytics Dashboard',
        provider: 'GYN Team',
        category: 'Analytics',
        rating: 4.8,
        installs: 15420,
        price: 'Free',
        description: 'Comprehensive analytics dashboard with real-time insights, custom reports, and data visualization tools.',
        icon: '📊',
        verified: true,
        screenshots: ['analytics-1.png', 'analytics-2.png'],
        version: '2.1.0',
        updated: '2024-01-15T00:00:00Z',
        requirements: ['Basic Plan or higher'],
        collectionId: '', collectionName: '', created: '2024-01-01T00:00:00Z'
    },
    {
        id: 'app-2',
        name: 'AI Content Generator',
        provider: 'AI Labs',
        category: 'AI & Automation',
        rating: 4.6,
        installs: 8930,
        price: '$9.99/mo',
        description: 'Generate high-quality content using advanced AI models. Perfect for lesson plans, reports, and more.',
        icon: '🤖',
        verified: true,
        screenshots: ['ai-gen-1.png', 'ai-gen-2.png'],
        version: '1.5.2',
        updated: '2024-01-20T00:00:00Z',
        requirements: ['Premium Plan'],
        collectionId: '', collectionName: '', created: '2024-01-05T00:00:00Z'
    },
    {
        id: 'app-3',
        name: 'Video Conferencing Pro',
        provider: 'CommTools',
        category: 'Communication',
        rating: 4.5,
        installs: 22100,
        price: 'Free',
        description: 'Professional video conferencing with HD quality, screen sharing, and recording capabilities.',
        icon: '📹',
        verified: true,
        screenshots: ['video-1.png', 'video-2.png'],
        version: '3.0.1',
        updated: '2024-01-18T00:00:00Z',
        requirements: [],
        collectionId: '', collectionName: '', created: '2023-12-01T00:00:00Z'
    },
    {
        id: 'app-4',
        name: 'Smart Scheduler',
        provider: 'TimeWise',
        category: 'Productivity',
        rating: 4.7,
        installs: 12450,
        price: '$4.99/mo',
        description: 'AI-powered scheduling assistant that optimizes your calendar and manages appointments automatically.',
        icon: '📅',
        verified: true,
        screenshots: ['scheduler-1.png'],
        version: '2.3.0',
        updated: '2024-01-22T00:00:00Z',
        requirements: ['Basic Plan or higher'],
        collectionId: '', collectionName: '', created: '2023-11-15T00:00:00Z'
    },
    {
        id: 'app-5',
        name: 'Document Scanner',
        provider: 'DocuTools',
        category: 'Utilities',
        rating: 4.3,
        installs: 5680,
        price: 'Free',
        description: 'Scan, digitize, and organize documents with OCR support and cloud storage integration.',
        icon: '📄',
        verified: false,
        screenshots: ['scanner-1.png'],
        version: '1.2.0',
        updated: '2024-01-10T00:00:00Z',
        requirements: [],
        collectionId: '', collectionName: '', created: '2023-12-20T00:00:00Z'
    },
    {
        id: 'app-6',
        name: 'Gamification Engine',
        provider: 'GYN Team',
        category: 'Education',
        rating: 4.9,
        installs: 18200,
        price: '$14.99/mo',
        description: 'Add gamification elements to your learning platform with XP, badges, leaderboards, and challenges.',
        icon: '🎮',
        verified: true,
        screenshots: ['gamification-1.png', 'gamification-2.png', 'gamification-3.png'],
        version: '4.0.0',
        updated: '2024-01-25T00:00:00Z',
        requirements: ['Enterprise Plan'],
        collectionId: '', collectionName: '', created: '2023-10-01T00:00:00Z'
    }
];

const MOCK_REVIEWS: AppReview[] = [
    {
        id: 'review-1',
        app: 'app-1',
        user: 'user-1',
        rating: 5,
        comment: 'Excellent analytics tool! Very comprehensive and easy to use.',
        helpful_count: 42,
        created: '2024-01-20T00:00:00Z',
        collectionId: '', collectionName: ''
    },
    {
        id: 'review-2',
        app: 'app-1',
        user: 'user-2',
        rating: 4,
        comment: 'Great features, but could use better export options.',
        helpful_count: 18,
        created: '2024-01-18T00:00:00Z',
        collectionId: '', collectionName: ''
    },
    {
        id: 'review-3',
        app: 'app-2',
        user: 'user-1',
        rating: 5,
        comment: 'The AI content generator has saved me hours of work. Highly recommend!',
        helpful_count: 35,
        created: '2024-01-22T00:00:00Z',
        collectionId: '', collectionName: ''
    }
];

const MOCK_INSTALLATIONS: AppInstallation[] = [
    {
        id: 'install-1',
        app: 'app-1',
        user: 'user-1',
        tenant: 'tenant-1',
        installed_at: '2024-01-10T00:00:00Z',
        status: 'active',
        collectionId: '', collectionName: '', created: '2024-01-10T00:00:00Z'
    },
    {
        id: 'install-2',
        app: 'app-3',
        user: 'user-1',
        tenant: 'tenant-1',
        installed_at: '2024-01-12T00:00:00Z',
        status: 'active',
        collectionId: '', collectionName: '', created: '2024-01-12T00:00:00Z'
    }
];

export const marketplaceService = {
    // Apps
    async getApps(): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            return MOCK_APPS;
        }

        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                sort: '-installs',
            });
        } catch (error) {
            console.error('Error fetching marketplace apps:', error);
            return [];
        }
    },

    async getAppById(id: string): Promise<MarketplaceApp | null> {
        if (isMockEnv()) {
            return MOCK_APPS.find(a => a.id === id) || null;
        }

        try {
            return await pb.collection('marketplace_apps').getOne<MarketplaceApp>(id);
        } catch {
            return null;
        }
    },

    async getAppsByCategory(category: string): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            return MOCK_APPS.filter(a => a.category === category);
        }

        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                filter: `category = "${category}"`,
                sort: '-installs',
            });
        } catch (error) {
            console.error('Error fetching apps by category:', error);
            return [];
        }
    },

    async searchApps(query: string): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_APPS.filter(a =>
                a.name.toLowerCase().includes(lowerQuery) ||
                a.description.toLowerCase().includes(lowerQuery) ||
                a.category.toLowerCase().includes(lowerQuery)
            );
        }

        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                filter: `name ~ "${query}" || description ~ "${query}" || category ~ "${query}"`,
                sort: '-installs',
            });
        } catch (error) {
            console.error('Error searching apps:', error);
            return [];
        }
    },

    async getFeaturedApps(): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            return MOCK_APPS.filter(a => a.verified).slice(0, 6);
        }

        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                filter: 'verified = true',
                sort: '-installs',
            });
        } catch (error) {
            console.error('Error fetching featured apps:', error);
            return [];
        }
    },

    async getMyApps(userId: string): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            return MOCK_APPS.filter(a => a.provider === userId || a.provider === 'GYN Team');
        }

        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                filter: `provider = "${userId}"`,
                sort: '-created',
            });
        } catch (error) {
            console.error('Error fetching my apps:', error);
            return [];
        }
    },

    async getDeveloperApps(developerId: string): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            return MOCK_APPS.filter(a => a.provider === developerId);
        }

        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                filter: `developer = "${developerId}" || provider = "${developerId}"`,
                sort: '-created',
            });
        } catch (error) {
            console.error('Error fetching developer apps:', error);
            return [];
        }
    },

    async createApp(data: Partial<MarketplaceApp>): Promise<MarketplaceApp> {
        if (isMockEnv()) {
            const newApp: MarketplaceApp = {
                id: `app-${Date.now()}`,
                name: data.name || 'New App',
                provider: data.provider || '',
                category: data.category || 'Other',
                rating: 0,
                installs: 0,
                price: data.price || 'Free',
                description: data.description || '',
                icon: data.icon || '📱',
                verified: false,
                screenshots: data.screenshots || [],
                version: data.version || '1.0.0',
                updated: new Date().toISOString(),
                requirements: data.requirements || [],
                collectionId: '', collectionName: '', created: new Date().toISOString()
            };
            MOCK_APPS.push(newApp);
            return newApp;
        }

        try {
            return await pb.collection('marketplace_apps').create<MarketplaceApp>(data);
        } catch (error) {
            console.error('Error creating app:', error);
            throw error;
        }
    },

    async updateApp(id: string, data: Partial<MarketplaceApp>): Promise<MarketplaceApp | null> {
        if (isMockEnv()) {
            const app = MOCK_APPS.find(a => a.id === id);
            if (app) {
                Object.assign(app, data, { updated: new Date().toISOString() });
            }
            return app || null;
        }

        try {
            return await pb.collection('marketplace_apps').update<MarketplaceApp>(id, data);
        } catch (error) {
            console.error('Error updating app:', error);
            throw error;
        }
    },

    async submitApp(data: Partial<MarketplaceApp>): Promise<MarketplaceApp> {
        if (isMockEnv()) {
            return this.createApp({ ...data, verified: false });
        }

        try {
            return await pb.collection('marketplace_apps').create(data);
        } catch (error) {
            console.error('Error submitting app:', error);
            throw error;
        }
    },

    async deleteApp(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_APPS.findIndex(a => a.id === id);
            if (index !== -1) {
                MOCK_APPS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('marketplace_apps').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    // Reviews
    async getAppReviews(appId: string): Promise<AppReview[]> {
        if (isMockEnv()) {
            return MOCK_REVIEWS.filter(r => r.app === appId);
        }

        try {
            return await pb.collection('app_reviews').getFullList<AppReview>({
                filter: `app = "${appId}"`,
                sort: '-helpful_count',
                expand: 'user'
            });
        } catch (error) {
            console.error('Error fetching app reviews:', error);
            return [];
        }
    },

    async addReview(appId: string, userId: string, rating: number, comment: string): Promise<AppReview> {
        if (isMockEnv()) {
            const newReview: AppReview = {
                id: `review-${Date.now()}`,
                app: appId,
                user: userId,
                rating,
                comment,
                helpful_count: 0,
                created: new Date().toISOString(),
                collectionId: '', collectionName: ''
            };
            MOCK_REVIEWS.push(newReview);

            // Update app rating
            const app = MOCK_APPS.find(a => a.id === appId);
            if (app) {
                const appReviews = MOCK_REVIEWS.filter(r => r.app === appId);
                app.rating = appReviews.reduce((sum, r) => sum + r.rating, 0) / appReviews.length;
            }

            return newReview;
        }

        try {
            return await pb.collection('app_reviews').create<AppReview>({
                app: appId,
                user: userId,
                rating,
                comment
            });
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    },

    async markReviewHelpful(reviewId: string): Promise<AppReview | null> {
        if (isMockEnv()) {
            const review = MOCK_REVIEWS.find(r => r.id === reviewId);
            if (review) {
                review.helpful_count++;
            }
            return review || null;
        }

        try {
            const review = await pb.collection('app_reviews').getOne<AppReview>(reviewId);
            return await pb.collection('app_reviews').update<AppReview>(reviewId, {
                helpful_count: review.helpful_count + 1
            });
        } catch {
            return null;
        }
    },

    // Installations
    async getInstalledApps(userId: string): Promise<MarketplaceApp[]> {
        if (isMockEnv()) {
            const installedIds = MOCK_INSTALLATIONS
                .filter(i => i.user === userId && i.status === 'active')
                .map(i => i.app);
            return MOCK_APPS.filter(a => installedIds.includes(a.id));
        }

        try {
            const installations = await pb.collection('app_installations').getFullList<AppInstallation>({
                filter: `user = "${userId}" && status = "active"`,
                expand: 'app'
            });
            return installations.map(i => i.expand?.app as MarketplaceApp).filter(Boolean);
        } catch (error) {
            console.error('Error fetching installed apps:', error);
            return [];
        }
    },

    async installApp(appId: string, userId: string, tenantId?: string): Promise<AppInstallation> {
        if (isMockEnv()) {
            const existing = MOCK_INSTALLATIONS.find(i => i.app === appId && i.user === userId);
            if (existing) {
                existing.status = 'active';
                return existing;
            }

            const newInstallation: AppInstallation = {
                id: `install-${Date.now()}`,
                app: appId,
                user: userId,
                tenant: tenantId,
                installed_at: new Date().toISOString(),
                status: 'active',
                collectionId: '', collectionName: '', created: new Date().toISOString()
            };
            MOCK_INSTALLATIONS.push(newInstallation);

            // Update app install count
            const app = MOCK_APPS.find(a => a.id === appId);
            if (app) {
                app.installs++;
            }

            return newInstallation;
        }

        try {
            return await pb.collection('app_installations').create<AppInstallation>({
                app: appId,
                user: userId,
                tenant: tenantId,
                installed_at: new Date().toISOString(),
                status: 'active'
            });
        } catch (error) {
            console.error('Error installing app:', error);
            throw error;
        }
    },

    async uninstallApp(appId: string, userId: string): Promise<boolean> {
        if (isMockEnv()) {
            const installation = MOCK_INSTALLATIONS.find(i => i.app === appId && i.user === userId);
            if (installation) {
                installation.status = 'uninstalled';
            }
            return true;
        }

        try {
            const installations = await pb.collection('app_installations').getFullList<AppInstallation>({
                filter: `app = "${appId}" && user = "${userId}" && status = "active"`
            });

            for (const installation of installations) {
                await pb.collection('app_installations').update(installation.id, {
                    status: 'uninstalled'
                });
            }
            return true;
        } catch {
            return false;
        }
    },

    async isAppInstalled(appId: string, userId: string): Promise<boolean> {
        if (isMockEnv()) {
            return MOCK_INSTALLATIONS.some(i => i.app === appId && i.user === userId && i.status === 'active');
        }

        try {
            const installations = await pb.collection('app_installations').getFullList<AppInstallation>({
                filter: `app = "${appId}" && user = "${userId}" && status = "active"`
            });
            return installations.length > 0;
        } catch {
            return false;
        }
    },

    // Categories
    async getCategories(): Promise<string[]> {
        if (isMockEnv()) {
            return [...new Set(MOCK_APPS.map(a => a.category))];
        }

        try {
            const apps = await pb.collection('marketplace_apps').getFullList<MarketplaceApp>({
                fields: 'category'
            });
            return [...new Set(apps.map(a => a.category))];
        } catch {
            return [];
        }
    },

    // Statistics
    async getMarketplaceStats() {
        if (isMockEnv()) {
            return {
                totalApps: MOCK_APPS.length,
                verifiedApps: MOCK_APPS.filter(a => a.verified).length,
                totalInstalls: MOCK_APPS.reduce((sum, a) => sum + a.installs, 0),
                averageRating: MOCK_APPS.reduce((sum, a) => sum + a.rating, 0) / MOCK_APPS.length,
                categoryCounts: MOCK_APPS.reduce((acc, a) => {
                    acc[a.category] = (acc[a.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            };
        }

        try {
            const apps = await pb.collection('marketplace_apps').getFullList<MarketplaceApp>();

            return {
                totalApps: apps.length,
                verifiedApps: apps.filter(a => a.verified).length,
                totalInstalls: apps.reduce((sum, a) => sum + a.installs, 0),
                averageRating: apps.reduce((sum, a) => sum + a.rating, 0) / apps.length,
                categoryCounts: apps.reduce((acc, a) => {
                    acc[a.category] = (acc[a.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            };
        } catch (error) {
            console.error('Error fetching marketplace stats:', error);
            return {
                totalApps: 0,
                verifiedApps: 0,
                totalInstalls: 0,
                averageRating: 0,
                categoryCounts: {}
            };
        }
    }
};
