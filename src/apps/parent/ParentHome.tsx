import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Clock, Bell,
  ChevronRight, Award, CheckCircle,
  MessageSquare, CreditCard, FileText, Activity,
  GraduationCap, TrendingUp, BookOpen, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { parentService, ChildGrade, ChildAttendance, ChildSchedule } from '../../services/parentService';
import { cn } from '../../lib/utils';

interface Child {
  id: string;
  name: string;
  grade_level: string;
  avatar?: string;
  relationship?: string;
}

interface ChildStats {
  attendanceRate: number;
  averageGrade: number;
  totalAssignments: number;
  recentGrades: ChildGrade[];
  todaySchedule: ChildSchedule[];
  recentAttendance: ChildAttendance[];
}

const ParentHome: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childStats, setChildStats] = useState<ChildStats | null>(null);
  const [announcements] = useState([
    { id: '1', title: 'Parent-Teacher Conference', date: '2024-12-20', type: 'event' },
    { id: '2', title: 'Winter Break Schedule', date: '2024-12-18', type: 'info' },
    { id: '3', title: 'Report Cards Available', date: '2024-12-15', type: 'grade' },
  ]);

  useEffect(() => {
    loadChildren();
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild) {
      loadChildStats(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    setLoading(true);
    const kids = await parentService.getChildren(user?.id || 'parent-1');
    const childList: Child[] = kids.map((child: any) => ({
      id: child.id,
      name: child.name,
      grade_level: child.grade_level || 'N/A',
      avatar: child.avatar,
      relationship: child.relationship,
    }));
    setChildren(childList);
    if (childList.length > 0) {
      setSelectedChild(childList[0]);
    }
    setLoading(false);
  };

  const loadChildStats = async (childId: string) => {
    const [grades, attendance, schedule] = await Promise.all([
      parentService.getChildGrades(childId),
      parentService.getChildAttendance(childId, 30),
      parentService.getChildSchedule(childId),
    ]);

    const avgGrade = grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / grades.length
      : 0;

    const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = attendance.length > 0 ? (presentDays / attendance.length) * 100 : 100;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const todaySchedule = schedule.filter(s => s.day === today);

    setChildStats({
      attendanceRate,
      averageGrade: avgGrade,
      totalAssignments: grades.length,
      recentGrades: grades.slice(0, 5),
      todaySchedule,
      recentAttendance: attendance.slice(0, 7),
    });
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 80) return 'text-blue-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-500';
      case 'Late': return 'bg-yellow-500';
      case 'Excused': return 'bg-blue-500';
      case 'Absent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${mins} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Parent'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with your children's academic progress
          </p>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
            {children.map(child => (
              <motion.button
                key={child.id}
                name={`select-child-${child.id}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChild(child)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-w-[200px]",
                  selectedChild?.id === child.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                  selectedChild?.id === child.id ? "bg-white/20" : "bg-indigo-100 text-indigo-600"
                )}>
                  {child.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold">{child.name}</div>
                  <div className={cn("text-sm flex items-center gap-1", selectedChild?.id === child.id ? "text-indigo-200" : "text-gray-500")}>
                    <GraduationCap className="w-3 h-3" />
                    {child.grade_level}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {selectedChild && childStats && (
          <>
            {/* Alerts Section */}
            {(childStats.attendanceRate < 90 || childStats.averageGrade < 75) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-300">Attention Needed</h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {childStats.attendanceRate < 90 && "Attendance is below 90%. "}
                    {childStats.averageGrade < 75 && "Average grade has dropped below 75%."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <CheckCircle className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{childStats.attendanceRate.toFixed(0)}%</span>
                </div>
                <div className="mt-2 text-green-100">Attendance Rate</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <Award className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <span className="text-3xl font-bold">{childStats.averageGrade.toFixed(0)}%</span>
                    <div className="flex items-center gap-1 text-xs opacity-80">
                      <TrendingUp className="w-3 h-3" /> +2.5%
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-blue-100">Average Grade</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{childStats.totalAssignments}</span>
                </div>
                <div className="mt-2 text-purple-100">Graded Items</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white"
              >
                <div className="flex items-center justify-between">
                  <Calendar className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{childStats.todaySchedule.length}</span>
                </div>
                <div className="mt-2 text-orange-100">Classes Today</div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Schedule */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Today's Schedule
                  </h2>
                </div>

                {childStats.todaySchedule.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No classes scheduled today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {childStats.todaySchedule.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-l-4 border-indigo-500"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{item.class_name}</span>
                          <span className="text-sm text-gray-500">{item.room}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                          <span className="mx-1">•</span>
                          <span>{item.teacher}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Grades */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" />
                    Recent Grades
                  </h2>
                  <button name="view-all-grades" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {childStats.recentGrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No grades recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {childStats.recentGrades.map((grade, idx) => (
                      <motion.div
                        key={grade.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{grade.assignment_name}</div>
                          <div className="text-sm text-gray-500">{grade.subject} • {grade.teacher}</div>
                        </div>
                        <div className="text-right">
                          <div className={cn("text-xl font-bold", getGradeColor((grade.score / grade.max_score) * 100))}>
                            {grade.grade_letter}
                          </div>
                          <div className="text-sm text-gray-500">{grade.score}/{grade.max_score}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Attendance & Announcements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Attendance Week */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-green-500" />
                    This Week's Attendance
                  </h2>
                  <div className="flex justify-between">
                    {childStats.recentAttendance.slice(0, 5).map((att, idx) => (
                      <div key={att.id} className="flex flex-col items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-full", getAttendanceColor(att.status))} title={att.status} />
                        <span className="text-xs text-gray-500">
                          {new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> Present</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Late</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Absent</div>
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-orange-500" />
                    School Announcements
                  </h2>
                  <div className="space-y-3">
                    {announcements.map((ann, idx) => (
                      <motion.div
                        key={ann.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          ann.type === 'event' ? 'bg-purple-100 text-purple-500' :
                          ann.type === 'grade' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'
                        )}>
                          {ann.type === 'event' ? <Calendar className="w-4 h-4" /> :
                           ann.type === 'grade' ? <Award className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{ann.title}</div>
                          <div className="text-xs text-gray-500">{ann.date}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'View Grades', icon: Award, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
                  { name: 'Message Teacher', icon: MessageSquare, color: 'bg-green-100 text-green-600 hover:bg-green-200' },
                  { name: 'Pay Fees', icon: CreditCard, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
                  { name: 'Full Schedule', icon: Calendar, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
                  { name: 'Library', icon: BookOpen, color: 'bg-teal-100 text-teal-600 hover:bg-teal-200' },
                ].map((action, idx) => (
                  <motion.button
                    key={action.name}
                    name={`quick-action-${action.name.toLowerCase().replace(/\s+/g, '-')}`}
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
          </>
        )}

        {children.length === 0 && !loading && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Children Linked</h2>
            <p className="text-gray-500 mb-6">Contact your school administrator to link your children to your account.</p>
            <button name="contact-support" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Contact Support
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentHome;
