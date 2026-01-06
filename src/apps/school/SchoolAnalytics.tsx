import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Users, GraduationCap,
  Calendar, Clock, AlertTriangle, Award, BookOpen, DollarSign,
  ChevronDown, Filter, Download
} from 'lucide-react';
import { schoolService, SchoolStats, ChartDataPoint } from '../../services/schoolService';
import { cn } from '../../lib/utils';
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures';
import { PremiumBanner, PremiumBadge, PremiumButton, PremiumGate } from '../../components/shared/ui/PremiumFeatures';

interface DepartmentPerformance {
  name: string;
  students: number;
  avgGrade: number;
  passRate: number;
  trend: number;
}

interface AttendanceTrend {
  week: string;
  rate: number;
}

const SchoolAnalytics: React.FC = () => {
  const { hasFeatureAccess, isPremiumOrHigher } = usePremiumFeatures();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [growthData, setGrowthData] = useState<ChartDataPoint[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  // Mock department data (would come from service in production)
  const [departments] = useState<DepartmentPerformance[]>([
    { name: 'Science', students: 145, avgGrade: 85.2, passRate: 94, trend: 2.3 },
    { name: 'Mathematics', students: 152, avgGrade: 78.5, passRate: 88, trend: -1.5 },
    { name: 'English', students: 148, avgGrade: 82.1, passRate: 92, trend: 0.8 },
    { name: 'Social Studies', students: 138, avgGrade: 80.4, passRate: 91, trend: 1.2 },
    { name: 'Arts', students: 95, avgGrade: 88.7, passRate: 98, trend: 3.1 },
  ]);

  const [attendanceTrends] = useState<AttendanceTrend[]>([
    { week: 'Week 1', rate: 94.2 },
    { week: 'Week 2', rate: 92.8 },
    { week: 'Week 3', rate: 95.1 },
    { week: 'Week 4', rate: 93.5 },
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, chartData] = await Promise.all([
        schoolService.getSchoolStats(),
        schoolService.getGrowthChartData()
      ]);
      setStats(statsData);
      setGrowthData(chartData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-500';
    if (grade >= 80) return 'text-blue-500';
    if (grade >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendBadge = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="flex items-center gap-1 text-green-500 text-sm">
          <TrendingUp className="w-3 h-3" />
          +{trend.toFixed(1)}%
        </span>
      );
    }
    if (trend < 0) {
      return (
        <span className="flex items-center gap-1 text-red-500 text-sm">
          <TrendingDown className="w-3 h-3" />
          {trend.toFixed(1)}%
        </span>
      );
    }
    return <span className="text-gray-400 text-sm">—</span>;
  };

  const maxGrowth = Math.max(...growthData.map(d => d.value), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
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
              <BarChart3 className="w-8 h-8 text-indigo-500" />
              School Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive performance insights
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <PremiumButton
              featureKey="CUSTOM_REPORTS"
              variant="outline"
              onClick={() => console.warn('Export functionality requires server-side processing')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
              {!hasFeatureAccess('CUSTOM_REPORTS') && (
                <PremiumBadge featureKey="CUSTOM_REPORTS" className="ml-2" />
              )}
            </PremiumButton>
          </div>
        </div>

        {/* Premium Banner */}
        {!isPremiumOrHigher && (
          <PremiumBanner featureKey="ADVANCED_ANALYTICS" className="mb-6" />
        )}




        
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Students</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalStudents.toLocaleString()}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Teachers</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalTeachers}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Attendance</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.averageAttendance}%</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Classes</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalClasses}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Budget Used</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">84%</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Growth Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Student Enrollment Growth
            </h2>

            <div className="h-64 flex items-end gap-2">
              {growthData.map((point, idx) => (
                <div key={point.label} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(point.value / maxGrowth) * 100}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg min-h-[20px] relative group"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.value} students
                    </div>
                  </motion.div>
                  <span className="mt-2 text-xs text-gray-500">{point.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Attendance Trends */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-green-500" />
              Weekly Attendance
            </h2>

            <div className="space-y-4">
              {attendanceTrends.map((trend, idx) => (
                <motion.div
                  key={trend.week}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{trend.week}</span>
                    <span className={cn(
                      "font-medium",
                      trend.rate >= 95 ? 'text-green-500' :
                      trend.rate >= 90 ? 'text-blue-500' : 'text-yellow-500'
                    )}>
                      {trend.rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trend.rate}%` }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        trend.rate >= 95 ? 'bg-green-500' :
                        trend.rate >= 90 ? 'bg-blue-500' : 'bg-yellow-500'
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Department Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-purple-500" />
            Department Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Department</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Students</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Grade</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Pass Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <motion.tr
                    key={dept.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">{dept.students}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn("font-semibold", getGradeColor(dept.avgGrade))}>
                        {dept.avgGrade}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              dept.passRate >= 95 ? 'bg-green-500' :
                              dept.passRate >= 90 ? 'bg-blue-500' : 'bg-yellow-500'
                            )}
                            style={{ width: `${dept.passRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{dept.passRate}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getTrendBadge(dept.trend)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Alerts Section */}
        {departments.some(d => d.avgGrade < 75 || d.passRate < 85) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Performance Alerts</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {departments.filter(d => d.avgGrade < 75).length > 0 && (
                    <>Some departments have average grades below 75%. </>
                  )}
                  {departments.filter(d => d.passRate < 85).length > 0 && (
                    <>Pass rates in some areas need attention. </>
                  )}
                  Consider reviewing curriculum and support programs.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SchoolAnalytics;
