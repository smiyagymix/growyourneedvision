export const PLATFORM_SETTINGS = {
    BRANDING: {
        BRAND_NAME: 'brand_name',
        BRAND_LOGO_URL: 'brand_logo_url',
        PRIMARY_COLOR: 'brand_primary_color',
        SECONDARY_COLOR: 'brand_secondary_color',
        PORTAL_TITLE: 'portal_title',
        SUPPORT_EMAIL: 'support_email',
    },
    FEATURES: {
        ENABLE_REGISTRATION: 'enable_registration',
        ENABLE_MARKETPLACE: 'enable_marketplace',
        ENABLE_DARK_MODE: 'enable_dark_mode',
    },
    SYSTEM: {
        MAINTENANCE_MODE: 'maintenance_mode',
    },
    INTEGRATIONS: {
        STRIPE_PUBLIC_KEY: 'stripe_public_key',
    }
} as const;

export type PlatformSettingKey =
    | typeof PLATFORM_SETTINGS.BRANDING[keyof typeof PLATFORM_SETTINGS.BRANDING]
    | typeof PLATFORM_SETTINGS.FEATURES[keyof typeof PLATFORM_SETTINGS.FEATURES]
    | typeof PLATFORM_SETTINGS.SYSTEM[keyof typeof PLATFORM_SETTINGS.SYSTEM]
    | typeof PLATFORM_SETTINGS.INTEGRATIONS[keyof typeof PLATFORM_SETTINGS.INTEGRATIONS];
