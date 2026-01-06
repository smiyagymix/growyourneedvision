import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ownerService, MarketplaceApp } from '../../services/ownerService';
import { Card, Button, Badge, Icon, Heading1, Heading3, Text, OwnerIcon } from '../../components/shared/ui/CommonUI';
import { LoadingScreen } from '../../components/shared/LoadingScreen';

export const Marketplace: React.FC = () => {
    const [apps, setApps] = useState<MarketplaceApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        try {
            const data = await ownerService.getMarketplaceApps();
            // Inject some more variety if it's mock
            if (data.length < 5) {
                const extra = [
                    { id: 'm3', name: 'Parent Communication Pro', provider: 'EduConnect', category: 'Communication', rating: 4.9, installs: 12000, price: 'Premium', verified: true, data: { description: 'Advanced parent-teacher messaging system with real-time translation.' } },
                    { id: 'm4', name: 'Curriculum AI Planner', provider: 'AI-Edu', category: 'Academics', rating: 4.7, installs: 8500, price: 'Free', verified: true, data: { description: 'Generate lesson plans and assessments in seconds with AI.' } },
                    { id: 'm5', name: 'Financial Insights', provider: 'MoneyMind', category: 'Finance', rating: 4.6, installs: 5200, price: 'Premium', verified: false, data: { description: 'Deep financial forecasting and audit-ready reports.' } }
                ];
                setApps([...data, ...extra as any]);
            } else {
                setApps(data);
            }
        } catch (error) {
            console.error("Failed to load marketplace apps", error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...Array.from(new Set(apps.map(app => app.category)))];

    const filteredApps = apps.filter(app => {
        const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.data?.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredApp = apps.find(app => app.verified && app.rating >= 4.5);

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <Badge variant="info" className="bg-indigo-50 text-indigo-700 border-indigo-100">Marketplace</Badge>
                    <Heading1>Discover New Possibilities</Heading1>
                    <Text variant="muted" className="text-lg">Extend your platform with vetted educational modules and integrations.</Text>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Icon name="MagnifyingGlassIcon" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, category, or provider..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-none shadow-sm rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Featured Section */}
            {!searchQuery && selectedCategory === 'All' && featuredApp && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-[#002366] text-white p-8 md:p-12"
                >
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <OwnerIcon name="SparklesIcon" className="w-5 h-5 text-yellow-400" />
                                </div>
                                <span className="text-sm font-bold tracking-widest uppercase opacity-80">Featured Module</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight">
                                {featuredApp.name}
                            </h2>
                            <p className="text-lg text-indigo-100 max-w-lg">
                                {featuredApp.data?.description}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button className="bg-white text-[#002366] hover:bg-indigo-50 px-8 h-12 rounded-full font-bold">
                                    Explore Module
                                </Button>
                                <Button variant="ghost" className="text-white hover:bg-white/10 px-8 h-12 rounded-full font-bold">
                                    View Provider
                                </Button>
                            </div>
                        </div>
                        <div className="hidden lg:flex justify-end">
                            <div className="relative w-80 h-80 bg-white/5 rounded-[3rem] border border-white/10 p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="w-full h-full bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                                    <OwnerIcon name="RocketLaunchIcon" className="w-32 h-32 text-indigo-300 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Main Content Areas */}
            <div className="flex flex-col gap-8">
                {/* Categories */}
                <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Subgrid of Apps */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredApps.map((app, index) => (
                            <motion.div
                                key={app.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card className="h-full group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border-none bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden flex flex-col">
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                <OwnerIcon
                                                    name={app.category === 'Communication' ? 'ChatBubbleLeftRightIcon' : app.category === 'Analytics' ? 'ChartBarIcon' : 'CubeIcon'}
                                                    className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                                                />
                                            </div>
                                            {app.verified && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                    <Icon name="CheckBadgeIcon" className="w-3.5 h-3.5" />
                                                    Verified
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <Heading3 className="group-hover:text-indigo-600 transition-colors">
                                                {app.name}
                                            </Heading3>
                                            <div className="flex items-center gap-2">
                                                <Text variant="muted" className="text-xs uppercase tracking-widest font-bold">
                                                    By {app.provider}
                                                </Text>
                                            </div>
                                        </div>

                                        <Text className="text-sm line-clamp-3 mb-6">
                                            {app.data?.description}
                                        </Text>

                                        <div className="mt-auto flex items-center justify-between text-sm py-4 border-t border-gray-100 dark:border-gray-700/50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Icon name="StarIcon" className="w-4 h-4 text-amber-400 fill-current" />
                                                    <span className="font-bold">{app.rating}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <Icon name="ArrowDownTrayIcon" className="w-4 h-4" />
                                                    <span className="font-medium">{app.installs.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className={`font-black ${app.price === 'Free' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                                                {app.price}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-2 px-8 pb-8">
                                        <Button className="w-full bg-[#002366] hover:bg-[#001a4d] text-white h-12 rounded-2xl font-bold shadow-lg shadow-blue-900/10">
                                            Install Now
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredApps.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32 space-y-4"
                    >
                        <div className="inline-flex p-6 rounded-[2.5rem] bg-gray-100 dark:bg-gray-800 text-gray-400">
                            <Icon name="MagnifyingGlassIcon" className="w-12 h-12" />
                        </div>
                        <Heading3>No modules matching "{searchQuery}"</Heading3>
                        <Text variant="muted">Try adjusting your search terms or filters.</Text>
                        <Button
                            variant="primary"
                            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                            className="mt-4"
                        >
                            Reset Exploration
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
