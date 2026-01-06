import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Icon, Heading1, Heading2, Text } from '../../components/shared/ui/CommonUI';
import { StatsSkeleton, CardSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { individualService, WellnessData } from '../../services/individualService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures';
import { PremiumBanner, PremiumButton, PremiumBadge } from '../../components/shared/ui/PremiumFeatures';

const wellnessLogSchema = z.object({
  mood_score: z.number().min(1, 'Mood score must be at least 1').max(10, 'Mood score max is 10'),
  energy_level: z.number().min(1).max(10),
  stress_level: z.number().min(0).max(10),
  sleep_hours: z.number().min(0, 'Sleep hours must be positive').max(24, 'Sleep hours max is 24'),
  water_intake: z.number().min(0).max(20),
  steps: z.number().min(0).max(100000),
  exercise_minutes: z.number().min(0).max(1440),
  meditation_minutes: z.number().min(0).max(1440)
});

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const IndividualWellness: React.FC<Props> = ({ activeTab }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { hasFeatureAccess } = usePremiumFeatures();
  const [wellnessHistory, setWellnessHistory] = useState<WellnessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [view, setView] = useState<'overview' | 'history' | 'insights'>('overview');

  // Premium features
  const hasAIHealthCoach = hasFeatureAccess('AI_HEALTH_COACH');
  const hasAdvancedAnalytics = hasFeatureAccess('ADVANCED_HEALTH_ANALYTICS');
  const hasMealPlanGenerator = hasFeatureAccess('MEAL_PLAN_GENERATOR');

  // Form state for logging
  const [logForm, setLogForm] = useState({
    mood_score: 7,
    energy_level: 7,
    stress_level: 3,
    sleep_hours: 7,
    water_intake: 6,
    steps: 5000,
    exercise_minutes: 0,
    meditation_minutes: 0
  });

  useEffect(() => {
    loadWellnessData();
  }, [user?.id]);

  const loadWellnessData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const history = await individualService.getWellnessHistory(user.id, 30);
      setWellnessHistory(history);
    } finally {
      setLoading(false);
    }
  };

  // Get today's data
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return wellnessHistory.find(w => w.date === today);
  }, [wellnessHistory]);

  // Calculate averages
  const averages = useMemo(() => {
    if (wellnessHistory.length === 0) return null;
    const sum = wellnessHistory.reduce((acc, w) => ({
      mood: acc.mood + w.mood_score,
      energy: acc.energy + w.energy_level,
      stress: acc.stress + w.stress_level,
      sleep: acc.sleep + w.sleep_hours,
      water: acc.water + w.water_intake,
      steps: acc.steps + w.steps,
      exercise: acc.exercise + w.exercise_minutes,
      meditation: acc.meditation + w.meditation_minutes
    }), { mood: 0, energy: 0, stress: 0, sleep: 0, water: 0, steps: 0, exercise: 0, meditation: 0 });

    const count = wellnessHistory.length;
    return {
      mood: (sum.mood / count).toFixed(1),
      energy: (sum.energy / count).toFixed(1),
      stress: (sum.stress / count).toFixed(1),
      sleep: (sum.sleep / count).toFixed(1),
      water: (sum.water / count).toFixed(0),
      steps: Math.round(sum.steps / count),
      exercise: Math.round(sum.exercise / count),
      meditation: Math.round(sum.meditation / count)
    };
  }, [wellnessHistory]);

  const handleLogSubmit = async () => {
    if (!user?.id) return;
    
    // Validate wellness data
    const result = wellnessLogSchema.safeParse(logForm);
    if (!result.success) {
      addToast(`Validation error: ${result.error.issues[0].message}`, 'error');
      return;
    }

    // Optimistic Update
    const optimisticEntry: WellnessData = {
      id: `opt-${Date.now()}`,
      user: user.id,
      date: new Date().toISOString().split('T')[0],
      ...result.data,
      collectionId: '',
      collectionName: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    } as WellnessData;

    const previousHistory = [...wellnessHistory];
    const existingIndex = wellnessHistory.findIndex(w => w.date === optimisticEntry.date);

    if (existingIndex !== -1) {
      const newHistory = [...wellnessHistory];
      newHistory[existingIndex] = optimisticEntry;
      setWellnessHistory(newHistory);
    } else {
      setWellnessHistory([optimisticEntry, ...wellnessHistory]);
    }

    setShowLogModal(false);
    addToast('Wellness logged! (Syncing...)', 'info');

    const logResult = await individualService.logWellness(user.id, {
      date: optimisticEntry.date,
      ...logForm
    });

    if (result) {
      addToast('Wellness sync complete!', 'success');
      // Replace optimistic entry with real one
      setWellnessHistory(prev => prev.map(w => w.id === optimisticEntry.id ? result : w));
    } else {
      addToast('Failed to sync wellness. Please try again.', 'error');
      setWellnessHistory(previousHistory);
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return '😄';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    if (score >= 2) return '😕';
    return '😔';
  };

  const getScoreColor = (score: number, inverse = false) => {
    const effectiveScore = inverse ? 11 - score : score;
    if (effectiveScore >= 8) return 'text-green-600 dark:text-green-400';
    if (effectiveScore >= 6) return 'text-blue-600 dark:text-blue-400';
    if (effectiveScore >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading && wellnessHistory.length === 0) {
    return (
      <div className="p-8 space-y-10">
        <div className="flex justify-between">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
            <div className="h-5 w-48 bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded-lg"></div>
          </div>
          <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
        </div>
        <CardSkeleton className="h-48 rounded-[2.5rem]" />
        <StatsSkeleton cols={4} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading1 className="text-3xl tracking-tight">{activeTab}</Heading1>
          <Text className="text-sm font-medium">Track your daily wellness and see trends</Text>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
            {(['overview', 'history', 'insights'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${view === v
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={() => setShowLogModal(true)}>
            <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
            Log Today
          </Button>
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Today's Summary */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
            <div className="flex items-center justify-between mb-4">
              <Heading2 className="text-xl tracking-tight">Today's Wellness</Heading2>
              {todayData ? (
                <span className="text-4xl">{getMoodEmoji(todayData.mood_score)}</span>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowLogModal(true)}>Log Now</Button>
              )}
            </div>

            {todayData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mood</p>
                  <p className={`text-2xl font-bold ${getScoreColor(todayData.mood_score)}`}>{todayData.mood_score}/10</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Energy</p>
                  <p className={`text-2xl font-bold ${getScoreColor(todayData.energy_level)}`}>{todayData.energy_level}/10</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stress</p>
                  <p className={`text-2xl font-bold ${getScoreColor(todayData.stress_level, true)}`}>{todayData.stress_level}/10</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sleep</p>
                  <p className={`text-2xl font-bold ${getScoreColor(todayData.sleep_hours >= 7 ? 8 : todayData.sleep_hours)}`}>{todayData.sleep_hours}h</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="HeartIcon" className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">You haven't logged your wellness today</p>
              </div>
            )}
          </Card>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl"
            >
              <Icon name="FireIcon" className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-80 mb-1">Steps Today</p>
              <p className="text-3xl font-black">{todayData?.steps.toLocaleString() || '—'}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-2xl"
            >
              <Icon name="BeakerIcon" className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-80 mb-1">Water Intake</p>
              <p className="text-3xl font-black">{todayData?.water_intake || '—'} <span className="text-lg">glasses</span></p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-2xl"
            >
              <Icon name="BoltIcon" className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-80 mb-1">Exercise</p>
              <p className="text-3xl font-black">{todayData?.exercise_minutes || '—'} <span className="text-lg">min</span></p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-2xl"
            >
              <Icon name="SparklesIcon" className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-80 mb-1">Meditation</p>
              <p className="text-3xl font-black">{todayData?.meditation_minutes || '—'} <span className="text-lg">min</span></p>
            </motion.div>
          </div>

          {/* Weekly Averages */}
          {averages && (
            <Card className="p-6">
              <Heading2 className="text-xl tracking-tight mb-4">30-Day Averages</Heading2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Mood</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{averages.mood}/10</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Sleep</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{averages.sleep}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Steps</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{averages.steps.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Exercise</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{averages.exercise} min</p>
                </div>
              </div>
            </Card>
          )}

          {/* Premium Wellness Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Health Coach */}
            {!hasAIHealthCoach && (
              <PremiumBanner
                featureKey="aiHealthCoach"
              />
            )}
            {hasAIHealthCoach && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Icon name="SparklesIcon" className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Your Health Coach</h3>
                    <span className="text-xs text-green-600 font-semibold">Active</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  "Great work on {todayData?.steps || 0} steps today! Try adding a 10-minute walk after lunch to hit your 10K goal."
                </p>
                <PremiumButton
                  featureKey="aiHealthCoach"
                  disabled
                  title="Health Coach integration requires AI service"
                  className="w-full"
                  variant="primary"
                  size="sm"
                >
                  <Icon name="ChatBubbleLeftRightIcon" className="w-4 h-4 mr-2" />
                  Chat with Coach
                </PremiumButton>
              </Card>
            )}

            {/* Advanced Health Analytics */}
            {!hasAdvancedAnalytics && (
              <PremiumBanner
                featureKey="advancedHealthAnalytics"
              />
            )}
            {hasAdvancedAnalytics && (
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Icon name="ChartBarIcon" className="w-5 h-5 text-blue-500" />
                  Health Trends
                  <span className="text-xs text-blue-600 font-semibold ml-2">Premium</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sleep Quality</span>
                    <span className="text-lg font-bold text-green-600">+15% ↑</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Activity Level</span>
                    <span className="text-lg font-bold text-blue-600">+8% ↑</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stress Management</span>
                    <span className="text-lg font-bold text-purple-600">+12% ↑</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Full Report
                  </Button>
                </div>
              </Card>
            )}

            {/* AI Meal Plan Generator */}
            {!hasMealPlanGenerator && (
              <PremiumBanner
                featureKey="mealPlanGenerator"
              />
            )}
            {hasMealPlanGenerator && (
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Icon name="CakeIcon" className="w-5 h-5 text-orange-500" />
                  This Week's Meal Plan
                  <span className="text-xs text-purple-600 font-semibold ml-2">Premium</span>
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Personalized for: <strong>2000 cal/day</strong>
                  </p>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Today's Suggestion</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      🥗 Mediterranean Quinoa Bowl
                    </p>
                  </div>
                  <PremiumButton
                    featureKey="mealPlanGenerator"
                    disabled
                    title="Meal plan generation requires AI service configuration"
                    className="w-full mt-2"
                    variant="primary"
                    size="sm"
                  >
                    <Icon name="SparklesIcon" className="w-4 h-4 mr-2" />
                    Generate New Plan
                  </PremiumButton>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          {wellnessHistory.length === 0 ? (
            <Card className="p-12 text-center">
              <Icon name="CalendarDaysIcon" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <Heading2 className="mb-2">No wellness data yet</Heading2>
              <Text className="mb-4">Start logging your daily wellness to see your history</Text>
              <Button variant="primary" onClick={() => setShowLogModal(true)}>Log Today</Button>
            </Card>
          ) : (
            wellnessHistory.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getMoodEmoji(entry.mood_score)}</div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h4>
                        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>😴 {entry.sleep_hours}h</span>
                          <span>👟 {entry.steps.toLocaleString()}</span>
                          <span>💧 {entry.water_intake}</span>
                          <span>🏃 {entry.exercise_minutes}min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getScoreColor(entry.mood_score)}`}>
                          Mood: {entry.mood_score}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className={`text-lg font-bold ${getScoreColor(entry.energy_level)}`}>
                          Energy: {entry.energy_level}
                        </span>
                      </div>
                      <span className={`text-sm ${getScoreColor(entry.stress_level, true)}`}>
                        Stress: {entry.stress_level}/10
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {view === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Heading2 className="text-xl tracking-tight mb-4">💡 Wellness Tips</Heading2>
            <div className="space-y-3">
              {averages && Number(averages.sleep) < 7 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Sleep more:</strong> Your average sleep of {averages.sleep}h is below the recommended 7-8 hours.
                  </p>
                </div>
              )}
              {averages && averages.steps < 8000 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Move more:</strong> Try to reach 8,000+ steps daily for better health.
                  </p>
                </div>
              )}
              {averages && Number(averages.stress) > 5 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    <strong>Manage stress:</strong> Consider adding more meditation or relaxation time.
                  </p>
                </div>
              )}
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Stay hydrated:</strong> Aim for 8 glasses of water daily.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Heading2 className="text-xl tracking-tight mb-4">🎯 Goals Progress</Heading2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Daily Steps Goal (10,000)</span>
                  <span className="text-sm font-medium">{Math.min(100, Math.round(((todayData?.steps || 0) / 10000) * 100))}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((todayData?.steps || 0) / 10000) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Water Intake (8 glasses)</span>
                  <span className="text-sm font-medium">{Math.min(100, Math.round(((todayData?.water_intake || 0) / 8) * 100))}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((todayData?.water_intake || 0) / 8) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Exercise (30 min)</span>
                  <span className="text-sm font-medium">{Math.min(100, Math.round(((todayData?.exercise_minutes || 0) / 30) * 100))}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((todayData?.exercise_minutes || 0) / 30) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <Heading2 className="text-xl italic">Log Today's Wellness</Heading2>
              <button onClick={() => setShowLogModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <Icon name="XMarkIcon" className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How are you feeling? {getMoodEmoji(logForm.mood_score)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logForm.mood_score}
                  onChange={(e) => setLogForm(f => ({ ...f, mood_score: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>😔 Poor</span>
                  <span className="font-bold">{logForm.mood_score}/10</span>
                  <span>😄 Great</span>
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Energy Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logForm.energy_level}
                  onChange={(e) => setLogForm(f => ({ ...f, energy_level: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Low</span>
                  <span className="font-bold">{logForm.energy_level}/10</span>
                  <span>High</span>
                </div>
              </div>

              {/* Stress Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stress Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logForm.stress_level}
                  onChange={(e) => setLogForm(f => ({ ...f, stress_level: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Low</span>
                  <span className="font-bold">{logForm.stress_level}/10</span>
                  <span>High</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Sleep */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sleep (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={logForm.sleep_hours}
                    onChange={(e) => setLogForm(f => ({ ...f, sleep_hours: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Water */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Water (glasses)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={logForm.water_intake}
                    onChange={(e) => setLogForm(f => ({ ...f, water_intake: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Steps */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Steps
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={logForm.steps}
                    onChange={(e) => setLogForm(f => ({ ...f, steps: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Exercise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exercise (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={logForm.exercise_minutes}
                    onChange={(e) => setLogForm(f => ({ ...f, exercise_minutes: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Meditation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meditation (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={logForm.meditation_minutes}
                  onChange={(e) => setLogForm(f => ({ ...f, meditation_minutes: Number(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowLogModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleLogSubmit}>
                <Icon name="CheckIcon" className="w-4 h-4 mr-2" />
                Save Entry
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IndividualWellness;
