import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Heading1, Heading2, Text } from '../../components/shared/ui/CommonUI';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { StatsSkeleton, TableSkeleton, GridSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { useApiError } from '../../hooks/useApiError';
import { useAuth } from '../../context/AuthContext';
import { individualService, IndividualCourse, ExtendedGoal } from '../../services/individualService';
import { Link } from 'react-router-dom';

export const IndividualDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [goals, setGoals] = useState<ExtendedGoal[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<IndividualCourse[]>([]);

    const { handleError } = useApiError();

    useEffect(() => {
        if (user?.id) {
            loadDashboardData(user.id);
        }
    }, [user?.id]);

    const loadDashboardData = async (userId: string) => {
        setLoading(true);
        try {
            const [dashboardStats, extendedGoals, courses] = await Promise.all([
                individualService.getDashboardStats(userId),
                individualService.getExtendedGoals(userId),
                individualService.getEnrolledCourses(userId, 3)
            ]);

            setStats(dashboardStats);
            setGoals(extendedGoals.slice(0, 3));
            setEnrolledCourses(courses);

            // Derive recent activity from courses and goals
            const activity = [
                ...courses.map(c => ({
                    id: c.id,
                    type: 'course',
                    title: `Enrolled in ${c.course_title}`,
                    date: new Date(c.created),
                    icon: 'AcademicCapIcon' as const
                })),
                ...extendedGoals.filter(g => g.is_completed).slice(0, 2).map(g => ({
                    id: g.id,
                    type: 'goal',
                    title: `Goal Achieved: ${g.goal_text}`,
                    date: new Date(g.updated),
                    icon: 'CheckCircleIcon' as const
                }))
            ].sort((a, b) => b.date.getTime() - a.date.getTime());

            setRecentActivity(activity);
        } catch (error) {
            handleError(error, 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-10">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
                    <div className="h-5 w-48 bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded-lg"></div>
                </div>
                <StatsSkeleton cols={4} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TableSkeleton rows={5} />
                    </div>
                    <div>
                        <TableSkeleton rows={5} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-10">
                <div className="space-y-2">
                    <Heading1 className="text-4xl md:text-5xl tracking-tight">
                        Welcome back, <span className="text-blue-600 dark:text-blue-400">{user?.name.split(' ')[0]}</span>! 🚀
                    </Heading1>
                    <Text className="text-lg font-medium">Your personalized learning dashboard is ready.</Text>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/individual/learning">
                        <Button className="rounded-2xl px-6 py-6 font-black shadow-premium hover:scale-105 transition-transform">
                            <Icon name="PlayIcon" className="w-5 h-5 mr-2" />
                            RESUME LEARNING
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Courses Active', value: stats?.courses.active, icon: 'AcademicCapIcon', color: 'blue' },
                    { label: 'Wellness Score', value: `${stats?.wellness.score || 0}%`, icon: 'HeartIcon', color: 'rose' },
                    { label: 'Goal Progress', value: `${stats?.courses.progress || 0}%`, icon: 'TargetIcon', color: 'indigo' },
                    { label: 'Upcoming Services', value: stats?.services.upcoming_bookings, icon: 'ClockIcon', color: 'amber' }
                ].map((stat, i) => (
                    <Card key={i} className="p-8 shadow-premium rounded-[2.5rem] border-0 hover:-translate-y-2 transition-all duration-500 group">
                        <div className="flex flex-col h-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-${stat.color}-500 group-hover:rotate-6 transition-transform`}>
                                <Icon name={stat.icon as any} className="w-7 h-7 text-white" />
                            </div>
                            <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</Text>
                            <span className="text-4xl font-black text-gray-900 dark:text-white leading-tight">
                                {stat.value}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Goals Progress */}
                <Card className="lg:col-span-2 p-10 shadow-premium rounded-[3rem] border-0">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <Heading2 className="text-2xl tracking-tight">Active Goals</Heading2>
                            <Text className="font-medium">Track your personal development milestones</Text>
                        </div>
                        <Link to="/individual/goals">
                            <Button variant="ghost" className="font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                ALL GOALS
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-8">
                        {goals.length > 0 ? goals.map(goal => (
                            <div key={goal.id} className="group cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{goal.goal_text}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Icon name="CalendarIcon" className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-400 uppercase">Due: {new Date(goal.due_date || '').toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                            {goal.progress}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-100 dark:border-gray-700">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                                        style={{ width: `${goal.progress}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <Icon name="FlagIcon" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <Heading2 className="opacity-50">No active goals found</Heading2>
                                <Button variant="outline" className="mt-6 rounded-xl font-black">START A GOAL</Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-10 shadow-premium rounded-[3rem] border-0">
                    <WidgetErrorBoundary title="Activity Audit">
                        <div className="mb-10">
                            <Heading2 className="text-2xl tracking-tight text-indigo-600 dark:text-indigo-400 italic">Audit Log</Heading2>
                            <Text className="font-bold">Recent System interactions</Text>
                        </div>
                        <div className="space-y-6">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 z-10 relative group-hover:scale-110 transition-transform`}>
                                            <Icon name={activity.icon} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        {i !== recentActivity.length - 1 && (
                                            <div className="absolute top-10 left-1/2 w-0.5 h-full bg-gray-100 dark:bg-gray-800 -translate-x-1/2"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-6">
                                        <Text className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{activity.title}</Text>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {activity.date.toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {recentActivity.length === 0 && (
                                <div className="text-center py-12 opacity-30">
                                    <Icon name="FingerPrintIcon" className="w-12 h-12 mx-auto mb-4" />
                                    <span className="font-black uppercase text-xs tracking-widest">No activity recorded</span>
                                </div>
                            )}
                        </div>
                    </WidgetErrorBoundary>
                </Card>
            </div>

            {/* Continue Learning Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Heading2 className="text-3xl tracking-tight uppercase font-black">Continue Learning</Heading2>
                        <Text className="text-lg font-medium opacity-70">Pick up right where you left off</Text>
                    </div>
                    <Link to="/individual/learning">
                        <Button variant="outline" className="rounded-2xl border-2 font-black">EXPLORE COURSE CATALOG</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {enrolledCourses.map((course) => (
                        <Card key={course.id} className="overflow-hidden shadow-premium rounded-[2.5rem] border-0 group">
                            <div className="h-48 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                                {course.course_image ? (
                                    <img src={course.course_image} alt={course.course_title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                        <Icon name="PlayIcon" className="w-16 h-16 text-white/50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all"></div>
                            </div>
                            <div className="p-8">
                                <Heading2 className="mb-4 text-xl line-clamp-1">{course.course_title}</Heading2>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-2 rounded-full mr-4 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${course.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-blue-600">{course.progress}%</span>
                                </div>
                                <Button className="w-full rounded-2xl py-6 font-black tracking-widest uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                    CONTINUE SESSION
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {enrolledCourses.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-gray-50 dark:bg-gray-800/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Icon name="LightBulbIcon" className="w-20 h-20 mx-auto mb-6 text-blue-300 dark:text-blue-900" />
                            <Heading2 className="text-3xl font-black mb-4">Start your learning journey</Heading2>
                            <Text className="text-xl mb-10 max-w-md mx-auto">Explore hundreds of courses and grow your skills with our expert-led programs.</Text>
                            <Button className="px-12 py-8 rounded-3xl text-lg font-black tracking-widest shadow-premium">BROWSE MARKETPLACE</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Footer Icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Calendar', icon: 'CalendarIcon', link: '/individual/calendar', color: 'blue' },
                    { label: 'Projects', icon: 'FolderIcon', link: '/individual/projects', color: 'purple' },
                    { label: 'Services', icon: 'FingerPrintIcon', link: '/individual/services', color: 'indigo' },
                    { label: 'Achievements', icon: 'TrophyIcon', link: '/individual/achievements', color: 'orange' }
                ].map((action, i) => (
                    <Link key={i} to={action.link} className="block">
                        <Card className="p-6 flex items-center gap-6 shadow-glass rounded-[2rem] border border-white/20 hover:border-blue-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${action.color}-500 group-hover:scale-110 transition-transform`}>
                                <Icon name={action.icon as any} className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-black uppercase tracking-widest text-sm text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {action.label}
                            </span>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default IndividualDashboard;
