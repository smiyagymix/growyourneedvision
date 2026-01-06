import React, { useState, Suspense } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { LoadingScreen } from '../../components/shared/LoadingScreen';

// Lazy load content managers
const MediaContentManager = React.lazy(() => import('./content-managers/MediaContentManager').then(module => ({ default: module.MediaContentManager })));
const SportContentManager = React.lazy(() => import('./content-managers/SportContentManager').then(module => ({ default: module.SportContentManager })));
const ReligionContentManager = React.lazy(() => import('./content-managers/ReligionContentManager').then(module => ({ default: module.ReligionContentManager })));
const GamificationContentManager = React.lazy(() => import('./content-managers/GamificationContentManager').then(module => ({ default: module.GamificationContentManager })));
const HelpContentManager = React.lazy(() => import('./content-managers/HelpContentManager').then(module => ({ default: module.HelpContentManager })));
const EventsContentManager = React.lazy(() => import('./content-managers/EventsContentManager').then(module => ({ default: module.EventsContentManager })));
const CalendarContentManager = React.lazy(() => import('./content-managers/CalendarContentManager').then(module => ({ default: module.CalendarContentManager })));
const HobbiesContentManager = React.lazy(() => import('./content-managers/HobbiesContentManager').then(module => ({ default: module.HobbiesContentManager })));
const ServicesContentManager = React.lazy(() => import('./content-managers/ServicesContentManager').then(module => ({ default: module.ServicesContentManager })));
const MessagingContentManager = React.lazy(() => import('./content-managers/MessagingContentManager').then(module => ({ default: module.MessagingContentManager })));
const StudioContentManager = React.lazy(() => import('./content-managers/StudioContentManager').then(module => ({ default: module.StudioContentManager })));
const MarketplaceContentManager = React.lazy(() => import('./content-managers/MarketplaceContentManager').then(module => ({ default: module.MarketplaceContentManager })));

export const OverlayAppsManager: React.FC = () => {
    const [selectedApp, setSelectedApp] = useState<string>('media');

    const overlayApps = [
        { id: 'media', name: 'Media', icon: 'FilmIcon', description: 'Movies, Series & Live TV', color: 'red' },
        { id: 'sport', name: 'Sport', icon: 'TrophyIcon', description: 'Teams, Matches & Stats', color: 'green' },
        { id: 'gamification', name: 'Gamification', icon: 'SparklesIcon', description: 'Achievements & Rewards', color: 'yellow' },
        { id: 'travel', name: 'Travel', icon: 'GlobeAltIcon', description: 'Destinations & Bookings', color: 'blue' },
        { id: 'help', name: 'Help Center', icon: 'QuestionMarkCircleIcon', description: 'FAQs & Support', color: 'purple' },
        { id: 'hobbies', name: 'Hobbies', icon: 'PaintBrushIcon', description: 'Projects & Skills', color: 'pink' },
        { id: 'religion', name: 'Religion', icon: 'BookOpenIcon', description: 'Prayer Times & Events', color: 'emerald' },
        { id: 'services', name: 'Services', icon: 'WrenchIcon', description: 'Service Marketplace', color: 'orange' },
        { id: 'activities', name: 'Activities', icon: 'CalendarIcon', description: 'Activity Catalog', color: 'indigo' },
        { id: 'events', name: 'Events', icon: 'TicketIcon', description: 'Event Management', color: 'cyan' },
        { id: 'messaging', name: 'Messaging', icon: 'ChatBubbleLeftRightIcon', description: 'Chat & Messages', color: 'teal' },
        { id: 'creator', name: 'Creator Studio', icon: 'VideoCameraIcon', description: 'Content Creation', color: 'rose' },
        { id: 'market', name: 'Market', icon: 'ShoppingCartIcon', description: 'E-commerce', color: 'amber' }
    ];

    const renderContentManager = () => {
        switch (selectedApp) {
            case 'media':
                return <MediaContentManager />;

            case 'sport':
                return <SportContentManager />;

            case 'religion':
                return <ReligionContentManager />;

            case 'gamification':
                return <GamificationContentManager />;

            case 'help':
                return <HelpContentManager />;

            case 'events':
                return <EventsContentManager />;

            case 'activities':
                return <CalendarContentManager />;

            case 'hobbies':
                return <HobbiesContentManager />;

            case 'services':
                return <ServicesContentManager />;

            case 'messaging':
                return <MessagingContentManager />;

            case 'creator':
                return <StudioContentManager />;

            case 'market':
                return <MarketplaceContentManager />;

            // Travel app - Special case as it doesn't have a content manager yet
            case 'travel':
                return (
                    <div className="text-center py-20">
                        <Icon name="GlobeAltIcon" className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Travel App Manager
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The Travel app uses an external booking API. Content management will be added in a future update.
                        </p>
                        <div className="max-w-md mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Note:</strong> The Travel app is fully functional for users through its integrated booking system.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar - App Selection */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Overlay Apps</h2>

                <div className="space-y-2">
                    {overlayApps.map(app => (
                        <button
                            key={app.id}
                            name={`select-overlay-app-${app.id}`}
                            onClick={() => setSelectedApp(app.id)}
                            className={`w-full text-left p-4 rounded-lg transition-all ${selectedApp === app.id
                                ? `bg-${app.color}-100 dark:bg-${app.color}-900/30 border-2 border-${app.color}-500`
                                : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${app.color}-500 flex items-center justify-center flex-shrink-0`}>
                                    <Icon name={app.icon} className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold truncate ${selectedApp === app.id
                                        ? `text-${app.color}-900 dark:text-${app.color}-100`
                                        : 'text-gray-900 dark:text-white'
                                        }`}>
                                        {app.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {app.description}
                                    </p>
                                </div>
                                {selectedApp === app.id && (
                                    <Icon name="CheckCircleIcon" className={`w-5 h-5 text-${app.color}-600 flex-shrink-0`} />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">Quick Tip</h4>
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                                Manage all content for your overlay apps from here. Add movies, channels, events, and more!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingScreen /></div>}>
                    {renderContentManager()}
                </Suspense>
            </div>
        </div>
    );
};
