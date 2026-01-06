
import React, { useState, useEffect } from 'react';
import { getModuleConfig } from '../modules/registry';
import pb from '../lib/pocketbase';
import { billingService } from '../services/billingService';
import { toolService, Tool } from '../services/toolService';
import { isMockEnv } from '../utils/mockData';
import { Button, Card, Badge, Modal, Icon } from '../components/shared/ui/CommonUI';
import { MarketingDashboard } from './tool_platform/MarketingDashboard';
import { FinanceDashboard } from './tool_platform/FinanceDashboard';
import { BusinessLogic } from './tool_platform/BusinessLogic';
import { MarketplaceDashboard } from './tool_platform/MarketplaceDashboard';
import { LogsDashboard } from './tool_platform/LogsDashboard';

interface ToolPlatformProps {
    activeTab: string;
    activeSubNav: string;
}

const ToolPlatform: React.FC<ToolPlatformProps> = ({ activeTab, activeSubNav }) => {
    const [stats, setStats] = useState({
        dailyEvents: 0,
        revenue: 0,
        activeModules: 0
    });
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const navConfig = getModuleConfig();

                if (isMockEnv()) {
                    setStats({
                        dailyEvents: 12500,
                        revenue: 42500,
                        activeModules: Object.keys(navConfig.tool_platform.subnav).length
                    });
                    return;
                }

                const usersResult = await pb.collection('users').getList(1, 1);
                const userCount = usersResult.totalItems;
                const billingStats = await billingService.getBillingStats();

                setStats({
                    dailyEvents: userCount * 12,
                    revenue: billingStats.mrr,
                    activeModules: Object.keys(navConfig.tool_platform.subnav).length
                });
            } catch (e) {
                console.error("Failed to fetch stats", e);
                if (isMockEnv()) {
                    const navConfig = getModuleConfig();
                    setStats({
                        dailyEvents: 12500,
                        revenue: 42500,
                        activeModules: Object.keys(navConfig.tool_platform.subnav).length
                    });
                }
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            // Fetch tools based on category using toolService

            let fetchedTools: Tool[] = [];

            // Try fetching real data first
            if (activeTab === 'Marketing') fetchedTools = await toolService.getMarketingTools();
            else if (activeTab === 'Finance') fetchedTools = await toolService.getFinanceTools();

            setTools(fetchedTools);
            setLoading(false);
        };

        if (activeTab !== 'Overview') {
            fetchTools();
        }
    }, [activeTab]);

    const handleToolClick = (tool: Tool) => {
        setSelectedTool(tool);
    };

    const renderOverview = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[minmax(120px,auto)]">
            {/* Hero Tile */}
            <div className="md:col-span-2 lg:col-span-2 row-span-2 relative rounded-xl overflow-hidden group shadow-xl transition-transform duration-500 hover:scale-[1.01]">
                <div className="absolute inset-0 bg-gradient-to-br from-gyn-blue-dark to-[#0a1142]"></div>
                <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-gyn-blue-medium rounded-full blur-[50px] opacity-60 animate-pulse"></div>

                <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                    <div>
                        <Badge variant="warning" className="mb-2 text-[8px]">
                            <Icon name="BriefcaseIcon" className="w-2.5 h-2.5 mr-0.5" />
                            Platform Intelligence
                        </Badge>
                        <h2 className="text-lg font-black text-white leading-tight max-w-md drop-shadow-lg">
                            Command Center
                        </h2>
                        <p className="text-blue-100 mt-2 max-w-sm leading-relaxed opacity-80 text-[9px]">
                            Access deep analytics, configure automated workflows, and monitor real-time performance metrics.
                        </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button variant="secondary" leftIcon={<Icon name="BoltIcon" className="w-3 h-3" />} className="text-[10px] px-2 py-1">
                            Launch Console
                        </Button>
                        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white text-[10px] px-2 py-1" leftIcon={<Icon name="DocumentTextIcon" className="w-3 h-3" />}>
                            Documentation
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <Card variant="default" className="p-3 flex flex-col justify-between group hover:shadow-lg">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-gyn-blue-medium shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <Icon name="ChartBarIcon" className="w-4 h-4" />
                </div>
                <div>
                    <div className="text-lg font-black text-gray-800 dark:text-white tracking-tight">{stats.dailyEvents.toLocaleString()}</div>
                    <div className="text-[7px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Daily Events</div>
                </div>
            </Card>

            <Card variant="default" className="p-3 flex flex-col justify-between group hover:shadow-lg">
                <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <Icon name="CurrencyDollarIcon" className="w-4 h-4" />
                </div>
                <div>
                    <div className="text-lg font-black text-gray-800 dark:text-white tracking-tight">${stats.revenue.toLocaleString()}</div>
                    <div className="text-[7px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Revenue Run Rate</div>
                </div>
            </Card>

            {/* Quick Links */}
            <div className="md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {['Marketing', 'Finance', 'Business', 'Marketplace'].map((cat) => (
                    <Card key={cat} variant="flat" className="p-2 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md cursor-pointer transition-all group">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm group-hover:bg-gyn-blue-medium group-hover:text-white transition-colors">
                                <Icon name={cat === 'Marketing' ? 'ShareIcon' : cat === 'Finance' ? 'CurrencyDollarIcon' : 'BriefcaseIcon'} className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-[10px]">{cat}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderToolGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((tool) => (
                <Card
                    key={tool.id}
                    variant="default"
                    className="group hover:-translate-y-1 hover:shadow-xl cursor-pointer relative overflow-hidden p-3"
                    onClick={() => handleToolClick(tool)}
                >
                    <div className="absolute top-0 right-0 p-1">
                        <Badge variant={tool.status === 'active' ? 'success' : 'warning'} size="sm" className="text-[7px]">
                            {tool.status}
                        </Badge>
                    </div>

                    <div className="flex items-start gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-inner">
                            <Icon name={tool.icon} className="w-5 h-5 text-gyn-blue-dark dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[10px] text-gray-800 dark:text-white group-hover:text-gyn-blue-medium transition-colors">{tool.name}</h3>
                            <span className="text-[7px] text-gray-400 font-mono">{tool.category}</span>
                        </div>
                    </div>

                    <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {tool.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex -space-x-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-600 border border-white dark:border-slate-800"></div>
                            ))}
                        </div>
                        <span className="text-[8px] font-bold text-gyn-blue-medium flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                            Open Tool <Icon name="ArrowRightIcon" className="w-2.5 h-2.5" />
                        </span>
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-2 animate-fadeIn pb-4">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-sm md:text-base font-black text-gyn-blue-dark dark:text-white tracking-tight">Platform Tools</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5 font-medium text-[8px]">Integrated Marketing, Finance, & Business Logic</p>
                </div>
                {activeTab !== 'Overview' && (
                    <Button variant="primary" leftIcon={<Icon name="PlusCircleIcon" className="w-3 h-3" />} className="text-[10px] px-2 py-1">
                        New {activeTab} Tool
                    </Button>
                )}
            </div>

            {activeTab === 'Overview' ? renderOverview() :
                activeTab === 'Marketing' ? <MarketingDashboard activeSubNav={activeSubNav} /> :
                    activeTab === 'Finance' ? <FinanceDashboard /> :
                        activeTab === 'Business' ? <BusinessLogic /> :
                            activeTab === 'Marketplace' ? <MarketplaceDashboard /> :
                                activeTab === 'Logs' ? <LogsDashboard /> :
                                    renderToolGrid()}

            {/* Tool Detail Modal */}
            <Modal
                isOpen={!!selectedTool}
                onClose={() => setSelectedTool(null)}
                title={selectedTool?.name || 'Tool Details'}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setSelectedTool(null)}>Close</Button>
                        <Button variant="primary">Launch Application</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            <Icon name={selectedTool?.icon || 'BriefcaseIcon'} className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedTool?.name}</h2>
                            <Badge variant="neutral" className="mt-2">{selectedTool?.category}</Badge>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                            {selectedTool?.description}
                        </p>
                        <h3 className="text-lg font-bold mt-6 mb-2">Key Features</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                            <li>Real-time data synchronization</li>
                            <li>Advanced reporting and analytics</li>
                            <li>Multi-user collaboration support</li>
                            <li>Automated workflow triggers</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <Icon name="BoltIcon" className="w-4 h-4" />
                            Quick Actions
                        </h4>
                        <div className="flex gap-3">
                            <Button size="sm" variant="secondary">View Logs</Button>
                            <Button size="sm" variant="secondary">Settings</Button>
                            <Button size="sm" variant="secondary">Permissions</Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ToolPlatform;

