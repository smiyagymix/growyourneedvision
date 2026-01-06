import React, { useState } from 'react';
import { Card, Button, Icon, Badge } from '../components/shared/ui/CommonUI';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Import all content managers
import { CalendarContentManager } from './owner/content-managers/CalendarContentManager';
import { EventsContentManager } from './owner/content-managers/EventsContentManager';
import { GamificationContentManager } from './owner/content-managers/GamificationContentManager';
import { HelpContentManager } from './owner/content-managers/HelpContentManager';
import { HobbiesContentManager } from './owner/content-managers/HobbiesContentManager';
import { MarketplaceContentManager } from './owner/content-managers/MarketplaceContentManager';
import { MediaContentManager } from './owner/content-managers/MediaContentManager';
import { MessagingContentManager } from './owner/content-managers/MessagingContentManager';
import { ReligionContentManager } from './owner/content-managers/ReligionContentManager';
import { ServicesContentManager } from './owner/content-managers/ServicesContentManager';
import { SportContentManager } from './owner/content-managers/SportContentManager';
import { StudioContentManager } from './owner/content-managers/StudioContentManager';

interface OverlaySettingsProps {
    activeTab?: string;
    activeSubNav?: string;
}

interface OverlayApp {
    id: string;
    name: string;
    icon: string;
    description: string;
    enabled: boolean;
    version: string;
    contentManager: React.ComponentType<any>;
}

