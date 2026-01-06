import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Award, BookOpen, Calendar,
  Clock, Target, BarChart3, PieChart, ChevronDown, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { parentService, ChildGrade, ChildAttendance } from '../../services/parentService';
import { cn } from '../../lib/utils';

interface Child {
  id: string;
  name: string;
  grade_level: string;
}

interface SubjectGrade {
  subject: string;
  grades: ChildGrade[];
  average: number;
  trend: number;
}

const ChildProgress: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [grades, setGrades] = useState<ChildGrade[]>([]);
  const [attendance, setAttendance] = useState<ChildAttendance[]>([]);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [overallStats, setOverallStats] = useState({
    gpa: 0,
    attendanceRate: 0,
    totalAssignments: 0,
    trend: 0,
  });

  useEffect(() => {
    loadChildren();
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild) {
      loadProgressData(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    setLoading(true);
    const kids = await parentService.getChildren(user?.id || 'parent-1');
    const childList: Child[] = kids.map((child: any) => ({
      id: child.id,
      name: child.name,
      grade_level: child.grade_level || 'N/A',
    }));
    setChildren(childList);
    if (childList.length > 0) {
      setSelectedChild(childList[0]);
    }
    setLoading(false);
  };

  const loadProgressData = async (childId: string) => {
    const [gradesData, attendanceData] = await Promise.all([
      parentService.getChildGrades(childId),
      parentService.getChildAttendance(childId, 60),
    ]);

    setGrades(gradesData);
    setAttendance(attendanceData);

    // Group grades by subject
    const subjectMap = new Map<string, ChildGrade[]>();
    gradesData.forEach(grade => {
      const existing = subjectMap.get(grade.subject) || [];
      existing.push(grade);
      subjectMap.set(grade.subject, existing);
    });

    const subjects: SubjectGrade[] = Array.from(subjectMap.entries()).map(([subject, grades]) => {
      const avg = grades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / grades.length;
      // Calculate trend (simple: compare last 2 grades if available)
      let trend = 0;
      if (grades.length >= 2) {
        const sorted = [...grades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = (sorted[0].score / sorted[0].max_score) * 100;
        const previous = (sorted[1].score / sorted[1].max_score) * 100;
        trend = latest - previous;
      }
      return { subject, grades, average: avg, trend };
    });

    setSubjectGrades(subjects);

    // Overall stats
    const overallAvg = gradesData.length > 0
      ? gradesData.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / gradesData.length
      : 0;
    const presentDays = attendanceData.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attRate = attendanceData.length > 0 ? (presentDays / attendanceData.length) * 100 : 100;

    setOverallStats({
      gpa: percentageToGPA(overallAvg),
      attendanceRate: attRate,
      totalAssignments: gradesData.length,
      trend: subjects.length > 0 ? subjects.reduce((s, sub) => s + sub.trend, 0) / subjects.length : 0,
    });
  };

  const percentageToGPA = (pct: number) => {
    if (pct >= 93) return 4.0;
    if (pct >= 90) return 3.7;
    if (pct >= 87) return 3.3;
    if (pct >= 83) return 3.0;
    if (pct >= 80) return 2.7;
    if (pct >= 77) return 2.3;
    if (pct >= 73) return 2.0;
    if (pct >= 70) return 1.7;
    if (pct >= 67) return 1.3;
    if (pct >= 63) return 1.0;
    return 0.0;
  };

  const getGradeColor = (avg: number) => {
    if (avg >= 90) return 'text-green-500';
    if (avg >= 80) return 'text-blue-500';
    if (avg >= 70) return 'text-yellow-500';
    if (avg >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getGradeBg = (avg: number) => {
    if (avg >= 90) return 'bg-green-500';
    if (avg >= 80) return 'bg-blue-500';
    if (avg >= 70) return 'bg-yellow-500';
    if (avg >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 2) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -2) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const maxGradeValue = Math.max(...subjectGrades.map(s => s.average), 100);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-500" />
              Academic Progress
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your child's academic journey
            </p>
          </div>

          {children.length > 1 && (
            <div className="mt-4 md:mt-0 relative">
              <select
                name="select-child"
                value={selectedChild?.id || ''}
                onChange={(e) => setSelectedChild(children.find(c => c.id === e.target.value) || null)}
                className="appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium cursor-pointer"
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>{child.name} - {child.grade_level}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {selectedChild && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Current GPA</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.gpa.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(overallStats.trend)}
                  <span className={overallStats.trend > 0 ? 'text-green-500' : overallStats.trend < 0 ? 'text-red-500' : 'text-gray-400'}>
                    {overallStats.trend > 0 ? '+' : ''}{overallStats.trend.toFixed(1)}% trend
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Attendance</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.attendanceRate.toFixed(0)}%</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${overallStats.attendanceRate}%` }} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Subjects</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{subjectGrades.length}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {overallStats.totalAssignments} assignments graded
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Best Subject</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {subjectGrades.length > 0 
                        ? subjectGrades.reduce((best, s) => s.average > best.average ? s : best).subject 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Performance Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Subject Performance
                </h2>

                {subjectGrades.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No grades available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subjectGrades.map((subject, idx) => (
                      <motion.div
                        key={subject.subject}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{subject.subject}</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(subject.trend)}
                            <span className={cn("font-bold", getGradeColor(subject.average))}>
                              {subject.average.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(subject.average / maxGradeValue) * 100}%` }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className={cn("h-full rounded-full", getGradeBg(subject.average))}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Grades List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-blue-500" />
                  Recent Grades
                </h2>

                {grades.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No grades recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {grades.slice(0, 10).map((grade, idx) => {
                      const pct = (grade.score / grade.max_score) * 100;
                      return (
                        <motion.div
                          key={grade.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{grade.assignment_name}</div>
                            <div className="text-sm text-gray-500">{grade.subject} • {grade.date}</div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-xl font-bold", getGradeColor(pct))}>
                              {grade.grade_letter}
                            </div>
                            <div className="text-sm text-gray-500">{grade.score}/{grade.max_score}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Alerts Section */}
            {subjectGrades.some(s => s.average < 70) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Areas Needing Attention</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {selectedChild.name} may need extra help in: {' '}
                      {subjectGrades.filter(s => s.average < 70).map(s => s.subject).join(', ')}
                    </p>
                    <button name="contact-teacher" className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">
                      Contact Teacher
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChildProgress;
