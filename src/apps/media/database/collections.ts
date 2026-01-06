// PocketBase Collection Schemas for Video Editor

export const VIDEO_EDITOR_COLLECTIONS = {
    // Video Exports Collection
    video_exports: {
        name: 'video_exports',
        type: 'base',
        schema: [
            { name: 'composition_id', type: 'text', required: true },
            { name: 'format', type: 'select', required: true, options: { values: ['mp4', 'gif', 'webm'] } },
            { name: 'quality', type: 'select', required: true, options: { values: ['draft', 'medium', 'high', 'ultra'] } },
            { name: 'minio_url', type: 'url', required: true },
            { name: 'local_path', type: 'text', required: true },
            { name: 'file_size', type: 'number', required: false },
            { name: 'duration', type: 'number', required: false },
            { name: 'exported_by', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_' } },
        ],
        indexes: [
            'CREATE INDEX idx_exports_user ON video_exports (exported_by)',
            'CREATE INDEX idx_exports_format ON video_exports (format)',
        ],
    },

    // Batch Exports Collection
    batch_exports: {
        name: 'batch_exports',
        type: 'base',
        schema: [
            { name: 'job_id', type: 'text', required: true },
            { name: 'video_index', type: 'number', required: true },
            { name: 'format', type: 'select', required: true, options: { values: ['mp4', 'gif', 'webm'] } },
            { name: 'minio_url', type: 'url', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['pending', 'processing', 'completed', 'failed'] } },
            { name: 'exported_by', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_' } },
        ],
        indexes: [
            'CREATE INDEX idx_batch_job ON batch_exports (job_id)',
            'CREATE INDEX idx_batch_status ON batch_exports (status)',
        ],
    },

    // Analytics Events Collection
    analytics_events: {
        name: 'analytics_events',
        type: 'base',
        schema: [
            { name: 'type', type: 'select', required: true, options: { values: ['video_created', 'video_exported', 'template_used', 'effect_applied', 'scene_added'] } },
            { name: 'metadata', type: 'json', required: true },
            { name: 'user_id', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_' } },
            { name: 'occurred_at', type: 'date', required: true },
        ],
        indexes: [
            'CREATE INDEX idx_events_type ON analytics_events (type)',
            'CREATE INDEX idx_events_user ON analytics_events (user_id)',
            'CREATE INDEX idx_events_date ON analytics_events (occurred_at)',
        ],
    },

    // Video Projects Collection
    video_projects: {
        name: 'video_projects',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'version', type: 'number', required: true },
            { name: 'state', type: 'json', required: true },
            { name: 'thumbnail', type: 'file', required: false },
            { name: 'duration', type: 'number', required: false },
            { name: 'template_type', type: 'select', required: true, options: { values: ['educational', 'corporate', 'minimal'] } },
            { name: 'owner', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_' } },
        ],
        indexes: [
            'CREATE INDEX idx_projects_owner ON video_projects (owner)',
            'CREATE INDEX idx_projects_template ON video_projects (template_type)',
        ],
    },

    // Media Assets Collection
    media_assets: {
        name: 'media_assets',
        type: 'base',
        schema: [
            { name: 'type', type: 'select', required: true, options: { values: ['image', 'video', 'audio', 'logo'] } },
            { name: 'name', type: 'text', required: true },
            { name: 'url', type: 'url', required: true },
            { name: 'size', type: 'number', required: true },
            { name: 'tags', type: 'json', required: false },
            { name: 'usage_count', type: 'number', required: false },
            { name: 'uploaded_by', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_' } },
        ],
        indexes: [
            'CREATE INDEX idx_assets_type ON media_assets (type)',
            'CREATE INDEX idx_assets_user ON media_assets (uploaded_by)',
        ],
    },
};

// Migration Script Generator
export function generateMigrationSQL(): string {
    return `
-- Video Editor Collections Migration
-- Run this in PocketBase Admin Panel > Settings > Import Collections

${JSON.stringify(Object.values(VIDEO_EDITOR_COLLECTIONS), null, 2)}
    `.trim();
}
