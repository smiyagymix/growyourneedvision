import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import { ActivityMetadata } from '../types/activity';

export interface ActivityDetails {
    targetId?: string;
    targetName?: string;
    actionType?: string;
    metadata?: ActivityMetadata;
    role?: string;
    [key: string]: string | number | boolean | ActivityMetadata | undefined;
}

export interface SchoolActivity {
    id: string;
    type: 'Info' | 'Warning' | 'Success' | 'Error';
    message: string;
    time: string; // Relative time string or ISO date
    timestamp: Date;
    details?: ActivityDetails;
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface SchoolStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalParents: number;
    activeStudents: number;
    averageAttendance: number;
}

const MOCK_ACTIVITIES: SchoolActivity[] = [
    {
        id: 'act-1',
        type: 'Info',
        message: 'New Student Registered: Emily Johnson',
        time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        details: { role: 'Student' }
    },
    {
        id: 'act-2',
        type: 'Success',
        message: 'New Class Scheduled: Advanced Mathematics',
        time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
        id: 'act-3',
        type: 'Info',
        message: 'New Teacher Registered: Dr. Michael Chen',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: { role: 'Teacher' }
    },
    {
        id: 'act-4',
        type: 'Warning',
        message: 'Low attendance detected in Class 10-B',
        time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
        id: 'act-5',
        type: 'Success',
        message: 'Grade submission completed for Physics',
        time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
];

const MOCK_GROWTH_DATA: ChartDataPoint[] = (() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data: ChartDataPoint[] = [];
    const now = new Date();
    let value = 50;

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        value += Math.floor(Math.random() * 20) + 5;
        data.push({
            label: monthNames[d.getMonth()],
            value
        });
    }
    return data;
})();

const MOCK_SCHOOL_STATS: SchoolStats = {
    totalStudents: 450,
    totalTeachers: 32,
    totalClasses: 24,
    totalParents: 380,
    activeStudents: 425,
    averageAttendance: 92.5
};

const tenantFilter = () => {
    const t = (pb.authStore.model as RecordModel & { tenantId?: string })?.tenantId;
    return t ? `tenantId = "${t}"` : undefined;
};

