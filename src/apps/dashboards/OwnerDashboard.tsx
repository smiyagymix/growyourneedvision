import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge } from '../../components/shared/ui/CommonUI';
import { Link, useNavigate } from 'react-router-dom';
import { AnalyticsDashboard } from '../owner/AnalyticsDashboard';
import { BroadcastMessageModal } from '../../components/shared/modals/BroadcastMessageModal';
import { PlatformBilling } from '../school/PlatformBilling';

import { Marketplace } from '../owner/Marketplace';
import { motion } from 'framer-motion';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { ownerService } from '../../services/ownerService';

interface OwnerDashboardProps {
    activeTab?: string;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ activeTab = 'Overview' }) => {
    const navigate = useNavigate();
    const { data: dashboardData, loading, error, refresh } = useOwnerDashboard();
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
    const [systemUptime, setSystemUptime] = useState<number>(99.9);

    // Fetch real system uptime from system_health collection
    useEffect(() => {
        const fetchSystemUptime = async () => {
            try {
                const uptime = await ownerService.getSystemUptime();
                setSystemUptime(uptime);
            } catch (error) {
                console.error('Error fetching system uptime:', error);
            }
        };

        fetchSystemUptime();
        // Refresh every 5 minutes
        const interval = setInterval(fetchSystemUptime, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const modules = [
        {
            title: 'Tenant Management',
            description: 'Manage schools, subscriptions, and domains',
            icon: 'BuildingOfficeIcon',
            link: '/admin/school',
            color: 'blue'
        },
        {
            title: 'Analytics',
            description: 'Platform-wide usage and revenue stats',
            icon: 'ChartBarIcon',
            link: '/admin/dashboard/Analytics',
            color: 'green'
        },
        {
            title: 'Support',
            description: 'Handle support tickets and inquiries',
            icon: 'LifebuoyIcon',
            link: '/owner/support',
            color: 'purple'
        },
        {
            title: 'Overlay Apps',
            description: 'Manage global content for overlay apps',
            icon: 'Squares2X2Icon',
            link: '/owner/overlay-apps',
            color: 'orange'
        }
    ];

    const renderOverview = () => {
        if (loading) {
            return (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <Icon name="ArrowPathIcon" className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading dashboard data...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <Icon name="ExclamationTriangleIcon" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => refresh()}>Retry</Button>
                    </div>
                </div>
            );
        }

        const activeTenants = dashboardData?.kpis.activeTenants.value?.toString() || '0';
        const mrrValue = dashboardData?.kpis.mrr.value || 42000;

        // If showing subscription plans, render that component instead
        if (showSubscriptionPlans) {
            return (
                <div className="h-full flex flex-col gap-4 overflow-hidden p-2">
                    {/* Back to Overview Button */}
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSubscriptionPlans(false)}
                            className="flex items-center gap-2"
                        >
                            <Icon name="ArrowLeftIcon" className="w-4 h-4" />
                            Back to Overview
                        </Button>
                        <div className="text-sm text-gray-500">
                            <Icon name="ChevronRight" className="w-4 h-4 inline" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Plans</h2>
                    </div>

                    {/* Platform Billing Component */}
                    <div className="flex-1 overflow-auto">
                        <PlatformBilling activeSubNav="Plans" />
                    </div>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col gap-1.5 overflow-hidden p-1.5">
                {/* Floating Header with Glassmorphism */}
                <div className="flex items-center justify-between shrink-0 px-2.5 py-1.5 rounded-lg backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 shadow-lg shadow-blue-500/5">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 blur-md opacity-30 animate-pulse" />
                            <div className="relative p-1 rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
                                <Icon name="CommandLineIcon" className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-sm md:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-tight">
                                Command Center
                            </h1>
                            <p className="text-[8px] text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                                REAL-TIME OVERVIEW
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const data = dashboardData;
                                const csvContent = `Metric,Value\nActive Tenants,${data?.kpis.activeTenants.value}\nMRR,${data?.kpis.mrr.value}\nLTV,${data?.kpis.ltv.value}\nChurn,${data?.kpis.churn.value}\n`;
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'owner_dashboard_export.csv';
                                a.click();
                            }}
                            className="hidden lg:flex items-center gap-0.5 px-2 py-1 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur border-white/20 hover:bg-white/80 transition-all text-[10px] font-semibold"
                        >
                            <Icon name="ArrowDownTrayIcon" className="w-2.5 h-2.5" />
                            Export
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="hidden md:flex items-center gap-0.5 px-2 py-1 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/30 text-[10px] font-semibold"
                        >
                            <Icon name="MegaphoneIcon" className="w-2.5 h-2.5" />
                            Broadcast
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowSubscriptionPlans(true)}
                            className="flex items-center gap-0.5 px-2 py-1 rounded-md backdrop-blur bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-300/20 hover:border-purple-300/40 transition-all text-[10px] font-semibold"
                        >
                            <Icon name="CreditCardIcon" className="w-2.5 h-2.5 text-purple-600" />
                            <span className="text-purple-700 dark:text-purple-300">Plans</span>
                        </Button>
                        <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/30 rounded-md backdrop-blur">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/50" />
                            <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider">ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* Compact KPI Cards with Glassmorphism - Single Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 shrink-0">
                    <Card className="relative overflow-hidden p-2 rounded-lg backdrop-blur-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 border border-blue-400/20 shadow-lg shadow-blue-500/20 group hover:scale-[1.01] transition-transform">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
                        <div className="relative">
                            <div className="text-[7px] font-black uppercase text-blue-100 tracking-wider mb-0.5">MRR</div>
                            <div className="text-base md:text-lg font-black text-white tracking-tight">${mrrValue.toLocaleString()}</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                                <Icon name="TrendingUpIcon" className="w-2 h-2 text-emerald-300" />
                                <span className="text-[8px] font-bold text-emerald-300">+12.4%</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden p-2 rounded-lg backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-lg group hover:scale-[1.01] transition-transform">
                        <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-lg" />
                        <div className="relative">
                            <div className="text-[7px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-0.5">Active Tenants</div>
                            <div className="text-base md:text-lg font-black text-gray-900 dark:text-white">{activeTenants}</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                                <div className="px-1 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">+12</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden p-2 rounded-lg backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-lg group hover:scale-[1.01] transition-transform">
                        <div className="absolute -left-3 -top-3 w-12 h-12 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full blur-lg" />
                        <div className="relative">
                            <div className="text-[7px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-0.5">Growth Rate</div>
                            <div className="text-base md:text-lg font-black text-gray-900 dark:text-white">+18%</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                                <span className="text-[8px] font-bold text-orange-500">vs last month</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden p-2 rounded-lg backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-lg group hover:scale-[1.01] transition-transform">
                        <div className="absolute -right-3 -top-3 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-lg" />
                        <div className="relative">
                            <div className="text-[7px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-0.5">Pipeline</div>
                            <div className="text-base md:text-lg font-black text-gray-900 dark:text-white">42</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                                <span className="text-[8px] font-bold text-blue-500">onboarding</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Optimized Bento Grid - Perfect Fit for Desktop/Tablet */}
                <div className="flex-1 min-h-0 grid grid-cols-6 grid-rows-2 gap-1.5">

                    {/* 1. Tenant Management - Large Feature Card */}
                    <Link to="/admin/school" className="col-span-6 md:col-span-3 row-span-1 group relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-gradient-to-br from-blue-50/90 via-purple-50/80 to-pink-50/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                        {/* Animated Background Orbs */}
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />

                        <div className="relative h-full p-3 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 blur-sm opacity-50 group-hover:opacity-70 transition-opacity" />
                                    <div className="relative p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg border border-white/20 shadow-md">
                                        <Icon name="BuildingOfficeIcon" className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="px-2 py-0.5 rounded-md backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border border-white/30 shadow-md">
                                    <span className="text-[10px] font-black text-gray-800 dark:text-gray-100">{activeTenants} Active</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <h3 className="text-sm md:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-0.5 tracking-tight leading-tight">
                                    Tenant Management
                                </h3>
                                <p className="text-[9px] text-gray-700 dark:text-gray-300 font-medium max-w-[90%] leading-snug">
                                    Manage schools & subscriptions
                                </p>

                                {/* Mini Stats Grid */}
                                <div className="grid grid-cols-2 gap-1 mt-1.5">
                                    <div className="p-1.5 rounded-md backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-white/30">
                                        <div className="text-[7px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-wider">New</div>
                                        <div className="text-sm font-black text-blue-600 dark:text-blue-400">{dashboardData?.kpis.activeTenants.change || 0}</div>
                                    </div>
                                    <div className="p-1.5 rounded-md backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-white/30">
                                        <div className="text-[7px] text-gray-500 dark:text-gray-400 uppercase font-black tracking-wider">Churn</div>
                                        <div className="text-sm font-black text-purple-600 dark:text-purple-400">{dashboardData?.kpis.churn.value || '0%'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* 2. Analytics - Vertical Card with Live Chart */}
                    <Link to="/admin/dashboard/Analytics" className="col-span-3 md:col-span-2 row-span-1 group relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-gradient-to-b from-emerald-50/90 to-green-50/80 dark:from-gray-800/90 dark:to-gray-800/80 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-green-500/30 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />

                        <div className="relative h-full p-2.5 flex flex-col">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="p-1 bg-gradient-to-br from-emerald-500 to-green-600 rounded-md shadow-md">
                                    <Icon name="ChartBarIcon" className="w-3.5 h-3.5 text-white" />
                                </div>
                                <Icon name="ArrowUpRightIcon" className="w-3 h-3 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            </div>

                            <h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-white mb-0.5">Analytics</h3>
                            <div className="flex items-center gap-0.5 mb-auto">
                                <Icon name="TrendingUpIcon" className="w-2.5 h-2.5 text-emerald-500" />
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">+24.5%</span>
                            </div>

                            {/* Live Chart Visualization */}
                            <div className="h-12 flex items-end justify-between gap-0.5 mt-1.5">
                                {[40, 70, 45, 90, 60, 80, 95].map((h, i) => (
                                    <div key={i} className="w-full relative overflow-hidden rounded-t-md bg-gradient-to-t from-gray-200/30 to-gray-100/30 dark:from-gray-700/30 dark:to-gray-600/30">
                                        <div
                                            style={{ height: `${h}%` }}
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-md opacity-90 group-hover:opacity-100 transition-all duration-300 shadow-md shadow-emerald-500/30"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Link>

                    {/* 3. System Health - Status Card */}
                    <div className="col-span-3 md:col-span-1 row-span-1 relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-gradient-to-br from-gray-50/90 to-slate-50/80 dark:from-gray-800/90 dark:to-gray-800/80 shadow-lg">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-tl from-green-500/20 to-emerald-500/20 rounded-full blur-lg" />

                        <div className="relative h-full p-2.5 flex flex-col justify-center">
                            <div className="flex items-center gap-1 mb-1">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-500 blur-sm opacity-50 animate-pulse" />
                                    <div className="relative w-1 h-1 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                </div>
                                <span className="text-[7px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">System</span>
                            </div>
                            <div className="text-sm md:text-base font-black text-gray-900 dark:text-white font-mono mb-1">{systemUptime.toFixed(2)}%</div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-0.5 rounded-full overflow-hidden backdrop-blur">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full shadow-sm shadow-green-500/30 transition-all duration-1000" style={{ width: `${systemUptime}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Revenue Growth Chart */}
                    <Card className="col-span-3 md:col-span-2 row-span-1 relative overflow-hidden rounded-xl p-2.5 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1">
                                    <div className="p-0.5 rounded-sm bg-gradient-to-br from-blue-500 to-cyan-600">
                                        <Icon name="ChartBarIcon" className="w-3 h-3 text-white" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-gray-800 dark:text-white">Revenue Growth</h3>
                                </div>
                                <Badge variant="success" className="backdrop-blur bg-emerald-500/10 border-emerald-500/20 text-[8px] px-1 py-0.5">
                                    <div className="w-0.5 h-0.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
                                    Live
                                </Badge>
                            </div>
                            <div className="flex items-end gap-0.5 h-12">
                                {[30, 45, 60, 55, 80, 90, 95].map((v, i) => (
                                    <div key={i} className="flex-1 relative overflow-hidden rounded-t-md bg-gradient-to-t from-blue-100/50 to-blue-50/30 dark:from-blue-900/30 dark:to-blue-800/20">
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-md shadow-md shadow-blue-500/20 transition-all duration-300 hover:from-blue-700 hover:to-cyan-600"
                                            style={{ height: `${v}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* 5. Tenant Pipeline */}
                    <Card className="col-span-3 md:col-span-2 row-span-1 relative overflow-hidden rounded-xl p-2.5 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-tl from-purple-500/10 to-pink-500/10 rounded-full blur-xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1">
                                    <div className="p-0.5 rounded-sm bg-gradient-to-br from-purple-500 to-pink-600">
                                        <Icon name="UsersIcon" className="w-3 h-3 text-white" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-gray-800 dark:text-white">Acquisition Pipeline</h3>
                                </div>
                                <Badge variant="neutral" className="backdrop-blur text-[8px] px-1 py-0.5">Monthly</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {['Q1', 'Q2', 'Q3', 'Q4'].map((label, i) => (
                                    <div key={label} className="p-1.5 rounded-md backdrop-blur-xl bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-700/50 dark:to-gray-800/50 border border-white/30 dark:border-gray-600/30 hover:scale-[1.03] transition-transform">
                                        <div className="text-[7px] text-gray-500 dark:text-gray-400 font-black tracking-wider">{label}</div>
                                        <div className="text-sm md:text-base font-black text-gray-900 dark:text-white">{[12, 18, 24, 30][i]}</div>
                                        <div className="text-[7px] font-bold text-emerald-600 dark:text-emerald-400">+{[3, 4, 5, 6][i]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* 6. Overlay Apps */}
                    <Link to="/owner/overlay-apps" className="col-span-3 md:col-span-2 row-span-1 group relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-gradient-to-r from-orange-50/90 to-amber-50/80 dark:from-gray-800/90 dark:to-gray-800/80 shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-tl from-orange-500/20 to-amber-500/20 rounded-full blur-xl" />

                        <div className="relative h-full p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-md">
                                    <Icon name="Squares2X2Icon" className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-white leading-tight">Overlay Apps</h3>
                                    <p className="text-[8px] text-gray-600 dark:text-gray-400 font-semibold">Global registry</p>
                                </div>
                            </div>
                            <div className="hidden md:flex -space-x-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full backdrop-blur-xl bg-white/60 dark:bg-gray-700/60 border border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-black text-gray-600 dark:text-gray-300 shadow-sm">
                                        v{i}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Link>

                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Analytics':
                return <AnalyticsDashboard />;

            case 'Market':
                return <Marketplace />;
            case 'System':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Diagnostics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 border-l-4 border-l-green-500">
                                <h3 className="text-lg font-bold mb-2">API Services</h3>
                                <p className="text-green-600 font-mono">ONLINE (v2.4.0)</p>
                                <p className="text-xs text-gray-400 mt-2">Uptime: 99.98%</p>
                            </Card>
                            <Card className="p-6 border-l-4 border-l-blue-500">
                                <h3 className="text-lg font-bold mb-2">Database</h3>
                                <p className="text-blue-600 font-mono">CONNECTED</p>
                                <p className="text-xs text-gray-400 mt-2">Latency: 24ms</p>
                            </Card>
                            <Card className="p-6 border-l-4 border-l-purple-500">
                                <h3 className="text-lg font-bold mb-2">Storage</h3>
                                <p className="text-purple-600 font-mono">HEALTHY</p>
                                <p className="text-xs text-gray-400 mt-2">Usage: 45%</p>
                            </Card>
                        </div>
                    </div>
                );
            case 'Overview':
            default:
                return renderOverview();
        }
    };


    return (
        <div className="h-full px-6 py-4">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
            >
                {renderContent()}
            </motion.div>

            {/* Broadcast Modal */}
            <BroadcastMessageModal
                isOpen={isBroadcastModalOpen}
                onClose={() => setIsBroadcastModalOpen(false)}
                tenantCount={Number(dashboardData?.kpis.activeTenants.value) || 0}
            />
        </div>
    );
};

export default OwnerDashboard;
