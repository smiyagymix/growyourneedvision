// Video Editor Constants

export const VIDEO_CONSTANTS = {
    // Render Settings
    DEFAULT_FPS: 30,
    DEFAULT_DURATION: 150, // 5 seconds at 30fps
    MIN_DURATION: 30,
    MAX_DURATION: 18000, // 10 minutes at 30fps

    // Resolution
    RESOLUTIONS: {
        '4K': { width: 3840, height: 2160 },
        '1080p': { width: 1920, height: 1080 },
        '720p': { width: 1280, height: 720 },
        '480p': { width: 854, height: 480 },
    },

    // File Size Limits (in bytes)
    MAX_FILE_SIZES: {
        image: 10 * 1024 * 1024, // 10MB
        video: 100 * 1024 * 1024, // 100MB
        audio: 20 * 1024 * 1024, // 20MB
        logo: 5 * 1024 * 1024, // 5MB
    },

    // Supported Formats
    SUPPORTED_FORMATS: {
        image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        video: ['.mp4', '.webm', '.mov'],
        audio: ['.mp3', '.wav', '.ogg', '.m4a'],
    },

    // Timeline
    TIMELINE: {
        MIN_ZOOM: 0.1,
        MAX_ZOOM: 10,
        DEFAULT_ZOOM: 1,
        MARKER_SIZE: 20,
    },

    // Cache
    CACHE: {
        MAX_SIZE: 100,
        DEFAULT_TTL: 3600000, // 1 hour
        CLEANUP_INTERVAL: 300000, // 5 minutes
    },

    // Performance
    PERFORMANCE: {
        HIGH_CPU_THRESHOLD: 80,
        MEDIUM_CPU_THRESHOLD: 50,
        MAX_HISTORY: 50,
        SNAPSHOT_INTERVAL: 1000,
    },

    // Export
    EXPORT: {
        QUALITY_LEVELS: ['draft', 'medium', 'high', 'ultra'] as const,
        DEFAULT_QUALITY: 'high' as const,
        BITRATES: {
            draft: 1000,
            medium: 3000,
            high: 6000,
            ultra: 12000,
        },
    },

    // Animation
    ANIMATION: {
        FADE_DURATION: 20,
        SLIDE_DURATION: 30,
        BOUNCE_INTENSITY: 0.2,
        SPRING_CONFIG: {
            damping: 200,
            stiffness: 100,
            mass: 0.5,
        },
    },

    // UI
    UI: {
        PREVIEW_UPDATE_THROTTLE: 16, // 60fps
        DEBOUNCE_DELAY: 300,
        TOAST_DURATION: 3000,
        MODAL_ANIMATION_MS: 200,
    },
} as const;

export const MIME_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/mp4': ['.m4a'],
} as const;

export const ERROR_MESSAGES = {
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
    INVALID_FORMAT: 'File format not supported',
    UPLOAD_FAILED: 'Failed to upload file',
    EXPORT_FAILED: 'Failed to export video',
    INVALID_DURATION: 'Duration must be between 1 second and 10 minutes',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
    NETWORK_ERROR: 'Network connection error',
    RENDER_ERROR: 'Rendering failed',
} as const;

export const SUCCESS_MESSAGES = {
    UPLOAD_SUCCESS: 'File uploaded successfully',
    EXPORT_SUCCESS: 'Video exported successfully',
    SAVE_SUCCESS: 'Project saved successfully',
    COPY_SUCCESS: 'Copied to clipboard',
} as const;
