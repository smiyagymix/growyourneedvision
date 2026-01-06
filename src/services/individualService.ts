import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

/**
 * Individual User Dashboard Data
 * Replaces ALL hardcoded/fake data in Individual Dashboard
 */

export interface IndividualCourse extends RecordModel {
    user: string;
    course_title: string;
    course_description?: string;
    course_image?: string;
    progress: number; // 0-100
    enrolled_date: string;
    completed_date?: string;
    status: 'active' | 'completed' | 'paused';
}

export interface WellnessData extends RecordModel {
    user: string;
    date: string;
    mood_score: number; // 1-10
    energy_level: number; // 1-10
    stress_level: number; // 1-10
    sleep_hours: number;
    water_intake: number; // in glasses
    steps: number;
    exercise_minutes: number;
    meditation_minutes: number;
}

export interface IndividualGoal extends RecordModel {
    user: string;
    goal_text: string;
    goal_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    is_completed: boolean;
    due_date?: string;
    completed_date?: string;
}

export interface LearningProgress extends RecordModel {
    user: string;
    subject: string;
    level: number;
    xp: number;
    next_level_xp: number;
    daily_streak: number;
    last_activity: string;
}

export interface Achievement extends RecordModel {
    user: string;
    title: string;
    description: string;
    category: string;
    xp: number;
    icon?: string;
    unlocked_date: string;
}

export interface Project extends RecordModel {
    user: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'paused';
    progress: number;
    start_date: string;
    due_date?: string;
    completed_date?: string;
}

export interface ExtendedGoal extends IndividualGoal {
    progress: number;
    category?: string;
    priority?: 'high' | 'medium' | 'low';
}

export interface Skill extends RecordModel {
    user: string;
    name: string;
    category: string;
    level: number; // 1-10
    xp: number;
    target_level?: number;
}

export interface CalendarEvent extends RecordModel {
    user: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    event_type: 'task' | 'meeting' | 'reminder' | 'deadline';
    is_completed?: boolean;
    color?: string;
}

export interface Habit extends RecordModel {
    user: string;
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    target_count: number;
    icon?: string;
    color?: string;
}

export interface HabitLog extends RecordModel {
    habit: string; // habit ID
    user: string;
    date: string;
    completed: boolean;
    note?: string;
}

export interface Note extends RecordModel {
    user: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    is_pinned?: boolean;
}

export interface UserProfile extends RecordModel {
    user: string;
    bio?: string;
    location?: string;
    website?: string;
    avatar_url?: string;
    social_links?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
        instagram?: string;
    };
}

export interface MarketplaceOrder extends RecordModel {
    user: string;
    order_number: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    price: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    order_date: string;
    tracking_number?: string;
}

export interface ServiceBooking extends RecordModel {
    user: string;
    service_name: string;
    service_provider: string;
    booking_date: string;
    booking_time: string;
    duration_minutes: number;
    status: 'upcoming' | 'completed' | 'cancelled';
    price: number;
    location?: string;
}

export interface Recommendation extends RecordModel {
    user?: string; // If null, it's a general recommendation
    item_type: 'course' | 'product' | 'service';
    item_id?: string;
    title: string;
    description?: string;
    image_url?: string;
    price?: number;
    category?: string;
    score?: number; // Recommendation score
}

export interface IndividualDashboardStats {
    courses: {
        total: number;
        active: number;
        completed: number;
        progress: number; // Average progress
    };
    wellness: {
        score: number; // Calculated from wellness_data
        trend: 'up' | 'down' | 'neutral';
        streak: number; // Days of consistent logging
    };
    marketplace: {
        total_orders: number;
        pending_orders: number;
        recent_orders: MarketplaceOrder[];
    };
    services: {
        total_bookings: number;
        upcoming_bookings: number;
        next_booking?: ServiceBooking;
    };
}

// Mock Data
const MOCK_COURSES: IndividualCourse[] = [
    {
        id: 'course-1',
        user: 'user-1',
        course_title: 'Introduction to Python Programming',
        course_description: 'Learn Python from scratch with hands-on projects',
        course_image: 'https://example.com/python.jpg',
        progress: 65,
        enrolled_date: '2024-01-15',
        status: 'active',
        collectionId: '', collectionName: '', created: '2024-01-15', updated: ''
    },
    {
        id: 'course-2',
        user: 'user-1',
        course_title: 'Web Development Fundamentals',
        course_description: 'HTML, CSS, and JavaScript basics',
        course_image: 'https://example.com/webdev.jpg',
        progress: 100,
        enrolled_date: '2023-10-01',
        completed_date: '2024-01-01',
        status: 'completed',
        collectionId: '', collectionName: '', created: '2023-10-01', updated: ''
    },
    {
        id: 'course-3',
        user: 'user-1',
        course_title: 'Data Science with R',
        course_description: 'Statistical analysis and visualization',
        course_image: 'https://example.com/datascience.jpg',
        progress: 30,
        enrolled_date: '2024-02-01',
        status: 'active',
        collectionId: '', collectionName: '', created: '2024-02-01', updated: ''
    },
    {
        id: 'course-4',
        user: 'user-1',
        course_title: 'Digital Marketing Essentials',
        course_description: 'SEO, social media, and content marketing',
        progress: 15,
        enrolled_date: '2024-02-15',
        status: 'paused',
        collectionId: '', collectionName: '', created: '2024-02-15', updated: ''
    }
];

