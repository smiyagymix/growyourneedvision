import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface UtilityTool extends RecordModel {
    name: string;
    description: string;
    icon: string;
    url?: string;
    category: string;
    is_active: boolean;
}

// Mock data
const MOCK_DEV_TOOLS: UtilityTool[] = [
    {
        id: 'dev-1',
        collectionId: 'mock',
        collectionName: 'utils_dev',
        name: 'JSON Formatter',
        description: 'Format and validate JSON data',
        icon: '🔧',
        url: '/utils/json-formatter',
        category: 'data',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'dev-2',
        collectionId: 'mock',
        collectionName: 'utils_dev',
        name: 'Regex Tester',
        description: 'Test and debug regular expressions',
        icon: '🔍',
        url: '/utils/regex-tester',
        category: 'testing',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'dev-3',
        collectionId: 'mock',
        collectionName: 'utils_dev',
        name: 'Code Formatter',
        description: 'Format code in multiple languages',
        icon: '📝',
        url: '/utils/code-formatter',
        category: 'formatting',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'dev-4',
        collectionId: 'mock',
        collectionName: 'utils_dev',
        name: 'Base64 Encoder/Decoder',
        description: 'Encode and decode Base64 strings',
        icon: '🔐',
        url: '/utils/base64',
        category: 'encoding',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

const MOCK_DESIGN_TOOLS: UtilityTool[] = [
    {
        id: 'design-1',
        collectionId: 'mock',
        collectionName: 'utils_design',
        name: 'Color Picker',
        description: 'Pick and convert colors between formats',
        icon: '🎨',
        url: '/utils/color-picker',
        category: 'color',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'design-2',
        collectionId: 'mock',
        collectionName: 'utils_design',
        name: 'Image Compressor',
        description: 'Compress images without losing quality',
        icon: '🖼️',
        url: '/utils/image-compress',
        category: 'image',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'design-3',
        collectionId: 'mock',
        collectionName: 'utils_design',
        name: 'Icon Generator',
        description: 'Generate app icons in multiple sizes',
        icon: '📱',
        url: '/utils/icon-generator',
        category: 'icons',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

const MOCK_GENERAL_UTILS: UtilityTool[] = [
    {
        id: 'general-1',
        collectionId: 'mock',
        collectionName: 'utils_general',
        name: 'QR Code Generator',
        description: 'Generate QR codes from text or URLs',
        icon: '📊',
        url: '/utils/qr-generator',
        category: 'generator',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'general-2',
        collectionId: 'mock',
        collectionName: 'utils_general',
        name: 'Password Generator',
        description: 'Generate secure random passwords',
        icon: '🔑',
        url: '/utils/password-generator',
        category: 'security',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'general-3',
        collectionId: 'mock',
        collectionName: 'utils_general',
        name: 'Unit Converter',
        description: 'Convert between different units',
        icon: '📏',
        url: '/utils/unit-converter',
        category: 'converter',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'general-4',
        collectionId: 'mock',
        collectionName: 'utils_general',
        name: 'Timestamp Converter',
        description: 'Convert timestamps and dates',
        icon: '⏰',
        url: '/utils/timestamp',
        category: 'time',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

const MOCK_RESOURCES: UtilityTool[] = [
    {
        id: 'resource-1',
        collectionId: 'mock',
        collectionName: 'utils_resources',
        name: 'Documentation Hub',
        description: 'Links to popular documentation sites',
        icon: '📚',
        url: '/utils/docs',
        category: 'docs',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'resource-2',
        collectionId: 'mock',
        collectionName: 'utils_resources',
        name: 'API References',
        description: 'Quick access to API documentation',
        icon: '🔗',
        url: '/utils/api-refs',
        category: 'api',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'resource-3',
        collectionId: 'mock',
        collectionName: 'utils_resources',
        name: 'Cheat Sheets',
        description: 'Quick reference cheat sheets',
        icon: '📋',
        url: '/utils/cheat-sheets',
        category: 'reference',
        is_active: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

export const utilityService = {
    // Dev Essentials
    async getDevTools(): Promise<UtilityTool[]> {
        if (isMockEnv()) {
            return MOCK_DEV_TOOLS.filter(t => t.is_active);
        }

        try {
            return await pb.collection('utils_dev').getFullList<UtilityTool>({
                filter: 'is_active = true',
                sort: 'name'
            });
        } catch (error) {
            console.error('Error fetching dev tools:', error);
            return MOCK_DEV_TOOLS.filter(t => t.is_active);
        }
    },

    // Design & Media
    async getDesignTools(): Promise<UtilityTool[]> {
        if (isMockEnv()) {
            return MOCK_DESIGN_TOOLS.filter(t => t.is_active);
        }

        try {
            return await pb.collection('utils_design').getFullList<UtilityTool>({
                filter: 'is_active = true',
                sort: 'name'
            });
        } catch (error) {
            console.error('Error fetching design tools:', error);
            return MOCK_DESIGN_TOOLS.filter(t => t.is_active);
        }
    },

    // General Utilities
    async getGeneralUtilities(): Promise<UtilityTool[]> {
        if (isMockEnv()) {
            return MOCK_GENERAL_UTILS.filter(t => t.is_active);
        }

        try {
            return await pb.collection('utils_general').getFullList<UtilityTool>({
                filter: 'is_active = true',
                sort: 'name'
            });
        } catch (error) {
            console.error('Error fetching general utilities:', error);
            return MOCK_GENERAL_UTILS.filter(t => t.is_active);
        }
    },

    // Resources
    async getResources(): Promise<UtilityTool[]> {
        if (isMockEnv()) {
            return MOCK_RESOURCES.filter(t => t.is_active);
        }

        try {
            return await pb.collection('utils_resources').getFullList<UtilityTool>({
                filter: 'is_active = true',
                sort: 'name'
            });
        } catch (error) {
            console.error('Error fetching resources:', error);
            return MOCK_RESOURCES.filter(t => t.is_active);
        }
    },

    // Get all tools across all categories
    async getAllTools(): Promise<UtilityTool[]> {
        const [dev, design, general, resources] = await Promise.all([
            this.getDevTools(),
            this.getDesignTools(),
            this.getGeneralUtilities(),
            this.getResources()
        ]);
        return [...dev, ...design, ...general, ...resources];
    },

    // Search across all tools
    async searchTools(query: string): Promise<UtilityTool[]> {
        const allTools = await this.getAllTools();
        const lowerQuery = query.toLowerCase();
        return allTools.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.category.toLowerCase().includes(lowerQuery)
        );
    },

    // Get tools by category
    async getToolsByCategory(category: string): Promise<UtilityTool[]> {
        const allTools = await this.getAllTools();
        return allTools.filter(t => t.category === category);
    },

    // Get tool categories
    async getCategories(): Promise<string[]> {
        const allTools = await this.getAllTools();
        const categories = new Set(allTools.map(t => t.category));
        return Array.from(categories).sort();
    }
};
