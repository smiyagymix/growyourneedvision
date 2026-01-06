import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, EmptyState } from '../../components/shared/ui/CommonUI';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Skeleton, SkeletonCard } from '../../components/shared/ui/Skeleton';
import { useApiError } from '../../hooks/useApiError';
import { useAuth } from '../../context/AuthContext';
import { parentService } from '../../services/parentService';
import pb from '../../lib/pocketbase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ParentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { handleError } = useApiError();
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalChildren: 0,
        upcomingAssignments: 0,
        unreadMessages: 0,
        pendingInvoices: 0
    });
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Get Children
            const kids = await parentService.getChildren(user.id);
            setChildren(kids);

            if (kids.length === 0) {
                setLoading(false);
                return;
            }

            const studentIds = kids.map(k => k.id);
            const studentFilter = studentIds.map(id => `student = "${id}"`).join(' || ');

            // 2. Get Stats
            // Upcoming Assignments (next 7 days)
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const assignments = await pb.collection('assignments').getList(1, 1, {
                filter: `(${studentFilter}) && due_date >= "${new Date().toISOString()}" && due_date <= "${nextWeek.toISOString()}"`
            });

            // Unread Messages
            const messages = await pb.collection('messages').getList(1, 1, {
                filter: `recipient = "${user.id}" && read = false`
            });

            // Pending Invoices
            const invoices = await pb.collection('school_invoices').getList(1, 1, {
                filter: `(${studentFilter}) && status = "Pending"`
            });

            setStats({
                totalChildren: kids.length,
                upcomingAssignments: assignments.totalItems,
                unreadMessages: messages.totalItems,
                pendingInvoices: invoices.totalItems
            });

            // 3. Recent Activities (Grades, Attendance, etc.)
            // We'll fetch recent grades and attendance
            const recentGrades = await pb.collection('grades').getList(1, 5, {
                filter: studentFilter,
                sort: '-created',
                expand: 'student, subject'
            });

            const recentAttendance = await pb.collection('attendance').getList(1, 5, {
                filter: studentFilter,
                sort: '-date',
                expand: 'student'
            });

            // Combine and sort
            const activities = [
                ...recentGrades.items.map(g => ({
                    type: 'grade',
                    date: g.created,
                    title: `New Grade for ${g.expand?.student?.name}`,
                    description: `${g.expand?.subject?.name}: ${g.score}/${g.max_score}`,
                    icon: 'AcademicCapIcon',
                    color: 'bg-green-100 text-green-600'
                })),
                ...recentAttendance.items.map(a => ({
                    type: 'attendance',
                    date: a.date,
                    title: `Attendance: ${a.expand?.student?.name}`,
                    description: `Marked as ${a.status}`,
                    icon: 'ClockIcon',
                    color: a.status === 'present' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

            setRecentActivities(activities);

            // 4. Upcoming Events (Assignments, Exams)
            const upcoming = await pb.collection('assignments').getList(1, 5, {
                filter: `(${studentFilter}) && due_date >= "${new Date().toISOString()}"`,
                sort: 'due_date',
                expand: 'student, subject'
            });

            setUpcomingEvents(upcoming.items);

        } catch (error) {
            handleError(error, 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="mb-8 space-y-2">
                    <Skeleton variant="text" width={300} height={40} />
                    <Skeleton variant="text" width={200} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-6">
                            <div className="flex justify-between">
                                <div className="space-y-2">
                                    <Skeleton variant="text" width={100} />
                                    <Skeleton variant="text" width={60} height={30} />
                                </div>
                                <Skeleton variant="circular" width={48} height={48} />
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <SkeletonCard />
                    </div>
                    <div className="space-y-4">
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                    Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Here's what's happening with your children today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold">Children</p>
                            <p className="text-3xl font-black text-blue-900 dark:text-white mt-2">{stats.totalChildren}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <Icon name="UserGroupIcon" className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 dark:text-purple-300 font-semibold">Assignments Due</p>
                            <p className="text-3xl font-black text-purple-900 dark:text-white mt-2">{stats.upcomingAssignments}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <Icon name="DocumentTextIcon" className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-300 font-semibold">Unread Messages</p>
                            <p className="text-3xl font-black text-green-900 dark:text-white mt-2">{stats.unreadMessages}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <Icon name="ChatBubbleLeftIcon" className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-600 dark:text-orange-300 font-semibold">Pending Invoices</p>
                            <p className="text-3xl font-black text-orange-900 dark:text-white mt-2">{stats.pendingInvoices}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                            <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Children Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Children</h2>
                            <Button variant="ghost" size="sm">View All</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {children.map(child => (
                                <div key={child.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        {child.avatar ? (
                                            <img src={pb.files.getUrl(child, child.avatar)} alt={child.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <Icon name="UserIcon" className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{child.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Grade {child.grade || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                            {children.length === 0 && (
                                <div className="col-span-2 text-center py-8 text-gray-500">
                                    No children linked to your account.
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Upcoming Events */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Assignments</h2>
                        </div>
                        <div className="space-y-4">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                            <Icon name="DocumentTextIcon" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {event.expand?.student?.name} • {event.expand?.subject?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                            Due {new Date(event.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {upcomingEvents.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No upcoming assignments.</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <WidgetErrorBoundary title="Recent Activity">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                                            <Icon name={activity.icon} className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.title}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">{activity.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(activity.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {recentActivities.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">No recent activity.</p>
                                )}
                            </div>
                        </WidgetErrorBoundary>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                <Icon name="ChatBubbleLeftIcon" className="w-5 h-5 mr-2" />
                                Message Teachers
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Icon name="CurrencyDollarIcon" className="w-5 h-5 mr-2" />
                                Pay Fees
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Icon name="CalendarIcon" className="w-5 h-5 mr-2" />
                                View Schedule
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
