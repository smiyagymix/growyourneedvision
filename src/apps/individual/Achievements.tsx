import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Star, Award, Sparkles, TrendingUp, 
  Clock, Target, BookOpen, Code, Users, Zap, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { individualService, Achievement } from '../../services/individualService';
import { cn } from '../../lib/utils';

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

const CATEGORIES: { value: Achievement['category']; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'learning', label: 'Learning', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  { value: 'projects', label: 'Projects', icon: Code, color: 'from-purple-500 to-pink-500' },
  { value: 'goals', label: 'Goals', icon: Target, color: 'from-green-500 to-emerald-500' },
  { value: 'social', label: 'Social', icon: Users, color: 'from-orange-500 to-amber-500' },
  { value: 'streak', label: 'Streaks', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { value: 'wellness', label: 'Wellness', icon: Crown, color: 'from-indigo-500 to-purple-500' },
];

const RARITY_STYLES: Record<Achievement['rarity'], { label: string; bg: string; border: string; glow: string }> = {
  common: { label: 'Common', bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-300 dark:border-gray-600', glow: '' },
  rare: { label: 'Rare', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-400', glow: 'shadow-blue-500/20' },
  epic: { label: 'Epic', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { label: 'Legendary', bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-400', glow: 'shadow-amber-500/40 shadow-lg' },
};

const Achievements: React.FC<Props> = ({ activeTab, activeSubNav }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | null>(null);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, [user?.id, selectedCategory]);

  const loadAchievements = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await individualService.getAchievements(user.id, selectedCategory || undefined);
    setAchievements(data);
    const xp = await individualService.getTotalXP(user.id);
    setTotalXP(xp);
    setLoading(false);
  };

  const calculateLevel = (xp: number) => {
    const baseXP = 100;
    const level = Math.floor(Math.sqrt(xp / baseXP)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * baseXP;
    const nextLevelXP = Math.pow(level, 2) * baseXP;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return { level, progress, xpToNext: nextLevelXP - xp };
  };

  const { level, progress, xpToNext } = calculateLevel(totalXP);

  const stats = {
    total: achievements.length,
    legendary: achievements.filter(a => a.rarity === 'legendary').length,
    epic: achievements.filter(a => a.rarity === 'epic').length,
    rare: achievements.filter(a => a.rarity === 'rare').length,
    common: achievements.filter(a => a.rarity === 'common').length,
  };

  const getCategoryStats = () => {
    return CATEGORIES.map(cat => ({
      ...cat,
      count: achievements.filter(a => a.category === cat.value).length,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Achievements & Badges
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your accomplishments and earn rewards
          </p>
        </div>

        {/* Level Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white/30">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{level}</div>
                    <div className="text-xs opacity-80">LEVEL</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Level {level} Explorer</h2>
                  <p className="text-white/80">{totalXP.toLocaleString()} Total XP</p>
                  <p className="text-sm text-white/60">{xpToNext.toLocaleString()} XP to next level</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-white/80">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">{stats.legendary}</div>
                  <div className="text-sm text-white/80">Legendary</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-300">{stats.epic}</div>
                  <div className="text-sm text-white/80">Epic</div>
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to Level {level + 1}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {getCategoryStats().map(cat => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.value}
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  selectedCategory === cat.value 
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", cat.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{cat.count}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{cat.label}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              !selectedCategory ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
          >
            All Badges
          </button>
          {Object.entries(RARITY_STYLES).map(([rarity, style]) => (
            <button
              key={rarity}
              onClick={() => {/* Could add rarity filter */}}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border",
                style.border,
                "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              {style.label} ({stats[rarity as keyof typeof stats] || 0})
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading achievements...</div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No achievements yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Complete tasks and reach milestones to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {achievements.map((achievement, idx) => {
              const rarityStyle = RARITY_STYLES[achievement.rarity];
              const categoryConfig = CATEGORIES.find(c => c.value === achievement.category);
              
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all hover:scale-105",
                    rarityStyle.bg,
                    rarityStyle.border,
                    rarityStyle.glow
                  )}
                >
                  <div className="text-center">
                    {/* Badge Icon */}
                    <div className="relative inline-block mb-4">
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center text-4xl",
                        achievement.rarity === 'legendary' && "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30",
                        achievement.rarity === 'epic' && "bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/30",
                        achievement.rarity === 'rare' && "bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/30",
                        achievement.rarity === 'common' && "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"
                      )}>
                        {achievement.badge_icon}
                      </div>
                      {achievement.rarity === 'legendary' && (
                        <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Badge Info */}
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{achievement.badge_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.badge_description}</p>
                    
                    {/* Rarity & XP */}
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded-full font-medium",
                        achievement.rarity === 'legendary' && "bg-amber-200 text-amber-800",
                        achievement.rarity === 'epic' && "bg-purple-200 text-purple-800",
                        achievement.rarity === 'rare' && "bg-blue-200 text-blue-800",
                        achievement.rarity === 'common' && "bg-gray-200 text-gray-700"
                      )}>
                        {rarityStyle.label}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                        <Star className="w-4 h-4" />
                        +{achievement.xp_reward} XP
                      </span>
                    </div>
                    
                    {/* Category & Date */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span className={cn(
                        "px-2 py-1 rounded-full bg-gradient-to-r text-white",
                        categoryConfig?.color || 'from-gray-400 to-gray-500'
                      )}>
                        {categoryConfig?.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(achievement.earned_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Upcoming Achievements Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            Upcoming Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'First Steps', desc: 'Complete your first project', progress: 60, icon: '🚀' },
              { name: 'Knowledge Seeker', desc: 'Finish 10 courses', progress: 30, icon: '📚' },
              { name: 'Goal Crusher', desc: 'Complete 25 goals', progress: 80, icon: '🎯' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl opacity-50">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="text-right text-sm text-gray-500 mt-1">{item.progress}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Achievements;
