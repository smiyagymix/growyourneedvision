export interface VideoMetadata {
    title: string;
    description: string;
    author: string;
    tags: string[];
    category: string;
    createdAt: Date;
    modifiedAt: Date;
    duration: number;
    resolution: string;
    fps: number;
    customFields: Record<string, string>;
}

export class MetadataEditor {
    static createMetadata(title: string, author: string): VideoMetadata {
        return {
            title,
            description: '',
            author,
            tags: [],
            category: 'General',
            createdAt: new Date(),
            modifiedAt: new Date(),
            duration: 0,
            resolution: '1920x1080',
            fps: 30,
            customFields: {},
        };
    }

    static updateMetadata(
        metadata: VideoMetadata,
        updates: Partial<VideoMetadata>
    ): VideoMetadata {
        return {
            ...metadata,
            ...updates,
            modifiedAt: new Date(),
        };
    }

    static addTag(metadata: VideoMetadata, tag: string): VideoMetadata {
        if (metadata.tags.includes(tag)) {
            return metadata;
        }

        return {
            ...metadata,
            tags: [...metadata.tags, tag],
            modifiedAt: new Date(),
        };
    }

    static removeTag(metadata: VideoMetadata, tag: string): VideoMetadata {
        return {
            ...metadata,
            tags: metadata.tags.filter(t => t !== tag),
            modifiedAt: new Date(),
        };
    }

    static setCustomField(
        metadata: VideoMetadata,
        key: string,
        value: string
    ): VideoMetadata {
        return {
            ...metadata,
            customFields: {
                ...metadata.customFields,
                [key]: value,
            },
            modifiedAt: new Date(),
        };
    }

    static removeCustomField(metadata: VideoMetadata, key: string): VideoMetadata {
        const { [key]: _, ...remainingFields } = metadata.customFields;

        return {
            ...metadata,
            customFields: remainingFields,
            modifiedAt: new Date(),
        };
    }

    static exportToJSON(metadata: VideoMetadata): string {
        return JSON.stringify(metadata, null, 2);
    }

    static importFromJSON(json: string): VideoMetadata | null {
        try {
            const data = JSON.parse(json);
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                modifiedAt: new Date(data.modifiedAt),
            };
        } catch {
            return null;
        }
    }

    static generateSEODescription(metadata: VideoMetadata): string {
        const { title, tags, category } = metadata;
        const tagString = tags.slice(0, 5).join(', ');

        return `${title} - ${category}${tagString ? ` | ${tagString}` : ''}`;
    }

    static validateMetadata(metadata: VideoMetadata): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!metadata.title || metadata.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!metadata.author || metadata.author.trim().length === 0) {
            errors.push('Author is required');
        }

        if (metadata.duration <= 0) {
            errors.push('Duration must be greater than 0');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
