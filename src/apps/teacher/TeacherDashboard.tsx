import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, ClipboardCheck, MessageSquare, Calendar, Clock,
  TrendingUp, AlertCircle, ChevronRight, Bell, FileText, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, TeacherClass, Assignment, TeacherMessage, TeacherScheduleItem, DashboardStats } from '../../services/teacherService';
import { cn } from '../../lib/utils';

import { StatsSkeleton, TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const TeacherDashboard: React.FC<Props> = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TeacherScheduleItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    const teacherId = user?.id || 't1';
    setLoading(true);

    try {
      const [statsData, classesData, assignmentsData, messagesData, scheduleData] = await Promise.all([
        teacherService.getDashboardStats(teacherId),
        teacherService.getClasses(teacherId),
        teacherService.getAssignments(teacherId),
        teacherService.getMessages(teacherId, true),
        teacherService.getTodaySchedule(teacherId),
      ]);

      setStats(statsData);
      setClasses(classesData);
      setAssignments(assignmentsData);
      setMessages(messagesData);
      setTodaySchedule(scheduleData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${mins} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Teacher'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening in your classes today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          {loading ? (
            <StatsSkeleton cols={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative group"
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative">
                  <Users className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <span className="text-3xl font-black">{stats?.total_students}</span>
                    <div className="flex items-center gap-1 text-xs opacity-80 justify-end">
                      <TrendingUp className="w-3 h-3" /> +5%
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-blue-100 font-medium relative">Total Students</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative group"
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative">
                  <BookOpen className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-black">{stats?.total_classes}</span>
                </div>
                <div className="mt-2 text-purple-100 font-medium relative">Active Classes</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative group"
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative">
                  <ClipboardCheck className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-black">{stats?.pending_submissions}</span>
                </div>
                <div className="mt-2 text-orange-100 font-medium relative">To Grade</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg overflow-hidden relative group"
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="flex items-center justify-between relative">
                  <MessageSquare className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-black">{stats?.messages_unread}</span>
                </div>
                <div className="mt-2 text-green-100 font-medium relative">Unread Messages</div>
              </motion.div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Today's Schedule
              </h2>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>

            {loading ? (
              <TableSkeleton rows={4} />
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No classes scheduled today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-700/50 hover:shadow-md transition-all cursor-pointer",
                      item.type === 'class' ? 'border-blue-500' :
                        item.type === 'meeting' ? 'border-purple-500' :
                          item.type === 'prep' ? 'border-green-500' : 'border-gray-400'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">{item.class_name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700">
                        {item.room}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500 font-medium">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Classes Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                My Classes
              </h2>
              <button aria-label="View all classes" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.slice(0, 4).map((cls, idx) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
                    style={{ borderLeftColor: cls.color, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{cls.subject} • Grade {cls.grade_level}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400 font-bold bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                        <Users className="w-4 h-4" />
                        <span>{cls.student_count}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{cls.schedule}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Upcoming Assignments */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Upcoming Due Dates
              </h2>
              <span className="text-sm text-gray-500">{stats?.assignments_due_week} this week</span>
            </div>

            <div className="space-y-3">
              {assignments
                .filter(a => a.status === 'published')
                .slice(0, 4)
                .map((assignment, idx) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        assignment.type === 'quiz' ? 'bg-purple-100 text-purple-500' :
                          assignment.type === 'test' ? 'bg-red-100 text-red-500' :
                            assignment.type === 'homework' ? 'bg-blue-100 text-blue-500' :
                              'bg-green-100 text-green-500'
                      )}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{assignment.title}</div>
                        <div className="text-sm text-gray-500">{assignment.class_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-medium",
                        getTimeUntil(assignment.due_date) === 'Today' ? 'text-red-500' :
                          getTimeUntil(assignment.due_date) === 'Tomorrow' ? 'text-orange-500' : 'text-gray-600'
                      )}>
                        {getTimeUntil(assignment.due_date)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {assignment.submissions_count}/{assignments.find(a => a.classId === assignment.classId) ? 28 : 25} submitted
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>

          {/* Messages & Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-500" />
                Recent Messages
              </h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No unread messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.slice(0, 4).map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.sender_type === 'parent' ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'
                    )}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{msg.sender_name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.created).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{msg.subject}</div>
                      <div className="text-sm text-gray-500 truncate">{msg.content}</div>
                    </div>
                    {!msg.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Take Attendance', icon: ClipboardCheck, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
              { name: 'Create Assignment', icon: FileText, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
              { name: 'Grade Submissions', icon: Award, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
              { name: 'Message Parents', icon: MessageSquare, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
            ].map((action, idx) => (
              <motion.button
                key={action.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                  action.color
                )}
              >
                <action.icon className="w-8 h-8" />
                <span className="text-sm font-medium">{action.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Performance Alert */}
        {stats && stats.average_class_performance < 75 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-4"
          >
            <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Performance Alert</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Average class performance is below 75%. Consider reviewing recent material or offering extra help sessions.
              </p>
            </div>
            <button className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium">
              View Details
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
