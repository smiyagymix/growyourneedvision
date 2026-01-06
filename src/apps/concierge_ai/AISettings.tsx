import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { aiManagementService, AIConfig } from '../../services/aiManagementService';
import { useToast } from '../../hooks/useToast';

const aiConfigSchema = z.object({
  model: z.enum(['gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus'], { message: 'Invalid AI model' }),
  temperature: z.number().min(0, 'Temperature must be at least 0').max(1, 'Temperature must be at most 1'),
  filter_profanity: z.boolean(),
  block_pii: z.boolean()
});

export const AISettings: React.FC = () => {
    const [configs, setConfigs] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            const data = await aiManagementService.getConfigs();
            const configMap: Record<string, any> = {};
            data.forEach(c => {
                configMap[c.key] = { ...c.value, id: c.id }; // Store ID for updates
            });
            setConfigs(configMap);
        } catch (error) {
            console.error("Failed to load configs", error);
        } finally {
            setLoading(false);
        }
    };

    const { showToast } = useToast();
    
    const handleSave = async () => {
        // Validate configuration
        const configData = {
            model: configs['model_default']?.model || 'gpt-4-turbo',
            temperature: configs['model_default']?.temperature || 0.7,
            filter_profanity: configs['safety_settings']?.filter_profanity || false,
            block_pii: configs['safety_settings']?.block_pii || false
        };
        
        const result = aiConfigSchema.safeParse(configData);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        setSaving(true);
        try {
            // Update each config
            const updates = [];
            if (configs['model_default']) {
                updates.push(aiManagementService.updateConfig(configs['model_default'].id, { 
                    value: { model: result.data.model, temperature: result.data.temperature } 
                }));
            }
            if (configs['safety_settings']) {
                updates.push(aiManagementService.updateConfig(configs['safety_settings'].id, { 
                    value: { filter_profanity: result.data.filter_profanity, block_pii: result.data.block_pii } 
                }));
            }
            await Promise.all(updates);
            showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error("Failed to save settings", error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const updateConfigValue = (key: string, field: string, value: any) => {
        setConfigs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configuration</h2>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
            
            <Card className="p-6 space-y-6">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="CpuChipIcon" className="w-5 h-5 text-gray-500" />
                        Model Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Model</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                                value={configs['model_default']?.model || 'gpt-4-turbo'}
                                onChange={(e) => updateConfigValue('model_default', 'model', e.target.value)}
                            >
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                <option value="claude-3-opus">Claude 3 Opus</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Temperature: {configs['model_default']?.temperature || 0.7}</label>
                            <input 
                                type="range" min="0" max="1" step="0.1" className="w-full" 
                                value={configs['model_default']?.temperature || 0.7}
                                onChange={(e) => updateConfigValue('model_default', 'temperature', parseFloat(e.target.value))}
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Precise</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="ShieldCheckIcon" className="w-5 h-5 text-gray-500" />
                        Safety & Moderation
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-gyn-blue-medium focus:ring-gyn-blue-medium" 
                                checked={configs['safety_settings']?.filter_profanity || false}
                                onChange={(e) => updateConfigValue('safety_settings', 'filter_profanity', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Filter profanity and hate speech</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-gyn-blue-medium focus:ring-gyn-blue-medium" 
                                checked={configs['safety_settings']?.block_pii || false}
                                onChange={(e) => updateConfigValue('safety_settings', 'block_pii', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Block PII (Personally Identifiable Information)</span>
                        </label>
                    </div>
                </div>

            </Card>
        </div>
    );
};
