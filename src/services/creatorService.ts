import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface CreatorTemplate extends RecordModel {
    name: string;
    type: 'design' | 'video' | 'document' | 'presentation';
    category: string;
    thumbnail?: string;
    content: string;
    is_public: boolean;
    downloads: number;
}

export interface VideoProject extends RecordModel {
    user: string;
    title: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    status: 'draft' | 'rendering' | 'completed' | 'failed';
    timeline: object;
    output_url?: string;
}

export interface CodeProject extends RecordModel {
    user: string;
    title: string;
    description?: string;
    language: string;
    files: { name: string; content: string }[];
    is_public: boolean;
    forks: number;
    stars: number;
}

export interface Document extends RecordModel {
    user: string;
    title: string;
    type: 'document' | 'spreadsheet' | 'presentation';
    content: string;
    thumbnail?: string;
    shared_with: string[];
    last_edited?: string;
}

export interface DesignProject extends RecordModel {
    user: string;
    title: string;
    description?: string;
    thumbnail?: string;
    layers: any;
    canvasSize: { width: number; height: number };
}

// Mock Data
const MOCK_TEMPLATES: CreatorTemplate[] = [
    {
        id: 'template-1',
        name: 'Business Presentation',
        type: 'presentation',
        category: 'Business',
        thumbnail: 'https://example.com/business-pres.png',
        content: '{}',
        is_public: true,
        downloads: 1250,
        collectionId: '', collectionName: '', created: '2024-01-01T00:00:00Z', updated: ''
    },
    {
        id: 'template-2',
        name: 'Social Media Post',
        type: 'design',
        category: 'Marketing',
        thumbnail: 'https://example.com/social-post.png',
        content: '{}',
        is_public: true,
        downloads: 3420,
        collectionId: '', collectionName: '', created: '2024-01-02T00:00:00Z', updated: ''
    },
    {
        id: 'template-3',
        name: 'Product Demo Video',
        type: 'video',
        category: 'Marketing',
        thumbnail: 'https://example.com/demo-video.png',
        content: '{}',
        is_public: true,
        downloads: 890,
        collectionId: '', collectionName: '', created: '2024-01-03T00:00:00Z', updated: ''
    },
    {
        id: 'template-4',
        name: 'Invoice Template',
        type: 'document',
        category: 'Business',
        thumbnail: 'https://example.com/invoice.png',
        content: '{}',
        is_public: true,
        downloads: 2100,
        collectionId: '', collectionName: '', created: '2024-01-04T00:00:00Z', updated: ''
    }
];

const MOCK_VIDEO_PROJECTS: VideoProject[] = [
    {
        id: 'video-1',
        user: 'user-1',
        title: 'Course Introduction',
        description: 'Introduction video for the course',
        thumbnail: 'https://example.com/video1-thumb.png',
        duration: 120,
        status: 'completed',
        timeline: {},
        output_url: 'https://example.com/video1.mp4',
        collectionId: '', collectionName: '', created: '2024-01-15T00:00:00Z', updated: ''
    },
    {
        id: 'video-2',
        user: 'user-1',
        title: 'Product Demo',
        description: 'Demo video for the product',
        thumbnail: 'https://example.com/video2-thumb.png',
        status: 'draft',
        timeline: {},
        collectionId: '', collectionName: '', created: '2024-01-20T00:00:00Z', updated: ''
    }
];

const MOCK_CODE_PROJECTS: CodeProject[] = [
    {
        id: 'code-1',
        user: 'user-1',
        title: 'React Todo App',
        description: 'A simple todo application built with React',
        language: 'typescript',
        files: [
            { name: 'App.tsx', content: 'export default function App() { return <div>Hello</div>; }' },
            { name: 'index.ts', content: 'import App from "./App";' }
        ],
        is_public: true,
        forks: 12,
        stars: 45,
        collectionId: '', collectionName: '', created: '2024-01-10T00:00:00Z', updated: ''
    },
    {
        id: 'code-2',
        user: 'user-1',
        title: 'Python Data Analysis',
        description: 'Data analysis scripts for coursework',
        language: 'python',
        files: [
            { name: 'main.py', content: 'import pandas as pd\ndf = pd.read_csv("data.csv")' }
        ],
        is_public: false,
        forks: 0,
        stars: 0,
        collectionId: '', collectionName: '', created: '2024-01-12T00:00:00Z', updated: ''
    }
];

