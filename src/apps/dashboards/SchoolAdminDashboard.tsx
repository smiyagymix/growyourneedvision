
import React, { useState, useEffect } from 'react';
import { Icon, Card, Badge, Button, Heading1 } from '../../components/shared/ui/CommonUI';
import { useSchoolDashboard } from '../../hooks/useSchoolDashboard';
import { SimpleLineChart } from './components/SimpleLineChart';
import { schoolSettingsService } from '../../services/schoolSettingsService';
import { StatsSkeleton, CardSkeleton, Skeleton } from '../../components/shared/ui/DashboardSkeletons';

interface DashboardProps {
    activeTab: string;
    activeSubNav: string;
}

const SchoolAdminDashboard: React.FC<DashboardProps> = ({ activeTab }) => {
    const { stats, activities, chartData, loading } = useSchoolDashboard();
    const [schoolName, setSchoolName] = useState('Loading...');
    const [academicYear, setAcademicYear] = useState('...');

    useEffect(() => {
        const loadSchoolInfo = async () => {
            try {
                const [name, year] = await Promise.all([
                    schoolSettingsService.getSchoolName(),
                    schoolSettingsService.getAcademicYear()
                ]);
                setSchoolName(name);
                setAcademicYear(year);
            } catch (error) {
                console.error('Failed to load school info:', error);
                setSchoolName('School');
                setAcademicYear('Current Year');
            }
        };
        loadSchoolInfo();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col gap-6 animate-pulse p-4">
                <div className="h-10 w-64 bg-gray-200 rounded-lg mb-4"></div>
                <StatsSkeleton cols={4} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="md:col-span-2">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                    </div>
                    <div>
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Helper for time ago
    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 md:gap-6 animate-fadeIn overflow-hidden p-4">
            {/* Page Header - Cinematic */}
            <div className="flex items-end justify-between border-b border-gray-200 pb-2 md:pb-4 relative shrink-0">
                <div className="absolute bottom-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-blue-500 to-transparent"></div>
                <div className="relative z-10">
                    <Heading1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-600 to-blue-900 drop-shadow-sm tracking-tight uppercase">School Command</Heading1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[10px] font-mono text-blue-600 uppercase tracking-widest">SYS.VER.2028</span>
                        <p className="text-gray-500 text-xs md:text-sm font-medium uppercase tracking-widest opacity-80">{schoolName} • Academic Year {academicYear}</p>
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <Badge variant="success" className="bg-white/80 backdrop-blur-md border border-green-200 text-green-700 shadow-sm px-3 py-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 shadow-sm"></span>
                        <span className="font-mono tracking-widest text-[10px] md:text-xs">SYSTEM ONLINE</span>
                    </Badge>
                </div>
            </div>

            {/* KPI Cards - Luxury Glass & Metal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 shrink-0">
                {[
                    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), sub: 'Active Enrolled', icon: 'UserGroup', color: 'text-hud-primary', bg: 'from-hud-primary/20 to-blue-900/20' },
                    { label: 'Total Teachers', value: stats.totalTeachers.toLocaleString(), sub: 'Full-time Staff', icon: 'UserIcon', color: 'text-purple-400', bg: 'from-purple-500/20 to-indigo-900/20' },
                    { label: 'Total Parents', value: stats.totalParents.toLocaleString(), sub: 'Registered Accounts', icon: 'Heart', color: 'text-pink-400', bg: 'from-pink-500/20 to-rose-900/20' },
                    { label: 'Staff Members', value: stats.totalStaff.toLocaleString(), sub: 'Admin & Support', icon: 'Briefcase', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-teal-900/20' },
                ].map((kpi, idx) => (
                    <div key={idx} className="relative group h-20 md:h-24">
                        {/* Card Background with Metallic/Glass feel */}
                        <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-md group-hover:border-blue-300">
                            {/* Gradient Glow */}
                            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${kpi.bg} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>

                            {/* Scanline Overlay */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-multiply"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

                            <div className="relative p-3 md:p-4 h-full flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">{kpi.label}</span>
                                    <Icon name={kpi.icon} className={`w-4 h-4 ${kpi.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                </div>

                                <div>
                                    <div className="text-2xl font-black text-gray-800 tracking-tighter drop-shadow-sm font-mono">{kpi.value}</div>
                                    <div className="w-full h-[1px] bg-gradient-to-r from-gray-200 to-transparent my-1.5"></div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-current"></span>
                                        {kpi.sub}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Left Column: Monthly Revenue Chart (2/3 width) */}
                <div className="md:col-span-2 relative group h-full flex flex-col min-h-0">
                    {/* Holographic Container */}
                    <div className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm"></div>

                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-lg opacity-20 group-hover:opacity-50 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-lg opacity-20 group-hover:opacity-50 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-lg opacity-20 group-hover:opacity-50 transition-opacity"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-lg opacity-20 group-hover:opacity-50 transition-opacity"></div>

                    <div className="relative p-4 md:p-6 z-10 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded border border-blue-100 text-blue-600 shadow-sm">
                                    <Icon name="PresentationChartLineIcon" className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-black text-gray-800 tracking-wide uppercase">Monthly Revenue</h3>
                                    <p className="text-[10px] text-blue-500 font-mono uppercase tracking-widest">Financial Performance</p>
                                </div>
                            </div>
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                <button className="px-3 py-1 text-[10px] font-bold rounded bg-white text-blue-600 border border-gray-200 shadow-sm uppercase tracking-wider">Monthly</button>
                                <button className="px-3 py-1 text-[10px] font-bold rounded bg-transparent text-gray-500 hover:text-gray-800 hover:bg-white transition-all uppercase tracking-wider">Yearly</button>
                            </div>
                        </div>

                        <div className="flex-1 relative rounded-xl border border-gray-100 bg-gray-50 overflow-hidden min-h-0">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                            <div className="relative p-4 h-full flex flex-col justify-center">
                                {chartData.length > 0 ? (
                                    <div className="w-full h-full">
                                        <SimpleLineChart data={chartData} color="#2563EB" height="100%" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                                        <Icon name="ChartBarIcon" className="w-12 h-12 text-gray-400 mb-2" />
                                        <p className="text-xs font-mono text-gray-400">NO DATA SIGNAL</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stacked Components (1/3 width) */}
                <div className="flex flex-col gap-4 h-full min-h-0">

                    {/* Top: Student Distribution */}
                    <div className="relative group flex-1 min-h-0 flex flex-col">
                        <div className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm"></div>
                        <div className="relative p-4 z-10 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-3 shrink-0">
                                <div className="p-1.5 bg-purple-50 rounded border border-purple-100 text-purple-600">
                                    <Icon name="PieChartIcon" className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-gray-800 tracking-wide uppercase">Student Distribution</h3>
                            </div>

                            <div className="flex-1 flex items-center justify-center min-h-0">
                                {/* Placeholder for Distribution Chart */}
                                <div className="w-full space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-gray-600">
                                            <span>Primary</span>
                                            <span>45%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-gray-600">
                                            <span>Secondary</span>
                                            <span>30%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-gray-600">
                                            <span>High School</span>
                                            <span>25%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Recent Activity (System Logs) */}
                    <div className="relative group flex-1 min-h-0 flex flex-col">
                        <div className="absolute inset-0 bg-white rounded-2xl border border-gray-200 shadow-sm"></div>

                        {/* Top Bar Decoration */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-blue-500 shadow-sm"></div>

                        <div className="relative p-4 z-10 h-full flex flex-col overflow-hidden">
                            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100 shrink-0">
                                <Icon name="BellIcon" className="w-4 h-4 text-blue-600 animate-pulse" />
                                <h3 className="text-sm font-black text-gray-800 tracking-wide uppercase">Recent Activity</h3>
                            </div>

                            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0">
                                {activities.length > 0 ? activities.map((alert, i) => (
                                    <div key={i} className="group/item relative pl-3 py-1.5 border-l-2 border-gray-200 hover:border-blue-500 transition-colors">
                                        <div className="absolute left-[-5px] top-2.5 w-1.5 h-1.5 rounded-full bg-white border border-gray-300 group-hover/item:border-blue-500 group-hover/item:bg-blue-500 transition-all"></div>
                                        <div className="flex justify-between items-start mb-0.5">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${alert.type === 'Info' ? 'text-blue-600' : alert.type === 'Success' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                [{alert.type}]
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-mono">{timeAgo(alert.timestamp)}</span>
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-500 group-hover/item:text-gray-800 transition-colors font-mono leading-relaxed line-clamp-2">{alert.message}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-400 text-xs font-mono border border-dashed border-gray-200 rounded">
                                // NO LOGS FOUND
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolAdminDashboard;
