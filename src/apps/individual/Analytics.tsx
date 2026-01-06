import React, { useState, useEffect, useMemo } from 'react';import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { individualService, IndividualCourse, Project, ExtendedGoal, Skill, WellnessData, LearningProgress } from '../../services/individualService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const IndividualAnalytics: React.FC<Props> = ({ activeTab = 'Analytics' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<IndividualCourse[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<ExtendedGoal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [wellness, setWellness] = useState<WellnessData[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalyticsData();
  }, [user?.id]);

  const loadAnalyticsData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [coursesData, projectsData, goalsData, skillsData, wellnessData, progressData] = await Promise.all([
        individualService.getAllCourses(user.id),
        individualService.getProjects(user.id),
        individualService.getExtendedGoals(user.id),
        individualService.getSkills(user.id),
        individualService.getWellnessHistory(user.id, 30),
        individualService.getLearningProgress(user.id)
      ]);
      setCourses(coursesData);
      setProjects(projectsData);
      setGoals(goalsData);
      setSkills(skillsData);
      setWellness(wellnessData);
      setLearningProgress(progressData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const completedCourses = courses.filter(c => c.status === 'completed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalXP = learningProgress.reduce((sum, lp) => sum + lp.xp, 0);
    const avgMood = wellness.length > 0 
      ? wellness.reduce((sum, w) => sum + w.mood_score, 0) / wellness.length 
      : 0;
    const totalSteps = wellness.reduce((sum, w) => sum + w.steps, 0);
    const totalExercise = wellness.reduce((sum, w) => sum + w.exercise_minutes, 0);

    return {
      completedCourses,
      completedProjects,
      completedGoals,
      totalXP,
      avgMood: avgMood.toFixed(1),
      totalSteps,
      totalExercise,
      skillsCount: skills.length,
      avgSkillProficiency: skills.length > 0 
        ? Math.round(skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length)
        : 0
    };
  }, [courses, projects, goals, skills, wellness, learningProgress]);

  // Skill distribution by category
  const skillDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    skills.forEach(skill => {
      distribution[skill.category] = (distribution[skill.category] || 0) + 1;
    });
    return distribution;
  }, [skills]);

  // Progress trends (simplified bar visualization)
  const progressTrend = useMemo(() => {
    return wellness.slice(0, 7).reverse().map(w => ({
      date: new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' }),
      mood: w.mood_score,
      energy: w.energy_level,
      steps: Math.round(w.steps / 1000)
    }));
  }, [wellness]);

  if (loading) {
    return (
      <div className="animate-fadeIn space-y-6 p-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your personal growth insights</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  timeRange === range 
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={loadAnalyticsData} 
              isLoading={loading}
              leftIcon={<Icon name="ArrowPathIcon" className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => {
                // Mock export functionality
                const dataStr = JSON.stringify(stats, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              leftIcon={<Icon name="ArrowDownTrayIcon" className="w-4 h-4" />}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl"
        >
          <Icon name="AcademicCapIcon" className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80 mb-1">Total XP Earned</p>
          <p className="text-3xl font-black">{stats.totalXP.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl"
        >
          <Icon name="CheckCircleIcon" className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80 mb-1">Goals Achieved</p>
          <p className="text-3xl font-black">{stats.completedGoals}/{goals.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl"
        >
          <Icon name="FolderOpenIcon" className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80 mb-1">Projects Done</p>
          <p className="text-3xl font-black">{stats.completedProjects}/{projects.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-2xl"
        >
          <Icon name="HeartIcon" className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80 mb-1">Avg Mood</p>
          <p className="text-3xl font-black">{stats.avgMood}/10</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Learning Progress</h3>
          <div className="space-y-4">
            {learningProgress.map((lp, idx) => (
              <div key={lp.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      idx === 0 ? 'bg-blue-100 dark:bg-blue-900/30' :
                      idx === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <span className="text-lg font-bold">{lp.level}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{lp.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lp.xp.toLocaleString()} XP</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">🔥 {lp.daily_streak} days</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(lp.xp / lp.next_level_xp) * 100}%` }}
                    className={`h-full rounded-full ${
                      idx === 0 ? 'bg-blue-500' :
                      idx === 1 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                  />
                </div>
              </div>
            ))}
            {learningProgress.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No learning progress yet</p>
            )}
          </div>
        </Card>

        {/* Skills Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skills Distribution</h3>
          <div className="space-y-3">
            {Object.entries(skillDistribution).map(([category, count]) => {
              const percentage = (count / skills.length) * 100;
              const colors: Record<string, string> = {
                technical: 'bg-blue-500',
                'soft-skills': 'bg-purple-500',
                language: 'bg-green-500',
                creative: 'bg-pink-500',
                business: 'bg-orange-500'
              };
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {category.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{count} skills</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full rounded-full ${colors[category] || 'bg-gray-500'}`}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(skillDistribution).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No skills added yet</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Proficiency</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgSkillProficiency}%</span>
            </div>
          </div>
        </Card>

        {/* Weekly Wellness Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Weekly Wellness</h3>
          {progressTrend.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between h-32 gap-2">
                {progressTrend.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t-md transition-all"
                      style={{ height: `${day.mood * 10}%` }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{day.date}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSteps.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Steps</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExercise}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Exercise Min</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{wellness.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Days Logged</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No wellness data yet</p>
          )}
        </Card>

        {/* Activity Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="BookOpenIcon" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Courses Completed</span>
              </div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.completedCourses}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="FolderIcon" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white">Projects Finished</span>
              </div>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.completedProjects}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="FlagIcon" className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white">Goals Achieved</span>
              </div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completedGoals}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon name="SparklesIcon" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="font-medium text-gray-900 dark:text-white">Skills Acquired</span>
              </div>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{stats.skillsCount}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IndividualAnalytics;