const MOCK_DOCUMENTS: Document[] = [
    {
        id: 'doc-1',
        user: 'user-1',
        title: 'Quarterly Report',
        type: 'document',
        content: '<h1>Q1 2024 Report</h1><p>This quarter...</p>',
        thumbnail: 'https://example.com/doc1-thumb.png',
        shared_with: [],
        last_edited: '2024-01-25T10:30:00Z',
        collectionId: '', collectionName: '', created: '2024-01-20T00:00:00Z', updated: ''
    },
    {
        id: 'doc-2',
        user: 'user-1',
        title: 'Budget Spreadsheet',
        type: 'spreadsheet',
        content: '{}',
        shared_with: ['user-2'],
        last_edited: '2024-01-24T15:00:00Z',
        collectionId: '', collectionName: '', created: '2024-01-18T00:00:00Z', updated: ''
    },
    {
        id: 'doc-3',
        user: 'user-1',
        title: 'Team Meeting Slides',
        type: 'presentation',
        content: '{}',
        shared_with: ['user-2', 'user-3'],
        last_edited: '2024-01-23T09:00:00Z',
        collectionId: '', collectionName: '', created: '2024-01-15T00:00:00Z', updated: ''
    }
];

const MOCK_DESIGN_PROJECTS: DesignProject[] = [
    {
        id: 'design-1',
        user: 'user-1',
        title: 'Marketing Flyer',
        description: 'New product launch flyer',
        layers: [],
        canvasSize: { width: 1080, height: 1080 },
        collectionId: '', collectionName: '', created: '2024-01-20T00:00:00Z', updated: ''
    }
];

