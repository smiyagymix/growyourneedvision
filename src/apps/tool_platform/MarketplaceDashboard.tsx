import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Icon } from '../../components/shared/ui/CommonUI';
import { marketplaceService, MarketplaceApp } from '../../services/marketplaceService';
import { DeveloperPortal } from './DeveloperPortal';

export const MarketplaceDashboard: React.FC = () => {
    const [apps, setApps] = useState<MarketplaceApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'marketplace' | 'developer'>('marketplace');

    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            const data = await marketplaceService.getApps();
            setApps(data);
            setLoading(false);
        };
        if (view === 'marketplace') {
            fetchApps();
        }
    }, [view]);

    if (view === 'developer') {
        return <DeveloperPortal onBack={() => setView('marketplace')} />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">App Marketplace</h2>
                    <p className="text-gray-500">Discover and install integrations to extend your platform.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon="CodeBracketIcon" onClick={() => setView('developer')}>Developer Portal</Button>
                    <Button variant="primary" icon="MagnifyingGlassIcon">Browse All</Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading marketplace...</div>
            ) : apps.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No apps found.</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map((app, idx) => (
                    <Card key={idx} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-gyn-blue-medium group-hover:text-white transition-colors">
                                <Icon name={app.icon as any} className="w-6 h-6" />
                            </div>
                            <Badge variant="neutral">{app.category}</Badge>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{app.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                                <Icon name="ArrowDownTrayIcon" className="w-3 h-3" /> {app.installs}
                            </span>
                            <span className="flex items-center gap-1 text-yellow-500">
                                <Icon name="StarIcon" className="w-3 h-3" /> {app.rating}
                            </span>
                        </div>
                        <Button variant="secondary" size="sm" className="w-full">Install</Button>
                    </Card>
                ))}
            </div>
            )}

            <Card className="p-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Build for the Marketplace</h3>
                        <p className="text-purple-100 max-w-xl">
                            Create custom integrations and earn revenue by publishing to our global marketplace. Access developer tools and API documentation.
                        </p>
                    </div>
                    <Button variant="secondary" size="lg" icon="CodeBracketIcon" className="shrink-0" onClick={() => setView('developer')}>
                        Developer Portal
                    </Button>
                </div>
            </Card>
        </div>
    );
};
