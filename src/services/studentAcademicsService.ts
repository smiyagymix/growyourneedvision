import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

/**
 * Student Academics Service
 * Handles student GPA calculation, grades, and academic stats
 * Replaces hardcoded values in Student Dashboard
 */

export interface StudentGrade {
    id: string;
    student: string;
    course: string;
    grade: number; // 0-100
    letter_grade?: string; // A, B, C, D, F
    credits?: number;
    semester?: string;
    year?: string;
    score?: number;
    max_score?: number;
    weight?: number;
}

export interface StudentAcademics {
    gpa: number;
    totalCredits: number;
    completedCourses: number;
    currentCourses: number;
}

export interface StudentEnrollment {
    id: string;
    student: string;
    course: string;
    status: 'active' | 'completed' | 'dropped';
    enrolled_at: string;
}

// Mock data
const MOCK_GRADES: StudentGrade[] = [
    {
        id: 'grade-1',
        student: 'student-1',
        course: 'Mathematics 101',
        grade: 92,
        letter_grade: 'A-',
        credits: 3,
        semester: 'Fall 2024',
        year: '2024',
        score: 92,
        max_score: 100,
        weight: 3
    },
    {
        id: 'grade-2',
        student: 'student-1',
        course: 'Physics 201',
        grade: 88,
        letter_grade: 'B+',
        credits: 4,
        semester: 'Fall 2024',
        year: '2024',
        score: 88,
        max_score: 100,
        weight: 4
    },
    {
        id: 'grade-3',
        student: 'student-1',
        course: 'English Literature',
        grade: 95,
        letter_grade: 'A',
        credits: 3,
        semester: 'Fall 2024',
        year: '2024',
        score: 95,
        max_score: 100,
        weight: 3
    },
    {
        id: 'grade-4',
        student: 'student-1',
        course: 'Computer Science',
        grade: 90,
        letter_grade: 'A-',
        credits: 3,
        semester: 'Spring 2024',
        year: '2024',
        score: 90,
        max_score: 100,
        weight: 3
    },
    {
        id: 'grade-5',
        student: 'student-2',
        course: 'Biology 101',
        grade: 85,
        letter_grade: 'B',
        credits: 4,
        semester: 'Fall 2024',
        year: '2024',
        score: 85,
        max_score: 100,
        weight: 4
    }
];

const MOCK_ENROLLMENTS: StudentEnrollment[] = [
    {
        id: 'enroll-1',
        student: 'student-1',
        course: 'Advanced Calculus',
        status: 'active',
        enrolled_at: new Date().toISOString()
    },
    {
        id: 'enroll-2',
        student: 'student-1',
        course: 'Quantum Physics',
        status: 'active',
        enrolled_at: new Date().toISOString()
    },
    {
        id: 'enroll-3',
        student: 'student-1',
        course: 'Data Structures',
        status: 'active',
        enrolled_at: new Date().toISOString()
    },
    {
        id: 'enroll-4',
        student: 'student-2',
        course: 'Chemistry 201',
        status: 'active',
        enrolled_at: new Date().toISOString()
    }
];

class StudentAcademicsService {

    /**
     * Calculate student GPA from grades
     * Uses 4.0 scale by default
     */
    async calculateGPA(studentId: string): Promise<number> {
        if (isMockEnv()) {
            const studentGrades = MOCK_GRADES.filter(g => g.student === studentId);
            if (studentGrades.length === 0) return 3.5; // Default mock GPA

            let totalPoints = 0;
            let totalCredits = 0;

            for (const grade of studentGrades) {
                const credits = grade.weight || grade.credits || 1;
                const percentage = grade.max_score ? (grade.score! / grade.max_score) * 100 : grade.grade;
                const gradePoint = this.convertToGradePoint(percentage);
                totalPoints += gradePoint * credits;
                totalCredits += credits;
            }

            const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
            return Math.round(gpa * 100) / 100;
        }

        try {
            const grades = await pb.collection('grades').getFullList<StudentGrade>({
                filter: `student = "${studentId}"`,
                sort: '-created'
            });

            if (grades.length === 0) {
                return 0;
            }

            let totalPoints = 0;
            let totalCredits = 0;

            for (const grade of grades) {
                const credits = grade.weight || 1;
                const percentage = grade.max_score ? (grade.score! / grade.max_score) * 100 : grade.grade;

                const gradePoint = this.convertToGradePoint(percentage);
                totalPoints += gradePoint * credits;
                totalCredits += credits;
            }

            const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
            return Math.round(gpa * 100) / 100;
        } catch (error) {
            console.error('Failed to calculate GPA:', error);
            return 0;
        }
    }

    /**
     * Convert percentage grade to 4.0 scale grade point
     */
    private convertToGradePoint(percentage: number): number {
        if (percentage >= 93) return 4.0;  // A
        if (percentage >= 90) return 3.7;  // A-
        if (percentage >= 87) return 3.3;  // B+
        if (percentage >= 83) return 3.0;  // B
        if (percentage >= 80) return 2.7;  // B-
        if (percentage >= 77) return 2.3;  // C+
        if (percentage >= 73) return 2.0;  // C
        if (percentage >= 70) return 1.7;  // C-
        if (percentage >= 67) return 1.3;  // D+
        if (percentage >= 65) return 1.0;  // D
        return 0.0;  // F
    }

