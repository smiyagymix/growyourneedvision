
import React, { Suspense } from 'react';
import { Icon, Card, Button, Badge } from '../components/shared/ui/CommonUI';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import { useTheme } from '../context/ThemeContext';
import { SystemSettings } from './owner/SystemSettings';
import { LoadingScreen } from '../components/shared/LoadingScreen';

// Lazy load owner management components
const FeatureFlags = React.lazy(() => import('./owner/FeatureFlags'));
const SecuritySettings = React.lazy(() => import('./owner/SecuritySettings'));
const IntegrationSettings = React.lazy(() => import('./owner/IntegrationSettings'));
const AuditLogs = React.lazy(() => import('./owner/AuditLogs').then(module => ({ default: module.AuditLogs })));
const LegalDocuments = React.lazy(() => import('./owner/LegalDocumentsManager'));
const EmailTemplates = React.lazy(() => import('./owner/EmailTemplateManager'));
const SystemHealth = React.lazy(() => import('./owner/SystemHealthDashboard'));
const Webhooks = React.lazy(() => import('./owner/WebhookManager'));
const Reports = React.lazy(() => import('./owner/ReportScheduler'));
const APIDocs = React.lazy(() => import('./owner/APIDocumentationViewer'));
const Backups = React.lazy(() => import('./owner/BackupManager'));
const WhiteLabelManager = React.lazy(() => import('./owner/WhiteLabelManager').then(module => ({ default: module.WhiteLabelManager })));
const WhiteLabelDomainManager = React.lazy(() => import('./owner/WhiteLabelDomainManager').then(module => ({ default: module.WhiteLabelDomainManager })));

// Lazy load content managers
const ReligionContentManager = React.lazy(() => import('./owner/content-managers/ReligionContentManager').then(module => ({ default: module.ReligionContentManager })));
const MarketplaceContentManager = React.lazy(() => import('./owner/content-managers/MarketplaceContentManager').then(module => ({ default: module.MarketplaceContentManager })));
const SportContentManager = React.lazy(() => import('./owner/content-managers/SportContentManager').then(module => ({ default: module.SportContentManager })));
const GamificationContentManager = React.lazy(() => import('./owner/content-managers/GamificationContentManager').then(module => ({ default: module.GamificationContentManager })));
const MediaContentManager = React.lazy(() => import('./owner/content-managers/MediaContentManager').then(module => ({ default: module.MediaContentManager })));
const EventsContentManager = React.lazy(() => import('./owner/content-managers/EventsContentManager').then(module => ({ default: module.EventsContentManager })));
const HobbiesContentManager = React.lazy(() => import('./owner/content-managers/HobbiesContentManager').then(module => ({ default: module.HobbiesContentManager })));
const ServicesContentManager = React.lazy(() => import('./owner/content-managers/ServicesContentManager').then(module => ({ default: module.ServicesContentManager })));
const HelpContentManager = React.lazy(() => import('./owner/content-managers/HelpContentManager').then(module => ({ default: module.HelpContentManager })));
const CalendarContentManager = React.lazy(() => import('./owner/content-managers/CalendarContentManager').then(module => ({ default: module.CalendarContentManager })));
const StudioContentManager = React.lazy(() => import('./owner/content-managers/StudioContentManager').then(module => ({ default: module.StudioContentManager })));
const MessagingContentManager = React.lazy(() => import('./owner/content-managers/MessagingContentManager').then(module => ({ default: module.MessagingContentManager })));

interface PlatformSettingsProps {
    activeTab: string;
    activeSubNav: string;
}

