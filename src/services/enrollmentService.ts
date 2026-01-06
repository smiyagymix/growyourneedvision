import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import { auditLog } from './auditLogger';

export interface EnrollmentRecord extends RecordModel {
    student: string;
    class: string;
    enrolled_at: string;
    enrollment_date?: string;
    status?: 'active' | 'completed' | 'dropped' | 'on_hold';
    notes?: string;
    expand?: {
        student?: RecordModel & { name?: string; email?: string };
        class?: RecordModel & { name?: string; teacher?: string };
    }
}

export interface EnrollmentStats {
    total: number;
    active: number;
    completed: number;
    dropped: number;
    recentEnrollments: number;
}

const MOCK_ENROLLMENTS: EnrollmentRecord[] = [
    {
        id: 'enroll-1',
        collectionId: 'mock',
        collectionName: 'enrollments',
        student: 'student-1',
        class: 'class-1',
        enrolled_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            student: { id: 'student-1', collectionId: 'mock', collectionName: 'students', name: 'John Smith', email: 'john@school.com', created: '', updated: '' },
            class: { id: 'class-1', collectionId: 'mock', collectionName: 'classes', name: 'Mathematics 101', created: '', updated: '' }
        }
    },
    {
        id: 'enroll-2',
        collectionId: 'mock',
        collectionName: 'enrollments',
        student: 'student-1',
        class: 'class-2',
        enrolled_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            student: { id: 'student-1', collectionId: 'mock', collectionName: 'students', name: 'John Smith', email: 'john@school.com', created: '', updated: '' },
            class: { id: 'class-2', collectionId: 'mock', collectionName: 'classes', name: 'Physics 201', created: '', updated: '' }
        }
    },
    {
        id: 'enroll-3',
        collectionId: 'mock',
        collectionName: 'enrollments',
        student: 'student-2',
        class: 'class-1',
        enrolled_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            student: { id: 'student-2', collectionId: 'mock', collectionName: 'students', name: 'Jane Doe', email: 'jane@school.com', created: '', updated: '' },
            class: { id: 'class-1', collectionId: 'mock', collectionName: 'classes', name: 'Mathematics 101', created: '', updated: '' }
        }
    }
];

