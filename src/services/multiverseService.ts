import pb from '../lib/pocketbase';
import { GAMIFICATION_CONFIG } from '../config/GamificationConfig';
import {
    Universe,
    Timeline,
    Mission,
    Glitch,
    UserProgress,
    UserMissionCompletion,
    UserGlitchFix
} from '../types/gamification';

/**
 * Multiverse Service
 * Handles all gamification data fetching and interactions
 */
export const multiverseService = {

    /**
     * Get all active universes
     */
    async getUniverses(): Promise<Universe[]> {
        try {
            const records = await pb.collection('universes').getFullList<Universe>({
                filter: 'is_active = true',
                sort: 'min_level',
            });
            return records;
        } catch (error) {
            console.error('Error fetching universes:', error);
            return [];
        }
    },

    /**
     * Get a single universe by ID
     */
    async getUniverse(id: string): Promise<Universe | null> {
        try {
            const record = await pb.collection('universes').getOne<Universe>(id);
            return record;
        } catch (error) {
            console.error(`Error fetching universe ${id}:`, error);
            return null;
        }
    },

    /**
     * Get timelines for a specific universe
     */
    async getTimelines(universeId: string): Promise<Timeline[]> {
        try {
            const records = await pb.collection('timelines').getFullList<Timeline>({
                filter: `universe = "${universeId}"`,
                sort: 'order',
            });
            return records;
        } catch (error) {
            console.error(`Error fetching timelines for universe ${universeId}:`, error);
            return [];
        }
    },

    /**
     * Get missions for a specific timeline
     */
    async getMissions(timelineId: string): Promise<Mission[]> {
        try {
            const records = await pb.collection('missions').getFullList<Mission>({
                filter: `timeline = "${timelineId}"`,
                sort: 'created', // Or add an order field to missions if needed
            });
            return records;
        } catch (error) {
            console.error(`Error fetching missions for timeline ${timelineId}:`, error);
            return [];
        }
    },

    /**
     * Get active glitches for a universe (or all if no universeId provided)
     */
    async getActiveGlitches(universeId?: string): Promise<Glitch[]> {
        try {
            let filter = 'is_active = true';
            if (universeId) {
                filter += ` && universe = "${universeId}"`;
            }

            const records = await pb.collection('glitches').getFullList<Glitch>({
                filter,
                sort: '-created',
            });
            return records;
        } catch (error) {
            console.error('Error fetching glitches:', error);
            return [];
        }
    },

    /**
     * Get user progress
     */
    async getUserProgress(userId: string): Promise<UserProgress | null> {
        try {
            // Try to find existing progress
            const records = await pb.collection('user_progress').getList<UserProgress>(1, 1, {
                filter: `user = "${userId}"`,
            });

            if (records.items.length > 0) {
                return records.items[0];
            }

            // If no progress exists, create initial record
            return await this.initializeUserProgress(userId);
        } catch (error) {
            console.error(`Error fetching progress for user ${userId}:`, error);
            return null;
        }
    },

    /**
     * Initialize progress for a new user
     */
    async initializeUserProgress(userId: string): Promise<UserProgress> {
        try {
            const initialProgress = {
                user: userId,
                current_xp: 0,
                level: 1,
                streak_days: 0,
                last_active: new Date().toISOString(),
            };

            const record = await pb.collection('user_progress').create<UserProgress>(initialProgress);
            return record;
        } catch (error) {
            console.error('Error initializing user progress:', error);
            throw error;
        }
    },

    /**
     * Complete a mission
     */
    async completeMission(userId: string, missionId: string, score?: number, submissionUrl?: string): Promise<UserMissionCompletion> {
        try {
            // 1. Record completion
            const completionData = {
                user: userId,
                mission: missionId,
                completed_at: new Date().toISOString(),
                score,
                submission_url: submissionUrl,
            };

            const completion = await pb.collection('user_mission_completions').create<UserMissionCompletion>(completionData);

            // 2. Award XP
            const mission = await pb.collection('missions').getOne<Mission>(missionId);
            await this.awardXp(userId, mission.xp_reward);

            return completion;
        } catch (error) {
            console.error('Error completing mission:', error);
            throw error;
        }
    },

    /**
     * Fix a glitch
     */
    async fixGlitch(userId: string, glitchId: string): Promise<UserGlitchFix> {
        try {
            // 1. Record fix
            const fixData = {
                user: userId,
                glitch: glitchId,
                fixed_at: new Date().toISOString(),
                attempts: 1, // Simplified for now
            };

            const fix = await pb.collection('user_glitch_fixes').create<UserGlitchFix>(fixData);

            // 2. Award XP
            const glitch = await pb.collection('glitches').getOne<Glitch>(glitchId);
            await this.awardXp(userId, glitch.xp_reward);

            return fix;
        } catch (error) {
            console.error('Error fixing glitch:', error);
            throw error;
        }
    },

    /**
     * Award XP to a user and handle leveling up
     */
    async awardXp(userId: string, amount: number): Promise<void> {
        try {
            const progress = await this.getUserProgress(userId);
            if (!progress) return;

            const newXp = progress.current_xp + amount;

            // Use centralized formula
            const newLevel = GAMIFICATION_CONFIG.LEVEL_FORMULA(newXp);

            await pb.collection('user_progress').update(progress.id, {
                current_xp: newXp,
                level: newLevel,
                last_active: new Date().toISOString(),
            });

        } catch (error) {
            console.error('Error awarding XP:', error);
        }
    }
};
