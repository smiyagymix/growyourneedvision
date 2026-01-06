import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface GradeRecord extends RecordModel {
    student: string;
    class: string;
    exam?: string;
    assignment?: string;
    score: number;
    max_score: number;
    weight: number;
    type: 'Exam' | 'Assignment' | 'Project' | 'Participation';
    graded_by: string;
    graded_at: string;
    feedback?: string;
    tenantId?: string;
    expand?: {
        student?: RecordModel;
        class?: RecordModel;
        exam?: RecordModel;
        assignment?: RecordModel;
    }
}

export interface CreateGradeData {
    student: string;
    class: string;
    exam?: string;
    assignment?: string;
    score: number;
    max_score: number;
    weight: number;
    type: 'Exam' | 'Assignment' | 'Project' | 'Participation';
    feedback?: string;
    tenantId?: string;
}

const MOCK_GRADES: GradeRecord[] = [
    {
        id: 'grade-1',
        collectionId: 'mock',
        collectionName: 'grades',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        student: 'student-1',
        class: 'class-1',
        score: 85,
        max_score: 100,
        weight: 0.3,
        type: 'Exam',
        graded_by: 'teacher-1',
        graded_at: new Date().toISOString(),
        feedback: 'Good work!'
    },
    {
        id: 'grade-2',
        collectionId: 'mock',
        collectionName: 'grades',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        student: 'student-1',
        class: 'class-1',
        assignment: 'assignment-1',
        score: 92,
        max_score: 100,
        weight: 0.2,
        type: 'Assignment',
        graded_by: 'teacher-1',
        graded_at: new Date().toISOString(),
        feedback: 'Excellent submission'
    }
];

