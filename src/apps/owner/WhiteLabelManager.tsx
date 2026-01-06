import React, { useState } from 'react';
import { z } from 'zod';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { Card, Button, Heading1, Heading3, Text, Icon, OwnerIcon } from '../../components/shared/ui/CommonUI';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const brandingSchema = z.object({
  portal_name: z.string().min(2, 'Portal name must be at least 2 characters').max(100, 'Portal name too long'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
});

export const WhiteLabelManager: React.FC = () => {
    const { settings, loading, updateSetting } = usePlatformSettings('Branding');
    const [previewLoading, setPreviewLoading] = useState(false);

    if (loading) return <LoadingScreen />;

    const getSetting = (key: string) => settings.find(s => s.key === key);

    const { showToast } = useToast();
    
    const handleUpdate = async (id: string, key: string, value: any) => {
        // Sanitize input
        const sanitized = typeof value === 'string' ? sanitizeText(value) : value;
        
        // Validate based on field type
        const validationSchema = key.includes('color') 
            ? z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
            : z.string().min(2, 'Value too short').max(100, 'Value too long');
        
        const result = validationSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        setPreviewLoading(true);
        try {
            await updateSetting(id, result.data);
            showToast('Branding updated successfully', 'success');
        } catch (error) {
            console.error("Failed to update branding setting", error);
            showToast('Failed to update branding', 'error');
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <Heading1>White Labeling & Branding</Heading1>
                    <Text variant="muted">Manage your platform identity, colors, and assets.</Text>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <Icon name="ArrowPathIcon" className="w-5 h-5 mr-2" />
                    Refresh Preview
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <Heading3 className="mb-4">Visual Identity</Heading3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portal Name</label>
                                <input
                                    type="text"
                                    defaultValue={getSetting('portal_name')?.value}
                                    onBlur={(e) => handleUpdate(getSetting('portal_name')?.id!, 'portal_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Brand Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        defaultValue={getSetting('primary_color')?.value}
                                        onBlur={(e) => handleUpdate(getSetting('primary_color')?.id!, 'primary_color', e.target.value)}
                                        className="h-10 w-12 p-1 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        defaultValue={getSetting('primary_color')?.value}
                                        onBlur={(e) => handleUpdate(getSetting('primary_color')?.id!, 'primary_color', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secondary Accent Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        defaultValue={getSetting('secondary_color')?.value}
                                        onBlur={(e) => handleUpdate(getSetting('secondary_color')?.id!, 'secondary_color', e.target.value)}
                                        className="h-10 w-12 p-1 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        defaultValue={getSetting('secondary_color')?.value}
                                        onBlur={(e) => handleUpdate(getSetting('secondary_color')?.id!, 'secondary_color', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <Heading3 className="mb-4">Typography</Heading3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Font Family</label>
                                <select
                                    defaultValue={getSetting('font_family')?.value || 'Inter'}
                                    onChange={(e) => handleUpdate(getSetting('font_family')?.id!, 'font_family', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                >
                                    <option value="Inter">Inter (Default)</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Open Sans">Open Sans</option>
                                    <option value="Montserrat">Montserrat</option>
                                    <option value="Outfit">Outfit</option>
                                    <option value="Playfair Display">Playfair Display (Serif)</option>
                                    <option value="Fira Code">Fira Code (Monospace)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <Heading3 className="mb-4">Logos & Assets</Heading3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL (PNG/SVG)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    defaultValue={getSetting('logo_url')?.value}
                                    onBlur={(e) => handleUpdate(getSetting('logo_url')?.id!, 'logo_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favicon URL (.ico/.png)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    defaultValue={getSetting('favicon_url')?.value}
                                    onBlur={(e) => handleUpdate(getSetting('favicon_url')?.id!, 'favicon_url', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Live Preview Panel */}
                <div className="lg:col-span-2">
                    <Card className="h-full bg-gray-100 dark:bg-black/20 p-8 flex flex-col items-center justify-center border-dashed border-2 relative">
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <span className="text-xs text-gray-500 ml-2">Live Theme Preview</span>
                        </div>

                        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-500">
                            {/* Dummy Navigation */}
                            <div className="h-14 border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {getSetting('logo_url')?.value ? (
                                            <img src={getSetting('logo_url')?.value} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-4 h-4 bg-indigo-500 rounded-full" />
                                        )}
                                    </div>
                                    <span className="font-bold text-sm">{getSetting('portal_name')?.value || 'Grow Your Need'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>

                            {/* Dummy Hero */}
                            <div className="p-10 text-center space-y-4">
                                <div className="inline-block p-3 rounded-2xl bg-opacity-10 mb-2" style={{ backgroundColor: getSetting('primary_color')?.value + '20' }}>
                                    <span style={{ color: getSetting('primary_color')?.value }}>
                                        <OwnerIcon name="SparklesIcon" className="w-8 h-8" />
                                    </span>
                                </div>
                                <h1 className="text-2xl font-black">Welcome to {getSetting('portal_name')?.value || 'The Platform'}</h1>
                                <p className="text-sm text-gray-500">Experience a portal designed exactly for your brand's unique needs.</p>
                                <div className="pt-4 flex justify-center gap-3">
                                    <button
                                        className="px-6 py-2 rounded-full text-white text-sm font-bold shadow-lg transition-transform hover:scale-105"
                                        style={{ backgroundColor: getSetting('primary_color')?.value }}
                                    >
                                        Get Started
                                    </button>
                                    <button
                                        className="px-6 py-2 rounded-full text-sm font-bold border transition-colors"
                                        style={{ borderColor: getSetting('secondary_color')?.value, color: getSetting('secondary_color')?.value }}
                                    >
                                        Learn More
                                    </button>
                                </div>
                            </div>

                            {/* Dummy Widgets */}
                            <div className="px-6 pb-10 grid grid-cols-2 gap-4">
                                <div className="h-24 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="h-2 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                                <div className="h-24 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="h-2 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            </div>
                        </div>

                        {previewLoading && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <Icon name="ArrowPathIcon" className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
