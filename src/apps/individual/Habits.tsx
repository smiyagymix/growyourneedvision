import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Plus, Check, X, Trash2, Edit3, Save, 
  Calendar, TrendingUp, Target, RotateCcw, Clock,
  Dumbbell, BookOpen, Droplets, Moon, Heart, Coffee, 
  Smile, Zap, Star, Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { individualService, Habit, HabitLog } from '../../services/individualService';
import { cn } from '../../lib/utils';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

// Habit validation schema
const habitSchema = z.object({
    name: z.string().min(2, 'Habit name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
    frequency: z.enum(['daily', 'weekly']),
    custom_days: z.array(z.number().min(0).max(6)),
    target_count: z.number().min(1).max(100),
    category: z.enum(['health', 'fitness', 'learning', 'productivity', 'mindfulness', 'other']),
    icon: z.string(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
});

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const HABIT_ICONS = [
  { id: 'exercise', label: 'Exercise', Icon: Dumbbell },
  { id: 'reading', label: 'Reading', Icon: BookOpen },
  { id: 'water', label: 'Water', Icon: Droplets },
  { id: 'sleep', label: 'Sleep', Icon: Moon },
  { id: 'meditation', label: 'Meditation', Icon: Smile },
  { id: 'journal', label: 'Journal', Icon: Edit3 },
  { id: 'coding', label: 'Coding', Icon: Zap },
  { id: 'healthy', label: 'Healthy Eating', Icon: Heart },
  { id: 'gratitude', label: 'Gratitude', Icon: Star },
  { id: 'learning', label: 'Learning', Icon: Award },
  { id: 'social', label: 'Social', Icon: Coffee },
  { id: 'creative', label: 'Creative', Icon: Flame },
];

const CATEGORIES: { value: Habit['category']; label: string; color: string }[] = [
  { value: 'health', label: 'Health', color: 'bg-green-500' },
  { value: 'fitness', label: 'Fitness', color: 'bg-orange-500' },
  { value: 'learning', label: 'Learning', color: 'bg-blue-500' },
  { value: 'productivity', label: 'Productivity', color: 'bg-purple-500' },
  { value: 'mindfulness', label: 'Mindfulness', color: 'bg-teal-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const FREQUENCIES: { value: Habit['frequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Habits: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitForm, setHabitForm] = useState({
    name: '', description: '', frequency: 'daily' as Habit['frequency'],
    custom_days: [] as number[], target_count: 1,
    category: 'health' as Habit['category'], icon: 'exercise', color: '#22c55e',
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [habitsData, logsData] = await Promise.all([
      individualService.getHabits(user.id),
      individualService.getHabitLogs(user.id, undefined, 30),
    ]);
    setHabits(habitsData);
    setHabitLogs(logsData);
    setLoading(false);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: WEEKDAYS[date.getDay()],
        dayNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  const isHabitCompletedOnDate = (habitId: string, dateStr: string) => {
    const log = habitLogs.find(l => l.habit_id === habitId && l.date === dateStr);
    return log?.completed || false;
  };

  const handleLogHabit = async (habitId: string) => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const existingLog = habitLogs.find(l => l.habit_id === habitId && l.date === today);
    const habit = habits.find(h => h.id === habitId);
    
    const log = await individualService.logHabit(habitId, user.id);
    
    if (log) {
      setHabitLogs(prev => {
        const filtered = prev.filter(l => !(l.habit_id === habitId && l.date === today));
        return [...filtered, log];
      });
      // Update habit streak
      if (habit && log.completed) {
        setHabits(prev => prev.map(h => 
          h.id === habitId 
            ? { ...h, current_streak: h.current_streak + 1, best_streak: Math.max(h.best_streak, h.current_streak + 1) }
            : h
        ));
      }
    }
  };

  const handleCreateHabit = async () => {
    const { showToast } = useToast();
    if (!user?.id || !habitForm.name.trim()) return;

    // Sanitize inputs
    const sanitizedForm = {
      ...habitForm,
      name: sanitizeText(habitForm.name),
      description: habitForm.description ? sanitizeHtml(habitForm.description, 'BASIC') : ''
    };

    // Validate with Zod
    const validationResult = habitSchema.safeParse(sanitizedForm);
    if (!validationResult.success) {
      showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
      return;
    }

    const habit = await individualService.createHabit(user.id, sanitizedForm);
    if (habit) {
      setHabits(prev => [...prev, habit]);
      showToast('Habit created successfully!', 'success');
      closeModal();
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Delete this habit?')) return;
    const success = await individualService.deleteHabit(habitId);
    if (success) {
      setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  const openNewHabitModal = () => {
    setHabitForm({ name: '', description: '', frequency: 'daily', custom_days: [], target_count: 1, category: 'health', icon: 'exercise', color: '#22c55e' });
    setEditingHabit(null);
    setShowNewHabit(true);
  };

  const closeModal = () => {
    setShowNewHabit(false);
    setEditingHabit(null);
    setHabitForm({ name: '', description: '', frequency: 'daily', custom_days: [], target_count: 1, category: 'health', icon: 'exercise', color: '#22c55e' });
  };

  const toggleCustomDay = (dayIndex: number) => {
    setHabitForm(prev => ({
      ...prev,
      custom_days: prev.custom_days.includes(dayIndex)
        ? prev.custom_days.filter(d => d !== dayIndex)
        : [...prev.custom_days, dayIndex].sort()
    }));
  };

  const last7Days = getLast7Days();
  const today = new Date().toISOString().split('T')[0];

  const getCompletionRate = (habitId: string) => {
    const habitLogsForHabit = habitLogs.filter(l => l.habit_id === habitId);
    const completed = habitLogsForHabit.filter(l => l.completed).length;
    return habitLogsForHabit.length > 0 ? Math.round((completed / habitLogsForHabit.length) * 100) : 0;
  };

  const getTodayStats = () => {
    const todayLogs = habitLogs.filter(l => l.date === today);
    const completed = todayLogs.filter(l => l.completed).length;
    return { completed, total: habits.length, percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0 };
  };

  const todayStats = getTodayStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              Habit Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Build better habits, one day at a time
            </p>
          </div>
          <button
            onClick={openNewHabitModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Habit
          </button>
        </div>

        {/* Today's Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Today's Progress</h2>
              <p className="text-white/80">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold">{todayStats.completed}/{todayStats.total}</div>
                <div className="text-sm text-white/80">Completed</div>
              </div>
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="40" fill="none" stroke="white" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${todayStats.percentage * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{todayStats.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Habits List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <Flame className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No habits yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Start building better habits today!</p>
            <button
              onClick={openNewHabitModal}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit, idx) => {
              const categoryConfig = CATEGORIES.find(c => c.value === habit.category);
              const iconConfig = HABIT_ICONS.find(i => i.id === habit.icon) || HABIT_ICONS[0];
              const IconComponent = iconConfig.Icon;
              const todayCompleted = isHabitCompletedOnDate(habit.id, today);
              const completionRate = getCompletionRate(habit.id);
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Habit Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleLogHabit(habit.id)}
                        className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all",
                          todayCompleted 
                            ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110" 
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                      >
                        {todayCompleted ? <Check className="w-7 h-7" /> : <IconComponent className="w-7 h-7" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
                          <span className={cn("px-2 py-0.5 text-xs rounded-full text-white", categoryConfig?.color)}>
                            {categoryConfig?.label}
                          </span>
                        </div>
                        {habit.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{habit.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {habit.current_streak} day streak
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            Best: {habit.best_streak} days
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {completionRate}% completion
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Week Progress */}
                    <div className="flex items-center gap-2">
                      {last7Days.map(day => {
                        const completed = isHabitCompletedOnDate(habit.id, day.date);
                        return (
                          <div key={day.date} className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">{day.dayName}</div>
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                day.isToday && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800",
                                completed 
                                  ? "bg-green-500 text-white" 
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              )}
                            >
                              {completed ? <Check className="w-4 h-4" /> : day.dayNum}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.max(...habits.map(h => h.current_streak))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Longest Active Streak</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h.id), 0) / habits.length)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Completion</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {habitLogs.filter(l => l.completed).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Completions</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* New Habit Modal */}
        <AnimatePresence>
          {showNewHabit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Habit</h2>
                  <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Habit Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Habit Name</label>
                    <input
                      type="text"
                      value={habitForm.name}
                      onChange={(e) => setHabitForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="e.g., Morning Exercise"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                    <textarea
                      value={habitForm.description}
                      onChange={(e) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                      placeholder="Add a short description..."
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {HABIT_ICONS.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setHabitForm(prev => ({ ...prev, icon: item.id }))}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                            habitForm.icon === item.id 
                              ? "bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500 text-indigo-600 dark:text-indigo-400" 
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
                          )}
                        >
                          <item.Icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setHabitForm(prev => ({ ...prev, category: cat.value }))}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            habitForm.category === cat.value 
                              ? "bg-indigo-600 text-white" 
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                    <div className="flex gap-2">
                      {FREQUENCIES.map(freq => (
                        <button
                          key={freq.value}
                          onClick={() => setHabitForm(prev => ({ ...prev, frequency: freq.value }))}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            habitForm.frequency === freq.value 
                              ? "bg-indigo-600 text-white" 
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          )}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                    <div className="flex gap-2">
                      {['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6b7280'].map(color => (
                        <button
                          key={color}
                          onClick={() => setHabitForm(prev => ({ ...prev, color }))}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            habitForm.color === color ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                  <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateHabit}
                    disabled={!habitForm.name.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Create Habit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Habits;