const OverlaySettings: React.FC<OverlaySettingsProps> = ({ activeTab = 'Overview', activeSubNav = '' }) => {
    const [selectedApp, setSelectedApp] = useState<string | null>(null);

    const overlayApps: OverlayApp[] = [
        {
            id: 'studio',
            name: 'Creator Studio',
            icon: 'PaintBrushIcon',
            description: 'Design, video editing, coding, and office tools',
            enabled: true,
            version: '2.1.0',
            contentManager: StudioContentManager
        },
        {
            id: 'media',
            name: 'Media & Live TV',
            icon: 'TvIcon',
            description: 'Video streaming, live TV, and media library',
            enabled: true,
            version: '1.8.0',
            contentManager: MediaContentManager
        },
        {
            id: 'messaging',
            name: 'Messaging',
            icon: 'ChatBubbleLeftRightIcon',
            description: 'Internal messaging and announcements',
            enabled: true,
            version: '1.5.0',
            contentManager: MessagingContentManager
        },
        {
            id: 'help',
            name: 'Help Center',
            icon: 'QuestionMarkCircleIcon',
            description: 'Documentation, support, and FAQs',
            enabled: true,
            version: '1.4.0',
            contentManager: HelpContentManager
        },
        {
            id: 'hobbies',
            name: 'Hobbies',
            icon: 'PuzzlePieceIcon',
            description: 'Hobby tracking and community',
            enabled: true,
            version: '1.3.0',
            contentManager: HobbiesContentManager
        },
        {
            id: 'religion',
            name: 'Religion',
            icon: 'BookOpenIcon',
            description: 'Quran, Hadith, and prayer times',
            enabled: true,
            version: '1.6.0',
            contentManager: ReligionContentManager
        },
        {
            id: 'sport',
            name: 'Sport',
            icon: 'TrophyIcon',
            description: 'Sports tracking and fitness',
            enabled: true,
            version: '1.2.0',
            contentManager: SportContentManager
        },
        {
            id: 'events',
            name: 'Events',
            icon: 'CalendarDaysIcon',
            description: 'Event discovery and management',
            enabled: true,
            version: '1.4.0',
            contentManager: EventsContentManager
        },
        {
            id: 'services',
            name: 'Services',
            icon: 'WrenchScrewdriverIcon',
            description: 'Service marketplace and booking',
            enabled: true,
            version: '1.1.0',
            contentManager: ServicesContentManager
        },
        {
            id: 'gamification',
            name: 'Gamification',
            icon: 'StarIcon',
            description: 'Achievements, badges, and rewards',
            enabled: true,
            version: '1.5.0',
            contentManager: GamificationContentManager
        },
        {
            id: 'calendar',
            name: 'Calendar',
            icon: 'CalendarIcon',
            description: 'Calendar and scheduling',
            enabled: true,
            version: '1.3.0',
            contentManager: CalendarContentManager
        },
        {
            id: 'marketplace',
            name: 'Marketplace',
            icon: 'ShoppingBagIcon',
            description: 'App marketplace and extensions',
            enabled: true,
            version: '1.7.0',
            contentManager: MarketplaceContentManager
        }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overlay Applications</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage global content and settings for all overlay apps</p>
                </div>
                <Button variant="primary">
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    Add New App
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Apps</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overlayApps.length}</p>
                        </div>
                        <Icon name="Squares2X2Icon" className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-2xl font-bold text-green-600">{overlayApps.filter(a => a.enabled).length}</p>
                        </div>
                        <Icon name="CheckCircleIcon" className="w-8 h-8 text-green-500" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Content Items</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
                        </div>
                        <Icon name="DocumentTextIcon" className="w-8 h-8 text-purple-500" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Updates Available</p>
                            <p className="text-2xl font-bold text-orange-600">3</p>
                        </div>
                        <Icon name="ArrowPathIcon" className="w-8 h-8 text-orange-500" />
                    </div>
                </Card>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overlayApps.map((app) => (
                    <motion.div
                        key={app.id}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                    <Icon name={app.icon} className="w-6 h-6 text-white" />
                                </div>
                                <Badge variant={app.enabled ? 'success' : 'secondary'}>
                                    {app.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{app.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{app.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">v{app.version}</span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedApp(app.id)}
                                >
                                    Manage Content
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderContent = () => {
        // If an app is selected and we're in the Apps tab, show its content manager
        if (activeTab === 'Apps' && activeSubNav && selectedApp) {
            const app = overlayApps.find(a => a.id === activeSubNav.toLowerCase());
            if (app && app.contentManager) {
                const ContentManager = app.contentManager;
                return (
                    <div>
                        <div className="mb-6 flex items-center gap-4">
                            <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                                <Icon name="ArrowLeftIcon" className="w-4 h-4 mr-2" />
                                Back to Apps
                            </Button>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name} Content</h2>
                                <p className="text-sm text-gray-500">Manage global content for {app.name}</p>
                            </div>
                        </div>
                        <ContentManager />
                    </div>
                );
            }
        }

        // Default rendering based on tab
        switch (activeTab) {
            case 'Overview':
                return renderOverview();

            case 'Content':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Global Content</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6">
                                <Icon name="SwatchIcon" className="w-8 h-8 text-purple-500 mb-4" />
                                <h3 className="text-lg font-bold mb-2">Themes</h3>
                                <p className="text-sm text-gray-500 mb-4">Global color schemes and styling</p>
                                <Button variant="secondary" size="sm">Manage Themes</Button>
                            </Card>
                            <Card className="p-6">
                                <Icon name="DocumentDuplicateIcon" className="w-8 h-8 text-blue-500 mb-4" />
                                <h3 className="text-lg font-bold mb-2">Templates</h3>
                                <p className="text-sm text-gray-500 mb-4">Reusable content templates</p>
                                <Button variant="secondary" size="sm">Manage Templates</Button>
                            </Card>
                            <Card className="p-6">
                                <Icon name="PhotoIcon" className="w-8 h-8 text-green-500 mb-4" />
                                <h3 className="text-lg font-bold mb-2">Global Assets</h3>
                                <p className="text-sm text-gray-500 mb-4">Shared images and media</p>
                                <Button variant="secondary" size="sm">Manage Assets</Button>
                            </Card>
                        </div>
                    </div>
                );

            case 'Apps':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Applications</h2>
                        <p className="text-sm text-gray-500">Select an app from the left navigation to manage its content</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {overlayApps.map((app) => (
                                <Card key={app.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                <Icon name={app.icon} className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{app.name}</h3>
                                                <p className="text-xs text-gray-500">v{app.version}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setSelectedApp(app.id)}
                                        >
                                            Configure
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case 'Versions':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Version Management</h2>
                        <Card className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <h3 className="font-bold">Platform Version</h3>
                                        <p className="text-sm text-gray-500">Current: v3.2.1</p>
                                    </div>
                                    <Badge variant="success">Up to date</Badge>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Available Updates</h4>
                                    <div className="space-y-2">
                                        {overlayApps.slice(0, 3).map((app) => (
                                            <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-sm">{app.name}</p>
                                                    <p className="text-xs text-gray-500">v{app.version} → v{parseFloat(app.version) + 0.1}</p>
                                                </div>
                                                <Button variant="secondary" size="sm">Update</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            default:
                return renderOverview();
        }
    };

    return (
        <div className="h-full px-6 py-4">
            {renderContent()}
        </div>
    );
};

export default OverlaySettings;
