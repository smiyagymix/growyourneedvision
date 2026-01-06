import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Meal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    time: string;
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface Exercise {
    name: string;
    duration: number; // minutes
    calories_burned: number;
    type: 'cardio' | 'strength' | 'flexibility' | 'other';
    intensity?: 'low' | 'medium' | 'high';
}

export interface WellnessLog extends RecordModel {
    date: string;
    steps: number;
    calories: number;
    sleep_minutes: number;
    mood: 'Excellent' | 'Good' | 'Okay' | 'Poor' | 'Energized' | 'Tired' | 'Stressed';
    user: string;
    meals: Meal[];
    exercises?: Exercise[];
    water_intake?: number; // ml
    weight?: number; // kg
    notes?: string;
    heart_rate?: number;
    blood_pressure?: { systolic: number; diastolic: number };
}

export interface WellnessGoal extends RecordModel {
    user: string;
    type: 'steps' | 'calories' | 'sleep' | 'water' | 'weight' | 'exercise';
    target: number;
    current?: number;
    unit: string;
    deadline?: string;
    status?: 'active' | 'completed' | 'failed';
}

export interface WellnessStats {
    averageSteps: number;
    averageSleep: number;
    averageCalories: number;
    totalExerciseMinutes: number;
    moodDistribution: Record<string, number>;
    streakDays: number;
    goalsCompleted: number;
}

const MOCK_WELLNESS_LOGS: WellnessLog[] = [
    {
        id: 'wellness-1',
        collectionId: 'mock',
        collectionName: 'wellness_logs',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        date: new Date().toISOString(),
        steps: 8500,
        calories: 2100,
        sleep_minutes: 430,
        mood: 'Energized',
        user: 'user-1',
        meals: [
            { name: 'Oatmeal with berries', calories: 350, protein: 12, carbs: 55, fats: 8, time: '08:00', type: 'breakfast' },
            { name: 'Grilled chicken salad', calories: 450, protein: 35, carbs: 20, fats: 15, time: '12:30', type: 'lunch' },
            { name: 'Salmon with vegetables', calories: 550, protein: 40, carbs: 30, fats: 25, time: '19:00', type: 'dinner' }
        ],
        exercises: [
            { name: 'Morning Run', duration: 30, calories_burned: 300, type: 'cardio', intensity: 'medium' }
        ],
        water_intake: 2000,
        weight: 72.5
    },
    {
        id: 'wellness-2',
        collectionId: 'mock',
        collectionName: 'wellness_logs',
        created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        steps: 10200,
        calories: 1950,
        sleep_minutes: 480,
        mood: 'Good',
        user: 'user-1',
        meals: [],
        water_intake: 2500,
        weight: 72.3
    }
];

const MOCK_GOALS: WellnessGoal[] = [
    {
        id: 'goal-1',
        collectionId: 'mock',
        collectionName: 'wellness_goals',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        user: 'user-1',
        type: 'steps',
        target: 10000,
        current: 8500,
        unit: 'steps',
        status: 'active'
    },
    {
        id: 'goal-2',
        collectionId: 'mock',
        collectionName: 'wellness_goals',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        user: 'user-1',
        type: 'water',
        target: 2500,
        current: 2000,
        unit: 'ml',
        status: 'active'
    }
];

