import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { notificationService } from './notificationService';
import { isMockEnv } from '../utils/mockData';
import { auditLog } from './auditLogger';

export interface AssignmentRecord extends RecordModel {
    title: string;
    description: string;
    due_date: string;
    class_id: string;
    teacher_id: string;
    points?: number;
    max_points?: number;
    attachments?: string[];
    status?: 'draft' | 'published' | 'closed';
    submission_type?: 'online' | 'file' | 'both';
    allow_late?: boolean;
    late_penalty?: number;
    rubric?: AssignmentRubric[];
    expand?: {
        class_id?: RecordModel & { name?: string };
        teacher_id?: RecordModel & { name?: string };
    }
}

export interface AssignmentRubric {
    criterion: string;
    description: string;
    points: number;
}

export interface SubmissionRecord extends RecordModel {
    assignment_id: string;
    student_id: string;
    submitted_at: string;
    files?: string[];
    content?: string;
    grade?: number;
    feedback?: string;
    graded_by?: string;
    graded_at?: string;
    notes?: string;
    status?: 'submitted' | 'graded' | 'returned' | 'resubmit';
    is_late?: boolean;
    rubric_scores?: Record<string, number>;
    expand?: {
        student_id?: RecordModel & { name?: string; email?: string };
        assignment_id?: RecordModel & { title?: string };
    }
}

export interface AssignmentStats {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    averageGrade: number;
    lateSubmissions: number;
}

