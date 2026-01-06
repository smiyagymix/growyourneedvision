import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface LessonPlan extends RecordModel {
    title: string;
    subject: string;
    grade_level: string;
    duration: number; // in minutes
    objectives: string[];
    materials: string[];
    activities: string[];
    assessment: string;
    notes?: string;
    date: string;
    teacher: string;
    status?: 'draft' | 'published' | 'completed';
    expand?: {
        teacher?: RecordModel & { name?: string };
    };
}

const MOCK_LESSON_PLANS: LessonPlan[] = [
    {
        id: 'lp-1',
        collectionId: 'mock',
        collectionName: 'lesson_plans',
        title: 'Introduction to Algebra',
        subject: 'Mathematics',
        grade_level: '9',
        duration: 45,
        objectives: [
            'Understand basic algebraic expressions',
            'Solve simple linear equations',
            'Apply algebra to word problems'
        ],
        materials: [
            'Whiteboard and markers',
            'Student workbooks',
            'Calculator'
        ],
        activities: [
            'Warm-up review of previous concepts (5 min)',
            'Introduction to new material (15 min)',
            'Guided practice problems (15 min)',
            'Independent work time (10 min)'
        ],
        assessment: 'Exit ticket with 3 practice problems',
        notes: 'Focus on visual representations for struggling students',
        date: new Date().toISOString().split('T')[0],
        teacher: 'teacher-1',
        status: 'published',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'lp-2',
        collectionId: 'mock',
        collectionName: 'lesson_plans',
        title: 'Cell Biology Basics',
        subject: 'Biology',
        grade_level: '10',
        duration: 50,
        objectives: [
            'Identify parts of a cell',
            'Explain cell membrane function',
            'Compare plant and animal cells'
        ],
        materials: [
            'Microscopes',
            'Cell slides',
            'Diagram handouts'
        ],
        activities: [
            'Cell diagram labeling (10 min)',
            'Microscope observation (20 min)',
            'Group discussion and comparison (15 min)',
            'Wrap-up quiz (5 min)'
        ],
        assessment: 'Lab report due next class',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teacher: 'teacher-1',
        status: 'draft',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'lp-3',
        collectionId: 'mock',
        collectionName: 'lesson_plans',
        title: 'Creative Writing Workshop',
        subject: 'English',
        grade_level: '11',
        duration: 60,
        objectives: [
            'Develop creative writing techniques',
            'Practice descriptive language',
            'Provide peer feedback'
        ],
        materials: [
            'Writing journals',
            'Story prompts cards',
            'Peer review rubric'
        ],
        activities: [
            'Free writing warm-up (10 min)',
            'Mini-lesson on sensory details (10 min)',
            'Writing workshop time (25 min)',
            'Peer sharing and feedback (15 min)'
        ],
        assessment: 'Short story draft due end of week',
        notes: 'Prepare extra prompts for students who finish early',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        teacher: 'teacher-1',
        status: 'completed',
        created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
];

export const lessonPlanService = {
    /**
     * Get all lesson plans for a teacher
     */
    async getTeacherLessonPlans(teacherId: string, page = 1, perPage = 50) {
        if (isMockEnv()) {
            const filtered = MOCK_LESSON_PLANS.filter(lp => lp.teacher === teacherId || teacherId === 'mock-user');
            const start = (page - 1) * perPage;
            const items = filtered.slice(start, start + perPage);
            return {
                items,
                page,
                perPage,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage)
            };
        }

        return await pb.collection('lesson_plans').getList<LessonPlan>(page, perPage, {
            filter: `teacher = "${teacherId}"`,
            sort: '-date',
            requestKey: null
        });
    },

    /**
     * Get a single lesson plan by ID
     */
    async getLessonPlan(id: string) {
        if (isMockEnv()) {
            const plan = MOCK_LESSON_PLANS.find(lp => lp.id === id);
            if (!plan) throw new Error('Lesson plan not found');
            return plan;
        }

        return await pb.collection('lesson_plans').getOne<LessonPlan>(id, {
            expand: 'teacher',
            requestKey: null
        });
    },

    /**
     * Create a new lesson plan
     */
    async createLessonPlan(data: Partial<LessonPlan>) {
        if (isMockEnv()) {
            const newPlan: LessonPlan = {
                id: `lp-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'lesson_plans',
                title: data.title || '',
                subject: data.subject || '',
                grade_level: data.grade_level || '',
                duration: data.duration || 45,
                objectives: data.objectives || [],
                materials: data.materials || [],
                activities: data.activities || [],
                assessment: data.assessment || '',
                notes: data.notes,
                date: data.date || new Date().toISOString().split('T')[0],
                teacher: data.teacher || 'mock-user',
                status: data.status || 'draft',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_LESSON_PLANS.unshift(newPlan);
            return newPlan;
        }

        return await pb.collection('lesson_plans').create<LessonPlan>(data);
    },

    /**
     * Update an existing lesson plan
     */
    async updateLessonPlan(id: string, data: Partial<LessonPlan>) {
        if (isMockEnv()) {
            const index = MOCK_LESSON_PLANS.findIndex(lp => lp.id === id);
            if (index === -1) throw new Error('Lesson plan not found');
            
            MOCK_LESSON_PLANS[index] = {
                ...MOCK_LESSON_PLANS[index],
                ...data,
                updated: new Date().toISOString()
            };
            return MOCK_LESSON_PLANS[index];
        }

        return await pb.collection('lesson_plans').update<LessonPlan>(id, data);
    },

    /**
     * Delete a lesson plan
     */
    async deleteLessonPlan(id: string) {
        if (isMockEnv()) {
            const index = MOCK_LESSON_PLANS.findIndex(lp => lp.id === id);
            if (index !== -1) {
                MOCK_LESSON_PLANS.splice(index, 1);
            }
            return true;
        }

        await pb.collection('lesson_plans').delete(id);
        return true;
    },

    /**
     * Get lesson plans by date range
     */
    async getLessonPlansByDateRange(teacherId: string, startDate: string, endDate: string) {
        if (isMockEnv()) {
            return MOCK_LESSON_PLANS.filter(lp => 
                (lp.teacher === teacherId || teacherId === 'mock-user') &&
                lp.date >= startDate && 
                lp.date <= endDate
            );
        }

        return await pb.collection('lesson_plans').getFullList<LessonPlan>({
            filter: `teacher = "${teacherId}" && date >= "${startDate}" && date <= "${endDate}"`,
            sort: 'date',
            requestKey: null
        });
    },

    /**
     * Duplicate a lesson plan
     */
    async duplicateLessonPlan(id: string, newDate?: string) {
        const original = await this.getLessonPlan(id);
        
        const duplicateData: Partial<LessonPlan> = {
            title: `${original.title} (Copy)`,
            subject: original.subject,
            grade_level: original.grade_level,
            duration: original.duration,
            objectives: [...original.objectives],
            materials: [...original.materials],
            activities: [...original.activities],
            assessment: original.assessment,
            notes: original.notes,
            date: newDate || new Date().toISOString().split('T')[0],
            teacher: original.teacher,
            status: 'draft'
        };

        return await this.createLessonPlan(duplicateData);
    },

    /**
     * Get lesson plan statistics for a teacher
     */
    async getTeacherStats(teacherId: string) {
        let plans: LessonPlan[];

        if (isMockEnv()) {
            plans = MOCK_LESSON_PLANS.filter(lp => lp.teacher === teacherId || teacherId === 'mock-user');
        } else {
            plans = await pb.collection('lesson_plans').getFullList<LessonPlan>({
                filter: `teacher = "${teacherId}"`,
                requestKey: null
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);

        return {
            total: plans.length,
            draft: plans.filter(p => p.status === 'draft').length,
            published: plans.filter(p => p.status === 'published').length,
            completed: plans.filter(p => p.status === 'completed').length,
            upcoming: plans.filter(p => p.date >= today).length,
            thisMonth: plans.filter(p => p.date.startsWith(thisMonth)).length,
            bySubject: plans.reduce((acc, p) => {
                acc[p.subject] = (acc[p.subject] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };
    }
};