export const schoolService = {
    async getRecentActivity(): Promise<SchoolActivity[]> {
        if (isMockEnv()) {
            return MOCK_ACTIVITIES;
        }

        try {
            const filter = tenantFilter();
            const baseQuery = {
                sort: '-created',
                requestKey: null as string | null,
                filter
            };

            const recentUsers = await pb.collection('users').getList(1, 5, baseQuery);

            let recentClasses: RecordModel[] = [];
            try {
                const classesResult = await pb.collection('classes').getList(1, 5, baseQuery);
                recentClasses = classesResult.items;
            } catch (e) {
                console.log("Classes collection might be empty or missing");
            }

            const activities: SchoolActivity[] = [];

            recentUsers.items.forEach(user => {
                activities.push({
                    id: user.id,
                    type: 'Info',
                    message: `New ${user.role} Registered: ${user.name}`,
                    time: user.created,
                    timestamp: new Date(user.created),
                    details: { role: user.role }
                });
            });

            recentClasses.forEach(cls => {
                activities.push({
                    id: cls.id,
                    type: 'Success',
                    message: `New Class Scheduled: ${cls.name}`,
                    time: cls.created,
                    timestamp: new Date(cls.created)
                });
            });

            return activities
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 5);

        } catch (error) {
            console.error("Failed to fetch school activity:", error);
            return MOCK_ACTIVITIES;
        }
    },

    async getGrowthChartData(): Promise<ChartDataPoint[]> {
        if (isMockEnv()) {
            return MOCK_GROWTH_DATA;
        }

        try {
            const filterParts = [] as string[];
            const tf = tenantFilter();
            if (tf) filterParts.push(tf);

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            const start = sixMonthsAgo.toISOString().slice(0, 10) + ' 00:00:00';
            filterParts.push(`created >= "${start}"`);

            const filter = filterParts.join(' && ');

            const usersPage = await pb.collection('users').getList(1, 500, {
                fields: 'created',
                filter,
                sort: 'created',
                requestKey: null
            });

            const allUsers = usersPage.items;
            const months = 6;
            const data: ChartDataPoint[] = [];
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            for (let i = months - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthLabel = monthNames[d.getMonth()];
                const year = d.getFullYear();
                const monthEnd = new Date(year, d.getMonth() + 1, 0);

                const count = allUsers.filter(u => new Date(u.created) <= monthEnd).length;

                data.push({
                    label: monthLabel,
                    value: count
                });
            }

            return data;
        } catch (error) {
            console.error("Failed to fetch growth data:", error);
            return MOCK_GROWTH_DATA;
        }
    },

    async getSchoolStats(): Promise<SchoolStats> {
        if (isMockEnv()) {
            return MOCK_SCHOOL_STATS;
        }

        try {
            const tf = tenantFilter();
            const filter = tf || '';

            const [students, teachers, classes, parents] = await Promise.all([
                pb.collection('users').getList(1, 1, { filter: filter ? `${filter} && role = "Student"` : 'role = "Student"' }),
                pb.collection('users').getList(1, 1, { filter: filter ? `${filter} && role = "Teacher"` : 'role = "Teacher"' }),
                pb.collection('classes').getList(1, 1, { filter }).catch(() => ({ totalItems: 0 })),
                pb.collection('users').getList(1, 1, { filter: filter ? `${filter} && role = "Parent"` : 'role = "Parent"' })
            ]);

            return {
                totalStudents: students.totalItems,
                totalTeachers: teachers.totalItems,
                totalClasses: classes.totalItems,
                totalParents: parents.totalItems,
                activeStudents: Math.floor(students.totalItems * 0.95), // Estimate
                averageAttendance: 92.5 // Would need attendance service integration
            };
        } catch (error) {
            console.error("Failed to fetch school stats:", error);
            return MOCK_SCHOOL_STATS;
        }
    },

    async getClassesByTeacher(teacherId: string): Promise<RecordModel[]> {
        if (isMockEnv()) {
            return [
                { id: 'class-1', collectionId: 'mock', collectionName: 'classes', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Mathematics 101', teacher: teacherId, subject: 'Math' },
                { id: 'class-2', collectionId: 'mock', collectionName: 'classes', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Physics Advanced', teacher: teacherId, subject: 'Physics' }
            ] as RecordModel[];
        }

        try {
            return await pb.collection('classes').getFullList({
                filter: `teacher = "${teacherId}"`,
                sort: 'name'
            });
        } catch (error) {
            console.error("Failed to fetch classes by teacher:", error);
            return [];
        }
    },

    async getStudentsByClass(classId: string): Promise<RecordModel[]> {
        if (isMockEnv()) {
            return [
                { id: 'student-1', collectionId: 'mock', collectionName: 'users', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'John Doe', role: 'Student' },
                { id: 'student-2', collectionId: 'mock', collectionName: 'users', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Jane Smith', role: 'Student' }
            ] as RecordModel[];
        }

        try {
            // This assumes an enrollment or class_students join collection
            const enrollments = await pb.collection('enrollments').getFullList({
                filter: `class = "${classId}"`,
                expand: 'student'
            });
            return enrollments.map((e: RecordModel & { expand?: { student?: RecordModel } }) => e.expand?.student).filter(Boolean) as RecordModel[];
        } catch (error) {
            console.error("Failed to fetch students by class:", error);
            return [];
        }
    },

    async getUpcomingEvents(): Promise<Array<{ id: string; title: string; date: string; type: string }>> {
        if (isMockEnv()) {
            return [
                { id: 'event-1', title: 'Parent-Teacher Meeting', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'meeting' },
                { id: 'event-2', title: 'Science Fair', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'event' },
                { id: 'event-3', title: 'Midterm Exams Begin', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), type: 'exam' }
            ];
        }

        try {
            const tf = tenantFilter();
            const filter = tf
                ? `${tf} && start_date >= "${new Date().toISOString()}"`
                : `start_date >= "${new Date().toISOString()}"`;

            const events = await pb.collection('events').getList(1, 5, {
                filter,
                sort: 'start_date'
            });

            return events.items.map((e: RecordModel & { title?: string; start_date?: string; type?: string }) => ({
                id: e.id,
                title: e.title || 'Untitled Event',
                date: e.start_date || '',
                type: e.type || 'event'
            }));
        } catch (error) {
            console.error("Failed to fetch upcoming events:", error);
            return [];
        }
    }
};
