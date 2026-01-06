import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, EmptyState, Heading1, Text } from '../../components/shared/ui/CommonUI';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { TableSkeleton, StatsSkeleton, GridSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { useApiError } from '../../hooks/useApiError';
import { useAuth } from '../../context/AuthContext';
import { parentService } from '../../services/parentService';
import { Link } from 'react-router-dom';

interface Child {
    id: string; // The service filters for child.id, so we can expect it
    name: string;
    grade_level: string;
    class_id?: string;
    avatar?: string;
    relationship?: string;
}

export const ParentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const { handleError } = useApiError();

    useEffect(() => {
        if (user?.id) {
            loadChildren();
        }
    }, [user?.id]);

    useEffect(() => {
        if (selectedChild?.id) {
            loadChildDashboard(selectedChild.id);
        }
    }, [selectedChild?.id]);

    const loadChildren = async () => {
        setLoading(true);
        try {
            const childrenList = await parentService.getChildren(user!.id);
            setChildren(childrenList as any[]);
            if (childrenList.length > 0) {
                setSelectedChild(childrenList[0] as any);
            }
        } catch (error) {
            handleError(error, 'Failed to load children');
        } finally {
            setLoading(false);
        }
    };

    const loadChildDashboard = async (childId: string) => {
        setDataLoading(true);
        try {
            const data = await parentService.getChildDashboard(childId);
            setDashboardData(data);
        } catch (error) {
            handleError(error, 'Failed to load child dashboard');
        } finally {
            setDataLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-8">
                    <div className="space-y-2">
                        <StatsSkeleton cols={1} />
                    </div>
                    <div className="w-64 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                </div>
                <div className="h-32 w-full bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse mb-8" />
                <StatsSkeleton cols={4} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <TableSkeleton rows={3} />
                    <GridSkeleton count={4} cols={2} />
                </div>
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="p-8 h-[80vh] flex items-center justify-center">
                <Card className="p-12 max-w-lg w-full text-center shadow-premium rounded-3xl border-0">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="UserGroupIcon" className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Heading1 className="mb-4">No Children Linked</Heading1>
                    <Text className="mb-8">We couldn't find any students linked to your parent account. Please contact the school administration to link your profile.</Text>
                    <Button variant="primary" className="w-full py-4 rounded-xl shadow-lg ring-offset-2 focus:ring-2">
                        Contact Administration
                    </Button>
                </Card>
            </div>
        );
    }

    const stats = dashboardData?.attendanceStats;
    const grades = dashboardData?.gradeStats;

    return (
        <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {/* Header with Child Selector */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
                <div>
                    <Heading1 className="text-4xl">Parent Dashboard</Heading1>
                    <Text className="text-lg opacity-70">Monitor academic progress and stay updated</Text>
                </div>

                {/* Child Selector */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                    <select
                        className="relative w-full md:w-64 pl-4 pr-10 py-3 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-gray-900 dark:text-white appearance-none cursor-pointer focus:border-blue-500 transition-all outline-none shadow-sm"
                        value={selectedChild?.id}
                        onChange={(e) => {
                            const child = children.find(c => c.id === e.target.value);
                            if (child) setSelectedChild(child);
                        }}
                    >
                        {children.map(child => (
                            <option key={child.id} value={child.id}>
                                {child.name} ({child.grade_level})
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Icon name="ChevronDownIcon" className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </header>

            {selectedChild && (
                <div className="space-y-8">
                    {/* Hero Profile Card */}
                    <Card className="p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white rounded-[2.5rem] shadow-premium relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                        <div className="relative flex flex-col md:flex-row items-center gap-8">
                            <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                {selectedChild.avatar ? (
                                    <img src={selectedChild.avatar} alt={selectedChild.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-black opacity-40">{selectedChild.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <Heading1 className="text-white mb-2 text-4xl leading-tight">{selectedChild.name}</Heading1>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold border border-white/20">
                                        {selectedChild.grade_level}
                                    </span>
                                    {selectedChild.relationship && (
                                        <span className="px-4 py-1.5 bg-indigo-500/30 backdrop-blur-md rounded-full text-sm font-bold border border-white/10">
                                            {selectedChild.relationship}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-black uppercase tracking-wider">Active Status</span>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Section */}
                    {dataLoading ? (
                        <StatsSkeleton cols={4} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Attendance', value: `${stats?.attendance_rate || 0}%`, icon: 'CalendarDaysIcon', color: 'green', sub: 'Last 30 days' },
                                { label: 'Avg Grade', value: `${grades?.average_score || 0}%`, icon: 'AcademicCapIcon', color: 'blue', sub: `${grades?.total_assignments || 0} assignments` },
                                { label: 'Highest', value: `${grades?.highest_score || 0}%`, icon: 'ArrowTrendingUpIcon', color: 'indigo', sub: 'Best subject' },
                                { label: 'Messages', value: '3', icon: 'ChatBubbleLeftRightIcon', color: 'purple', sub: 'Unread updates' }
                            ].map((item, i) => (
                                <Card key={i} className="p-6 shadow-premium hover:shadow-2xl transition-all duration-300 border-0 group rounded-3xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-2xl group-hover:scale-110 transition-transform`}>
                                            <Icon name={item.icon as any} className={`w-7 h-7 text-${item.color}-600 dark:text-${item.color}-400`} />
                                        </div>
                                        <Icon name="EllipsisVerticalIcon" className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <Text className="text-sm font-bold opacity-60 uppercase tracking-widest mb-1">{item.label}</Text>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{item.value}</h3>
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <div className={`h-1 flex-1 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-full`}>
                                            <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: item.value }}></div>
                                        </div>
                                        <span className="text-[10px] font-black opacity-50 whitespace-nowrap uppercase">{item.sub}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Activity */}
                        <Card className="p-8 shadow-premium rounded-[2rem] border-0">
                            <div className="flex items-center justify-between mb-8">
                                <Heading1 className="text-2xl">Academic Activity</Heading1>
                                <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">View Report</Button>
                            </div>
                            <WidgetErrorBoundary title="Recent Activity">
                                <div className="space-y-6">
                                    {dataLoading ? (
                                        <TableSkeleton rows={4} />
                                    ) : dashboardData?.recentGrades?.length > 0 ? (
                                        dashboardData.recentGrades.map((grade: any) => (
                                            <div key={grade.id} className="group relative flex items-center gap-5 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-110 transition-transform">
                                                    {grade.subject.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-gray-900 dark:text-white truncate">{grade.assignment_name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{grade.subject}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className="text-xs font-bold text-gray-400">{new Date(grade.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xl font-black ${grade.score >= 90 ? 'text-green-600' : grade.score >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                        {grade.score}%
                                                    </div>
                                                    <span className="text-[10px] font-black opacity-40 uppercase">Grade: {grade.grade_letter}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-20">
                                                <Icon name="DocumentMagnifyingGlassIcon" className="w-8 h-8" />
                                            </div>
                                            <Text className="opacity-50 font-bold">No academic records yet</Text>
                                        </div>
                                    )}
                                </div>
                            </WidgetErrorBoundary>
                        </Card>

                        {/* Quick Actions & Links */}
                        <div className="space-y-8">
                            <Card className="p-8 shadow-premium rounded-[2rem] border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <Heading1 className="text-2xl mb-8">Academic Hub</Heading1>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Exams & Grades', sub: 'Full history', icon: 'AcademicCapIcon', link: '/parent/academic', color: 'blue' },
                                        { label: 'Attendance', sub: 'Daily records', icon: 'ClockIcon', link: '/parent/attendance', color: 'teal' },
                                        { label: 'Messages', sub: '3 Pending', icon: 'ChatBubbleBottomCenterTextIcon', link: '/parent/communication', color: 'purple' },
                                        { label: 'Schedule', sub: 'Term dates', icon: 'CalendarDaysIcon', link: '/parent/schedule', color: 'orange' }
                                    ].map((action, i) => (
                                        <Link key={i} to={action.link}>
                                            <button className="w-full text-left p-5 bg-white dark:bg-gray-800 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm group">
                                                <div className={`w-10 h-10 bg-${action.color}-50 dark:bg-${action.color}-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform`}>
                                                    <Icon name={action.icon as any} className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                                                </div>
                                                <Heading1 className="text-sm mb-1">{action.label}</Heading1>
                                                <Text className="text-[10px] uppercase font-black opacity-40">{action.sub}</Text>
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-8 shadow-premium rounded-[2rem] border-0 bg-indigo-900 text-white relative overflow-hidden group">
                                <Icon name="SparklesIcon" className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
                                <Heading1 className="text-white text-xl mb-2">Concierge Support</Heading1>
                                <Text className="text-white/60 mb-6 text-sm">Need help with registration or fees? Our team is available 24/7.</Text>
                                <Button variant="secondary" className="w-full bg-white text-indigo-900 font-black rounded-xl hover:bg-gray-100 shadow-lg">
                                    Start Chat
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentDashboard;
