import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface MarketingAsset extends RecordModel {
    title: string;
    file: string; // Filename
    type: 'Image' | 'Video' | 'Document';
    size: number;
    tags: string[];
    url?: string; // Computed URL
    description?: string;
    downloads?: number;
    views?: number;
}

export interface CreateAssetData {
    title: string;
    type: 'Image' | 'Video' | 'Document';
    size: number;
    tags: string[];
    description?: string;
    file?: File; // For file uploads
}

export interface StudioProject extends RecordModel {
    name: string;
    description?: string;
    type: 'design' | 'video' | 'document' | 'presentation';
    status: 'draft' | 'in-progress' | 'completed' | 'archived';
    owner: string;
    thumbnail?: string;
    data?: Record<string, unknown>;
}

// Mock data
const MOCK_ASSETS: MarketingAsset[] = [
    { 
        id: '1', 
        title: 'Summer Banner', 
        file: 'banner.jpg', 
        type: 'Image', 
        size: 1024000, 
        tags: ['summer', 'sale'], 
        description: 'Summer sale promotional banner',
        downloads: 45,
        views: 234,
        created: new Date().toISOString(), 
        updated: new Date().toISOString(), 
        collectionId: 'marketing_assets', 
        collectionName: 'marketing_assets', 
        url: 'https://via.placeholder.com/300x200?text=Summer+Banner' 
    },
    { 
        id: '2', 
        title: 'Product Demo', 
        file: 'demo.mp4', 
        type: 'Video', 
        size: 5024000, 
        tags: ['product', 'demo'], 
        description: 'Product demonstration video',
        downloads: 89,
        views: 567,
        created: new Date().toISOString(), 
        updated: new Date().toISOString(), 
        collectionId: 'marketing_assets', 
        collectionName: 'marketing_assets', 
        url: 'https://via.placeholder.com/300x200?text=Video+Thumbnail' 
    },
    { 
        id: '3', 
        title: 'Q1 Report', 
        file: 'report.pdf', 
        type: 'Document', 
        size: 204000, 
        tags: ['report', 'finance'], 
        description: 'Q1 2024 financial report',
        downloads: 12,
        views: 78,
        created: new Date().toISOString(), 
        updated: new Date().toISOString(), 
        collectionId: 'marketing_assets', 
        collectionName: 'marketing_assets', 
        url: 'https://via.placeholder.com/300x200?text=PDF+Document' 
    },
    { 
        id: '4', 
        title: 'Brand Logo Pack', 
        file: 'logos.zip', 
        type: 'Image', 
        size: 2500000, 
        tags: ['brand', 'logo', 'identity'], 
        description: 'Complete brand logo package in multiple formats',
        downloads: 156,
        views: 890,
        created: new Date().toISOString(), 
        updated: new Date().toISOString(), 
        collectionId: 'marketing_assets', 
        collectionName: 'marketing_assets', 
        url: 'https://via.placeholder.com/300x200?text=Logo+Pack' 
    }
];

const MOCK_PROJECTS: StudioProject[] = [
    {
        id: 'proj-1',
        name: 'Marketing Campaign Q1',
        description: 'Q1 marketing campaign materials',
        type: 'design',
        status: 'completed',
        owner: 'user-1',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: 'studio_projects',
        collectionName: 'studio_projects'
    },
    {
        id: 'proj-2',
        name: 'Product Launch Video',
        description: 'Launch video for new product',
        type: 'video',
        status: 'in-progress',
        owner: 'user-1',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: 'studio_projects',
        collectionName: 'studio_projects'
    },
    {
        id: 'proj-3',
        name: 'Annual Report 2024',
        description: 'Annual company report design',
        type: 'document',
        status: 'draft',
        owner: 'user-2',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: 'studio_projects',
        collectionName: 'studio_projects'
    }
];

