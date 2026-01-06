import pb from '../lib/pocketbase';
import { SchoolClass, Subject, Exam, ExamResult, Enrollment } from '../apps/school/types';
import { retry } from '../hooks/useRetry';
import { auditLog } from './auditLogger';

export const academicsService = {
    // --- Classes ---
    async getClasses() {
        return await retry(() => pb.collection('school_classes').getFullList<SchoolClass>({ sort: '-created', expand: 'teacher' }));
    },
    async getTeacherClasses(teacherId: string) {
        return await retry(() => pb.collection('school_classes').getFullList<SchoolClass>({
            filter: `teacher = "${teacherId}"`,
            sort: '-created',
            expand: 'teacher'
        }));
    },
    async getStudentClasses(studentId: string) {
        return await retry(async () => {
            const enrollments = await pb.collection('enrollments').getFullList<Enrollment>({
                filter: `student = "${studentId}"`,
                expand: 'class,class.teacher'
            });
            return enrollments.map(e => e.expand?.class as SchoolClass).filter(Boolean);
        });
    },
    async createClass(data: Partial<SchoolClass>) {
        const record = await retry(() => pb.collection('school_classes').create(data));
        await auditLog.log('academics.class_create', { class_id: record.id, name: data.name }, 'info');
        return record;
    },
    async updateClass(id: string, data: Partial<SchoolClass>) {
        const record = await retry(() => pb.collection('school_classes').update(id, data));
        await auditLog.log('academics.class_update', { class_id: id }, 'info');
        return record;
    },
    async deleteClass(id: string) {
        const result = await retry(() => pb.collection('school_classes').delete(id));
        await auditLog.log('academics.class_delete', { class_id: id }, 'warning');
        return result;
    },

    // --- Subjects ---
    async getSubjects() {
        return await retry(() => pb.collection('subjects').getFullList<Subject>({ sort: 'name' }));
    },
    async createSubject(data: Partial<Subject>) {
        const record = await retry(() => pb.collection('subjects').create(data));
        await auditLog.log('academics.subject_create', { subject_id: record.id, name: data.name }, 'info');
        return record;
    },
    async updateSubject(id: string, data: Partial<Subject>) {
        const record = await retry(() => pb.collection('subjects').update(id, data));
        await auditLog.log('academics.subject_update', { subject_id: id }, 'info');
        return record;
    },
    async deleteSubject(id: string) {
        const result = await retry(() => pb.collection('subjects').delete(id));
        await auditLog.log('academics.subject_delete', { subject_id: id }, 'warning');
        return result;
    },

    // --- Exams ---
    async getExams() {
        return await retry(() => pb.collection('exams').getFullList<Exam>({ sort: '-date', expand: 'subject,class' }));
    },
    async createExam(data: Partial<Exam>) {
        const record = await retry(() => pb.collection('exams').create(data));
        await auditLog.log('academics.exam_create', { exam_id: record.id, name: data.name }, 'info');
        return record;
    },
    async updateExam(id: string, data: Partial<Exam>) {
        const record = await retry(() => pb.collection('exams').update(id, data));
        await auditLog.log('academics.exam_update', { exam_id: id }, 'info');
        return record;
    },
    async deleteExam(id: string) {
        const result = await retry(() => pb.collection('exams').delete(id));
        await auditLog.log('academics.exam_delete', { exam_id: id }, 'warning');
        return result;
    },

    // --- Grades ---
    async getStudentGrades(studentId: string) {
        return await retry(() => pb.collection('exam_results').getFullList<ExamResult>({
            filter: `student = "${studentId}"`,
            expand: 'exam,exam.subject'
        }));
    },

    async getClassExams(classId: string) {
        return await retry(() => pb.collection('exams').getFullList<Exam>({
            filter: `class = "${classId}"`,
            sort: 'date'
        }));
    },

    async getClassGrades(classId: string) {
        return await retry(async () => {
            const exams = await this.getClassExams(classId);
            if (exams.length === 0) return [];

            const examIds = exams.map(e => `exam = "${e.id}"`).join(' || ');
            return await pb.collection('exam_results').getFullList<ExamResult>({
                filter: examIds,
                expand: 'student,exam'
            });
        });
    },

    async getExamResults(examId: string) {
        return await retry(() => pb.collection('exam_results').getFullList<ExamResult>({
            filter: `exam = "${examId}"`,
            expand: 'student'
        }));
    },

    async updateGrade(resultId: string, marks: number) {
        const record = await retry(() => pb.collection('exam_results').update(resultId, { marks_obtained: marks }));
        await auditLog.log('academics.grade_update', { result_id: resultId, marks }, 'info');
        return record;
    },

    async createGrade(data: Partial<ExamResult>) {
        const record = await retry(() => pb.collection('exam_results').create(data));
        await auditLog.log('academics.grade_create', { exam_id: data.exam, student_id: data.student, marks: data.marks_obtained }, 'info');
        return record;
    },

    // --- Stats ---
    async getStats() {
        return await retry(async () => {
            const students = await pb.collection('users').getList(1, 1, { filter: 'role = "Student"' });
            const teachers = await pb.collection('users').getList(1, 1, { filter: 'role = "Teacher"' });
            return {
                totalStudents: students.totalItems,
                totalTeachers: teachers.totalItems
            };
        });
    }
};
