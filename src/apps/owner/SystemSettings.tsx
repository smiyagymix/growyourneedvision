import React, { useEffect, useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { ownerService, SystemSetting, JsonValue } from '../../services/ownerService';
import { Button, Card, Icon } from '../../components/shared/ui/CommonUI';
import { LoadingScreen } from '../../components/shared/LoadingScreen';

type JsonObject = { [key: string]: JsonValue };

export const SystemSettings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await ownerService.getSystemSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings", error);
        } finally {
            setLoading(false);
        }
    };


    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
        const cat = setting.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(setting);
        return acc;
    }, {} as Record<string, SystemSetting[]>);

    const handleToggle = async (setting: SystemSetting) => {
        if (typeof setting.value !== 'boolean') return;

        try {
            const newValue = !setting.value;
            // Optimistic update
            const updatedSettings = settings.map(s => s.id === setting.id ? { ...s, value: newValue } : s);
            setSettings(updatedSettings);

            await ownerService.updateSystemSetting(setting.id, newValue);
        } catch (error) {
            console.error("Failed to update setting", error);
            // Revert on error
            loadSettings();
        }
    };

    const handleTextChange = async (setting: SystemSetting, newValue: string) => {
        // Debounce could be added here, for now simpler implementation
        try {
            await ownerService.updateSystemSetting(setting.id, newValue);
            const updatedSettings = settings.map(s => s.id === setting.id ? { ...s, value: newValue } : s);
            setSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to update text setting", error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'general': return 'GlobeAltIcon';
            case 'security': return 'ShieldCheckIcon';
            case 'communications': return 'EnvelopeIcon';
            case 'billing': return 'CreditCardIcon';
            case 'appearance': return 'SwatchIcon';
            default: return 'Cog6ToothIcon';
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">System Configuration</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage the core engine and security rules of the Grow Your Need platform.</p>
                </div>
                <Button variant="outline" onClick={loadSettings}>
                    <Icon name="ArrowPathIcon" className="w-5 h-5 mr-2" />
                    Sync Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(groupedSettings).map(([category, catSettings]) => (
                    <Card key={category} className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Icon name={getCategoryIcon(category)} className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{category}</h3>
                                <p className="text-xs text-gray-500">{catSettings.length} configuration keys</p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {catSettings.map(setting => (
                                <div key={setting.id} className="p-6 hover:bg-gray-50/20 dark:hover:bg-gray-800/20 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 mr-6">
                                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-widest block mb-1">
                                                {setting.key.replace(/_/g, ' ')}
                                            </span>
                                            {setting.description && (
                                                <p className="text-xs text-gray-500 leading-relaxed font-medium">{setting.description}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            {typeof setting.value === 'boolean' ? (
                                                <button
                                                    onClick={() => handleToggle(setting)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${setting.value ? 'bg-indigo-600 shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)]' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.value ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            ) : setting.key.includes('color') ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        defaultValue={String(setting.value)}
                                                        onBlur={(e) => handleTextChange(setting, e.target.value)}
                                                        className="h-8 w-8 p-1 rounded-lg border-none shadow-sm cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        defaultValue={String(setting.value)}
                                                        onBlur={(e) => handleTextChange(setting, e.target.value)}
                                                        className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[10px] font-mono"
                                                    />
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    defaultValue={String(setting.value)}
                                                    onBlur={(e) => handleTextChange(setting, e.target.value)}
                                                    className="min-w-[120px] px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