export const wellnessService = {
    /**
     * Get wellness logs for a user
     */
    async getLogs(userId: string, limit: number = 7): Promise<WellnessLog[]> {
        if (isMockEnv()) {
            return MOCK_WELLNESS_LOGS.filter(l => l.user === userId).slice(0, limit);
        }

        try {
            return await pb.collection('wellness_logs').getList<WellnessLog>(1, limit, {
                sort: '-date',
                filter: `user = "${userId}"`,
                requestKey: null
            }).then(res => res.items);
        } catch (error) {
            console.warn('Failed to fetch wellness logs', error);
            return [];
        }
    },

    /**
     * Get logs by date range
     */
    async getLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<WellnessLog[]> {
        if (isMockEnv()) {
            return MOCK_WELLNESS_LOGS.filter(l =>
                l.user === userId &&
                l.date >= startDate &&
                l.date <= endDate
            );
        }

        try {
            return await pb.collection('wellness_logs').getFullList<WellnessLog>({
                sort: '-date',
                filter: `user = "${userId}" && date >= "${startDate}" && date <= "${endDate}"`,
                requestKey: null
            });
        } catch (error) {
            console.warn('Failed to fetch wellness logs by date range', error);
            return [];
        }
    },

    /**
     * Get today's log
     */
    async getTodayLog(userId: string): Promise<WellnessLog | null> {
        const today = new Date().toISOString().split('T')[0];

        if (isMockEnv()) {
            const log = MOCK_WELLNESS_LOGS.find(l =>
                l.user === userId && l.date.startsWith(today)
            );
            return log || null;
        }

        try {
            const logs = await this.getLogs(userId, 1);
            if (logs.length > 0) {
                const logDate = new Date(logs[0].date).toDateString();
                const todayStr = new Date().toDateString();
                if (logDate === todayStr) {
                    return logs[0];
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Create wellness log
     */
    async createLog(data: Partial<WellnessLog>): Promise<WellnessLog | null> {
        if (isMockEnv()) {
            const newLog: WellnessLog = {
                id: `wellness-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'wellness_logs',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                date: data.date || new Date().toISOString(),
                steps: data.steps || 0,
                calories: data.calories || 0,
                sleep_minutes: data.sleep_minutes || 0,
                mood: data.mood || 'Okay',
                user: data.user || '',
                meals: data.meals || [],
                exercises: data.exercises,
                water_intake: data.water_intake,
                weight: data.weight,
                notes: data.notes
            };
            MOCK_WELLNESS_LOGS.unshift(newLog);
            return newLog;
        }

        try {
            return await pb.collection('wellness_logs').create<WellnessLog>(data);
        } catch (error) {
            console.error('Failed to create wellness log', error);
            return null;
        }
    },

    /**
     * Update wellness log
     */
    async updateLog(id: string, data: Partial<WellnessLog>): Promise<WellnessLog | null> {
        if (isMockEnv()) {
            const index = MOCK_WELLNESS_LOGS.findIndex(l => l.id === id);
            if (index === -1) return null;
            MOCK_WELLNESS_LOGS[index] = {
                ...MOCK_WELLNESS_LOGS[index],
                ...data,
                updated: new Date().toISOString()
            };
            return MOCK_WELLNESS_LOGS[index];
        }

        try {
            return await pb.collection('wellness_logs').update<WellnessLog>(id, data);
        } catch (error) {
            console.error('Failed to update wellness log', error);
            return null;
        }
    },

    /**
     * Delete wellness log
     */
    async deleteLog(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_WELLNESS_LOGS.findIndex(l => l.id === id);
            if (index !== -1) {
                MOCK_WELLNESS_LOGS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('wellness_logs').delete(id);
            return true;
        } catch (error) {
            console.error('Failed to delete wellness log', error);
            return false;
        }
    },

    /**
     * Add meal to today's log
     */
    async addMeal(userId: string, meal: Meal): Promise<WellnessLog | null> {
        let todayLog = await this.getTodayLog(userId);

        if (!todayLog) {
            todayLog = await this.createLog({
                user: userId,
                date: new Date().toISOString(),
                steps: 0,
                calories: 0,
                sleep_minutes: 0,
                mood: 'Okay',
                meals: [meal]
            });
            return todayLog;
        }

        const updatedMeals = [...(todayLog.meals || []), meal];
        const totalCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);

        return await this.updateLog(todayLog.id, {
            meals: updatedMeals,
            calories: totalCalories
        });
    },

    /**
     * Add exercise to today's log
     */
    async addExercise(userId: string, exercise: Exercise): Promise<WellnessLog | null> {
        let todayLog = await this.getTodayLog(userId);

        if (!todayLog) {
            todayLog = await this.createLog({
                user: userId,
                date: new Date().toISOString(),
                steps: 0,
                calories: 0,
                sleep_minutes: 0,
                mood: 'Okay',
                meals: [],
                exercises: [exercise]
            });
            return todayLog;
        }

        const updatedExercises = [...(todayLog.exercises || []), exercise];
        return await this.updateLog(todayLog.id, { exercises: updatedExercises });
    },

    /**
     * Update steps for today
     */
    async updateSteps(userId: string, steps: number): Promise<WellnessLog | null> {
        let todayLog = await this.getTodayLog(userId);

        if (!todayLog) {
            todayLog = await this.createLog({
                user: userId,
                date: new Date().toISOString(),
                steps,
                calories: 0,
                sleep_minutes: 0,
                mood: 'Okay',
                meals: []
            });
            return todayLog;
        }

        return await this.updateLog(todayLog.id, { steps });
    },

    // =============== GOALS ===============

    /**
     * Get user's wellness goals
     */
    async getGoals(userId: string): Promise<WellnessGoal[]> {
        if (isMockEnv()) {
            return MOCK_GOALS.filter(g => g.user === userId);
        }

        try {
            return await pb.collection('wellness_goals').getFullList<WellnessGoal>({
                filter: `user = "${userId}"`,
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.warn('Failed to fetch wellness goals', error);
            return [];
        }
    },

    /**
     * Create wellness goal
     */
    async createGoal(data: Partial<WellnessGoal>): Promise<WellnessGoal | null> {
        if (isMockEnv()) {
            const newGoal: WellnessGoal = {
                id: `goal-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'wellness_goals',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                user: data.user || '',
                type: data.type || 'steps',
                target: data.target || 0,
                current: data.current || 0,
                unit: data.unit || 'units',
                status: data.status || 'active'
            };
            MOCK_GOALS.push(newGoal);
            return newGoal;
        }

        try {
            return await pb.collection('wellness_goals').create<WellnessGoal>(data);
        } catch (error) {
            console.error('Failed to create wellness goal', error);
            return null;
        }
    },

    /**
     * Update goal progress
     */
    async updateGoalProgress(goalId: string, current: number): Promise<WellnessGoal | null> {
        if (isMockEnv()) {
            const index = MOCK_GOALS.findIndex(g => g.id === goalId);
            if (index === -1) return null;
            MOCK_GOALS[index].current = current;
            if (current >= MOCK_GOALS[index].target) {
                MOCK_GOALS[index].status = 'completed';
            }
            return MOCK_GOALS[index];
        }

        try {
            const goal = await pb.collection('wellness_goals').getOne<WellnessGoal>(goalId);
            const status = current >= goal.target ? 'completed' : 'active';
            return await pb.collection('wellness_goals').update<WellnessGoal>(goalId, {
                current,
                status
            });
        } catch (error) {
            console.error('Failed to update goal progress', error);
            return null;
        }
    },

    // =============== STATISTICS ===============

    /**
     * Get wellness statistics for a user
     */
    async getStatistics(userId: string, days: number = 30): Promise<WellnessStats> {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        const logs = await this.getLogsByDateRange(
            userId,
            startDate.toISOString(),
            endDate.toISOString()
        );
        const goals = await this.getGoals(userId);

        if (logs.length === 0) {
            return {
                averageSteps: 0,
                averageSleep: 0,
                averageCalories: 0,
                totalExerciseMinutes: 0,
                moodDistribution: {},
                streakDays: 0,
                goalsCompleted: 0
            };
        }

        const totalSteps = logs.reduce((sum, l) => sum + l.steps, 0);
        const totalSleep = logs.reduce((sum, l) => sum + l.sleep_minutes, 0);
        const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
        const totalExercise = logs.reduce((sum, l) => {
            return sum + (l.exercises?.reduce((s, e) => s + e.duration, 0) || 0);
        }, 0);

        const moodDistribution: Record<string, number> = {};
        logs.forEach(l => {
            moodDistribution[l.mood] = (moodDistribution[l.mood] || 0) + 1;
        });

        // Calculate streak (consecutive days with logs)
        let streakDays = 0;
        const sortedLogs = [...logs].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (let i = 0; i < sortedLogs.length; i++) {
            const logDate = new Date(sortedLogs[i].date);
            const expectedDate = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);

            if (logDate.toDateString() === expectedDate.toDateString()) {
                streakDays++;
            } else {
                break;
            }
        }

        return {
            averageSteps: Math.round(totalSteps / logs.length),
            averageSleep: Math.round(totalSleep / logs.length),
            averageCalories: Math.round(totalCalories / logs.length),
            totalExerciseMinutes: totalExercise,
            moodDistribution,
            streakDays,
            goalsCompleted: goals.filter(g => g.status === 'completed').length
        };
    },

    /**
     * Get weekly summary
     */
    async getWeeklySummary(userId: string): Promise<{
        days: Array<{
            date: string;
            steps: number;
            calories: number;
            sleep: number;
            mood: string;
        }>;
        totals: {
            steps: number;
            calories: number;
            avgSleep: number;
        };
    }> {
        const logs = await this.getLogs(userId, 7);

        const days = logs.map(l => ({
            date: l.date,
            steps: l.steps,
            calories: l.calories,
            sleep: l.sleep_minutes,
            mood: l.mood
        }));

        const totals = {
            steps: logs.reduce((sum, l) => sum + l.steps, 0),
            calories: logs.reduce((sum, l) => sum + l.calories, 0),
            avgSleep: logs.length > 0
                ? Math.round(logs.reduce((sum, l) => sum + l.sleep_minutes, 0) / logs.length)
                : 0
        };

        return { days, totals };
    }
};