const PlatformSettings: React.FC<PlatformSettingsProps> = ({ activeTab, activeSubNav }) => {
    const { theme, setTheme } = useTheme();

    // Feature Flags Tab
    if (activeTab === 'Feature Flags') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <FeatureFlags />
            </Suspense>
        );
    }

    // Security Tab
    if (activeTab === 'Security') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <SecuritySettings />
            </Suspense>
        );
    }

    // Integrations Tab
    if (activeTab === 'Integrations') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <IntegrationSettings />
            </Suspense>
        );
    }

    // Audit Logs Tab
    if (activeTab === 'Audit') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <AuditLogs />
            </Suspense>
        );
    }

    // Legal Documents Tab
    if (activeTab === 'Legal') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <LegalDocuments />
            </Suspense>
        );
    }

    // Email Templates Tab
    if (activeTab === 'Templates') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <EmailTemplates />
            </Suspense>
        );
    }

    // System Health Tab
    if (activeTab === 'Health') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <SystemHealth />
            </Suspense>
        );
    }

    // Webhooks Tab
    if (activeTab === 'Webhooks') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <Webhooks />
            </Suspense>
        );
    }

    // Reports Tab
    if (activeTab === 'Reports') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <Reports />
            </Suspense>
        );
    }

    // API Documentation Tab
    if (activeTab === 'API') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <APIDocs />
            </Suspense>
        );
    }

    // Backups Tab
    if (activeTab === 'Backups') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <Backups />
            </Suspense>
        );
    }

    if (activeTab === 'Configuration') {
        return <SystemSettings />;
    }

    if (activeSubNav === 'Branding') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <WhiteLabelManager />
            </Suspense>
        );
    }

    if (activeSubNav === 'Domains') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <WhiteLabelDomainManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Religion') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <ReligionContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Marketplace') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <MarketplaceContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Sport') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <SportContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Gamification') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <GamificationContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Media') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <MediaContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Events') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <EventsContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Hobbies') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <HobbiesContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Services') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <ServicesContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Help Center') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <HelpContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Calendar') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <CalendarContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Studio') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <StudioContentManager />
            </Suspense>
        );
    }

    if (activeTab === 'Backend' && activeSubNav === 'Messaging') {
        return (
            <Suspense fallback={<LoadingScreen />}>
                <MessagingContentManager />
            </Suspense>
        );
    }

    // Use activeSubNav to determine which settings group to load
    // If activeSubNav is empty or 'Configuration', default to 'General'
    const settingsGroup = (activeSubNav && activeSubNav !== 'Configuration') ? activeSubNav : 'General';
    const { settings, loading, updateSetting } = usePlatformSettings(settingsGroup);

    const handleToggle = async (id: string, currentValue: boolean) => {
        await updateSetting(id, !currentValue);
    };

    if (activeTab === 'Appearance' && activeSubNav === 'Themes') {
        return (
            <div className="max-w-4xl mx-auto py-8 animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gyn-blue-dark dark:text-white">Appearance</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Customize the look and feel of the platform.</p>
                </div>

                <Card className="overflow-hidden">
                    <div className="p-4 md:p-8 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg md:text-xl font-bold text-gyn-blue-dark dark:text-white mb-4 md:mb-6">Theme Preference</h2>

                        <div className="grid grid-cols-3 gap-2 md:gap-6">
                            {/* Light Theme */}
                            <button
                                onClick={() => setTheme('light')}
                                className={`relative p-2 md:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 md:gap-3 group ${theme === 'light'
                                    ? 'border-gyn-blue-medium bg-blue-50/50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gyn-blue-medium/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-gyn-blue-medium text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-gyn-blue-medium'
                                    }`}>
                                    <Icon name="SunIcon" className="w-4 h-4 md:w-6 md:h-6" />
                                </div>
                                <span className={`font-bold text-[10px] md:text-base text-center leading-tight ${theme === 'light' ? 'text-gyn-blue-dark dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Light Mode</span>
                                {theme === 'light' && (
                                    <div className="absolute top-1 right-1 md:top-3 md:right-3 text-gyn-blue-medium">
                                        <Icon name="CheckCircleIcon" className="w-3 h-3 md:w-5 md:h-5" />
                                    </div>
                                )}
                            </button>

                            {/* Dark Theme */}
                            <button
                                onClick={() => setTheme('dark')}
                                className={`relative p-2 md:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 md:gap-3 group ${theme === 'dark'
                                    ? 'border-gyn-blue-medium bg-blue-50/50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gyn-blue-medium/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-gyn-blue-medium text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-gyn-blue-medium'
                                    }`}>
                                    <Icon name="MoonIcon" className="w-4 h-4 md:w-6 md:h-6" />
                                </div>
                                <span className={`font-bold text-[10px] md:text-base text-center leading-tight ${theme === 'dark' ? 'text-gyn-blue-dark dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Dark Mode</span>
                                {theme === 'dark' && (
                                    <div className="absolute top-1 right-1 md:top-3 md:right-3 text-gyn-blue-medium">
                                        <Icon name="CheckCircleIcon" className="w-3 h-3 md:w-5 md:h-5" />
                                    </div>
                                )}
                            </button>

                            {/* System Theme */}
                            <button
                                onClick={() => setTheme('system')}
                                className={`relative p-2 md:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 md:gap-3 group ${theme === 'system'
                                    ? 'border-gyn-blue-medium bg-blue-50/50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gyn-blue-medium/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${theme === 'system' ? 'bg-gyn-blue-medium text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-gyn-blue-medium'
                                    }`}>
                                    <Icon name="ComputerDesktopIcon" className="w-4 h-4 md:w-6 md:h-6" />
                                </div>
                                <span className={`font-bold text-[10px] md:text-base text-center leading-tight ${theme === 'system' ? 'text-gyn-blue-dark dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>System Default</span>
                                {theme === 'system' && (
                                    <div className="absolute top-1 right-1 md:top-3 md:right-3 text-gyn-blue-medium">
                                        <Icon name="CheckCircleIcon" className="w-3 h-3 md:w-5 md:h-5" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 bg-transparent dark:bg-transparent">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Preview</h3>
                        <div className="p-4 md:p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl border border-white/50 dark:border-gray-700/50 shadow-sm max-w-md mx-auto">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gyn-blue-light dark:bg-blue-900/50 flex items-center justify-center text-gyn-blue-dark dark:text-blue-400 font-bold">JD</div>
                                <div>
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                                <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                <div className="h-3 w-4/6 bg-gray-100 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button variant="primary" size="sm">Action</Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 animate-fadeIn">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gyn-blue-dark dark:text-white">Platform Configuration</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage global system parameters and access controls.</p>
            </div>

            <Card className="overflow-hidden">
                {/* Settings Header */}
                <div className="p-4 md:p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gyn-blue-medium dark:text-blue-400 shrink-0">
                        <Icon name="Cog6ToothIcon" className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gyn-blue-dark dark:text-white">{activeTab} Settings</h2>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Configure {activeSubNav.toLowerCase()} behavior.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading configuration...</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {settings.map((setting) => (
                            <div key={setting.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                <div className="max-w-lg">
                                    <label className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                        {setting.key.replace(/_/g, ' ').toUpperCase()}
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {setting.description}
                                    </p>
                                </div>

                                {typeof setting.value === 'boolean' ? (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={setting.value}
                                            onChange={() => handleToggle(setting.id, setting.value)}
                                        />
                                        <div className="w-14 h-7 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gyn-blue-dark shadow-inner"></div>
                                    </label>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            defaultValue={setting.value}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm font-mono text-gray-600 focus:outline-none focus:ring-2 focus:ring-gyn-blue-medium/20 focus:border-gyn-blue-medium shadow-sm"
                                        />
                                        <Button variant="outline" size="sm">Update</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <Button variant="ghost">Discard Changes</Button>
                    <Button variant="primary" className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">Save Configuration</Button>
                </div>
            </Card>
        </div>
    );
};

export default PlatformSettings;
