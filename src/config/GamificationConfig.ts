export const GAMIFICATION_CONFIG = {
    XP_PER_LEVEL: 1000,
    LEVEL_FORMULA: (xp: number) => Math.floor(xp / 1000) + 1,
    
    REWARDS: {
        RARITY_COLORS: {
            Legendary: 'from-yellow-400 to-orange-500',
            Epic: 'from-purple-400 to-pink-500',
            Rare: 'from-blue-400 to-cyan-500',
            Common: 'from-gray-300 to-gray-400',
        },
        RARITY_BORDERS: {
            Legendary: 'border-yellow-400 shadow-yellow-400/50',
            Epic: 'border-purple-400 shadow-purple-400/50',
            Rare: 'border-blue-400 shadow-blue-400/50',
            Common: 'border-gray-300',
        },
        RARITY_BADGES: {
            Legendary: 'bg-yellow-100 text-yellow-700',
            Epic: 'bg-purple-100 text-purple-700',
            Rare: 'bg-blue-100 text-blue-700',
            Common: 'bg-gray-100 text-gray-600',
        }
    },

    AI_CHALLENGE: {
        MIN_XP_MULTIPLIER: 50,
        MAX_XP_MULTIPLIER: 100,
    }
};