export const enrollmentService = {
    /**
     * Enroll a student in a class
     */
    async enrollStudent(studentId: string, classId: string, notes?: string): Promise<EnrollmentRecord | null> {
        // Check if already enrolled
        const existing = await this.checkEnrollment(studentId, classId);
        if (existing) {
            console.warn('Student is already enrolled in this class');
            return null;
        }

        if (isMockEnv()) {
            const newEnrollment: EnrollmentRecord = {
                id: `enroll-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'enrollments',
                student: studentId,
                class: classId,
                enrolled_at: new Date().toISOString(),
                status: 'active',
                notes,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_ENROLLMENTS.push(newEnrollment);
            return newEnrollment;
        }

        try {
            const record = await pb.collection('enrollments').create({
                student: studentId,
                class: classId,
                enrolled_at: new Date().toISOString(),
                status: 'active',
                notes
            });

            await auditLog.log('enrollment.create', {
                enrollment_id: record.id,
                student_id: studentId,
                class_id: classId
            }, 'info');

            return record as unknown as EnrollmentRecord;
        } catch (error) {
            console.error('Error enrolling student:', error);
            return null;
        }
    },

    /**
     * Check if student is enrolled
     */
    async checkEnrollment(studentId: string, classId: string): Promise<EnrollmentRecord | null> {
        if (isMockEnv()) {
            return MOCK_ENROLLMENTS.find(
                e => e.student === studentId && e.class === classId && e.status !== 'dropped'
            ) || null;
        }

        try {
            const result = await pb.collection('enrollments').getFirstListItem(
                `student = "${studentId}" && class = "${classId}"`,
                { requestKey: null }
            );
            return result as unknown as EnrollmentRecord;
        } catch {
            return null;
        }
    },

    /**
     * Get enrollment by ID
     */
    async getEnrollment(enrollmentId: string): Promise<EnrollmentRecord | null> {
        if (isMockEnv()) {
            return MOCK_ENROLLMENTS.find(e => e.id === enrollmentId) || null;
        }

        try {
            const record = await pb.collection('enrollments').getOne(enrollmentId, {
                expand: 'student,class',
                requestKey: null
            });
            return record as unknown as EnrollmentRecord;
        } catch (error) {
            console.error('Error fetching enrollment:', error);
            return null;
        }
    },

    /**
     * Get enrollments for a class
     */
    async getClassEnrollments(classId: string, page = 1, perPage = 50) {
        if (isMockEnv()) {
            const filtered = MOCK_ENROLLMENTS.filter(e => e.class === classId);
            return {
                page,
                perPage,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage),
                items: filtered.slice((page - 1) * perPage, page * perPage)
            };
        }

        try {
            return await pb.collection('enrollments').getList(page, perPage, {
                filter: `class = "${classId}"`,
                expand: 'student',
                sort: '-enrolled_at',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching class enrollments:', error);
            return { page, perPage, totalItems: 0, totalPages: 0, items: [] };
        }
    },

    /**
     * Get enrollments for a student
     */
    async getStudentEnrollments(studentId: string): Promise<EnrollmentRecord[]> {
        if (isMockEnv()) {
            return MOCK_ENROLLMENTS.filter(e => e.student === studentId);
        }

        try {
            const records = await pb.collection('enrollments').getFullList({
                filter: `student = "${studentId}"`,
                expand: 'class,class.teacher',
                sort: '-enrolled_at',
                requestKey: null
            });
            return records as unknown as EnrollmentRecord[];
        } catch (error) {
            console.error('Error fetching student enrollments:', error);
            return [];
        }
    },

    /**
     * Get active enrollments count for a class
     */
    async getActiveEnrollmentCount(classId: string): Promise<number> {
        if (isMockEnv()) {
            return MOCK_ENROLLMENTS.filter(e => e.class === classId && e.status === 'active').length;
        }

        try {
            const result = await pb.collection('enrollments').getList(1, 1, {
                filter: `class = "${classId}" && status = "active"`,
                requestKey: null
            });
            return result.totalItems;
        } catch (error) {
            console.error('Error counting enrollments:', error);
            return 0;
        }
    },

    /**
     * Update enrollment status
     */
    async updateStatus(enrollmentId: string, status: EnrollmentRecord['status'], notes?: string): Promise<EnrollmentRecord | null> {
        if (isMockEnv()) {
            const idx = MOCK_ENROLLMENTS.findIndex(e => e.id === enrollmentId);
            if (idx >= 0) {
                MOCK_ENROLLMENTS[idx] = {
                    ...MOCK_ENROLLMENTS[idx],
                    status,
                    notes: notes || MOCK_ENROLLMENTS[idx].notes,
                    updated: new Date().toISOString()
                };
                return MOCK_ENROLLMENTS[idx];
            }
            return null;
        }

        try {
            const record = await pb.collection('enrollments').update(enrollmentId, {
                status,
                ...(notes && { notes })
            });

            await auditLog.log('enrollment.status_update', {
                enrollment_id: enrollmentId,
                new_status: status
            }, 'info');

            return record as unknown as EnrollmentRecord;
        } catch (error) {
            console.error('Error updating enrollment status:', error);
            return null;
        }
    },

    /**
     * Withdraw student (set status to dropped)
     */
    async withdrawStudent(enrollmentId: string, reason?: string): Promise<boolean> {
        const result = await this.updateStatus(enrollmentId, 'dropped', reason);
        if (result) {
            await auditLog.log('enrollment.withdraw', {
                enrollment_id: enrollmentId,
                reason
            }, 'warning');
        }
        return result !== null;
    },

    /**
     * Bulk enroll students in a class
     */
    async bulkEnroll(studentIds: string[], classId: string): Promise<{
        successful: string[];
        failed: string[];
        alreadyEnrolled: string[];
    }> {
        const successful: string[] = [];
        const failed: string[] = [];
        const alreadyEnrolled: string[] = [];

        for (const studentId of studentIds) {
            const existing = await this.checkEnrollment(studentId, classId);
            if (existing) {
                alreadyEnrolled.push(studentId);
                continue;
            }

            const result = await this.enrollStudent(studentId, classId);
            if (result) {
                successful.push(studentId);
            } else {
                failed.push(studentId);
            }
        }

        return { successful, failed, alreadyEnrolled };
    },

    /**
     * Get enrollment statistics for a class
     */
    async getClassStats(classId: string): Promise<EnrollmentStats> {
        const enrollments = isMockEnv()
            ? MOCK_ENROLLMENTS.filter(e => e.class === classId)
            : (await this.getClassEnrollments(classId, 1, 1000)).items;

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        return {
            total: enrollments.length,
            active: enrollments.filter(e => e.status === 'active').length,
            completed: enrollments.filter(e => e.status === 'completed').length,
            dropped: enrollments.filter(e => e.status === 'dropped').length,
            recentEnrollments: enrollments.filter(e => e.enrolled_at > thirtyDaysAgo).length
        };
    },

    /**
     * Get all enrollments (for admin)
     */
    async getAllEnrollments(options?: {
        status?: EnrollmentRecord['status'];
        limit?: number;
        offset?: number;
    }): Promise<EnrollmentRecord[]> {
        if (isMockEnv()) {
            let filtered = [...MOCK_ENROLLMENTS];
            if (options?.status) {
                filtered = filtered.filter(e => e.status === options.status);
            }
            return filtered.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 100));
        }

        try {
            const filter = options?.status ? `status = "${options.status}"` : '';
            const records = await pb.collection('enrollments').getList(
                1,
                options?.limit || 100,
                {
                    filter,
                    expand: 'student,class',
                    sort: '-enrolled_at',
                    requestKey: null
                }
            );
            return records.items as unknown as EnrollmentRecord[];
        } catch (error) {
            console.error('Error fetching all enrollments:', error);
            return [];
        }
    },

    /**
     * Transfer student to a different class
     */
    async transferStudent(enrollmentId: string, newClassId: string): Promise<EnrollmentRecord | null> {
        const existing = await this.getEnrollment(enrollmentId);
        if (!existing) return null;

        // Check if already enrolled in new class
        const alreadyInNew = await this.checkEnrollment(existing.student, newClassId);
        if (alreadyInNew) {
            console.warn('Student already enrolled in target class');
            return null;
        }

        // Withdraw from current class
        await this.withdrawStudent(enrollmentId, 'Transferred to another class');

        // Enroll in new class
        return this.enrollStudent(existing.student, newClassId, 'Transferred from another class');
    }
};
