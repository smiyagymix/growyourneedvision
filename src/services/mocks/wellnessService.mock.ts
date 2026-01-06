import { WellnessLog } from '../wellnessService';

export const MOCK_WELLNESS_LOGS: WellnessLog[] = [
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
        ],
        exercises: [
            { name: 'Morning Run', duration: 30, calories_burned: 300, type: 'cardio', intensity: 'medium' }
        ],
        water_intake: 2000,
        weight: 72.5
    }
];

export const MOCK_GOALS: any[] = [
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
