import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'Learning' | 'Social' | 'Activity' | 'Milestone';
    xp_reward: number;
    requirement_type: 'count' | 'score' | 'streak';
    requirement_value: number;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    created: string;
}

export interface UserAchievement {
    id: string;
    user: string;
    achievement: string;
    unlocked_at: string;
    progress: number;
    completed: boolean;
    created: string;
    expand?: {
        achievement?: Achievement;
    };
}

export interface LeaderboardEntry {
    id: string;
    user: string;
    total_xp: number;
    level: number;
    achievements_count: number;
    rank: number;
    username: string;
    avatar_url?: string;
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    cost_xp: number;
    category: 'Avatar' | 'Theme' | 'Badge' | 'Power-Up';
    icon: string;
    available: boolean;
    created: string;
}

export interface UserReward {
    id: string;
    user: string;
    reward: string;
    purchased_at: string;
    equipped: boolean;
    expand?: {
        reward?: Reward;
    };
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'special';
    xp_reward: number;
    requirement_type: string;
    requirement_value: number;
    status: 'Active' | 'Completed' | 'Expired';
    target_user: string;
    created: string;
    expires_at?: string;
}

export interface UserProgress {
    id: string;
    user: string;
    current_xp: number;
    level: number;
    total_xp_earned: number;
    achievements_unlocked: number;
    streak_days: number;
    last_activity?: string;
}

export interface GamificationStats {
    totalUsers: number;
    totalXPAwarded: number;
    achievementsUnlocked: number;
    rewardsPurchased: number;
    activeChallenges: number;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'ach-1',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        category: 'Learning',
        xp_reward: 50,
        requirement_type: 'count',
        requirement_value: 1,
        rarity: 'Common',
        created: new Date().toISOString()
    },
    {
        id: 'ach-2',
        name: 'Knowledge Seeker',
        description: 'Complete 10 lessons',
        icon: '📚',
        category: 'Learning',
        xp_reward: 200,
        requirement_type: 'count',
        requirement_value: 10,
        rarity: 'Rare',
        created: new Date().toISOString()
    },
    {
        id: 'ach-3',
        name: 'Social Butterfly',
        description: 'Join 5 study groups',
        icon: '🦋',
        category: 'Social',
        xp_reward: 150,
        requirement_type: 'count',
        requirement_value: 5,
        rarity: 'Rare',
        created: new Date().toISOString()
    },
    {
        id: 'ach-4',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'Milestone',
        xp_reward: 300,
        requirement_type: 'streak',
        requirement_value: 7,
        rarity: 'Epic',
        created: new Date().toISOString()
    },
    {
        id: 'ach-5',
        name: 'Master Learner',
        description: 'Reach Level 10',
        icon: '👑',
        category: 'Milestone',
        xp_reward: 1000,
        requirement_type: 'score',
        requirement_value: 10,
        rarity: 'Legendary',
        created: new Date().toISOString()
    }
];

const MOCK_USER_ACHIEVEMENTS: UserAchievement[] = [
    {
        id: 'ua-1',
        user: 'user-1',
        achievement: 'ach-1',
        unlocked_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 100,
        completed: true,
        created: new Date().toISOString(),
        expand: { achievement: MOCK_ACHIEVEMENTS[0] }
    },
    {
        id: 'ua-2',
        user: 'user-1',
        achievement: 'ach-2',
        unlocked_at: '',
        progress: 60,
        completed: false,
        created: new Date().toISOString(),
        expand: { achievement: MOCK_ACHIEVEMENTS[1] }
    }
];

