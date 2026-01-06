import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface ParentStudentLink extends RecordModel {
    parent: string;
    student: string;
    relationship: string;
    expand?: {
        student?: StudentRecord;
        parent?: ParentRecord;
    }
}

export interface StudentRecord extends RecordModel {
    name: string;
    email: string;
    grade_level: string;
    class_id?: string;
    avatar?: string;
    tenantId?: string;
}

export interface ParentRecord extends RecordModel {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    tenantId?: string;
}

export interface ChildGrade {
    id: string;
    student: string;
    subject: string;
    assignment_name: string;
    score: number;
    max_score: number;
    grade_letter: string;
    teacher: string;
    date: string;
}

export interface ChildAttendance {
    id: string;
    student: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    notes?: string;
}

export interface ChildSchedule {
    id: string;
    student: string;
    day: string;
    class_name: string;
    subject: string;
    teacher: string;
    start_time: string;
    end_time: string;
    room: string;
}



export const parentService = {
    /**
     * Get all children linked to a parent
     */
    async getChildren(parentId: string) {
        try {
            const links = await pb.collection('parent_student_links').getFullList<ParentStudentLink>({
                filter: `parent = "${parentId}"`,
                expand: 'student',
                requestKey: null
            });

            // Return just the student records
            return links.map(link => ({
                ...link.expand?.student,
                linkId: link.id,
                relationship: link.relationship
            })).filter(child => child?.id); // Filter out any where expansion failed
        } catch (error) {
            console.error('Failed to fetch children:', error);
            return [];
        }
    },

    /**
     * Get a specific child by student ID
     */
    async getChildById(parentId: string, studentId: string) {
        try {
            const link = await pb.collection('parent_student_links').getFirstListItem<ParentStudentLink>(
                `parent = "${parentId}" && student = "${studentId}"`,
                { expand: 'student' }
            );
            if (link?.expand?.student) {
                return {
                    ...link.expand.student,
                    linkId: link.id,
                    relationship: link.relationship
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch child:', error);
            return null;
        }
    },

    /**
     * Get grades for a child
     */
    async getChildGrades(studentId: string): Promise<ChildGrade[]> {
        try {
            const grades = await pb.collection('grades').getFullList({
                filter: `student = "${studentId}"`,
                sort: '-date'
            });
            return grades as unknown as ChildGrade[];
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            return [];
        }
    },

    /**
     * Get attendance for a child
     */
    async getChildAttendance(studentId: string, days: number = 30): Promise<ChildAttendance[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const attendance = await pb.collection('attendance').getFullList({
                filter: `student = "${studentId}" && date >= "${startDate.toISOString().split('T')[0]}"`,
                sort: '-date'
            });
            return attendance as unknown as ChildAttendance[];
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            return [];
        }
    },

    /**
     * Get schedule for a child
     */
    async getChildSchedule(studentId: string): Promise<ChildSchedule[]> {
        try {
            const schedule = await pb.collection('class_schedules').getFullList({
                filter: `student = "${studentId}"`,
                sort: 'day,start_time'
            });
            return schedule as unknown as ChildSchedule[];
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
            return [];
        }
    },

    /**
     * Get attendance statistics for a child
     */
    async getAttendanceStats(studentId: string) {
        const attendance = await this.getChildAttendance(studentId, 30);

        const stats = {
            total: attendance.length,
            present: attendance.filter(a => a.status === 'Present').length,
            absent: attendance.filter(a => a.status === 'Absent').length,
            late: attendance.filter(a => a.status === 'Late').length,
            excused: attendance.filter(a => a.status === 'Excused').length,
            attendance_rate: 0
        };

        if (stats.total > 0) {
            stats.attendance_rate = Math.round(((stats.present + stats.late + stats.excused) / stats.total) * 100);
        }

        return stats;
    },

    /**
     * Get grade statistics for a child
     */
    async getGradeStats(studentId: string) {
        const grades = await this.getChildGrades(studentId);

        if (grades.length === 0) {
            return {
                total_assignments: 0,
                average_score: 0,
                highest_score: 0,
                lowest_score: 0,
                subjects: []
            };
        }

        const subjectStats: Record<string, { total: number; count: number }> = {};

        grades.forEach(g => {
            const percentage = (g.score / g.max_score) * 100;
            if (!subjectStats[g.subject]) {
                subjectStats[g.subject] = { total: 0, count: 0 };
            }
            subjectStats[g.subject].total += percentage;
            subjectStats[g.subject].count++;
        });

        const allScores = grades.map(g => (g.score / g.max_score) * 100);

        return {
            total_assignments: grades.length,
            average_score: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length),
            highest_score: Math.round(Math.max(...allScores)),
            lowest_score: Math.round(Math.min(...allScores)),
            subjects: Object.entries(subjectStats).map(([name, stats]) => ({
                name,
                average: Math.round(stats.total / stats.count),
                assignments: stats.count
            }))
        };
    },

    /**
     * Get child dashboard summary
     */
    async getChildDashboard(studentId: string) {
        const [grades, attendance, schedule] = await Promise.all([
            this.getChildGrades(studentId),
            this.getChildAttendance(studentId, 7),
            this.getChildSchedule(studentId)
        ]);

        const recentGrades = grades.slice(0, 5);
        const todaySchedule = schedule.filter(s => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            return s.day === today;
        });

        const attendanceStats = await this.getAttendanceStats(studentId);
        const gradeStats = await this.getGradeStats(studentId);

        return {
            recentGrades,
            recentAttendance: attendance,
            todaySchedule,
            attendanceStats,
            gradeStats
        };
    },

    /**
     * Link a student to a parent (usually done by admin, but maybe useful)
     */
    async linkChild(parentId: string, studentId: string, relationship: string = 'Parent'): Promise<ParentStudentLink | null> {
        try {
            return await pb.collection('parent_student_links').create({
                parent: parentId,
                student: studentId,
                relationship
            });
        } catch (error) {
            console.error('Failed to link child:', error);
            return null;
        }
    },

    /**
     * Unlink a student from a parent
     */
    async unlinkChild(linkId: string): Promise<boolean> {
        try {
            await pb.collection('parent_student_links').delete(linkId);
            return true;
        } catch (error) {
            console.error('Failed to unlink child:', error);
            return false;
        }
    },

    /**
     * Update relationship type
     */
    async updateRelationship(linkId: string, relationship: string): Promise<ParentStudentLink | null> {
        try {
            return await pb.collection('parent_student_links').update(linkId, { relationship });
        } catch (error) {
            console.error('Failed to update relationship:', error);
            return null;
        }
    }
};