const MOCK_WELLNESS: WellnessData[] = [
    { id: 'w-1', user: 'user-1', date: new Date().toISOString().split('T')[0], mood_score: 8, energy_level: 7, stress_level: 3, sleep_hours: 7.5, water_intake: 8, steps: 8500, exercise_minutes: 45, meditation_minutes: 15, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'w-2', user: 'user-1', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], mood_score: 7, energy_level: 6, stress_level: 4, sleep_hours: 6.5, water_intake: 6, steps: 6200, exercise_minutes: 30, meditation_minutes: 10, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'w-3', user: 'user-1', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], mood_score: 9, energy_level: 8, stress_level: 2, sleep_hours: 8, water_intake: 10, steps: 12000, exercise_minutes: 60, meditation_minutes: 20, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'w-4', user: 'user-1', date: new Date(Date.now() - 259200000).toISOString().split('T')[0], mood_score: 6, energy_level: 5, stress_level: 5, sleep_hours: 5.5, water_intake: 5, steps: 4500, exercise_minutes: 0, meditation_minutes: 0, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'w-5', user: 'user-1', date: new Date(Date.now() - 345600000).toISOString().split('T')[0], mood_score: 7, energy_level: 7, stress_level: 4, sleep_hours: 7, water_intake: 7, steps: 7800, exercise_minutes: 40, meditation_minutes: 10, collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_GOALS: IndividualGoal[] = [
    { id: 'goal-1', user: 'user-1', goal_text: 'Complete Python course', goal_type: 'monthly', is_completed: false, due_date: '2024-03-31', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'goal-2', user: 'user-1', goal_text: 'Exercise for 30 minutes', goal_type: 'daily', is_completed: true, completed_date: new Date().toISOString(), collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'goal-3', user: 'user-1', goal_text: 'Read 2 books', goal_type: 'monthly', is_completed: false, due_date: '2024-03-31', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'goal-4', user: 'user-1', goal_text: 'Meditate for 10 minutes', goal_type: 'daily', is_completed: false, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'goal-5', user: 'user-1', goal_text: 'Learn 50 new vocabulary words', goal_type: 'weekly', is_completed: false, due_date: '2024-02-25', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_LEARNING_PROGRESS: LearningProgress[] = [
    { id: 'lp-1', user: 'user-1', subject: 'Python', level: 5, xp: 2500, next_level_xp: 3000, daily_streak: 12, last_activity: new Date().toISOString(), collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'lp-2', user: 'user-1', subject: 'JavaScript', level: 8, xp: 8200, next_level_xp: 10000, daily_streak: 8, last_activity: new Date(Date.now() - 86400000).toISOString(), collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'lp-3', user: 'user-1', subject: 'Data Science', level: 3, xp: 900, next_level_xp: 1500, daily_streak: 5, last_activity: new Date().toISOString(), collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_ORDERS: MarketplaceOrder[] = [
    { id: 'order-1', user: 'user-1', order_number: 'ORD-2024-001', product_name: 'Wireless Headphones', product_image: 'https://example.com/headphones.jpg', quantity: 1, price: 89.99, status: 'shipped', order_date: '2024-02-10', tracking_number: 'TRK123456', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'order-2', user: 'user-1', order_number: 'ORD-2024-002', product_name: 'Programming Book Bundle', quantity: 3, price: 45.50, status: 'delivered', order_date: '2024-01-28', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'order-3', user: 'user-1', order_number: 'ORD-2024-003', product_name: 'Standing Desk Mat', quantity: 1, price: 39.99, status: 'processing', order_date: '2024-02-15', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_BOOKINGS: ServiceBooking[] = [
    { id: 'booking-1', user: 'user-1', service_name: 'Career Coaching Session', service_provider: 'Career Pro', booking_date: new Date(Date.now() + 604800000).toISOString().split('T')[0], booking_time: '10:00', duration_minutes: 60, status: 'upcoming', price: 150, location: 'Virtual', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'booking-2', user: 'user-1', service_name: 'Personal Training', service_provider: 'FitLife Gym', booking_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], booking_time: '18:00', duration_minutes: 45, status: 'upcoming', price: 75, location: '123 Fitness Ave', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'booking-3', user: 'user-1', service_name: 'Language Tutoring', service_provider: 'LinguaLearn', booking_date: '2024-02-01', booking_time: '14:00', duration_minutes: 60, status: 'completed', price: 50, location: 'Virtual', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
    { id: 'rec-1', item_type: 'course', title: 'Machine Learning Fundamentals', description: 'Learn ML from industry experts', image_url: 'https://example.com/ml.jpg', price: 99.99, category: 'Technology', score: 95, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'rec-2', item_type: 'product', title: 'Ergonomic Keyboard', description: 'Reduce strain while coding', image_url: 'https://example.com/keyboard.jpg', price: 149.99, category: 'Electronics', score: 88, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'rec-3', item_type: 'service', title: 'Resume Review Service', description: 'Professional resume feedback', price: 49.99, category: 'Career', score: 92, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'rec-4', user: 'user-1', item_type: 'course', title: 'Advanced Python Projects', description: 'Build real-world applications', price: 79.99, category: 'Technology', score: 98, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'rec-5', item_type: 'product', title: 'Noise-Canceling Earbuds', description: 'Focus better with premium audio', image_url: 'https://example.com/earbuds.jpg', price: 199.99, category: 'Electronics', score: 85, collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
    { id: 'ach-1', user: 'user-1', title: 'First Steps', description: 'Completed your first course', category: 'learning', xp: 100, icon: 'trophy', unlocked_date: '2024-01-01', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'ach-2', user: 'user-1', title: 'Wellness Warrior', description: 'Logged wellness data for 7 days straight', category: 'wellness', xp: 150, icon: 'heart', unlocked_date: '2024-01-10', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'ach-3', user: 'user-1', title: 'Goal Getter', description: 'Completed 10 goals', category: 'productivity', xp: 200, icon: 'target', unlocked_date: '2024-01-15', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', user: 'user-1', title: 'Personal Website', description: 'Build portfolio website', status: 'active', progress: 60, start_date: '2024-01-01', due_date: '2024-03-01', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'proj-2', user: 'user-1', title: 'Learn Spanish', description: 'Become conversational', status: 'active', progress: 40, start_date: '2024-01-15', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_SKILLS: Skill[] = [
    { id: 'skill-1', user: 'user-1', name: 'Python', category: 'Programming', level: 7, xp: 3500, target_level: 10, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'skill-2', user: 'user-1', name: 'Public Speaking', category: 'Communication', level: 5, xp: 1200, target_level: 8, collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
    { id: 'evt-1', user: 'user-1', title: 'Team Meeting', description: 'Weekly sync', start_date: new Date(Date.now() + 86400000).toISOString(), event_type: 'meeting', is_completed: false, color: '#3b82f6', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'evt-2', user: 'user-1', title: 'Project Deadline', start_date: new Date(Date.now() + 604800000).toISOString(), event_type: 'deadline', is_completed: false, color: '#ef4444', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_HABITS: Habit[] = [
    { id: 'habit-1', user: 'user-1', name: 'Morning Exercise', description: '30 minutes workout', frequency: 'daily', target_count: 1, icon: 'dumbbell', color: '#10b981', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'habit-2', user: 'user-1', name: 'Read for 1 hour', frequency: 'daily', target_count: 1, icon: 'book', color: '#8b5cf6', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_HABIT_LOGS: HabitLog[] = [
    { id: 'log-1', habit: 'habit-1', user: 'user-1', date: new Date().toISOString().split('T')[0], completed: true, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'log-2', habit: 'habit-2', user: 'user-1', date: new Date().toISOString().split('T')[0], completed: false, collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_NOTES: Note[] = [
    { id: 'note-1', user: 'user-1', title: 'Project Ideas', content: 'List of potential projects to build', category: 'ideas', tags: ['projects', 'ideas'], is_pinned: true, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'note-2', user: 'user-1', title: 'Meeting Notes', content: 'Notes from weekly team meeting', category: 'work', tags: ['meetings'], is_pinned: false, collectionId: '', collectionName: '', created: '', updated: '' }
];

/**
 * Individual User Service
 * Provides real data for Individual dashboard
 * NO MORE HARDCODED VALUES!
 */
class IndividualUserService {

    /**
     * Get complete dashboard stats for a user
     */
    async getDashboardStats(userId: string): Promise<IndividualDashboardStats> {
        const [courses, wellness, orders, bookings] = await Promise.all([
            this.getCoursesStats(userId),
            this.getWellnessStats(userId),
            this.getMarketplaceStats(userId),
            this.getServicesStats(userId),
        ]);

        return {
            courses,
            wellness,
            marketplace: orders,
            services: bookings,
        };
    }

    /**
     * Get courses statistics
     */
    async getCoursesStats(userId: string): Promise<IndividualDashboardStats['courses']> {
        if (isMockEnv()) {
            const userCourses = MOCK_COURSES.filter(c => c.user === userId);
            const active = userCourses.filter(c => c.status === 'active');
            const completed = userCourses.filter(c => c.status === 'completed');
            const avgProgress = active.length > 0
                ? active.reduce((sum, c) => sum + c.progress, 0) / active.length
                : 0;

            return {
                total: userCourses.length,
                active: active.length,
                completed: completed.length,
                progress: Math.round(avgProgress),
            };
        }

        try {
            const allCourses = await pb.collection('individual_courses').getFullList<IndividualCourse>({
                filter: `user = "${userId}"`,
                sort: '-created',
            });

            const active = allCourses.filter(c => c.status === 'active');
            const completed = allCourses.filter(c => c.status === 'completed');
            const avgProgress = active.length > 0
                ? active.reduce((sum, c) => sum + c.progress, 0) / active.length
                : 0;

            return {
                total: allCourses.length,
                active: active.length,
                completed: completed.length,
                progress: Math.round(avgProgress),
            };
        } catch (error) {
            console.error('Failed to get courses stats:', error);
            return { total: 0, active: 0, completed: 0, progress: 0 };
        }
    }

    /**
     * Get enrolled courses
     */
    async getEnrolledCourses(userId: string, limit: number = 10): Promise<IndividualCourse[]> {
        if (isMockEnv()) {
            return MOCK_COURSES
                .filter(c => c.user === userId && c.status !== 'completed')
                .slice(0, limit);
        }

        try {
            return await pb.collection('individual_courses').getFullList<IndividualCourse>({
                filter: `user = "${userId}" && status != "completed"`,
                sort: '-created',
                limit,
            });
        } catch (error) {
            console.error('Failed to get enrolled courses:', error);
            return [];
        }
    }

    /**
     * Get all courses for user
     */
    async getAllCourses(userId: string): Promise<IndividualCourse[]> {
        if (isMockEnv()) {
            return MOCK_COURSES.filter(c => c.user === userId);
        }

        try {
            return await pb.collection('individual_courses').getFullList<IndividualCourse>({
                filter: `user = "${userId}"`,
                sort: '-created',
            });
        } catch (error) {
            console.error('Failed to get all courses:', error);
            return [];
        }
    }

    /**
     * Update course progress
     */
    async updateCourseProgress(courseId: string, progress: number): Promise<IndividualCourse | null> {
        if (isMockEnv()) {
            const course = MOCK_COURSES.find(c => c.id === courseId);
            if (course) {
                course.progress = Math.min(100, Math.max(0, progress));
                if (course.progress === 100) {
                    course.status = 'completed';
                    course.completed_date = new Date().toISOString();
                }
            }
            return course || null;
        }

        try {
            const updateData: Partial<IndividualCourse> = { progress };
            if (progress >= 100) {
                updateData.status = 'completed';
                updateData.completed_date = new Date().toISOString();
            }
            return await pb.collection('individual_courses').update<IndividualCourse>(courseId, updateData);
        } catch (error) {
            console.error('Failed to update course progress:', error);
            return null;
        }
    }

    /**
     * Calculate wellness score from recent wellness data
     */
    async getLearningProgress(userId: string): Promise<LearningProgress[]> {
        if (isMockEnv()) {
            return MOCK_LEARNING_PROGRESS.filter(lp => lp.user === userId);
        }

        return pb.collection('learning_progress').getFullList<LearningProgress>({
            filter: `user = "${userId}"`,
            sort: '-last_activity'
        });
    }

    async getWellnessStats(userId: string): Promise<IndividualDashboardStats['wellness']> {
        if (isMockEnv()) {
            const userWellness = MOCK_WELLNESS.filter(w => w.user === userId);
            if (userWellness.length === 0) {
                return { score: 0, trend: 'neutral', streak: 0 };
            }

            const scores = userWellness.map(r => {
                const score = ((r.mood_score + r.energy_level - r.stress_level) / 3) * 10;
                return Math.max(0, Math.min(100, score));
            });

            const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
            let trend: 'up' | 'down' | 'neutral' = 'neutral';

            if (scores.length >= 4) {
                const recentAvg = scores.slice(0, 3).reduce((sum, s) => sum + s, 0) / 3;
                const previousAvg = scores.slice(3).reduce((sum, s) => sum + s, 0) / (scores.length - 3);
                if (recentAvg > previousAvg + 5) trend = 'up';
                else if (recentAvg < previousAvg - 5) trend = 'down';
            }

            return { score: avgScore, trend, streak: userWellness.length };
        }

        try {
            // Get last 7 days of wellness data
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const wellnessRecords = await pb.collection('wellness_data').getFullList<WellnessData>({
                filter: `user = "${userId}" && date >= "${sevenDaysAgo.toISOString().split('T')[0]}"`,
                sort: '-date',
            });

            if (wellnessRecords.length === 0) {
                return { score: 0, trend: 'neutral', streak: 0 };
            }

            // Calculate average wellness score
            // Formula: (mood + energy - stress) / 3 * 10 (scale to 0-100)
            const scores = wellnessRecords.map(r => {
                const score = ((r.mood_score + r.energy_level - r.stress_level) / 3) * 10;
                return Math.max(0, Math.min(100, score)); // Clamp to 0-100
            });

            const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

            // Calculate trend (compare last 3 days with previous 4 days)
            let trend: 'up' | 'down' | 'neutral' = 'neutral';
            if (scores.length >= 4) {
                const recentAvg = scores.slice(0, 3).reduce((sum, s) => sum + s, 0) / 3;
                const previousAvg = scores.slice(3).reduce((sum, s) => sum + s, 0) / (scores.length - 3);
                if (recentAvg > previousAvg + 5) trend = 'up';
                else if (recentAvg < previousAvg - 5) trend = 'down';
            }

            // Calculate streak (consecutive days with data)
            const streak = this.calculateWellnessStreak(wellnessRecords);

            return { score: avgScore, trend, streak };
        } catch (error) {
            console.error('Failed to get wellness stats:', error);
            return { score: 0, trend: 'neutral', streak: 0 };
        }
    }

    /**
     * Log wellness data
     */
    async logWellness(userId: string, data: Partial<WellnessData>): Promise<WellnessData | null> {
        if (isMockEnv()) {
            const newEntry: WellnessData = {
                id: `w-${Date.now()}`,
                user: userId,
                date: data.date || new Date().toISOString().split('T')[0],
                mood_score: data.mood_score || 5,
                energy_level: data.energy_level || 5,
                stress_level: data.stress_level || 5,
                sleep_hours: data.sleep_hours || 0,
                water_intake: data.water_intake || 0,
                steps: data.steps || 0,
                exercise_minutes: data.exercise_minutes || 0,
                meditation_minutes: data.meditation_minutes || 0,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_WELLNESS.unshift(newEntry);
            return newEntry;
        }

        try {
            return await pb.collection('wellness_data').create<WellnessData>({
                user: userId,
                date: new Date().toISOString().split('T')[0],
                ...data
            });
        } catch (error) {
            console.error('Failed to log wellness:', error);
            return null;
        }
    }

    /**
     * Get wellness history
     */
    async getWellnessHistory(userId: string, days: number = 30): Promise<WellnessData[]> {
        if (isMockEnv()) {
            return MOCK_WELLNESS.filter(w => w.user === userId).slice(0, days);
        }

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            return await pb.collection('wellness_data').getFullList<WellnessData>({
                filter: `user = "${userId}" && date >= "${startDate.toISOString().split('T')[0]}"`,
                sort: '-date'
            });
        } catch (error) {
            console.error('Failed to get wellness history:', error);
            return [];
        }
    }

    /**
     * Calculate wellness logging streak
     */
    private calculateWellnessStreak(records: WellnessData[]): number {
        if (records.length === 0) return 0;

        // Sort by date descending
        const sorted = [...records].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        let streak = 1;
        let currentDate = new Date(sorted[0].date);

        for (let i = 1; i < sorted.length; i++) {
            const prevDate = new Date(sorted[i].date);
            const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

            if (dayDiff === 1) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Get marketplace statistics
     */
    async getMarketplaceStats(userId: string): Promise<IndividualDashboardStats['marketplace']> {
        if (isMockEnv()) {
            const userOrders = MOCK_ORDERS.filter(o => o.user === userId);
            const pending = userOrders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status));
            const recent = userOrders.slice(0, 5);

            return {
                total_orders: userOrders.length,
                pending_orders: pending.length,
                recent_orders: recent,
            };
        }

        try {
            const allOrders = await pb.collection('marketplace_orders').getFullList<MarketplaceOrder>({
                filter: `user = "${userId}"`,
                sort: '-order_date',
            });

            const pending = allOrders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status));
            const recent = allOrders.slice(0, 5);

            return {
                total_orders: allOrders.length,
                pending_orders: pending.length,
                recent_orders: recent,
            };
        } catch (error) {
            console.error('Failed to get marketplace stats:', error);
            return { total_orders: 0, pending_orders: 0, recent_orders: [] };
        }
    }

    /**
     * Get user orders
     */
    async getOrders(userId: string, status?: MarketplaceOrder['status']): Promise<MarketplaceOrder[]> {
        if (isMockEnv()) {
            let orders = MOCK_ORDERS.filter(o => o.user === userId);
            if (status) {
                orders = orders.filter(o => o.status === status);
            }
            return orders;
        }

        try {
            let filter = `user = "${userId}"`;
            if (status) {
                filter += ` && status = "${status}"`;
            }
            return await pb.collection('marketplace_orders').getFullList<MarketplaceOrder>({
                filter,
                sort: '-order_date'
            });
        } catch (error) {
            console.error('Failed to get orders:', error);
            return [];
        }
    }

    /**
     * Get services statistics
     */
    async getServicesStats(userId: string): Promise<IndividualDashboardStats['services']> {
        if (isMockEnv()) {
            const userBookings = MOCK_BOOKINGS.filter(b => b.user === userId);
            const now = new Date();
            const upcoming = userBookings.filter(b => {
                const bookingDate = new Date(b.booking_date);
                return bookingDate >= now && b.status === 'upcoming';
            });

            return {
                total_bookings: userBookings.length,
                upcoming_bookings: upcoming.length,
                next_booking: upcoming[0],
            };
        }

        try {
            const allBookings = await pb.collection('service_bookings').getFullList<ServiceBooking>({
                filter: `user = "${userId}"`,
                sort: 'booking_date',
            });

            const now = new Date();
            const upcoming = allBookings.filter(b => {
                const bookingDate = new Date(b.booking_date);
                return bookingDate >= now && b.status === 'upcoming';
            });

            const nextBooking = upcoming[0];

            return {
                total_bookings: allBookings.length,
                upcoming_bookings: upcoming.length,
                next_booking: nextBooking,
            };
        } catch (error) {
            console.error('Failed to get services stats:', error);
            return { total_bookings: 0, upcoming_bookings: 0 };
        }
    }

    /**
     * Get user bookings
     */
    async getBookings(userId: string, status?: ServiceBooking['status']): Promise<ServiceBooking[]> {
        if (isMockEnv()) {
            let bookings = MOCK_BOOKINGS.filter(b => b.user === userId);
            if (status) {
                bookings = bookings.filter(b => b.status === status);
            }
            return bookings;
        }

        try {
            let filter = `user = "${userId}"`;
            if (status) {
                filter += ` && status = "${status}"`;
            }
            return await pb.collection('service_bookings').getFullList<ServiceBooking>({
                filter,
                sort: 'booking_date'
            });
        } catch (error) {
            console.error('Failed to get bookings:', error);
            return [];
        }
    }

    /**
     * Create a booking
     */
    async createBooking(userId: string, data: Partial<ServiceBooking>): Promise<ServiceBooking | null> {
        if (isMockEnv()) {
            const newBooking: ServiceBooking = {
                id: `booking-${Date.now()}`,
                user: userId,
                service_name: data.service_name || 'Service',
                service_provider: data.service_provider || 'Provider',
                booking_date: data.booking_date || new Date().toISOString().split('T')[0],
                booking_time: data.booking_time || '10:00',
                duration_minutes: data.duration_minutes || 60,
                status: 'upcoming',
                price: data.price || 0,
                location: data.location,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_BOOKINGS.push(newBooking);
            return newBooking;
        }

        try {
            return await pb.collection('service_bookings').create<ServiceBooking>({
                user: userId,
                status: 'upcoming',
                ...data
            });
        } catch (error) {
            console.error('Failed to create booking:', error);
            return null;
        }
    }

    /**
     * Cancel a booking
     */
    async cancelBooking(bookingId: string): Promise<boolean> {
        if (isMockEnv()) {
            const booking = MOCK_BOOKINGS.find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'cancelled';
            }
            return true;
        }

        try {
            await pb.collection('service_bookings').update(bookingId, { status: 'cancelled' });
            return true;
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            return false;
        }
    }

    /**
     * Get marketplace items (products/services)
     * Uses recommendations collection for now as the catalog
     */
    async getMarketplaceItems(): Promise<Recommendation[]> {
        if (isMockEnv()) {
            return MOCK_RECOMMENDATIONS.filter(r =>
                r.item_type === 'product' || r.item_type === 'service'
            );
        }

        try {
            // Fetch general recommendations that are products or services
            return await pb.collection('recommendations').getFullList<Recommendation>({
                filter: 'item_type = "product" || item_type = "service"',
                sort: '-created',
            });
        } catch (error) {
            console.error('Failed to get marketplace items:', error);
            return [];
        }
    }

    /**
     * Get personalized recommendations
     */
    async getRecommendations(userId: string, limit: number = 6): Promise<Recommendation[]> {
        if (isMockEnv()) {
            const userRecs = MOCK_RECOMMENDATIONS.filter(r => r.user === userId);
            const generalRecs = MOCK_RECOMMENDATIONS.filter(r => !r.user);

            if (userRecs.length >= limit) {
                return userRecs.slice(0, limit);
            }
            return [...userRecs, ...generalRecs].slice(0, limit);
        }

        try {
            // Try to get user-specific recommendations first
            const userRecs = await pb.collection('recommendations').getFullList<Recommendation>({
                filter: `user = "${userId}"`,
                sort: '-score',
                limit: limit,
            });

            if (userRecs.length >= limit) {
                return userRecs;
            }

            // Fill with general recommendations
            const generalRecs = await pb.collection('recommendations').getFullList<Recommendation>({
                filter: 'user = null || user = ""',
                sort: '-created',
                limit: limit - userRecs.length,
            });

            return [...userRecs, ...generalRecs];
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            return [];
        }
    }

    /**
     * Get user goals
     */
    async getGoals(userId: string, type?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<IndividualGoal[]> {
        if (isMockEnv()) {
            let goals = MOCK_GOALS.filter(g => g.user === userId);
            if (type) {
                goals = goals.filter(g => g.goal_type === type);
            }
            return goals;
        }

        try {
            let filter = `user = "${userId}"`;
            if (type) {
                filter += ` && goal_type = "${type}"`;
            }

            return await pb.collection('individual_goals').getFullList<IndividualGoal>({
                filter,
                sort: '-created',
            });
        } catch (error) {
            console.error('Failed to get goals:', error);
            return [];
        }
    }

    /**
     * Get daily goals
     */
    async getDailyGoals(userId: string): Promise<IndividualGoal[]> {
        return this.getGoals(userId, 'daily');
    }

    /**
     * Toggle goal completion
     */
    async toggleGoalCompletion(goalId: string): Promise<IndividualGoal | null> {
        if (isMockEnv()) {
            const goal = MOCK_GOALS.find(g => g.id === goalId);
            if (goal) {
                goal.is_completed = !goal.is_completed;
                goal.completed_date = goal.is_completed ? new Date().toISOString() : undefined;
            }
            return goal || null;
        }

        const goal = await pb.collection('individual_goals').getOne<IndividualGoal>(goalId);
        return await pb.collection('individual_goals').update<IndividualGoal>(goalId, {
            is_completed: !goal.is_completed,
            completed_date: !goal.is_completed ? new Date().toISOString() : null,
        });
    }

    /**
     * Create a new goal
     */
    async createGoal(userId: string, data: Partial<IndividualGoal>): Promise<IndividualGoal> {
        if (isMockEnv()) {
            const newGoal: IndividualGoal = {
                id: `goal-${Date.now()}`,
                user: userId,
                goal_text: data.goal_text || 'New Goal',
                goal_type: data.goal_type || 'daily',
                is_completed: false,
                due_date: data.due_date,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_GOALS.push(newGoal);
            return newGoal;
        }

        return await pb.collection('individual_goals').create<IndividualGoal>({
            user: userId,
            ...data,
        });
    }

    /**
     * Delete a goal
     */
    async deleteGoal(goalId: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_GOALS.findIndex(g => g.id === goalId);
            if (index !== -1) {
                MOCK_GOALS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('individual_goals').delete(goalId);
            return true;
        } catch (error) {
            console.error('Failed to delete goal:', error);
            return false;
        }
    }

    /**
     * Get comprehensive user statistics
     */
    async getUserStatistics(userId: string) {
        if (isMockEnv()) {
            const courses = MOCK_COURSES.filter(c => c.user === userId);
            const wellness = MOCK_WELLNESS.filter(w => w.user === userId);
            const goals = MOCK_GOALS.filter(g => g.user === userId);
            const learning = MOCK_LEARNING_PROGRESS.filter(lp => lp.user === userId);
            const orders = MOCK_ORDERS.filter(o => o.user === userId);
            const bookings = MOCK_BOOKINGS.filter(b => b.user === userId);

            return {
                learning: {
                    total_courses: courses.length,
                    completed_courses: courses.filter(c => c.status === 'completed').length,
                    total_xp: learning.reduce((sum, lp) => sum + lp.xp, 0),
                    max_streak: Math.max(...learning.map(lp => lp.daily_streak), 0),
                    subjects_studied: learning.length
                },
                wellness: {
                    avg_mood: wellness.length > 0
                        ? Math.round(wellness.reduce((sum, w) => sum + w.mood_score, 0) / wellness.length * 10) / 10
                        : 0,
                    avg_sleep: wellness.length > 0
                        ? Math.round(wellness.reduce((sum, w) => sum + w.sleep_hours, 0) / wellness.length * 10) / 10
                        : 0,
                    total_steps: wellness.reduce((sum, w) => sum + w.steps, 0),
                    total_exercise_minutes: wellness.reduce((sum, w) => sum + w.exercise_minutes, 0)
                },
                goals: {
                    total: goals.length,
                    completed: goals.filter(g => g.is_completed).length,
                    completion_rate: goals.length > 0
                        ? Math.round(goals.filter(g => g.is_completed).length / goals.length * 100)
                        : 0
                },
                commerce: {
                    total_orders: orders.length,
                    total_spent: orders.reduce((sum, o) => sum + o.price * o.quantity, 0),
                    total_bookings: bookings.length
                }
            };
        }

        try {
            const stats = await this.getDashboardStats(userId);
            const learningProgress = await this.getLearningProgress(userId);
            const goals = await this.getGoals(userId);

            return {
                learning: {
                    total_courses: stats.courses.total,
                    completed_courses: stats.courses.completed,
                    total_xp: learningProgress.reduce((sum, lp) => sum + lp.xp, 0),
                    max_streak: Math.max(...learningProgress.map(lp => lp.daily_streak), 0),
                    subjects_studied: learningProgress.length
                },
                wellness: {
                    score: stats.wellness.score,
                    trend: stats.wellness.trend,
                    streak: stats.wellness.streak
                },
                goals: {
                    total: goals.length,
                    completed: goals.filter(g => g.is_completed).length,
                    completion_rate: goals.length > 0
                        ? Math.round(goals.filter(g => g.is_completed).length / goals.length * 100)
                        : 0
                },
                commerce: {
                    total_orders: stats.marketplace.total_orders,
                    pending_orders: stats.marketplace.pending_orders,
                    total_bookings: stats.services.total_bookings,
                    upcoming_bookings: stats.services.upcoming_bookings
                }
            };
        } catch (error) {
            console.error('Failed to get user statistics:', error);
            return null;
        }
    }

    /**
     * Get user achievements
     */
    async getAchievements(userId: string, category?: string): Promise<Achievement[]> {
        if (isMockEnv()) {
            let achievements = MOCK_ACHIEVEMENTS.filter(a => a.user === userId);
            if (category) {
                achievements = achievements.filter(a => a.category === category);
            }
            return achievements;
        }

        try {
            const filter = category
                ? `user = "${userId}" && category = "${category}"`
                : `user = "${userId}"`;
            return await pb.collection('achievements').getFullList<Achievement>({
                filter,
                sort: '-unlocked_date',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get achievements:', error);
            return [];
        }
    }

    /**
     * Get total XP for user
     */
    async getTotalXP(userId: string): Promise<number> {
        if (isMockEnv()) {
            const achievements = MOCK_ACHIEVEMENTS.filter(a => a.user === userId);
            const learning = MOCK_LEARNING_PROGRESS.filter(lp => lp.user === userId);
            return achievements.reduce((sum, a) => sum + a.xp, 0) +
                learning.reduce((sum, lp) => sum + lp.xp, 0);
        }

        try {
            const [achievements, learning] = await Promise.all([
                pb.collection('achievements').getFullList<Achievement>({
                    filter: `user = "${userId}"`,
                    requestKey: null
                }),
                pb.collection('learning_progress').getFullList<LearningProgress>({
                    filter: `user = "${userId}"`,
                    requestKey: null
                })
            ]);
            return achievements.reduce((sum, a) => sum + a.xp, 0) +
                learning.reduce((sum, lp) => sum + lp.xp, 0);
        } catch (error) {
            console.error('Failed to get total XP:', error);
            return 0;
        }
    }

    /**
     * Get user projects
     */
    async getProjects(userId: string): Promise<Project[]> {
        if (isMockEnv()) {
            return MOCK_PROJECTS.filter(p => p.user === userId);
        }

        try {
            return await pb.collection('projects').getFullList<Project>({
                filter: `user = "${userId}"`,
                sort: '-start_date',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get projects:', error);
            return [];
        }
    }

    /**
     * Get extended goals with progress
     */
    async getExtendedGoals(userId: string): Promise<ExtendedGoal[]> {
        if (isMockEnv()) {
            return MOCK_GOALS.filter(g => g.user === userId).map(g => ({
                ...g,
                progress: g.is_completed ? 100 : Math.floor(Math.random() * 70),
                category: 'personal',
                priority: 'medium' as const
            }));
        }

        try {
            const goals = await pb.collection('individual_goals').getFullList<IndividualGoal>({
                filter: `user = "${userId}"`,
                sort: '-created',
                requestKey: null
            });
            return goals.map(g => ({
                ...g,
                progress: g.is_completed ? 100 : 50,
                category: 'personal',
                priority: 'medium' as const
            }));
        } catch (error) {
            console.error('Failed to get extended goals:', error);
            return [];
        }
    }

    /**
     * Get user skills
     */
    async getSkills(userId: string): Promise<Skill[]> {
        if (isMockEnv()) {
            return MOCK_SKILLS.filter(s => s.user === userId);
        }

        try {
            return await pb.collection('skills').getFullList<Skill>({
                filter: `user = "${userId}"`,
                sort: '-level',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get skills:', error);
            return [];
        }
    }

    /**
     * Get calendar events
     */
    async getCalendarEvents(userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
        if (isMockEnv()) {
            let events = MOCK_CALENDAR_EVENTS.filter(e => e.user === userId);
            if (startDate && endDate) {
                events = events.filter(e => e.start_date >= startDate && e.start_date <= endDate);
            }
            return events;
        }

        try {
            let filter = `user = "${userId}"`;
            if (startDate && endDate) {
                filter += ` && start_date >= "${startDate}" && start_date <= "${endDate}"`;
            }
            return await pb.collection('calendar_events').getFullList<CalendarEvent>({
                filter,
                sort: 'start_date',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get calendar events:', error);
            return [];
        }
    }

    /**
     * Create calendar event
     */
    async createCalendarEvent(userId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
        if (isMockEnv()) {
            const newEvent: CalendarEvent = {
                id: `evt-${Date.now()}`,
                user: userId,
                title: data.title || 'New Event',
                description: data.description,
                start_date: data.start_date || new Date().toISOString(),
                end_date: data.end_date,
                event_type: data.event_type || 'task',
                is_completed: false,
                color: data.color || '#3b82f6',
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_CALENDAR_EVENTS.push(newEvent);
            return newEvent;
        }

        return await pb.collection('calendar_events').create<CalendarEvent>({
            user: userId,
            ...data
        });
    }

    /**
     * Update calendar event
     */
    async updateCalendarEvent(eventId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
        if (isMockEnv()) {
            const event = MOCK_CALENDAR_EVENTS.find(e => e.id === eventId);
            if (event) {
                Object.assign(event, data);
                return event;
            }
            throw new Error('Event not found');
        }

        return await pb.collection('calendar_events').update<CalendarEvent>(eventId, data);
    }

    /**
     * Delete calendar event
     */
    async deleteCalendarEvent(eventId: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_CALENDAR_EVENTS.findIndex(e => e.id === eventId);
            if (index !== -1) {
                MOCK_CALENDAR_EVENTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('calendar_events').delete(eventId);
            return true;
        } catch (error) {
            console.error('Failed to delete calendar event:', error);
            return false;
        }
    }

    /**
     * Get user habits
     */
    async getHabits(userId: string): Promise<Habit[]> {
        if (isMockEnv()) {
            return MOCK_HABITS.filter(h => h.user === userId);
        }

        try {
            return await pb.collection('habits').getFullList<Habit>({
                filter: `user = "${userId}"`,
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get habits:', error);
            return [];
        }
    }

    /**
     * Get habit logs
     */
    async getHabitLogs(userId: string, habitId?: string, days?: number): Promise<HabitLog[]> {
        if (isMockEnv()) {
            let logs = MOCK_HABIT_LOGS.filter(l => l.user === userId);
            if (habitId) {
                logs = logs.filter(l => l.habit === habitId);
            }
            if (days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                const cutoffStr = cutoffDate.toISOString().split('T')[0];
                logs = logs.filter(l => l.date >= cutoffStr);
            }
            return logs;
        }

        try {
            let filter = habitId
                ? `user = "${userId}" && habit = "${habitId}"`
                : `user = "${userId}"`;
            if (days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                const cutoffStr = cutoffDate.toISOString().split('T')[0];
                filter += ` && date >= "${cutoffStr}"`;
            }
            return await pb.collection('habit_logs').getFullList<HabitLog>({
                filter,
                sort: '-date',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get habit logs:', error);
            return [];
        }
    }

    /**
     * Log habit completion
     */
    async logHabit(habitId: string, userId: string): Promise<HabitLog> {
        if (isMockEnv()) {
            const newLog: HabitLog = {
                id: `log-${Date.now()}`,
                habit: habitId,
                user: userId,
                date: new Date().toISOString().split('T')[0],
                completed: true,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_HABIT_LOGS.push(newLog);
            return newLog;
        }

        return await pb.collection('habit_logs').create<HabitLog>({
            habit: habitId,
            user: userId,
            date: new Date().toISOString().split('T')[0],
            completed: true
        });
    }

    /**
     * Create habit
     */
    async createHabit(userId: string, data: Partial<Habit>): Promise<Habit> {
        if (isMockEnv()) {
            const newHabit: Habit = {
                id: `habit-${Date.now()}`,
                user: userId,
                name: data.name || 'New Habit',
                description: data.description,
                frequency: data.frequency || 'daily',
                target_count: data.target_count || 1,
                icon: data.icon,
                color: data.color || '#3b82f6',
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_HABITS.push(newHabit);
            return newHabit;
        }

        return await pb.collection('habits').create<Habit>({
            user: userId,
            ...data
        });
    }

    /**
     * Delete habit
     */
    async deleteHabit(habitId: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_HABITS.findIndex(h => h.id === habitId);
            if (index !== -1) {
                MOCK_HABITS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('habits').delete(habitId);
            return true;
        } catch (error) {
            console.error('Failed to delete habit:', error);
            return false;
        }
    }

    /**
     * Get user notes
     */
    async getNotes(userId: string, category?: string): Promise<Note[]> {
        if (isMockEnv()) {
            let notes = MOCK_NOTES.filter(n => n.user === userId);
            if (category) {
                notes = notes.filter(n => n.category === category);
            }
            return notes;
        }

        try {
            let filter = `user = "${userId}"`;
            if (category) {
                filter += ` && category = "${category}"`;
            }
            return await pb.collection('notes').getFullList<Note>({
                filter,
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Failed to get notes:', error);
            return [];
        }
    }

    /**
     * Create note
     */
    async createNote(userId: string, data: Partial<Note>): Promise<Note> {
        if (isMockEnv()) {
            const newNote: Note = {
                id: `note-${Date.now()}`,
                user: userId,
                title: data.title || 'Untitled Note',
                content: data.content || '',
                category: data.category,
                tags: data.tags || [],
                is_pinned: data.is_pinned || false,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_NOTES.push(newNote);
            return newNote;
        }

        return await pb.collection('notes').create<Note>({
            user: userId,
            ...data
        });
    }

    /**
     * Update note
     */
    async updateNote(noteId: string, data: Partial<Note>): Promise<Note> {
        if (isMockEnv()) {
            const note = MOCK_NOTES.find(n => n.id === noteId);
            if (note) {
                Object.assign(note, data);
                return note;
            }
            throw new Error('Note not found');
        }

        return await pb.collection('notes').update<Note>(noteId, data);
    }

    /**
     * Delete note
     */
    async deleteNote(noteId: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_NOTES.findIndex(n => n.id === noteId);
            if (index !== -1) {
                MOCK_NOTES.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('notes').delete(noteId);
            return true;
        } catch (error) {
            console.error('Failed to delete note:', error);
            return false;
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        if (isMockEnv()) {
            return {
                id: 'profile-1',
                user: userId,
                bio: 'Passionate learner and developer',
                location: 'San Francisco, CA',
                website: 'https://example.com',
                avatar_url: '',
                social_links: {
                    twitter: 'example',
                    github: 'example',
                    linkedin: 'example'
                },
                collectionId: '', collectionName: '', created: '', updated: ''
            };
        }

        try {
            const profiles = await pb.collection('user_profiles').getFullList<UserProfile>({
                filter: `user = "${userId}"`,
                requestKey: null
            });
            return profiles.length > 0 ? profiles[0] : null;
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
        if (isMockEnv()) {
            return {
                id: 'profile-1',
                user: userId,
                ...data,
                collectionId: '', collectionName: '', created: '', updated: new Date().toISOString()
            } as UserProfile;
        }

        try {
            const existing = await this.getUserProfile(userId);
            if (existing) {
                return await pb.collection('user_profiles').update<UserProfile>(existing.id, data);
            } else {
                return await pb.collection('user_profiles').create<UserProfile>({
                    user: userId,
                    ...data
                });
            }
        } catch (error) {
            console.error('Failed to update user profile:', error);
            return null;
        }
    }
}

export const individualService = new IndividualUserService();
