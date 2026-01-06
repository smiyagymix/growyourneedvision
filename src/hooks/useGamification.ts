import { useState, useEffect, useCallback } from 'react';
import { multiverseService } from '../services/multiverseService';
import { GAMIFICATION_CONFIG } from '../config/GamificationConfig';
import { UserProgress } from '../types/gamification';
import { useAuth } from '../context/AuthContext';

export const useGamification = () => {
    const { user } = useAuth();
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshProgress = useCallback(async () => {
        if (!user) return;
        try {
            const data = await multiverseService.getUserProgress(user.id);
            setProgress(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load progress');
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            refreshProgress().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user, refreshProgress]);

    return {
        progress,
        loading,
        error,
        refreshProgress,
        addXP: async (amount: number) => {
            if (!user) return;
            await multiverseService.awardXp(user.id, amount);
            refreshProgress();
        },
        // Helper to check if user meets level requirement
        canAccess: (minLevel: number) => (progress?.level || 1) >= minLevel,
        // Helper to calculate progress to next level
        levelProgress: () => {
            if (!progress) return 0;
            const currentLevelXp = (progress.level - 1) * GAMIFICATION_CONFIG.XP_PER_LEVEL;
            const xpInLevel = progress.current_xp - currentLevelXp;
            return (xpInLevel / GAMIFICATION_CONFIG.XP_PER_LEVEL) * 100;
        }
    };
};