export const gradesService = {
    /**
     * Get all grades with optional filters
     */
    async getGrades(filter?: { studentId?: string; classId?: string; type?: string; tenantId?: string }): Promise<GradeRecord[]> {
        if (isMockEnv()) {
            return MOCK_GRADES.filter(g => {
                if (filter?.studentId && g.student !== filter.studentId) return false;
                if (filter?.classId && g.class !== filter.classId) return false;
                if (filter?.type && g.type !== filter.type) return false;
                return true;
            });
        }

        try {
            const filterParts: string[] = [];
            if (filter?.studentId) filterParts.push(`student = "${filter.studentId}"`);
            if (filter?.classId) filterParts.push(`class = "${filter.classId}"`);
            if (filter?.type) filterParts.push(`type = "${filter.type}"`);
            if (filter?.tenantId) filterParts.push(`tenantId = "${filter.tenantId}"`);

            return await pb.collection('grades').getFullList<GradeRecord>({
                filter: filterParts.join(' && ') || undefined,
                expand: 'student,class,exam,assignment',
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching grades:', error);
            return [];
        }
    },

    /**
     * Get grades for a specific class
     */
    async getClassGrades(classId: string): Promise<GradeRecord[]> {
        if (isMockEnv()) {
            return MOCK_GRADES.filter(g => g.class === classId);
        }

        try {
            return await pb.collection('grades').getFullList<GradeRecord>({
                filter: `class = "${classId}"`,
                expand: 'student,exam,assignment',
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching class grades:', error);
            return [];
        }
    },

    /**
     * Get grades for a specific student
     */
    async getStudentGrades(studentId: string): Promise<GradeRecord[]> {
        if (isMockEnv()) {
            return MOCK_GRADES.filter(g => g.student === studentId);
        }

        try {
            return await pb.collection('grades').getFullList<GradeRecord>({
                filter: `student = "${studentId}"`,
                expand: 'class,exam,assignment',
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching student grades:', error);
            return [];
        }
    },

    /**
     * Get a single grade by ID
     */
    async getGrade(gradeId: string): Promise<GradeRecord | null> {
        if (isMockEnv()) {
            return MOCK_GRADES.find(g => g.id === gradeId) || null;
        }

        try {
            return await pb.collection('grades').getOne<GradeRecord>(gradeId, {
                expand: 'student,class,exam,assignment',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching grade:', error);
            return null;
        }
    },

    /**
     * Submit a grade for a student
     */
    async submitGrade(data: CreateGradeData): Promise<GradeRecord | null> {
        if (isMockEnv()) {
            const newGrade: GradeRecord = {
                id: `grade-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'grades',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                ...data,
                graded_by: 'mock-teacher',
                graded_at: new Date().toISOString()
            };
            MOCK_GRADES.unshift(newGrade);
            return newGrade;
        }

        try {
            const user = pb.authStore.model;
            if (!user) throw new Error("User not authenticated");

            return await pb.collection('grades').create<GradeRecord>({
                ...data,
                graded_by: user.id,
                graded_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error submitting grade:', error);
            return null;
        }
    },

    /**
     * Update an existing grade
     */
    async updateGrade(gradeId: string, data: Partial<CreateGradeData>): Promise<GradeRecord | null> {
        if (isMockEnv()) {
            const idx = MOCK_GRADES.findIndex(g => g.id === gradeId);
            if (idx >= 0) {
                MOCK_GRADES[idx] = {
                    ...MOCK_GRADES[idx],
                    ...data,
                    updated: new Date().toISOString(),
                    graded_at: new Date().toISOString()
                };
                return MOCK_GRADES[idx];
            }
            return null;
        }

        try {
            return await pb.collection('grades').update<GradeRecord>(gradeId, {
                ...data,
                graded_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating grade:', error);
            return null;
        }
    },

    /**
     * Delete a grade
     */
    async deleteGrade(gradeId: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_GRADES.findIndex(g => g.id === gradeId);
            if (idx >= 0) {
                MOCK_GRADES.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection('grades').delete(gradeId);
            return true;
        } catch (error) {
            console.error('Error deleting grade:', error);
            return false;
        }
    },

    /**
     * Bulk submit grades (useful for batch grading)
     */
    async bulkSubmitGrades(grades: CreateGradeData[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const gradeData of grades) {
            const result = await this.submitGrade(gradeData);
            if (result) {
                success++;
            } else {
                failed++;
            }
        }

        return { success, failed };
    },

    /**
     * Calculate average grade for a student in a class
     */
    async calculateStudentAverage(studentId: string, classId: string): Promise<number> {
        const grades = await this.getGrades({ studentId, classId });

        if (grades.length === 0) return 0;

        let totalWeightedScore = 0;
        let totalWeight = 0;

        grades.forEach(grade => {
            const normalizedScore = (grade.score / grade.max_score) * 100;
            totalWeightedScore += normalizedScore * grade.weight;
            totalWeight += grade.weight;
        });

        return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 0;
    },

    /**
     * Calculate class average for a specific assignment/exam
     */
    async calculateAssignmentAverage(classId: string, assignmentId?: string, examId?: string): Promise<number> {
        const grades = await this.getGrades({ classId });
        const filteredGrades = grades.filter(g => {
            if (assignmentId) return g.assignment === assignmentId;
            if (examId) return g.exam === examId;
            return true;
        });

        if (filteredGrades.length === 0) return 0;

        const total = filteredGrades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0);
        return Math.round((total / filteredGrades.length) * 10) / 10;
    },

    /**
     * Get grade distribution for a class
     */
    async getGradeDistribution(classId: string): Promise<{ A: number; B: number; C: number; D: number; F: number }> {
        const grades = await this.getGrades({ classId });
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

        grades.forEach(grade => {
            const percent = (grade.score / grade.max_score) * 100;
            if (percent >= 90) distribution.A++;
            else if (percent >= 80) distribution.B++;
            else if (percent >= 70) distribution.C++;
            else if (percent >= 60) distribution.D++;
            else distribution.F++;
        });

        return distribution;
    }
};
