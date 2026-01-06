import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface PlatformConfig {
    id: string;
    key: string;
    value: any;
    description: string;
    category: string;
}

export const usePlatformSettings = (category: string) => {
    const [settings, setSettings] = useState<PlatformConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                if (isMockEnv()) {
                    const defaultSettings: PlatformConfig[] = [
                        { id: 'mock-1', key: `enable_${category.toLowerCase()}_feature_1`, value: true, description: `Enable primary ${category} feature`, category },
                        { id: 'mock-2', key: `enable_${category.toLowerCase()}_feature_2`, value: false, description: `Enable beta ${category} feature`, category },
                        { id: 'mock-3', key: `${category.toLowerCase()}_api_url`, value: 'https://api.growyourneed.com/v1', description: 'External API Endpoint', category },
                        { id: 'brand-1', key: 'primary_color', value: '#3041c7', description: 'Main brand color', category: 'Branding' },
                        { id: 'brand-2', key: 'secondary_color', value: '#f5a623', description: 'Secondary accent color', category: 'Branding' },
                        { id: 'brand-3', key: 'portal_name', value: 'Grow Your Need', description: 'Platform display name', category: 'Branding' },
                        { id: 'brand-4', key: 'logo_url', value: '', description: 'Main logo image URL', category: 'Branding' },
                    ];
                    setSettings(defaultSettings);
                    setLoading(false);
                    return;
                }
                // Try to fetch from 'platform_settings' collection
                try {
                    const records = await pb.collection('platform_settings').getList(1, 50, {
                        filter: `category = "${category}"`,
                    });

                    if (records.items.length > 0) {
                        setSettings(records.items.map((item: any) => ({
                            id: item.id,
                            key: item.key,
                            value: item.value,
                            description: item.description,
                            category: item.category
                        })));
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    // Collection might not exist
                }

                // Fallback: Seed Data if empty
                const defaultSettings: Partial<PlatformConfig>[] = [
                    { key: `enable_${category.toLowerCase()}_feature_1`, value: true, description: `Enable primary ${category} feature`, category },
                    { key: `enable_${category.toLowerCase()}_feature_2`, value: false, description: `Enable beta ${category} feature`, category },
                    { key: `${category.toLowerCase()}_api_url`, value: 'https://api.growyourneed.com/v1', description: 'External API Endpoint', category },
                    { key: 'primary_color', value: '#3041c7', description: 'Main brand color', category: 'Branding' },
                    { key: 'secondary_color', value: '#f5a623', description: 'Secondary accent color', category: 'Branding' },
                    { key: 'portal_name', value: 'Grow Your Need', description: 'Platform display name', category: 'Branding' },
                    { key: 'logo_url', value: '', description: 'Main logo image URL', category: 'Branding' },
                ];

                // Attempt to seed
                const seeded: PlatformConfig[] = [];
                try {
                    for (const setting of defaultSettings) {
                        const record = await pb.collection('platform_settings').create(setting);
                        seeded.push({
                            id: record.id,
                            key: record.key,
                            value: record.value,
                            description: record.description,
                            category: record.category
                        });
                    }
                } catch (e) {
                    console.warn("Failed to seed settings (likely permissions or schema missing), using memory-only:", e);
                }

                if (seeded.length > 0) {
                    setSettings(seeded);
                } else {
                    // If seeding fails, fall back to memory-only
                    setSettings(defaultSettings.map((s, i) => ({ ...s, id: `local-fallback-${i}` } as PlatformConfig)));
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [category]);

    const updateSetting = async (id: string, value: any) => {
        try {
            // If it's a real record (has valid ID length usually > 5 for PB)
            if (id.length > 5) {
                await pb.collection('platform_settings').update(id, { value });
            }
            // Update local state
            setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s));
        } catch (err) {
            console.error("Failed to update setting", err);
            throw err;
        }
    };

    return { settings, loading, error, updateSetting };
};