    /**
     * Get student grades
     */
    async getGrades(studentId: string): Promise<StudentGrade[]> {
        if (isMockEnv()) {
            return MOCK_GRADES.filter(g => g.student === studentId);
        }

        try {
            return await pb.collection('grades').getFullList<StudentGrade>({
                filter: `student = "${studentId}"`,
                sort: '-created'
            });
        } catch (error) {
            console.error('Failed to get grades:', error);
            return [];
        }
    }

    /**
     * Get student enrollments
     */
    async getEnrollments(studentId: string): Promise<StudentEnrollment[]> {
        if (isMockEnv()) {
            return MOCK_ENROLLMENTS.filter(e => e.student === studentId);
        }

        try {
            return await pb.collection('enrollments').getFullList<StudentEnrollment>({
                filter: `student = "${studentId}"`,
                sort: '-enrolled_at'
            });
        } catch (error) {
            console.error('Failed to get enrollments:', error);
            return [];
        }
    }

    /**
     * Get student academic summary
     */
    async getAcademicsSummary(studentId: string): Promise<StudentAcademics> {
        if (isMockEnv()) {
            const studentGrades = MOCK_GRADES.filter(g => g.student === studentId);
            const studentEnrollments = MOCK_ENROLLMENTS.filter(e => e.student === studentId && e.status === 'active');
            const gpa = await this.calculateGPA(studentId);
            const totalCredits = studentGrades.reduce((sum, g) => sum + (g.credits || g.weight || 1), 0);

            return {
                gpa,
                totalCredits,
                completedCourses: studentGrades.length,
                currentCourses: studentEnrollments.length
            };
        }

        try {
            const gpa = await this.calculateGPA(studentId);

            const grades = await pb.collection('grades').getFullList<StudentGrade>({
                filter: `student = "${studentId}"`
            });

            const totalCredits = grades.reduce((sum, g) => sum + (g.weight || 1), 0);

            try {
                const enrollments = await pb.collection('enrollments').getFullList({
                    filter: `student = "${studentId}"`
                });

                return {
                    gpa,
                    totalCredits,
                    completedCourses: grades.length,
                    currentCourses: enrollments.length
                };
            } catch {
                return {
                    gpa,
                    totalCredits,
                    completedCourses: grades.length,
                    currentCourses: 0
                };
            }
        } catch (error) {
            console.error('Failed to get academics summary:', error);
            return {
                gpa: 0,
                totalCredits: 0,
                completedCourses: 0,
                currentCourses: 0
            };
        }
    }

    /**
     * Get grades by semester
     */
    async getGradesBySemester(studentId: string, semester: string): Promise<StudentGrade[]> {
        if (isMockEnv()) {
            return MOCK_GRADES.filter(g => g.student === studentId && g.semester === semester);
        }

        try {
            return await pb.collection('grades').getFullList<StudentGrade>({
                filter: `student = "${studentId}" && semester = "${semester}"`,
                sort: 'course'
            });
        } catch (error) {
            console.error('Failed to get grades by semester:', error);
            return [];
        }
    }

    /**
     * Get GPA history (by semester)
     */
    async getGPAHistory(studentId: string): Promise<{ semester: string; gpa: number }[]> {
        if (isMockEnv()) {
            return [
                { semester: 'Spring 2024', gpa: 3.6 },
                { semester: 'Fall 2024', gpa: 3.7 }
            ];
        }

        try {
            const grades = await pb.collection('grades').getFullList<StudentGrade>({
                filter: `student = "${studentId}"`
            });

            // Group by semester
            const bySemester: Record<string, StudentGrade[]> = {};
            grades.forEach(g => {
                const sem = g.semester || 'Unknown';
                if (!bySemester[sem]) bySemester[sem] = [];
                bySemester[sem].push(g);
            });

            // Calculate GPA for each semester
            return Object.entries(bySemester).map(([semester, semGrades]) => {
                let totalPoints = 0;
                let totalCredits = 0;

                semGrades.forEach(g => {
                    const credits = g.weight || 1;
                    const percentage = g.max_score ? (g.score! / g.max_score) * 100 : g.grade;
                    totalPoints += this.convertToGradePoint(percentage) * credits;
                    totalCredits += credits;
                });

                return {
                    semester,
                    gpa: totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
                };
            });
        } catch (error) {
            console.error('Failed to get GPA history:', error);
            return [];
        }
    }

    /**
     * Get letter grade from percentage
     */
    getLetterGrade(percentage: number): string {
        if (percentage >= 93) return 'A';
        if (percentage >= 90) return 'A-';
        if (percentage >= 87) return 'B+';
        if (percentage >= 83) return 'B';
        if (percentage >= 80) return 'B-';
        if (percentage >= 77) return 'C+';
        if (percentage >= 73) return 'C';
        if (percentage >= 70) return 'C-';
        if (percentage >= 67) return 'D+';
        if (percentage >= 65) return 'D';
        return 'F';
    }
}

export const studentAcademicsService = new StudentAcademicsService();
