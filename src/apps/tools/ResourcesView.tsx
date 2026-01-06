import React from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';

interface ResourcesViewProps {
    activeSubNav: string;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ activeSubNav }) => {
    const docs = [
        { title: 'Platform Architecture', type: 'Technical', updated: '2 days ago', icon: 'ServerStackIcon' },
        { title: 'API Reference', type: 'Development', updated: '1 week ago', icon: 'CodeBracketIcon' },
        { title: 'User Guide', type: 'General', updated: '3 days ago', icon: 'BookOpenIcon' },
        { title: 'Security Protocols', type: 'Security', updated: '1 month ago', icon: 'ShieldCheckIcon' },
        { title: 'Integration Patterns', type: 'Development', updated: '5 days ago', icon: 'PuzzlePieceIcon' },
        { title: 'Design System', type: 'Design', updated: '2 weeks ago', icon: 'SwatchIcon' },
    ];

    const features = [
        { name: 'Multi-Tenant Architecture', status: 'Production', tier: 'Enterprise', icon: 'BuildingOffice2Icon' },
        { name: 'AI Concierge', status: 'Beta', tier: 'Pro', icon: 'SparklesIcon' },
        { name: 'Advanced Analytics', status: 'Production', tier: 'Business', icon: 'ChartBarIcon' },
        { name: 'Custom Workflows', status: 'Development', tier: 'Enterprise', icon: 'ArrowsRightLeftIcon' },
        { name: 'Mobile App', status: 'Planned', tier: 'All', icon: 'DevicePhoneMobileIcon' },
        { name: 'API Access', status: 'Production', tier: 'Pro', icon: 'GlobeAltIcon' },
        { name: 'White Labeling', status: 'Production', tier: 'Enterprise', icon: 'PaintBrushIcon' },
        { name: 'SSO Integration', status: 'Production', tier: 'Enterprise', icon: 'KeyIcon' },
    ];

    if (activeSubNav === 'Feature Grid') {
        return (
            <div className="p-6 h-full overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Feature Matrix</h2>
                    <p className="text-gray-500 dark:text-gray-400">Overview of platform capabilities and their current status.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <Card key={idx} className="p-5 hover:shadow-lg transition-shadow border-l-4 border-l-gyn-blue-dark dark:border-l-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-gyn-blue-dark dark:text-blue-400">
                                    <Icon name={feature.icon as any} className="w-6 h-6" />
                                </div>
                                <Badge variant={
                                    feature.status === 'Production' ? 'success' :
                                    feature.status === 'Beta' ? 'warning' :
                                    feature.status === 'Development' ? 'info' : 'default'
                                }>
                                    {feature.status}
                                </Badge>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{feature.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Icon name="TagIcon" className="w-4 h-4" />
                                <span>{feature.tier} Tier</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Default to Docs
    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Documentation</h2>
                    <p className="text-gray-500 dark:text-gray-400">Technical guides and resources for developers and administrators.</p>
                </div>
                <Button variant="primary" icon="PlusIcon">New Doc</Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {docs.map((doc, idx) => (
                    <Card key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors shadow-sm">
                                <Icon name={doc.icon as any} className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-gyn-blue-dark dark:group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Icon name="FolderIcon" className="w-3 h-3" />
                                        {doc.type}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Icon name="ClockIcon" className="w-3 h-3" />
                                        Updated {doc.updated}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" icon="ArrowDownTrayIcon" />
                            <Icon name="ChevronRightIcon" className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
