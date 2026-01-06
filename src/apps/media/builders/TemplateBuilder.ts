import { TemplateType } from '../templates/types';

export interface TemplateConfig {
    name: string;
    type: TemplateType;
    defaultProps: Record<string, string | number | boolean>;
    requiredProps: string[];
    optionalProps: string[];
    previewThumbnail?: string;
}

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
    {
        name: 'Educational Template',
        type: 'educational',
        defaultProps: {
            title: 'Lesson Title',
            subtitle: 'Introduction',
            subject: 'Mathematics',
            lessonNumber: '1',
            primaryColor: '#3b82f6',
            backgroundColor: '#1e3a8a',
        },
        requiredProps: ['title', 'subject', 'lessonNumber'],
        optionalProps: ['subtitle', 'logoUrl', 'backgroundImageUrl'],
    },
    {
        name: 'Corporate Template',
        type: 'corporate',
        defaultProps: {
            title: 'Your Message',
            subtitle: 'Professional Presentation',
            companyName: 'Company Name',
            tagline: 'Excellence in Innovation',
            primaryColor: '#059669',
            backgroundColor: '#0f172a',
        },
        requiredProps: ['title', 'companyName'],
        optionalProps: ['subtitle', 'tagline', 'logoUrl', 'backgroundImageUrl'],
    },
    {
        name: 'Minimal Template',
        type: 'minimal',
        defaultProps: {
            title: 'Clean Design',
            subtitle: 'Simple and Elegant',
            accentPosition: 'center',
            primaryColor: '#8b5cf6',
            backgroundColor: '#ffffff',
        },
        requiredProps: ['title'],
        optionalProps: ['subtitle', 'accentPosition', 'logoUrl'],
    },
];

export class TemplateBuilder {
    static getConfig(type: TemplateType): TemplateConfig | null {
        return TEMPLATE_CONFIGS.find(c => c.type === type) || null;
    }

    static createFromConfig(config: TemplateConfig, userProps: Record<string, unknown>): Record<string, unknown> {
        const props = { ...config.defaultProps };

        Object.keys(userProps).forEach(key => {
            if (config.requiredProps.includes(key) || config.optionalProps.includes(key)) {
                props[key] = userProps[key] as string | number | boolean;
            }
        });

        return props;
    }

    static validateProps(config: TemplateConfig, props: Record<string, unknown>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        config.requiredProps.forEach(prop => {
            if (!(prop in props)) {
                errors.push(`Missing required property: ${prop}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    static cloneTemplate(type: TemplateType, newName: string): TemplateConfig | null {
        const original = this.getConfig(type);
        if (!original) return null;

        return {
            ...original,
            name: newName,
        };
    }

    static exportTemplate(config: TemplateConfig): string {
        return JSON.stringify(config, null, 2);
    }

    static importTemplate(json: string): TemplateConfig | null {
        try {
            return JSON.parse(json) as TemplateConfig;
        } catch {
            return null;
        }
    }
}
