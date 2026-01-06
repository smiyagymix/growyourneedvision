import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Award, Target, Calendar, BookOpen, Clock, Star,
  ChevronUp, ChevronDown, Minus, BarChart3, PieChart, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService, Grade } from '../../services/studentService';
import { cn } from '../../lib/utils';

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

interface WeeklyProgress {
  day: string;
  studyTime: number;
  assignments: number;
}

const StudentProgress: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gpa, setGpa] = useState(0);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Mock weekly progress data
  const weeklyProgress: WeeklyProgress[] = [
    { day: 'Mon', studyTime: 120, assignments: 2 },
    { day: 'Tue', studyTime: 90, assignments: 1 },
    { day: 'Wed', studyTime: 150, assignments: 3 },
    { day: 'Thu', studyTime: 80, assignments: 0 },
    { day: 'Fri', studyTime: 200, assignments: 4 },
    { day: 'Sat', studyTime: 45, assignments: 1 },
    { day: 'Sun', studyTime: 60, assignments: 0 },
  ];

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);

    const [gpaData, gradesData, attendanceData, studyTimeData, statsData] = await Promise.all([
      studentService.getGPA(user.id),
      studentService.getGrades(user.id),
      studentService.getAttendanceRate(user.id),
      studentService.getTotalStudyTime(user.id, 30),
      studentService.getDashboardStats(user.id),
    ]);

    setGpa(gpaData.gpa);
    setGrades(gradesData);
    setAttendanceRate(attendanceData);
    setTotalStudyTime(studyTimeData);
    setDashboardStats(statsData);
    setLoading(false);
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-500', 'A': 'text-green-500', 'A-': 'text-green-400',
      'B+': 'text-blue-500', 'B': 'text-blue-500', 'B-': 'text-blue-400',
      'C+': 'text-yellow-500', 'C': 'text-yellow-500', 'C-': 'text-yellow-400',
      'D': 'text-orange-500', 'F': 'text-red-500',
    };
    return colors[grade] || 'text-gray-500';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const maxStudyTime = Math.max(...weeklyProgress.map(d => d.studyTime));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading progress data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
            My Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your academic journey and study habits
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* GPA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                {getTrendIcon(0.2)}
                <span>+0.2</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-1">{gpa.toFixed(2)}</div>
            <div className="text-indigo-200">Current GPA</div>
          </motion.div>

          {/* Attendance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                {getTrendIcon(2)}
                <span>+2%</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-1">{attendanceRate}%</div>
            <div className="text-green-200">Attendance Rate</div>
          </motion.div>

          {/* Study Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                {getTrendIcon(5)}
                <span>+5h</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-1">{Math.round(totalStudyTime / 60)}h</div>
            <div className="text-purple-200">Study Time (30d)</div>
          </motion.div>

          {/* Assignments Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-sm bg-white/20 px-2 py-1 rounded-full">
                {dashboardStats?.upcoming_assignments || 0} pending
              </div>
            </div>
            <div className="text-4xl font-bold mb-1">{dashboardStats?.assignments_completed || 0}</div>
            <div className="text-orange-200">Assignments Done</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Study Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Weekly Study Time
              </h3>
              <span className="text-sm text-gray-500">
                Total: {weeklyProgress.reduce((s, d) => s + d.studyTime, 0)} min
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyProgress.map((day, idx) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.studyTime / maxStudyTime) * 100}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className={cn(
                      "w-full rounded-t-lg transition-colors",
                      idx === new Date().getDay() - 1 ? "bg-indigo-500" : "bg-indigo-200 dark:bg-indigo-900"
                    )}
                  />
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-gray-600 dark:text-gray-400">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-200 dark:bg-indigo-900" />
                  <span className="text-gray-600 dark:text-gray-400">Other Days</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subject Performance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-500" />
              Subject Grades
            </h3>

            <div className="space-y-4">
              {grades.slice(0, 5).map((grade, idx) => (
                <motion.div
                  key={grade.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gray-500" />
                    </div>

                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{grade.course_name || 'Subject'}</div>
                      <div className="text-sm text-gray-500">{grade.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-xl font-bold", getGradeColor(grade.letter_grade || ''))}>
                      {grade.letter_grade || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{grade.score}/{grade.max_score}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-yellow-500" />
            Recent Achievements
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Perfect Attendance', icon: Calendar, color: 'bg-green-100 text-green-500', desc: 'No absences this month' },
              { name: 'Study Streak', icon: Activity, color: 'bg-purple-100 text-purple-500', desc: '7 day study streak' },
              { name: 'Top Performer', icon: Award, color: 'bg-yellow-100 text-yellow-500', desc: 'GPA above 3.5' },
              { name: 'Quick Learner', icon: TrendingUp, color: 'bg-blue-100 text-blue-500', desc: '10 assignments completed' },
            ].map((achievement, idx) => (
              <motion.div
                key={achievement.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition-shadow"
              >
                <div className={cn("w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center", achievement.color.split(' ')[0])}>
                  <achievement.icon className={cn("w-6 h-6", achievement.color.split(' ')[1])} />
                </div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">{achievement.name}</div>
                <div className="text-xs text-gray-500 mt-1">{achievement.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-indigo-500" />
            Learning Goals
          </h3>

          <div className="space-y-4">
            {[
              { name: 'Maintain GPA above 3.5', progress: 80, current: '3.67', target: '3.5' },
              { name: 'Complete 50 study hours', progress: 65, current: '32.5h', target: '50h' },
              { name: 'Submit all assignments on time', progress: 90, current: '9/10', target: '10/10' },
              { name: 'Master 100 flashcards', progress: 45, current: '45', target: '100' },
            ].map((goal, idx) => (
              <div key={goal.name} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{goal.name}</span>
                  <span className="text-sm text-gray-500">{goal.current} / {goal.target}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className={cn(
                      "h-full rounded-full",
                      goal.progress >= 80 ? "bg-green-500" : goal.progress >= 50 ? "bg-yellow-500" : "bg-indigo-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProgress;
