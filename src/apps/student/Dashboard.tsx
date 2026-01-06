import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, EmptyState } from '../../components/shared/ui/CommonUI';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Skeleton, SkeletonCard } from '../../components/shared/ui/Skeleton';
import { useApiError } from '../../hooks/useApiError';
import { useAuth } from '../../context/AuthContext';
import pb from '../../lib/pocketbase';


import { Link } from 'react-router-dom';
import { isMockEnv } from '../../utils/mockData';
import { studentService, Assignment, Grade, AttendanceRecord } from '../../services/studentService';

import { TableSkeleton, StatsSkeleton } from '../../components/shared/ui/DashboardSkeletons';

export const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        upcomingAssignments: 0,
        pendingSubmissions: 0,
        averageGrade: 0,
        attendanceRate: 0,
        totalCourses: 0
    });
    const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const { handleError } = useApiError();

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const studentId = user?.id;

            if (!studentId || isMockEnv()) {
                setStats({
                    upcomingAssignments: 3,
                    pendingSubmissions: 1,
                    averageGrade: 92.5,
                    attendanceRate: 98,
                    totalCourses: 5
                });
                setRecentAssignments([
                    { id: 'a1', title: 'History Essay', due_date: new Date().toISOString(), expand: { subject: { name: 'History' } } },
                    { id: 'a2', title: 'Math Homework', due_date: new Date().toISOString(), expand: { subject: { name: 'Math' } } }
                ]);
                setAnnouncements([
                    { id: 'n1', title: 'Welcome Back!', created: new Date().toISOString(), content: 'New semester kickoff' },
                    { id: 'n2', title: 'Field Trip', created: new Date().toISOString(), content: 'Permission slips due Friday' }
                ]);
                setLoading(false);
                return;
            }

            const [
                upcomingAssignments,
                allAssignments,
                grades,
                courses,
                attendance,
                announcementsData
            ] = await Promise.all([
                studentService.getUpcomingAssignments(studentId, 14),
                studentService.getAssignments(studentId),
                studentService.getGrades(studentId),
                studentService.getCourses(studentId, 'active'),
                studentService.getAttendance(studentId),
                studentService.getAnnouncements(studentId)
            ]);

            const pendingCount = allAssignments.filter(a => a.status === 'pending').length;

            const avgGrade = grades.length > 0
                ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length
                : 0;

            const presentCount = attendance.filter(a => a.status === 'present').length;
            const attendanceRate = attendance.length > 0
                ? Math.round((presentCount / attendance.length) * 100)
                : 100;

            setStats({
                upcomingAssignments: upcomingAssignments.length,
                pendingSubmissions: pendingCount,
                averageGrade: avgGrade,
                attendanceRate: attendanceRate,
                totalCourses: courses.length
            });

            const formattedAssignments = upcomingAssignments.slice(0, 5).map(a => ({
                ...a,
                expand: { subject: { name: a.course_name || 'General' } }
            }));

            setRecentAssignments(formattedAssignments);
            setAnnouncements(announcementsData.slice(0, 3));

        } catch (error) {
            handleError(error, 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-8">
                <div className="mb-8 space-y-3">
                    <div className="h-10 w-72 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    <div className="h-4 w-56 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
                <StatsSkeleton cols={4} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TableSkeleton rows={4} />
                    </div>
                    <div>
                        <TableSkeleton rows={3} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fadeIn">
            {/* Academic Spotlight Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight" data-testid="welcome-msg">
                        Hello, {user?.name?.split(' ')[0]}! ✨
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        Ready to conquer your academic goals? Here's your status.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Icon name="AcademicCapIcon" className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Tier</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Premium Scholar</p>
                    </div>
                </div>
            </div>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Upcoming Tasks', value: stats.upcomingAssignments, icon: 'DocumentTextIcon', color: 'indigo' },
                    { label: 'GPA Equivalent', value: `${stats.averageGrade.toFixed(1)}%`, icon: 'StarIcon', color: 'green' },
                    { label: 'Attendance', value: `${stats.attendanceRate}%`, icon: 'ClockIcon', color: 'purple' },
                    { label: 'My Courses', value: stats.totalCourses, icon: 'BookOpenIcon', color: 'orange' }
                ].map((stat, i) => (
                    <Card key={i} className="p-6 border-none shadow-premium hover:shadow-premium-hover transition-all group overflow-hidden relative">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">{stat.label}</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">{stat.value}</p>
                            </div>
                            <div className={`w-14 h-14 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <Icon name={stat.icon} className={`w-7 h-7 text-${stat.color}-500`} />
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform" />
                    </Card>
                ))}
            </div>

            {/* Academic Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Priority Assignment List */}
                <Card className="lg:col-span-2 p-8 shadow-sm">
                    <WidgetErrorBoundary title="Assignments">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Priority Submissions</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">Don't miss these deadlines</p>
                            </div>
                            <Link to="/student/assignments">
                                <Button variant="outline" size="sm" className="font-black rounded-xl">Explore All</Button>
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentAssignments.length > 0 ? (
                                recentAssignments.map(assignment => (
                                    <div key={assignment.id} className="p-5 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl hover:bg-white dark:hover:bg-gray-800 border-2 border-transparent hover:border-indigo-50 dark:hover:border-indigo-900/20 hover:shadow-lg transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 font-black text-indigo-500">
                                                    {assignment.expand?.subject?.name?.charAt(0) || 'A'}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{assignment.title}</h3>
                                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-tighter">
                                                        {assignment.expand?.subject?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="px-3 py-1 bg-white dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm inline-block">
                                                    <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter">
                                                        Due {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <Icon name="InboxIcon" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">Clear skies! No pending work found.</p>
                                </div>
                            )}
                        </div>
                    </WidgetErrorBoundary>
                </Card>

                {/* Academic Quick Links */}
                <Card className="p-8 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Navigator</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-8">Manage your student lifecycle</p>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { to: '/student/assignments', label: 'Work Center', icon: 'DocumentTextIcon', sub: 'Tasks & Projects' },
                            { to: '/student/grades', label: 'Achievements', icon: 'ChartBarIcon', sub: 'Scores & Feedback' },
                            { to: '/student/schedule', label: 'Planner', icon: 'CalendarIcon', sub: 'Daily Timetable' },
                            { to: '/student/courses', label: 'Knowledge Base', icon: 'BookOpenIcon', sub: 'Resource Hub' }
                        ].map(link => (
                            <Link key={link.to} to={link.to}>
                                <Button variant="outline" className="w-full justify-start p-6 h-auto rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-gray-100 dark:border-gray-700 transition-all group">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                        <Icon name={link.icon} className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{link.label}</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{link.sub}</p>
                                    </div>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