export const assetService = {
    /**
     * Upload asset file and create record
     * @param file - File to upload
     * @returns URL of uploaded file
     */
    async uploadAssetFile(file: File): Promise<string> {
        if (isMockEnv()) {
            // Return mock URL for testing
            return `https://via.placeholder.com/300x200?text=${encodeURIComponent(file.name)}`;
        }

        try {
            // Create temporary record to get ID for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('type', file.type.startsWith('image/') ? 'Image' : file.type.startsWith('video/') ? 'Video' : 'Document');
            formData.append('size', file.size.toString());
            formData.append('tags', JSON.stringify([]));

            const record = await pb.collection('marketing_assets').create(formData);
            
            // Return file URL
            return pb.files.getUrl(record, record.file);
        } catch (error) {
            console.error('Failed to upload asset file:', error);
            throw error;
        }
    },

    /**
     * Create asset with metadata and uploaded file
     */
    async createAsset(data: CreateAssetData): Promise<MarketingAsset> {
        if (isMockEnv()) {
            return {
                ...MOCK_ASSETS[0],
                ...data,
                file: data.file?.name || 'mock_file.jpg',
                id: `mock_${Date.now()}`,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            } as MarketingAsset;
        }

        try {
            const formData = new FormData();
            
            if (data.file) {
                formData.append('file', data.file);
            }
            if (data.title) formData.append('title', data.title);
            if (data.type) formData.append('type', data.type);
            if (data.size !== undefined) formData.append('size', data.size.toString());
            if (data.tags) formData.append('tags', JSON.stringify(data.tags));
            if (data.description) formData.append('description', data.description);

            const record = await pb.collection('marketing_assets').create<MarketingAsset>(formData);
            
            // Add computed URL
            if (record.file) {
                record.url = pb.files.getUrl(record, record.file);
            }
            
            return record;
        } catch (error) {
            console.error('Failed to create asset:', error);
            throw error;
        }
    },

    // Marketing Assets
    async getAssets(): Promise<MarketingAsset[]> {
        if (isMockEnv()) {
            return [...MOCK_ASSETS];
        }

        try {
            const records = await pb.collection('marketing_assets').getFullList<MarketingAsset>({
                sort: '-created',
                requestKey: null
            });
            return records.map(r => ({
                ...r,
                url: pb.files.getUrl(r, r.file)
            }));
        } catch (error) {
            console.error('Error fetching assets:', error);
            return MOCK_ASSETS;
        }
    },

    async getAssetById(id: string): Promise<MarketingAsset | null> {
        if (isMockEnv()) {
            return MOCK_ASSETS.find(a => a.id === id) || null;
        }

        try {
            const record = await pb.collection('marketing_assets').getOne<MarketingAsset>(id);
            return {
                ...record,
                url: pb.files.getUrl(record, record.file)
            };
        } catch (error) {
            console.error('Error fetching asset:', error);
            return null;
        }
    },

    async searchAssets(query: string): Promise<MarketingAsset[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_ASSETS.filter(a =>
                a.title.toLowerCase().includes(lowerQuery) ||
                a.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
                a.description?.toLowerCase().includes(lowerQuery)
            );
        }

        try {
            const records = await pb.collection('marketing_assets').getFullList<MarketingAsset>({
                filter: `title ~ "${query}" || tags ~ "${query}"`,
                sort: '-created'
            });
            return records.map(r => ({
                ...r,
                url: pb.files.getUrl(r, r.file)
            }));
        } catch (error) {
            console.error('Error searching assets:', error);
            return [];
        }
    },

    async getAssetsByType(type: 'Image' | 'Video' | 'Document'): Promise<MarketingAsset[]> {
        if (isMockEnv()) {
            return MOCK_ASSETS.filter(a => a.type === type);
        }

        try {
            const records = await pb.collection('marketing_assets').getFullList<MarketingAsset>({
                filter: `type = "${type}"`,
                sort: '-created'
            });
            return records.map(r => ({
                ...r,
                url: pb.files.getUrl(r, r.file)
            }));
        } catch (error) {
            console.error('Error fetching assets by type:', error);
            return [];
        }
    },

    async getAssetsByTags(tags: string[]): Promise<MarketingAsset[]> {
        if (isMockEnv()) {
            return MOCK_ASSETS.filter(a =>
                tags.some(tag => a.tags.includes(tag))
            );
        }

        try {
            const filters = tags.map(tag => `tags ~ "${tag}"`).join(' || ');
            const records = await pb.collection('marketing_assets').getFullList<MarketingAsset>({
                filter: filters,
                sort: '-created'
            });
            return records.map(r => ({
                ...r,
                url: pb.files.getUrl(r, r.file)
            }));
        } catch (error) {
            console.error('Error fetching assets by tags:', error);
            return [];
        }
    },

    async uploadAsset(file: File, title: string, type: 'Image' | 'Video' | 'Document', tags: string[] = []): Promise<MarketingAsset | null> {
        if (isMockEnv()) {
            const newAsset: MarketingAsset = {
                id: `asset-${Date.now()}`,
                title,
                file: file.name,
                type,
                size: file.size,
                tags,
                downloads: 0,
                views: 0,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: 'marketing_assets',
                collectionName: 'marketing_assets',
                url: URL.createObjectURL(file)
            };
            MOCK_ASSETS.push(newAsset);
            return newAsset;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            formData.append('type', type);
            formData.append('size', file.size.toString());
            if (tags.length > 0) {
                formData.append('tags', JSON.stringify(tags));
            }

            const record = await pb.collection('marketing_assets').create<MarketingAsset>(formData);
            return {
                ...record,
                url: pb.files.getUrl(record, record.file)
            };
        } catch (error) {
            console.error('Error uploading asset:', error);
            return null;
        }
    },

    async updateAsset(id: string, data: Partial<MarketingAsset>): Promise<MarketingAsset | null> {
        if (isMockEnv()) {
            const asset = MOCK_ASSETS.find(a => a.id === id);
            if (asset) {
                Object.assign(asset, data, { updated: new Date().toISOString() });
            }
            return asset || null;
        }

        try {
            const record = await pb.collection('marketing_assets').update<MarketingAsset>(id, data);
            return {
                ...record,
                url: pb.files.getUrl(record, record.file)
            };
        } catch (error) {
            console.error('Error updating asset:', error);
            return null;
        }
    },

    async deleteAsset(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_ASSETS.findIndex(a => a.id === id);
            if (index !== -1) {
                MOCK_ASSETS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('marketing_assets').delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting asset:', error);
            return false;
        }
    },

    async incrementDownloads(id: string): Promise<void> {
        if (isMockEnv()) {
            const asset = MOCK_ASSETS.find(a => a.id === id);
            if (asset) {
                asset.downloads = (asset.downloads || 0) + 1;
            }
            return;
        }

        try {
            const record = await pb.collection('marketing_assets').getOne<MarketingAsset>(id);
            await pb.collection('marketing_assets').update(id, {
                downloads: (record.downloads || 0) + 1
            });
        } catch (error) {
            console.error('Error incrementing downloads:', error);
        }
    },

    async incrementViews(id: string): Promise<void> {
        if (isMockEnv()) {
            const asset = MOCK_ASSETS.find(a => a.id === id);
            if (asset) {
                asset.views = (asset.views || 0) + 1;
            }
            return;
        }

        try {
            const record = await pb.collection('marketing_assets').getOne<MarketingAsset>(id);
            await pb.collection('marketing_assets').update(id, {
                views: (record.views || 0) + 1
            });
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    },

    // Asset Statistics
    async getAssetStats() {
        if (isMockEnv()) {
            return {
                total_assets: MOCK_ASSETS.length,
                images: MOCK_ASSETS.filter(a => a.type === 'Image').length,
                videos: MOCK_ASSETS.filter(a => a.type === 'Video').length,
                documents: MOCK_ASSETS.filter(a => a.type === 'Document').length,
                total_size: MOCK_ASSETS.reduce((sum, a) => sum + a.size, 0),
                total_downloads: MOCK_ASSETS.reduce((sum, a) => sum + (a.downloads || 0), 0),
                total_views: MOCK_ASSETS.reduce((sum, a) => sum + (a.views || 0), 0)
            };
        }

        try {
            const assets = await pb.collection('marketing_assets').getFullList<MarketingAsset>();
            return {
                total_assets: assets.length,
                images: assets.filter(a => a.type === 'Image').length,
                videos: assets.filter(a => a.type === 'Video').length,
                documents: assets.filter(a => a.type === 'Document').length,
                total_size: assets.reduce((sum, a) => sum + a.size, 0),
                total_downloads: assets.reduce((sum, a) => sum + (a.downloads || 0), 0),
                total_views: assets.reduce((sum, a) => sum + (a.views || 0), 0)
            };
        } catch (error) {
            console.error('Error getting asset stats:', error);
            return {
                total_assets: 0,
                images: 0,
                videos: 0,
                documents: 0,
                total_size: 0,
                total_downloads: 0,
                total_views: 0
            };
        }
    },

    // Studio Projects
    async getProjects(): Promise<StudioProject[]> {
        if (isMockEnv()) {
            return [...MOCK_PROJECTS];
        }

        try {
            return await pb.collection('studio_projects').getFullList<StudioProject>({
                sort: '-created',
                expand: 'owner'
            });
        } catch (error) {
            console.error('Error fetching projects:', error);
            return MOCK_PROJECTS;
        }
    },

    async getProjectById(id: string): Promise<StudioProject | null> {
        if (isMockEnv()) {
            return MOCK_PROJECTS.find(p => p.id === id) || null;
        }

        try {
            return await pb.collection('studio_projects').getOne<StudioProject>(id, {
                expand: 'owner'
            });
        } catch (error) {
            console.error('Error fetching project:', error);
            return null;
        }
    },

    async getProjectsByOwner(ownerId: string): Promise<StudioProject[]> {
        if (isMockEnv()) {
            return MOCK_PROJECTS.filter(p => p.owner === ownerId);
        }

        try {
            return await pb.collection('studio_projects').getFullList<StudioProject>({
                filter: `owner = "${ownerId}"`,
                sort: '-created'
            });
        } catch (error) {
            console.error('Error fetching owner projects:', error);
            return [];
        }
    },

    async getProjectsByStatus(status: StudioProject['status']): Promise<StudioProject[]> {
        if (isMockEnv()) {
            return MOCK_PROJECTS.filter(p => p.status === status);
        }

        try {
            return await pb.collection('studio_projects').getFullList<StudioProject>({
                filter: `status = "${status}"`,
                sort: '-created'
            });
        } catch (error) {
            console.error('Error fetching projects by status:', error);
            return [];
        }
    },

    async createProject(data: Partial<StudioProject>): Promise<StudioProject | null> {
        if (isMockEnv()) {
            const newProject: StudioProject = {
                id: `proj-${Date.now()}`,
                name: data.name || 'New Project',
                description: data.description,
                type: data.type || 'design',
                status: data.status || 'draft',
                owner: data.owner || 'user-1',
                data: data.data,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: 'studio_projects',
                collectionName: 'studio_projects'
            };
            MOCK_PROJECTS.push(newProject);
            return newProject;
        }

        try {
            return await pb.collection('studio_projects').create<StudioProject>(data);
        } catch (error) {
            console.error('Error creating project:', error);
            return null;
        }
    },

    async updateProject(id: string, data: Partial<StudioProject>): Promise<StudioProject | null> {
        if (isMockEnv()) {
            const project = MOCK_PROJECTS.find(p => p.id === id);
            if (project) {
                Object.assign(project, data, { updated: new Date().toISOString() });
            }
            return project || null;
        }

        try {
            return await pb.collection('studio_projects').update<StudioProject>(id, data);
        } catch (error) {
            console.error('Error updating project:', error);
            return null;
        }
    },

    async deleteProject(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_PROJECTS.findIndex(p => p.id === id);
            if (index !== -1) {
                MOCK_PROJECTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('studio_projects').delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    },

    // Project Statistics
    async getProjectStats() {
        if (isMockEnv()) {
            return {
                total_projects: MOCK_PROJECTS.length,
                by_type: {
                    design: MOCK_PROJECTS.filter(p => p.type === 'design').length,
                    video: MOCK_PROJECTS.filter(p => p.type === 'video').length,
                    document: MOCK_PROJECTS.filter(p => p.type === 'document').length,
                    presentation: MOCK_PROJECTS.filter(p => p.type === 'presentation').length
                },
                by_status: {
                    draft: MOCK_PROJECTS.filter(p => p.status === 'draft').length,
                    'in-progress': MOCK_PROJECTS.filter(p => p.status === 'in-progress').length,
                    completed: MOCK_PROJECTS.filter(p => p.status === 'completed').length,
                    archived: MOCK_PROJECTS.filter(p => p.status === 'archived').length
                }
            };
        }

        try {
            const projects = await pb.collection('studio_projects').getFullList<StudioProject>();
            return {
                total_projects: projects.length,
                by_type: {
                    design: projects.filter(p => p.type === 'design').length,
                    video: projects.filter(p => p.type === 'video').length,
                    document: projects.filter(p => p.type === 'document').length,
                    presentation: projects.filter(p => p.type === 'presentation').length
                },
                by_status: {
                    draft: projects.filter(p => p.status === 'draft').length,
                    'in-progress': projects.filter(p => p.status === 'in-progress').length,
                    completed: projects.filter(p => p.status === 'completed').length,
                    archived: projects.filter(p => p.status === 'archived').length
                }
            };
        } catch (error) {
            console.error('Error getting project stats:', error);
            return {
                total_projects: 0,
                by_type: { design: 0, video: 0, document: 0, presentation: 0 },
                by_status: { draft: 0, 'in-progress': 0, completed: 0, archived: 0 }
            };
        }
    },

    // Asset types
    getAssetTypes(): MarketingAsset['type'][] {
        return ['Image', 'Video', 'Document'];
    },

    // Project types
    getProjectTypes(): StudioProject['type'][] {
        return ['design', 'video', 'document', 'presentation'];
    },

    // Project statuses
    getProjectStatuses(): StudioProject['status'][] {
        return ['draft', 'in-progress', 'completed', 'archived'];
    }
};