export const creatorService = {
    // Templates
    getTemplates: async (type?: string, category?: string): Promise<CreatorTemplate[]> => {
        if (isMockEnv()) {
            let templates = [...MOCK_TEMPLATES];
            if (type) {
                templates = templates.filter(t => t.type === type);
            }
            if (category) {
                templates = templates.filter(t => t.category === category);
            }
            return templates;
        }

        try {
            let filter = 'is_public = true';
            if (type) filter += ` && type = "${type}"`;
            if (category) filter += ` && category = "${category}"`;

            return await pb.collection('creator_templates').getFullList<CreatorTemplate>({
                filter,
                sort: '-downloads'
            });
        } catch {
            return [];
        }
    },

    getTemplateById: async (id: string): Promise<CreatorTemplate | null> => {
        if (isMockEnv()) {
            return MOCK_TEMPLATES.find(t => t.id === id) || null;
        }

        try {
            return await pb.collection('creator_templates').getOne<CreatorTemplate>(id);
        } catch {
            return null;
        }
    },

    searchTemplates: async (query: string): Promise<CreatorTemplate[]> => {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_TEMPLATES.filter(t =>
                t.name.toLowerCase().includes(lowerQuery) ||
                t.category.toLowerCase().includes(lowerQuery)
            );
        }

        try {
            return await pb.collection('creator_templates').getFullList<CreatorTemplate>({
                filter: `name ~ "${query}" || category ~ "${query}"`,
                sort: '-downloads'
            });
        } catch {
            return [];
        }
    },

    incrementTemplateDownload: async (templateId: string): Promise<void> => {
        if (isMockEnv()) {
            const template = MOCK_TEMPLATES.find(t => t.id === templateId);
            if (template) {
                template.downloads++;
            }
            return;
        }

        try {
            const template = await pb.collection('creator_templates').getOne<CreatorTemplate>(templateId);
            await pb.collection('creator_templates').update(templateId, {
                downloads: template.downloads + 1
            });
        } catch {
            // Silent fail
        }
    },

    // Video Projects
    getVideoProjects: async (userId: string): Promise<VideoProject[]> => {
        if (isMockEnv()) {
            return MOCK_VIDEO_PROJECTS.filter(v => v.user === userId);
        }

        try {
            return await pb.collection('creator_videos').getFullList<VideoProject>({
                filter: `user = "${userId}"`,
                sort: '-created'
            });
        } catch {
            return [];
        }
    },

    getVideoProjectById: async (id: string): Promise<VideoProject | null> => {
        if (isMockEnv()) {
            return MOCK_VIDEO_PROJECTS.find(v => v.id === id) || null;
        }

        try {
            return await pb.collection('creator_videos').getOne<VideoProject>(id);
        } catch {
            return null;
        }
    },

    createVideoProject: async (data: Partial<VideoProject>): Promise<VideoProject> => {
        if (isMockEnv()) {
            const newProject: VideoProject = {
                id: `video-${Date.now()}`,
                user: data.user || '',
                title: data.title || 'Untitled Video',
                description: data.description,
                status: 'draft',
                timeline: data.timeline || {},
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_VIDEO_PROJECTS.push(newProject);
            return newProject;
        }

        return await pb.collection('creator_videos').create<VideoProject>(data);
    },

    updateVideoProject: async (id: string, data: Partial<VideoProject>): Promise<VideoProject | null> => {
        if (isMockEnv()) {
            const project = MOCK_VIDEO_PROJECTS.find(v => v.id === id);
            if (project) {
                Object.assign(project, data);
            }
            return project || null;
        }

        return await pb.collection('creator_videos').update<VideoProject>(id, data);
    },

    deleteVideoProject: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_VIDEO_PROJECTS.findIndex(v => v.id === id);
            if (index !== -1) {
                MOCK_VIDEO_PROJECTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('creator_videos').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    // Code Projects
    getCodeProjects: async (userId: string): Promise<CodeProject[]> => {
        if (isMockEnv()) {
            return MOCK_CODE_PROJECTS.filter(c => c.user === userId);
        }

        try {
            return await pb.collection('creator_code').getFullList<CodeProject>({
                filter: `user = "${userId}"`,
                sort: '-created'
            });
        } catch {
            return [];
        }
    },

    getPublicCodeProjects: async (): Promise<CodeProject[]> => {
        if (isMockEnv()) {
            return MOCK_CODE_PROJECTS.filter(c => c.is_public);
        }

        try {
            return await pb.collection('creator_code').getFullList<CodeProject>({
                filter: 'is_public = true',
                sort: '-stars'
            });
        } catch {
            return [];
        }
    },

    getCodeProjectById: async (id: string): Promise<CodeProject | null> => {
        if (isMockEnv()) {
            return MOCK_CODE_PROJECTS.find(c => c.id === id) || null;
        }

        try {
            return await pb.collection('creator_code').getOne<CodeProject>(id);
        } catch {
            return null;
        }
    },

    createCodeProject: async (data: Partial<CodeProject>): Promise<CodeProject> => {
        if (isMockEnv()) {
            const newProject: CodeProject = {
                id: `code-${Date.now()}`,
                user: data.user || '',
                title: data.title || 'Untitled Project',
                description: data.description,
                language: data.language || 'javascript',
                files: data.files || [{ name: 'index.js', content: '' }],
                is_public: data.is_public ?? false,
                forks: 0,
                stars: 0,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_CODE_PROJECTS.push(newProject);
            return newProject;
        }

        return await pb.collection('creator_code').create<CodeProject>(data);
    },

    updateCodeProject: async (id: string, data: Partial<CodeProject>): Promise<CodeProject | null> => {
        if (isMockEnv()) {
            const project = MOCK_CODE_PROJECTS.find(c => c.id === id);
            if (project) {
                Object.assign(project, data);
            }
            return project || null;
        }

        return await pb.collection('creator_code').update<CodeProject>(id, data);
    },

    forkCodeProject: async (projectId: string, userId: string): Promise<CodeProject | null> => {
        if (isMockEnv()) {
            const original = MOCK_CODE_PROJECTS.find(c => c.id === projectId);
            if (!original) return null;

            original.forks++;

            const forked: CodeProject = {
                id: `code-${Date.now()}`,
                user: userId,
                title: `${original.title} (Fork)`,
                description: original.description,
                language: original.language,
                files: [...original.files],
                is_public: false,
                forks: 0,
                stars: 0,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_CODE_PROJECTS.push(forked);
            return forked;
        }

        try {
            const original = await pb.collection('creator_code').getOne<CodeProject>(projectId);

            // Update fork count
            await pb.collection('creator_code').update(projectId, {
                forks: original.forks + 1
            });

            // Create forked project
            return await pb.collection('creator_code').create<CodeProject>({
                user: userId,
                title: `${original.title} (Fork)`,
                description: original.description,
                language: original.language,
                files: original.files,
                is_public: false
            });
        } catch {
            return null;
        }
    },

    starCodeProject: async (projectId: string): Promise<void> => {
        if (isMockEnv()) {
            const project = MOCK_CODE_PROJECTS.find(c => c.id === projectId);
            if (project) {
                project.stars++;
            }
            return;
        }

        try {
            const project = await pb.collection('creator_code').getOne<CodeProject>(projectId);
            await pb.collection('creator_code').update(projectId, {
                stars: project.stars + 1
            });
        } catch {
            // Silent fail
        }
    },

    // Documents
    getDocuments: async (userId: string, type?: string): Promise<Document[]> => {
        if (isMockEnv()) {
            let docs = MOCK_DOCUMENTS.filter(d => d.user === userId || d.shared_with.includes(userId));
            if (type) {
                docs = docs.filter(d => d.type === type);
            }
            return docs;
        }

        try {
            let filter = `user = "${userId}" || shared_with ~ "${userId}"`;
            if (type) {
                filter = `(${filter}) && type = "${type}"`;
            }

            return await pb.collection('creator_docs').getFullList<Document>({
                filter,
                sort: '-last_edited'
            });
        } catch {
            return [];
        }
    },

    getDocumentById: async (id: string): Promise<Document | null> => {
        if (isMockEnv()) {
            return MOCK_DOCUMENTS.find(d => d.id === id) || null;
        }

        try {
            return await pb.collection('creator_docs').getOne<Document>(id);
        } catch {
            return null;
        }
    },

    createDocument: async (data: Partial<Document>): Promise<Document> => {
        if (isMockEnv()) {
            const newDoc: Document = {
                id: `doc-${Date.now()}`,
                user: data.user || '',
                title: data.title || 'Untitled Document',
                type: data.type || 'document',
                content: data.content || '',
                shared_with: data.shared_with || [],
                last_edited: new Date().toISOString(),
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_DOCUMENTS.push(newDoc);
            return newDoc;
        }

        return await pb.collection('creator_docs').create<Document>({
            ...data,
            last_edited: new Date().toISOString()
        });
    },

    updateDocument: async (id: string, data: Partial<Document>): Promise<Document | null> => {
        if (isMockEnv()) {
            const doc = MOCK_DOCUMENTS.find(d => d.id === id);
            if (doc) {
                Object.assign(doc, data, { last_edited: new Date().toISOString() });
            }
            return doc || null;
        }

        return await pb.collection('creator_docs').update<Document>(id, {
            ...data,
            last_edited: new Date().toISOString()
        });
    },

    deleteDocument: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_DOCUMENTS.findIndex(d => d.id === id);
            if (index !== -1) {
                MOCK_DOCUMENTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('creator_docs').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    shareDocument: async (docId: string, userIds: string[]): Promise<Document | null> => {
        if (isMockEnv()) {
            const doc = MOCK_DOCUMENTS.find(d => d.id === docId);
            if (doc) {
                doc.shared_with = [...new Set([...doc.shared_with, ...userIds])];
            }
            return doc || null;
        }

        try {
            const doc = await pb.collection('creator_docs').getOne<Document>(docId);
            return await pb.collection('creator_docs').update<Document>(docId, {
                shared_with: [...new Set([...doc.shared_with, ...userIds])]
            });
        } catch {
            return null;
        }
    },

    unshareDocument: async (docId: string, userId: string): Promise<Document | null> => {
        if (isMockEnv()) {
            const doc = MOCK_DOCUMENTS.find(d => d.id === docId);
            if (doc) {
                doc.shared_with = doc.shared_with.filter(id => id !== userId);
            }
            return doc || null;
        }

        try {
            const doc = await pb.collection('creator_docs').getOne<Document>(docId);
            return await pb.collection('creator_docs').update<Document>(docId, {
                shared_with: doc.shared_with.filter(id => id !== userId)
            });
        } catch {
            return null;
        }
    },

    // Design Projects
    getDesignProjects: async (userId: string): Promise<DesignProject[]> => {
        if (isMockEnv()) {
            return MOCK_DESIGN_PROJECTS.filter(d => d.user === userId);
        }

        try {
            return await pb.collection('creator_designs').getFullList<DesignProject>({
                filter: `user = "${userId}"`,
                sort: '-created'
            });
        } catch {
            return [];
        }
    },

    getDesignProjectById: async (id: string): Promise<DesignProject | null> => {
        if (isMockEnv()) {
            return MOCK_DESIGN_PROJECTS.find(d => d.id === id) || null;
        }

        try {
            return await pb.collection('creator_designs').getOne<DesignProject>(id);
        } catch {
            return null;
        }
    },

    createDesignProject: async (data: Partial<DesignProject>): Promise<DesignProject> => {
        if (isMockEnv()) {
            const newProject: DesignProject = {
                id: `design-${Date.now()}`,
                user: data.user || '',
                title: data.title || 'Untitled Design',
                description: data.description,
                layers: data.layers || [],
                canvasSize: data.canvasSize || { width: 1920, height: 1080 },
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_DESIGN_PROJECTS.push(newProject);
            return newProject;
        }

        return await pb.collection('creator_designs').create<DesignProject>(data);
    },

    updateDesignProject: async (id: string, data: Partial<DesignProject>): Promise<DesignProject | null> => {
        if (isMockEnv()) {
            const project = MOCK_DESIGN_PROJECTS.find(v => v.id === id);
            if (project) {
                Object.assign(project, data);
            }
            return project || null;
        }

        return await pb.collection('creator_designs').update<DesignProject>(id, data);
    },

    deleteDesignProject: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_DESIGN_PROJECTS.findIndex(v => v.id === id);
            if (index !== -1) {
                MOCK_DESIGN_PROJECTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('creator_designs').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    // Statistics
    getCreatorStats: async (userId: string) => {
        if (isMockEnv()) {
            const videos = MOCK_VIDEO_PROJECTS.filter(v => v.user === userId);
            const code = MOCK_CODE_PROJECTS.filter(c => c.user === userId);
            const docs = MOCK_DOCUMENTS.filter(d => d.user === userId);
            const designs = MOCK_DESIGN_PROJECTS.filter(d => d.user === userId);

            return {
                totalProjects: videos.length + code.length + docs.length + designs.length,
                videoProjects: videos.length,
                designProjects: designs.length,
                completedVideos: videos.filter(v => v.status === 'completed').length,
                codeProjects: code.length,
                publicCodeProjects: code.filter(c => c.is_public).length,
                totalStars: code.reduce((sum, c) => sum + c.stars, 0),
                totalForks: code.reduce((sum, c) => sum + c.forks, 0),
                documents: docs.length,
                sharedDocuments: docs.filter(d => d.shared_with.length > 0).length
            };
        }

        try {
            const [videos, code, docs, designs] = await Promise.all([
                pb.collection('creator_videos').getFullList<VideoProject>({ filter: `user = "${userId}"` }),
                pb.collection('creator_code').getFullList<CodeProject>({ filter: `user = "${userId}"` }),
                pb.collection('creator_docs').getFullList<Document>({ filter: `user = "${userId}"` }),
                pb.collection('creator_designs').getFullList<DesignProject>({ filter: `user = "${userId}"` })
            ]);

            return {
                totalProjects: videos.length + code.length + docs.length + designs.length,
                videoProjects: videos.length,
                designProjects: designs.length,
                completedVideos: videos.filter(v => v.status === 'completed').length,
                codeProjects: code.length,
                publicCodeProjects: code.filter(c => c.is_public).length,
                totalStars: code.reduce((sum, c) => sum + c.stars, 0),
                totalForks: code.reduce((sum, c) => sum + c.forks, 0),
                documents: docs.length,
                sharedDocuments: docs.filter(d => d.shared_with.length > 0).length
            };
        } catch {
            return {
                totalProjects: 0,
                videoProjects: 0,
                completedVideos: 0,
                codeProjects: 0,
                publicCodeProjects: 0,
                totalStars: 0,
                totalForks: 0,
                documents: 0,
                sharedDocuments: 0
            };
        }
    }
};
