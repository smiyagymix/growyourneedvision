import { RenderSettings } from '../optimizers/RenderOptimizer';

export interface ExportPreset {
    id: string;
    name: string;
    description: string;
    settings: RenderSettings;
    platform?: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'custom';
}

export const EXPORT_PRESETS: ExportPreset[] = [
    {
        id: 'youtube-hd',
        name: 'YouTube HD',
        description: 'Optimized for YouTube 1080p uploads',
        platform: 'youtube',
        settings: {
            quality: 'high',
            resolution: '1080p',
            frameRate: 60,
            codec: 'h264',
            bitrate: 8000,
        },
    },
    {
        id: 'instagram-feed',
        name: 'Instagram Feed',
        description: 'Square format for Instagram posts',
        platform: 'instagram',
        settings: {
            quality: 'medium',
            resolution: '1080p',
            frameRate: 30,
            codec: 'h264',
            bitrate: 3500,
        },
    },
    {
        id: 'instagram-story',
        name: 'Instagram Story',
        description: 'Vertical 9:16 for Instagram Stories',
        platform: 'instagram',
        settings: {
            quality: 'medium',
            resolution: '1080p',
            frameRate: 30,
            codec: 'h264',
            bitrate: 3000,
        },
    },
    {
        id: 'tiktok-standard',
        name: 'TikTok',
        description: 'Vertical format for TikTok',
        platform: 'tiktok',
        settings: {
            quality: 'high',
            resolution: '1080p',
            frameRate: 30,
            codec: 'h264',
            bitrate: 4000,
        },
    },
    {
        id: 'twitter-standard',
        name: 'Twitter',
        description: 'Optimized for Twitter videos',
        platform: 'twitter',
        settings: {
            quality: 'medium',
            resolution: '720p',
            frameRate: 30,
            codec: 'h264',
            bitrate: 2000,
        },
    },
    {
        id: 'linkedin-standard',
        name: 'LinkedIn',
        description: 'Professional quality for LinkedIn',
        platform: 'linkedin',
        settings: {
            quality: 'high',
            resolution: '1080p',
            frameRate: 30,
            codec: 'h264',
            bitrate: 5000,
        },
    },
    {
        id: '4k-ultra',
        name: '4K Ultra',
        description: 'Maximum quality 4K export',
        platform: 'custom',
        settings: {
            quality: 'ultra',
            resolution: '4k',
            frameRate: 60,
            codec: 'h265',
            bitrate: 20000,
        },
    },
    {
        id: 'web-optimized',
        name: 'Web Optimized',
        description: 'Balanced quality and file size for web',
        platform: 'custom',
        settings: {
            quality: 'medium',
            resolution: '1080p',
            frameRate: 30,
            codec: 'h264',
            bitrate: 3000,
        },
    },
];

export class ExportPresetManager {
    private customPresets: Map<string, ExportPreset> = new Map();

    getAllPresets(): ExportPreset[] {
        return [...EXPORT_PRESETS, ...Array.from(this.customPresets.values())];
    }

    getPreset(id: string): ExportPreset | null {
        const defaultPreset = EXPORT_PRESETS.find(p => p.id === id);
        if (defaultPreset) return defaultPreset;

        return this.customPresets.get(id) || null;
    }

    getPresetsByPlatform(platform: ExportPreset['platform']): ExportPreset[] {
        return this.getAllPresets().filter(p => p.platform === platform);
    }

    createCustomPreset(
        name: string,
        description: string,
        settings: RenderSettings
    ): ExportPreset {
        const preset: ExportPreset = {
            id: `custom-${Date.now()}`,
            name,
            description,
            settings,
            platform: 'custom',
        };

        this.customPresets.set(preset.id, preset);
        return preset;
    }

    deleteCustomPreset(id: string): boolean {
        return this.customPresets.delete(id);
    }

    duplicatePreset(id: string, newName: string): ExportPreset | null {
        const original = this.getPreset(id);
        if (!original) return null;

        return this.createCustomPreset(
            newName,
            `Copy of ${original.description}`,
            { ...original.settings }
        );
    }
}

export const exportPresetManager = new ExportPresetManager();