const MOCK_ASSIGNMENTS: AssignmentRecord[] = [
    {
        id: 'assign-1',
        collectionId: 'mock',
        collectionName: 'assignments',
        title: 'Algebra Problem Set 3',
        description: 'Complete problems 1-20 from Chapter 5. Show all work.',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        class_id: 'class-1',
        teacher_id: 'teacher-1',
        points: 100,
        max_points: 100,
        status: 'published',
        submission_type: 'file',
        allow_late: true,
        late_penalty: 10,
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            class_id: { id: 'class-1', collectionId: 'mock', collectionName: 'classes', name: 'Mathematics 101', created: '', updated: '' },
            teacher_id: { id: 'teacher-1', collectionId: 'mock', collectionName: 'users', name: 'Dr. Smith', created: '', updated: '' }
        }
    },
    {
        id: 'assign-2',
        collectionId: 'mock',
        collectionName: 'assignments',
        title: 'Physics Lab Report',
        description: 'Write a lab report on the pendulum experiment. Include data analysis and conclusions.',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        class_id: 'class-2',
        teacher_id: 'teacher-1',
        points: 50,
        max_points: 50,
        status: 'published',
        submission_type: 'both',
        allow_late: false,
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            class_id: { id: 'class-2', collectionId: 'mock', collectionName: 'classes', name: 'Physics 201', created: '', updated: '' },
            teacher_id: { id: 'teacher-1', collectionId: 'mock', collectionName: 'users', name: 'Dr. Smith', created: '', updated: '' }
        }
    },
    {
        id: 'assign-3',
        collectionId: 'mock',
        collectionName: 'assignments',
        title: 'Essay: Climate Change',
        description: 'Write a 1000-word essay discussing the impacts of climate change.',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        class_id: 'class-3',
        teacher_id: 'teacher-2',
        points: 100,
        max_points: 100,
        status: 'closed',
        submission_type: 'online',
        created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_SUBMISSIONS: SubmissionRecord[] = [
    {
        id: 'sub-1',
        collectionId: 'mock',
        collectionName: 'submissions',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        content: 'My completed homework solutions',
        status: 'submitted',
        is_late: false,
        created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            student_id: { id: 'student-1', collectionId: 'mock', collectionName: 'users', name: 'John Smith', email: 'john@school.com', created: '', updated: '' }
        }
    },
    {
        id: 'sub-2',
        collectionId: 'mock',
        collectionName: 'submissions',
        assignment_id: 'assign-3',
        student_id: 'student-1',
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        content: 'Climate change essay content...',
        grade: 92,
        feedback: 'Excellent analysis and well-structured arguments.',
        graded_by: 'teacher-2',
        graded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        is_late: false,
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const assignmentService = {
    /**
     * Get assignments for a teacher
     */
    async getAssignments(teacherId: string, page = 1, perPage = 50) {
        if (isMockEnv()) {
            const filtered = MOCK_ASSIGNMENTS.filter(a => a.teacher_id === teacherId);
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
        return await pb.collection('assignments').getList<AssignmentRecord>(page, perPage, {
            filter: `teacher_id = "${teacherId}"`,
            sort: '-due_date',
            expand: 'class_id',
            requestKey: null
        });
    },

    /**
     * Get all assignments (Admin view)
     */
    async getAllAssignments(page = 1, perPage = 50) {
        if (isMockEnv()) {
            const start = (page - 1) * perPage;
            const items = MOCK_ASSIGNMENTS.slice(start, start + perPage);
            return {
                items,
                page,
                perPage,
                totalItems: MOCK_ASSIGNMENTS.length,
                totalPages: Math.ceil(MOCK_ASSIGNMENTS.length / perPage)
            };
        }
        return await pb.collection('assignments').getList<AssignmentRecord>(page, perPage, {
            sort: '-due_date',
            expand: 'class_id,teacher_id',
            requestKey: null
        });
    },

    /**
     * Get assignments for a class
     */
    async getAssignmentsByClass(classId: string, page = 1, perPage = 50) {
        if (isMockEnv()) {
            const filtered = MOCK_ASSIGNMENTS.filter(a => a.class_id === classId);
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
        return await pb.collection('assignments').getList<AssignmentRecord>(page, perPage, {
            filter: `class_id = "${classId}"`,
            sort: '-due_date',
            expand: 'teacher_id',
            requestKey: null
        });
    },

    /**
     * Get single assignment
     */
    async getAssignment(id: string) {
        if (isMockEnv()) {
            const assignment = MOCK_ASSIGNMENTS.find(a => a.id === id);
            if (!assignment) throw new Error('Assignment not found');
            return assignment;
        }
        return await pb.collection('assignments').getOne<AssignmentRecord>(id, {
            expand: 'class_id,teacher_id',
            requestKey: null
        });
    },

    /**
     * Create assignment
     */
    async createAssignment(data: {
        title: string;
        description: string;
        due_date: string;
        class_id: string;
        teacher_id: string;
        points?: number;
        max_points?: number;
        attachments?: string[];
        status?: 'draft' | 'published' | 'closed';
        submission_type?: 'online' | 'file' | 'both';
        allow_late?: boolean;
        late_penalty?: number;
        rubric?: AssignmentRubric[];
    }) {
        if (isMockEnv()) {
            const newAssignment: AssignmentRecord = {
                id: `assign-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'assignments',
                ...data,
                status: data.status || 'draft',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_ASSIGNMENTS.push(newAssignment);
            auditLog.log('assignment_created', { assignmentId: newAssignment.id, title: data.title }, 'info');
            return newAssignment;
        }

        const assignment = await pb.collection('assignments').create<AssignmentRecord>(data);
        auditLog.log('assignment_created', { assignmentId: assignment.id, title: data.title }, 'info');

        // Notify students in the class
        try {
            const enrollments = await pb.collection('enrollments').getFullList({
                filter: `class = "${data.class_id}"`,
                expand: 'student',
                requestKey: null
            });

            const studentIds = enrollments.map((e: any) => e.student);

            if (studentIds.length > 0) {
                await notificationService.notifyNewAssignment(
                    studentIds,
                    data.title,
                    data.due_date
                );
            }
        } catch (error) {
            console.error('Failed to notify students:', error);
        }

        return assignment;
    },

    /**
     * Update assignment
     */
    async updateAssignment(id: string, data: Partial<AssignmentRecord>) {
        if (isMockEnv()) {
            const index = MOCK_ASSIGNMENTS.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Assignment not found');
            MOCK_ASSIGNMENTS[index] = {
                ...MOCK_ASSIGNMENTS[index],
                ...data,
                updated: new Date().toISOString()
            };
            return MOCK_ASSIGNMENTS[index];
        }
        return await pb.collection('assignments').update<AssignmentRecord>(id, data);
    },

    /**
     * Delete assignment
     */
    async deleteAssignment(id: string) {
        if (isMockEnv()) {
            const index = MOCK_ASSIGNMENTS.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Assignment not found');
            MOCK_ASSIGNMENTS.splice(index, 1);
            // Also delete related submissions
            const subIndices = MOCK_SUBMISSIONS.map((s, i) => s.assignment_id === id ? i : -1).filter(i => i !== -1);
            subIndices.reverse().forEach(i => MOCK_SUBMISSIONS.splice(i, 1));
            auditLog.log('assignment_deleted', { assignmentId: id }, 'info');
            return true;
        }
        await pb.collection('assignments').delete(id);
        auditLog.log('assignment_deleted', { assignmentId: id }, 'info');
        return true;
    },

    /**
     * Publish assignment (change from draft to published)
     */
    async publishAssignment(id: string) {
        const assignment = await this.updateAssignment(id, { status: 'published' });
        auditLog.log('assignment_published', { assignmentId: id }, 'info');
        return assignment;
    },

    /**
     * Close assignment (no more submissions)
     */
    async closeAssignment(id: string) {
        const assignment = await this.updateAssignment(id, { status: 'closed' });
        auditLog.log('assignment_closed', { assignmentId: id }, 'info');
        return assignment;
    },

    /**
     * Get overdue assignments for a class
     */
    async getOverdueAssignments(classId?: string) {
        const now = new Date().toISOString();
        
        if (isMockEnv()) {
            let filtered = MOCK_ASSIGNMENTS.filter(a => 
                a.due_date < now && a.status === 'published'
            );
            if (classId) {
                filtered = filtered.filter(a => a.class_id === classId);
            }
            return filtered;
        }

        const filter = classId 
            ? `class_id = "${classId}" && due_date < "${now}" && status = "published"`
            : `due_date < "${now}" && status = "published"`;

        return await pb.collection('assignments').getFullList<AssignmentRecord>({
            filter,
            sort: '-due_date',
            requestKey: null
        });
    },

    /**
     * Get upcoming assignments (due in next N days)
     */
    async getUpcomingAssignments(days = 7, classId?: string) {
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        if (isMockEnv()) {
            let filtered = MOCK_ASSIGNMENTS.filter(a => {
                const dueDate = new Date(a.due_date);
                return dueDate >= now && dueDate <= future && a.status === 'published';
            });
            if (classId) {
                filtered = filtered.filter(a => a.class_id === classId);
            }
            return filtered;
        }

        const filter = classId 
            ? `class_id = "${classId}" && due_date >= "${now.toISOString()}" && due_date <= "${future.toISOString()}" && status = "published"`
            : `due_date >= "${now.toISOString()}" && due_date <= "${future.toISOString()}" && status = "published"`;

        return await pb.collection('assignments').getFullList<AssignmentRecord>({
            filter,
            sort: 'due_date',
            expand: 'class_id',
            requestKey: null
        });
    },

    /**
     * Get submissions for an assignment
     */
    async getSubmissions(assignmentId: string) {
        if (isMockEnv()) {
            return MOCK_SUBMISSIONS.filter(s => s.assignment_id === assignmentId);
        }
        return await pb.collection('submissions').getFullList<SubmissionRecord>({
            filter: `assignment_id = "${assignmentId}"`,
            expand: 'student_id',
            sort: '-submitted_at',
            requestKey: null
        });
    },

    /**
     * Get submission by ID
     */
    async getSubmission(id: string) {
        if (isMockEnv()) {
            const submission = MOCK_SUBMISSIONS.find(s => s.id === id);
            if (!submission) throw new Error('Submission not found');
            return submission;
        }
        return await pb.collection('submissions').getOne<SubmissionRecord>(id, {
            expand: 'student_id,assignment_id',
            requestKey: null
        });
    },

    /**
     * Grade a submission
     */
    async gradeSubmission(submissionId: string, grade: number, feedback: string, gradedBy: string, rubricScores?: Record<string, number>) {
        if (isMockEnv()) {
            const index = MOCK_SUBMISSIONS.findIndex(s => s.id === submissionId);
            if (index === -1) throw new Error('Submission not found');
            MOCK_SUBMISSIONS[index] = {
                ...MOCK_SUBMISSIONS[index],
                grade,
                feedback,
                graded_by: gradedBy,
                graded_at: new Date().toISOString(),
                status: 'graded',
                rubric_scores: rubricScores,
                updated: new Date().toISOString()
            };
            auditLog.log('submission_graded', { submissionId, grade }, 'info');
            return MOCK_SUBMISSIONS[index];
        }

        const submission = await pb.collection('submissions').update<SubmissionRecord>(submissionId, {
            grade,
            feedback,
            graded_by: gradedBy,
            graded_at: new Date().toISOString(),
            status: 'graded',
            rubric_scores: rubricScores
        });

        auditLog.log('submission_graded', { submissionId, grade }, 'info');

        // Notify student
        try {
            const submissionData = await pb.collection('submissions').getOne(submissionId, {
                expand: 'assignment_id,student_id'
            });

            await notificationService.notifyGradePosted(
                submissionData.student_id,
                submissionData.expand?.assignment_id?.title || 'Assignment',
                grade
            );
        } catch (error) {
            console.error('Failed to notify student:', error);
        }

        return submission;
    },

    /**
     * Bulk grade submissions
     */
    async bulkGradeSubmissions(grades: { submissionId: string; grade: number; feedback?: string }[], gradedBy: string) {
        const results: { success: SubmissionRecord[]; failed: string[] } = { success: [], failed: [] };

        for (const item of grades) {
            try {
                const graded = await this.gradeSubmission(
                    item.submissionId, 
                    item.grade, 
                    item.feedback || '', 
                    gradedBy
                );
                results.success.push(graded);
            } catch (error) {
                results.failed.push(item.submissionId);
            }
        }

        auditLog.log('bulk_grade_completed', { 
            total: grades.length, 
            success: results.success.length, 
            failed: results.failed.length 
        }, 'info');

        return results;
    },

    /**
     * Return submission for revision
     */
    async returnSubmission(submissionId: string, feedback: string, gradedBy: string) {
        if (isMockEnv()) {
            const index = MOCK_SUBMISSIONS.findIndex(s => s.id === submissionId);
            if (index === -1) throw new Error('Submission not found');
            MOCK_SUBMISSIONS[index] = {
                ...MOCK_SUBMISSIONS[index],
                feedback,
                graded_by: gradedBy,
                status: 'returned',
                updated: new Date().toISOString()
            };
            return MOCK_SUBMISSIONS[index];
        }

        return await pb.collection('submissions').update<SubmissionRecord>(submissionId, {
            feedback,
            graded_by: gradedBy,
            status: 'returned'
        });
    },

    /**
     * Get assignments for a student
     */
    async getStudentAssignments(studentId: string) {
        if (isMockEnv()) {
            // In mock mode, return all published assignments
            return MOCK_ASSIGNMENTS.filter(a => a.status === 'published');
        }

        // Get student's enrollments
        const enrollments = await pb.collection('enrollments').getFullList({
            filter: `student = "${studentId}"`,
            requestKey: null
        });

        const classIds = enrollments.map((e: any) => e.class);

        if (classIds.length === 0) {
            return [];
        }

        // Get assignments for those classes
        const filter = classIds.map(id => `class_id = "${id}"`).join(' || ');

        return await pb.collection('assignments').getFullList<AssignmentRecord>({
            filter,
            sort: '-due_date',
            expand: 'class_id,teacher_id',
            requestKey: null
        });
    },

    /**
     * Submit assignment
     */
    async submitAssignment(assignmentId: string, studentId: string, data?: {
        content?: string;
        files?: string[];
        notes?: string;
    }) {
        // Check if submission is late
        const assignment = await this.getAssignment(assignmentId);
        const isLate = new Date() > new Date(assignment.due_date);

        if (isLate && !assignment.allow_late) {
            throw new Error('Late submissions are not allowed for this assignment');
        }

        if (isMockEnv()) {
            const newSubmission: SubmissionRecord = {
                id: `sub-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'submissions',
                assignment_id: assignmentId,
                student_id: studentId,
                submitted_at: new Date().toISOString(),
                content: data?.content,
                files: data?.files,
                notes: data?.notes,
                status: 'submitted',
                is_late: isLate,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_SUBMISSIONS.push(newSubmission);
            auditLog.log('assignment_submitted', { assignmentId, studentId, isLate }, 'info');
            return newSubmission;
        }

        const submission = await pb.collection('submissions').create<SubmissionRecord>({
            assignment_id: assignmentId,
            student_id: studentId,
            submitted_at: new Date().toISOString(),
            content: data?.content,
            files: data?.files,
            notes: data?.notes || '',
            status: 'submitted',
            is_late: isLate
        });

        auditLog.log('assignment_submitted', { assignmentId, studentId, isLate }, 'info');

        // Notify teacher
        try {
            const student = await pb.collection('users').getOne(studentId);
            await notificationService.notifyNewSubmission(
                assignment.teacher_id,
                student.name,
                assignment.title
            );
        } catch (error) {
            console.error('Failed to notify teacher:', error);
        }

        return submission;
    },

    /**
     * Resubmit assignment (after being returned)
     */
    async resubmitAssignment(submissionId: string, data?: {
        content?: string;
        files?: string[];
        notes?: string;
    }) {
        const existing = await this.getSubmission(submissionId);
        
        if (existing.status !== 'returned' && existing.status !== 'resubmit') {
            throw new Error('This submission cannot be resubmitted');
        }

        if (isMockEnv()) {
            const index = MOCK_SUBMISSIONS.findIndex(s => s.id === submissionId);
            if (index === -1) throw new Error('Submission not found');
            MOCK_SUBMISSIONS[index] = {
                ...MOCK_SUBMISSIONS[index],
                content: data?.content || MOCK_SUBMISSIONS[index].content,
                files: data?.files || MOCK_SUBMISSIONS[index].files,
                notes: data?.notes || MOCK_SUBMISSIONS[index].notes,
                submitted_at: new Date().toISOString(),
                status: 'submitted',
                grade: undefined,
                feedback: undefined,
                updated: new Date().toISOString()
            };
            return MOCK_SUBMISSIONS[index];
        }

        return await pb.collection('submissions').update<SubmissionRecord>(submissionId, {
            content: data?.content,
            files: data?.files,
            notes: data?.notes,
            submitted_at: new Date().toISOString(),
            status: 'submitted',
            grade: null,
            feedback: null
        });
    },

    /**
     * Get student's submission for an assignment (returns the latest one)
     */
    async getStudentSubmission(assignmentId: string, studentId: string) {
        if (isMockEnv()) {
            return MOCK_SUBMISSIONS.find(s => 
                s.assignment_id === assignmentId && s.student_id === studentId
            ) || null;
        }

        try {
            return await pb.collection('submissions').getFirstListItem<SubmissionRecord>(
                `assignment_id = "${assignmentId}" && student_id = "${studentId}"`,
                {
                    sort: '-submitted_at',
                    expand: 'assignment_id',
                    requestKey: null
                }
            );
        } catch (error) {
            return null;
        }
    },

    /**
     * Get student's submission history for an assignment
     */
    async getSubmissionHistory(assignmentId: string, studentId: string) {
        if (isMockEnv()) {
            return MOCK_SUBMISSIONS.filter(s => 
                s.assignment_id === assignmentId && s.student_id === studentId
            );
        }
        return await pb.collection('submissions').getFullList<SubmissionRecord>({
            filter: `assignment_id = "${assignmentId}" && student_id = "${studentId}"`,
            sort: '-submitted_at',
            expand: 'assignment_id',
            requestKey: null
        });
    },

    /**
     * Get assignment statistics
     */
    async getAssignmentStats(assignmentId: string): Promise<AssignmentStats> {
        const submissions = await this.getSubmissions(assignmentId);
        
        const graded = submissions.filter(s => s.status === 'graded');
        const grades = graded.map(s => s.grade || 0);
        const averageGrade = grades.length > 0 
            ? grades.reduce((a, b) => a + b, 0) / grades.length 
            : 0;

        return {
            total: submissions.length,
            submitted: submissions.filter(s => s.status === 'submitted').length,
            graded: graded.length,
            pending: submissions.filter(s => s.status === 'submitted').length,
            averageGrade: Math.round(averageGrade * 100) / 100,
            lateSubmissions: submissions.filter(s => s.is_late).length
        };
    },

    /**
     * Get teacher statistics
     */
    async getTeacherStats(teacherId: string) {
        const { items: assignments } = await this.getAssignments(teacherId);
        
        let totalSubmissions = 0;
        let gradedSubmissions = 0;
        let pendingSubmissions = 0;

        for (const assignment of assignments) {
            const stats = await this.getAssignmentStats(assignment.id);
            totalSubmissions += stats.total;
            gradedSubmissions += stats.graded;
            pendingSubmissions += stats.pending;
        }

        return {
            totalAssignments: assignments.length,
            publishedAssignments: assignments.filter(a => a.status === 'published').length,
            draftAssignments: assignments.filter(a => a.status === 'draft').length,
            totalSubmissions,
            gradedSubmissions,
            pendingSubmissions,
            gradingProgress: totalSubmissions > 0 
                ? Math.round((gradedSubmissions / totalSubmissions) * 100) 
                : 100
        };
    },

    /**
     * Clone assignment to another class
     */
    async cloneAssignment(assignmentId: string, targetClassId: string, newTeacherId?: string) {
        const original = await this.getAssignment(assignmentId);
        
        const cloned = await this.createAssignment({
            title: `${original.title} (Copy)`,
            description: original.description,
            due_date: original.due_date,
            class_id: targetClassId,
            teacher_id: newTeacherId || original.teacher_id,
            points: original.points,
            max_points: original.max_points,
            attachments: original.attachments,
            status: 'draft',
            submission_type: original.submission_type,
            allow_late: original.allow_late,
            late_penalty: original.late_penalty,
            rubric: original.rubric
        });

        auditLog.log('assignment_cloned', { originalId: assignmentId, newId: cloned.id }, 'info');
        return cloned;
    },

    /**
     * Export assignment grades
     */
    async exportGrades(assignmentId: string): Promise<{
        assignment: string;
        exportDate: string;
        grades: Array<{
            studentId: string;
            studentName: string;
            grade: number | null;
            feedback: string;
            submittedAt: string;
            isLate: boolean;
        }>;
    }> {
        const assignment = await this.getAssignment(assignmentId);
        const submissions = await this.getSubmissions(assignmentId);

        return {
            assignment: assignment.title,
            exportDate: new Date().toISOString(),
            grades: submissions.map(s => ({
                studentId: s.student_id,
                studentName: s.expand?.student_id?.name || 'Unknown',
                grade: s.grade || null,
                feedback: s.feedback || '',
                submittedAt: s.submitted_at,
                isLate: s.is_late || false
            }))
        };
    }
};