const MOCK_REWARDS: Reward[] = [
    {
        id: 'reward-1',
        name: 'Golden Avatar Frame',
        description: 'A shiny golden frame for your profile',
        cost_xp: 500,
        category: 'Avatar',
        icon: '🖼️',
        available: true,
        created: new Date().toISOString()
    },
    {
        id: 'reward-2',
        name: 'Dark Theme',
        description: 'Unlock the exclusive dark theme',
        cost_xp: 300,
        category: 'Theme',
        icon: '🌙',
        available: true,
        created: new Date().toISOString()
    },
    {
        id: 'reward-3',
        name: 'XP Booster',
        description: 'Double XP for 24 hours',
        cost_xp: 200,
        category: 'Power-Up',
        icon: '⚡',
        available: true,
        created: new Date().toISOString()
    }
];

const MOCK_USER_REWARDS: UserReward[] = [
    {
        id: 'ur-1',
        user: 'user-1',
        reward: 'reward-2',
        purchased_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        equipped: true,
        expand: { reward: MOCK_REWARDS[1] }
    }
];

const MOCK_CHALLENGES: Challenge[] = [
    {
        id: 'challenge-1',
        title: 'Daily Learner',
        description: 'Complete 3 lessons today',
        type: 'daily',
        xp_reward: 100,
        requirement_type: 'lessons',
        requirement_value: 3,
        status: 'Active',
        target_user: '',
        created: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'challenge-2',
        title: 'Weekly Champion',
        description: 'Earn 1000 XP this week',
        type: 'weekly',
        xp_reward: 500,
        requirement_type: 'xp',
        requirement_value: 1000,
        status: 'Active',
        target_user: '',
        created: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_USER_PROGRESS: UserProgress[] = [
    {
        id: 'progress-1',
        user: 'user-1',
        current_xp: 750,
        level: 5,
        total_xp_earned: 2500,
        achievements_unlocked: 3,
        streak_days: 4,
        last_activity: new Date().toISOString()
    },
    {
        id: 'progress-2',
        user: 'user-2',
        current_xp: 1200,
        level: 7,
        total_xp_earned: 4500,
        achievements_unlocked: 5,
        streak_days: 12,
        last_activity: new Date().toISOString()
    },
    {
        id: 'progress-3',
        user: 'user-3',
        current_xp: 350,
        level: 3,
        total_xp_earned: 1200,
        achievements_unlocked: 2,
        streak_days: 1,
        last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
];

export const gamificationService = {
    // Achievements
    getAllAchievements: async (): Promise<Achievement[]> => {
        if (isMockEnv()) {
            return MOCK_ACHIEVEMENTS;
        }

        return await pb.collection('gamification_achievements').getFullList<Achievement>({
            sort: '-xp_reward'
        });
    },

    getAchievement: async (id: string): Promise<Achievement | null> => {
        if (isMockEnv()) {
            return MOCK_ACHIEVEMENTS.find(a => a.id === id) || null;
        }

        try {
            return await pb.collection('gamification_achievements').getOne<Achievement>(id);
        } catch {
            return null;
        }
    },

    createAchievement: async (data: Partial<Achievement>) => {
        if (isMockEnv()) {
            const newAch: Achievement = {
                id: `ach-${Date.now()}`,
                name: data.name || '',
                description: data.description || '',
                icon: data.icon || '🎯',
                category: data.category || 'Learning',
                xp_reward: data.xp_reward || 0,
                requirement_type: data.requirement_type || 'count',
                requirement_value: data.requirement_value || 1,
                rarity: data.rarity || 'Common',
                created: new Date().toISOString()
            };
            MOCK_ACHIEVEMENTS.push(newAch);
            return newAch;
        }

        return await pb.collection('gamification_achievements').create(data);
    },

    updateAchievement: async (id: string, data: Partial<Achievement>) => {
        if (isMockEnv()) {
            const ach = MOCK_ACHIEVEMENTS.find(a => a.id === id);
            if (ach) {
                Object.assign(ach, data);
            }
            return ach;
        }

        return await pb.collection('gamification_achievements').update(id, data);
    },

    deleteAchievement: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_ACHIEVEMENTS.findIndex(a => a.id === id);
            if (index !== -1) {
                MOCK_ACHIEVEMENTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('gamification_achievements').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    getUserAchievements: async (userId: string): Promise<UserAchievement[]> => {
        if (isMockEnv()) {
            return MOCK_USER_ACHIEVEMENTS.filter(ua => ua.user === userId);
        }

        return await pb.collection('user_achievements').getFullList<UserAchievement>({
            filter: `user = "${userId}"`,
            expand: 'achievement',
            sort: '-unlocked_at'
        });
    },

    unlockAchievement: async (userId: string, achievementId: string) => {
        if (isMockEnv()) {
            const achievement = MOCK_ACHIEVEMENTS.find(a => a.id === achievementId);
            const newUA: UserAchievement = {
                id: `ua-${Date.now()}`,
                user: userId,
                achievement: achievementId,
                completed: true,
                progress: 100,
                unlocked_at: new Date().toISOString(),
                created: new Date().toISOString(),
                expand: { achievement }
            };
            MOCK_USER_ACHIEVEMENTS.push(newUA);
            return newUA;
        }

        return await pb.collection('user_achievements').create({
            user: userId,
            achievement: achievementId,
            completed: true,
            progress: 100,
            unlocked_at: new Date().toISOString()
        });
    },

    updateAchievementProgress: async (userAchievementId: string, progress: number) => {
        if (isMockEnv()) {
            const ua = MOCK_USER_ACHIEVEMENTS.find(u => u.id === userAchievementId);
            if (ua) {
                ua.progress = progress;
                if (progress >= 100) {
                    ua.completed = true;
                    ua.unlocked_at = new Date().toISOString();
                }
            }
            return ua;
        }

        return await pb.collection('user_achievements').update(userAchievementId, {
            progress
        });
    },

    // Leaderboard
    getGlobalLeaderboard: async (limit: number = 100): Promise<LeaderboardEntry[]> => {
        if (isMockEnv()) {
            return MOCK_USER_PROGRESS
                .sort((a, b) => b.total_xp_earned - a.total_xp_earned)
                .slice(0, limit)
                .map((entry, index) => ({
                    id: entry.id,
                    user: entry.user,
                    total_xp: entry.total_xp_earned,
                    level: entry.level,
                    achievements_count: entry.achievements_unlocked,
                    rank: index + 1,
                    username: `User ${entry.user.split('-')[1]}`,
                    avatar_url: undefined
                }));
        }

        try {
            const users = await pb.collection('user_progress').getFullList({
                sort: '-current_xp',
                limit,
                expand: 'user'
            });

            return users.map((entry: any, index: number) => ({
                id: entry.id,
                user: entry.user,
                total_xp: entry.current_xp || 0,
                level: entry.level || 1,
                achievements_count: entry.achievements_unlocked || 0,
                rank: index + 1,
                username: entry.expand?.user?.name || 'Unknown',
                avatar_url: entry.expand?.user?.avatar
            }));
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            return [];
        }
    },

    getTenantLeaderboard: async (tenantId: string, limit: number = 50): Promise<LeaderboardEntry[]> => {
        if (isMockEnv()) {
            return gamificationService.getGlobalLeaderboard(limit);
        }

        try {
            const users = await pb.collection('user_progress').getFullList({
                sort: '-current_xp',
                filter: `tenantId = "${tenantId}"`,
                limit,
                expand: 'user'
            });

            return users.map((entry: any, index: number) => ({
                id: entry.id,
                user: entry.user,
                total_xp: entry.current_xp || 0,
                level: entry.level || 1,
                achievements_count: entry.achievements_unlocked || 0,
                rank: index + 1,
                username: entry.expand?.user?.name || 'Unknown',
                avatar_url: entry.expand?.user?.avatar
            }));
        } catch (error) {
            console.error('Failed to load tenant leaderboard:', error);
            return [];
        }
    },

    getUserRank: async (userId: string): Promise<number | null> => {
        if (isMockEnv()) {
            const sorted = MOCK_USER_PROGRESS.sort((a, b) => b.total_xp_earned - a.total_xp_earned);
            const index = sorted.findIndex(p => p.user === userId);
            return index >= 0 ? index + 1 : null;
        }

        try {
            const allUsers = await pb.collection('user_progress').getFullList({
                sort: '-current_xp'
            });

            const userIndex = allUsers.findIndex((u: any) => u.user === userId);
            return userIndex >= 0 ? userIndex + 1 : null;
        } catch (error) {
            console.error('Failed to get user rank:', error);
            return null;
        }
    },

    // User Progress
    getUserProgress: async (userId: string): Promise<UserProgress | null> => {
        if (isMockEnv()) {
            return MOCK_USER_PROGRESS.find(p => p.user === userId) || null;
        }

        try {
            return await pb.collection('user_progress').getFirstListItem<UserProgress>(
                `user = "${userId}"`
            );
        } catch {
            return null;
        }
    },

    createUserProgress: async (userId: string): Promise<UserProgress> => {
        if (isMockEnv()) {
            const newProgress: UserProgress = {
                id: `progress-${Date.now()}`,
                user: userId,
                current_xp: 0,
                level: 1,
                total_xp_earned: 0,
                achievements_unlocked: 0,
                streak_days: 0,
                last_activity: new Date().toISOString()
            };
            MOCK_USER_PROGRESS.push(newProgress);
            return newProgress;
        }

        return await pb.collection('user_progress').create({
            user: userId,
            current_xp: 0,
            level: 1,
            total_xp_earned: 0,
            achievements_unlocked: 0,
            streak_days: 0,
            last_activity: new Date().toISOString()
        });
    },

    addXP: async (userId: string, amount: number, reason?: string): Promise<UserProgress | null> => {
        let progress = await gamificationService.getUserProgress(userId);

        if (!progress) {
            progress = await gamificationService.createUserProgress(userId);
        }

        const newXP = progress.current_xp + amount;
        const newTotalXP = progress.total_xp_earned + amount;
        const newLevel = Math.floor(newTotalXP / 500) + 1; // Level up every 500 XP

        if (isMockEnv()) {
            progress.current_xp = newXP;
            progress.total_xp_earned = newTotalXP;
            progress.level = newLevel;
            progress.last_activity = new Date().toISOString();
            return progress;
        }

        try {
            return await pb.collection('user_progress').update<UserProgress>(progress.id, {
                current_xp: newXP,
                total_xp_earned: newTotalXP,
                level: newLevel,
                last_activity: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to add XP:', error, reason);
            return null;
        }
    },

    updateStreak: async (userId: string): Promise<number> => {
        let progress = await gamificationService.getUserProgress(userId);

        if (!progress) {
            progress = await gamificationService.createUserProgress(userId);
        }

        const lastActivity = progress.last_activity ? new Date(progress.last_activity) : null;
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        let newStreak = progress.streak_days;

        if (!lastActivity) {
            newStreak = 1;
        } else if (lastActivity.toDateString() === yesterday.toDateString()) {
            newStreak = progress.streak_days + 1;
        } else if (lastActivity.toDateString() !== today.toDateString()) {
            newStreak = 1; // Reset streak
        }

        if (isMockEnv()) {
            progress.streak_days = newStreak;
            progress.last_activity = today.toISOString();
            return newStreak;
        }

        await pb.collection('user_progress').update(progress.id, {
            streak_days: newStreak,
            last_activity: today.toISOString()
        });

        return newStreak;
    },

    // Rewards Store
    getAllRewards: async (): Promise<Reward[]> => {
        if (isMockEnv()) {
            return MOCK_REWARDS.filter(r => r.available);
        }

        return await pb.collection('gamification_rewards').getFullList<Reward>({
            filter: 'available = true',
            sort: 'cost_xp'
        });
    },

    getReward: async (id: string): Promise<Reward | null> => {
        if (isMockEnv()) {
            return MOCK_REWARDS.find(r => r.id === id) || null;
        }

        try {
            return await pb.collection('gamification_rewards').getOne<Reward>(id);
        } catch {
            return null;
        }
    },

    createReward: async (data: Partial<Reward>) => {
        if (isMockEnv()) {
            const newReward: Reward = {
                id: `reward-${Date.now()}`,
                name: data.name || '',
                description: data.description || '',
                cost_xp: data.cost_xp || 0,
                category: data.category || 'Badge',
                icon: data.icon || '🎁',
                available: data.available !== false,
                created: new Date().toISOString()
            };
            MOCK_REWARDS.push(newReward);
            return newReward;
        }

        return await pb.collection('gamification_rewards').create(data);
    },

    updateReward: async (id: string, data: Partial<Reward>) => {
        if (isMockEnv()) {
            const reward = MOCK_REWARDS.find(r => r.id === id);
            if (reward) {
                Object.assign(reward, data);
            }
            return reward;
        }

        return await pb.collection('gamification_rewards').update(id, data);
    },

    deleteReward: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_REWARDS.findIndex(r => r.id === id);
            if (index !== -1) {
                MOCK_REWARDS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('gamification_rewards').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    getUserRewards: async (userId: string): Promise<UserReward[]> => {
        if (isMockEnv()) {
            return MOCK_USER_REWARDS.filter(ur => ur.user === userId);
        }

        return await pb.collection('user_rewards').getFullList<UserReward>({
            filter: `user = "${userId}"`,
            expand: 'reward',
            sort: '-purchased_at'
        });
    },

    purchaseReward: async (userId: string, rewardId: string, costXp: number) => {
        if (isMockEnv()) {
            const progress = MOCK_USER_PROGRESS.find(p => p.user === userId);
            if (!progress || progress.current_xp < costXp) {
                throw new Error('Insufficient XP');
            }
            progress.current_xp -= costXp;

            const reward = MOCK_REWARDS.find(r => r.id === rewardId);
            const newUR: UserReward = {
                id: `ur-${Date.now()}`,
                user: userId,
                reward: rewardId,
                purchased_at: new Date().toISOString(),
                equipped: false,
                expand: { reward }
            };
            MOCK_USER_REWARDS.push(newUR);
            return newUR;
        }

        // This should be a transaction in production
        // 1. Deduct XP from user
        // 2. Add reward to user_rewards

        const progress = await pb.collection('user_progress').getFirstListItem(
            `user = "${userId}"`
        );

        if (progress.current_xp < costXp) {
            throw new Error('Insufficient XP');
        }

        // Decrement XP
        await pb.collection('user_progress').update(progress.id, {
            current_xp: progress.current_xp - costXp
        });

        // Add reward
        return await pb.collection('user_rewards').create({
            user: userId,
            reward: rewardId,
            purchased_at: new Date().toISOString(),
            equipped: false
        });
    },

    equipReward: async (userRewardId: string) => {
        if (isMockEnv()) {
            const ur = MOCK_USER_REWARDS.find(r => r.id === userRewardId);
            if (ur) {
                ur.equipped = true;
            }
            return ur;
        }

        return await pb.collection('user_rewards').update(userRewardId, {
            equipped: true
        });
    },

    unequipReward: async (userRewardId: string) => {
        if (isMockEnv()) {
            const ur = MOCK_USER_REWARDS.find(r => r.id === userRewardId);
            if (ur) {
                ur.equipped = false;
            }
            return ur;
        }

        return await pb.collection('user_rewards').update(userRewardId, {
            equipped: false
        });
    },

    // Challenges (Daily/Weekly)
    getActiveChallenges: async (userId: string): Promise<Challenge[]> => {
        if (isMockEnv()) {
            return MOCK_CHALLENGES.filter(c =>
                c.status === 'Active' &&
                (c.target_user === userId || c.target_user === '')
            );
        }

        return await pb.collection('gamification_challenges').getFullList({
            filter: `status = "Active" && (target_user = "${userId}" || target_user = "")`,
            sort: '-created'
        });
    },

    getAllChallenges: async (): Promise<Challenge[]> => {
        if (isMockEnv()) {
            return MOCK_CHALLENGES;
        }

        return await pb.collection('gamification_challenges').getFullList({
            sort: '-created'
        });
    },

    createChallenge: async (data: Partial<Challenge>): Promise<Challenge> => {
        if (isMockEnv()) {
            const newChallenge: Challenge = {
                id: `challenge-${Date.now()}`,
                title: data.title || '',
                description: data.description || '',
                type: data.type || 'daily',
                xp_reward: data.xp_reward || 0,
                requirement_type: data.requirement_type || 'count',
                requirement_value: data.requirement_value || 1,
                status: 'Active',
                target_user: data.target_user || '',
                created: new Date().toISOString(),
                expires_at: data.expires_at
            };
            MOCK_CHALLENGES.push(newChallenge);
            return newChallenge;
        }

        return await pb.collection('gamification_challenges').create(data);
    },

    completeChallenge: async (challengeId: string, userId: string) => {
        if (isMockEnv()) {
            const challenge = MOCK_CHALLENGES.find(c => c.id === challengeId);
            if (challenge) {
                // Award XP
                await gamificationService.addXP(userId, challenge.xp_reward, `Completed challenge: ${challenge.title}`);
            }
            return { challenge: challengeId, user: userId, completed_at: new Date().toISOString() };
        }

        return await pb.collection('challenge_completions').create({
            challenge: challengeId,
            user: userId,
            completed_at: new Date().toISOString()
        });
    },

    // Statistics
    getGamificationStats: async (): Promise<GamificationStats> => {
        if (isMockEnv()) {
            return {
                totalUsers: MOCK_USER_PROGRESS.length,
                totalXPAwarded: MOCK_USER_PROGRESS.reduce((sum, p) => sum + p.total_xp_earned, 0),
                achievementsUnlocked: MOCK_USER_ACHIEVEMENTS.filter(ua => ua.completed).length,
                rewardsPurchased: MOCK_USER_REWARDS.length,
                activeChallenges: MOCK_CHALLENGES.filter(c => c.status === 'Active').length
            };
        }

        try {
            const [progress, achievements, rewards, challenges] = await Promise.all([
                pb.collection('user_progress').getFullList(),
                pb.collection('user_achievements').getFullList({ filter: 'completed = true' }),
                pb.collection('user_rewards').getFullList(),
                pb.collection('gamification_challenges').getFullList({ filter: 'status = "Active"' })
            ]);

            return {
                totalUsers: progress.length,
                totalXPAwarded: progress.reduce((sum: number, p: any) => sum + (p.total_xp_earned || 0), 0),
                achievementsUnlocked: achievements.length,
                rewardsPurchased: rewards.length,
                activeChallenges: challenges.length
            };
        } catch (error) {
            console.error('Failed to get gamification stats:', error);
            return {
                totalUsers: 0,
                totalXPAwarded: 0,
                achievementsUnlocked: 0,
                rewardsPurchased: 0,
                activeChallenges: 0
            };
        }
    },

    getUserStats: async (userId: string): Promise<{
        progress: UserProgress | null;
        achievements: UserAchievement[];
        rewards: UserReward[];
        rank: number | null;
    }> => {
        const [progress, achievements, rewards, rank] = await Promise.all([
            gamificationService.getUserProgress(userId),
            gamificationService.getUserAchievements(userId),
            gamificationService.getUserRewards(userId),
            gamificationService.getUserRank(userId)
        ]);

        return { progress, achievements, rewards, rank };
    }
};
