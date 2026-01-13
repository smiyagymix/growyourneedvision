/**
 * Grade Service - Complete Grading and Assessment Management
 * Handles grading logic, calculations, reporting with real business rules
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { Logger } from '../utils/logging';
import { ErrorFactory, normalizeError } from '../utils/errorHandling';
import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

export type GradeScale = 'A' | 'B' | 'C' | 'D' | 'F' | 'Pass' | 'Fail';

export interface Grade extends RecordModel {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  tenantId: string;
  componentGrades: {
    assignments: number;
    midterm: number;
    final: number;
    participation: number;
  };
  weights: {
    assignments: number;
    midterm: number;
    final: number;
    participation: number;
  };
  finalScore: number;
  letterGrade: GradeScale;
  gpa?: number;
  status: 'in-progress' | 'final' | 'submitted';
  recordedBy: string;
  recordedDate: string;
  created: string;
  updated: string;
}

export interface GradeCreatePayload {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  tenantId: string;
  componentGrades: Grade['componentGrades'];
  weights?: Grade['weights'];
  recordedBy: string;
}

export interface GradeUpdatePayload {
  componentGrades?: Grade['componentGrades'];
  weights?: Grade['weights'];
}

// Default grading scale
const DEFAULT_GRADING_SCALE: Record<number, GradeScale> = {
  90: 'A',
  80: 'B',
  70: 'C',
  60: 'D',
  0: 'F',
};

// Zod schemas
const GradeCreateSchema = z.object({
  enrollmentId: z.string().min(1),
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  tenantId: z.string().min(1),
  componentGrades: z.object({
    assignments: z.number().min(0).max(100),
    midterm: z.number().min(0).max(100),
    final: z.number().min(0).max(100),
    participation: z.number().min(0).max(100),
  }),
  weights: z.optional(
    z.object({
      assignments: z.number().min(0).max(1),
      midterm: z.number().min(0).max(1),
      final: z.number().min(0).max(1),
      participation: z.number().min(0).max(1),
    })
  ),
  recordedBy: z.string().min(1),
});

// ============================================================================
// GRADE SERVICE
// ============================================================================

export class GradeService {
  private logger: Logger;
  private defaultWeights: Grade['weights'] = {
    assignments: 0.3,
    midterm: 0.2,
    final: 0.4,
    participation: 0.1,
  };

  constructor() {
    this.logger = new Logger({ enableConsole: true });
  }

  /**
   * Calculate final score from components
   */
  private calculateFinalScore(
    components: Grade['componentGrades'],
    weights: Grade['weights'] = this.defaultWeights
  ): number {
    const sum =
      components.assignments * weights.assignments +
      components.midterm * weights.midterm +
      components.final * weights.final +
      components.participation * weights.participation;

    return Math.round(sum * 100) / 100;
  }

  /**
   * Convert score to letter grade
   */
  private scoreToLetterGrade(score: number): GradeScale {
    for (const [threshold, grade] of Object.entries(DEFAULT_GRADING_SCALE).sort(
      (a, b) => parseInt(b[0]) - parseInt(a[0])
    )) {
      if (score >= parseInt(threshold)) {
        return grade as GradeScale;
      }
    }
    return 'F';
  }

  /**
   * Convert letter grade to GPA
   */
  private letterGradeToGPA(grade: GradeScale): number {
    const gpaScale: Record<GradeScale, number> = {
      A: 4.0,
      B: 3.0,
      C: 2.0,
      D: 1.0,
      F: 0.0,
      Pass: 3.5,
      Fail: 0.0,
    };
    return gpaScale[grade];
  }

  /**
   * Record grade
   */
  async recordGrade(payload: GradeCreatePayload): Promise<Grade> {
    this.logger.startTimer('record-grade');

    try {
      const validated = GradeCreateSchema.parse(payload);
      const weights = validated.weights || this.defaultWeights;

      // Calculate final score
      const finalScore = this.calculateFinalScore(validated.componentGrades, weights);
      const letterGrade = this.scoreToLetterGrade(finalScore);
      const gpa = this.letterGradeToGPA(letterGrade);

      // Check if grade already exists
      const existing = await this.getGradeByEnrollment(validated.enrollmentId);
      if (existing) {
        throw ErrorFactory.conflict('Grade already recorded for this enrollment');
      }

      const grade = await pb.collection('grades').create<Grade>({
        ...validated,
        weights,
        finalScore,
        letterGrade,
        gpa,
        status: 'in-progress',
        recordedDate: new Date().toISOString(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });

      this.logger.endTimer('record-grade', {
        gradeId: grade.id,
        studentId: grade.studentId,
        finalScore,
        letterGrade,
      });

      return grade;
    } catch (error) {
      const appError = normalizeError(error, undefined, { payload });
      this.logger.error('Failed to record grade', appError);
      throw appError;
    }
  }

  /**
   * Get grade by ID
   */
  async getGradeById(gradeId: string): Promise<Grade | null> {
    try {
      const grade = await pb.collection('grades').getOne<Grade>(gradeId, {
        requestKey: null,
      });
      return grade;
    } catch (error) {
      if ((error as any).status === 404) {
        return null;
      }
      const appError = normalizeError(error, undefined, { gradeId });
      this.logger.error('Failed to get grade', appError);
      throw appError;
    }
  }

  /**
   * Get grade by enrollment
   */
  async getGradeByEnrollment(enrollmentId: string): Promise<Grade | null> {
    try {
      const results = await pb.collection('grades').getList<Grade>(1, 1, {
        filter: `enrollmentId = "${enrollmentId}"`,
        requestKey: null,
      });
      return results.items[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get student grades for course
   */
  async getStudentGradesByCourse(studentId: string, courseId: string): Promise<Grade | null> {
    try {
      const results = await pb.collection('grades').getList<Grade>(1, 1, {
        filter: `studentId = "${studentId}" && courseId = "${courseId}"`,
        requestKey: null,
      });
      return results.items[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all grades for course
   */
  async getGradesByCourse(
    courseId: string,
    options?: { page?: number; perPage?: number }
  ): Promise<Grade[]> {
    try {
      const page = options?.page || 1;
      const perPage = options?.perPage || 100;

      const results = await pb.collection('grades').getList<Grade>(page, perPage, {
        filter: `courseId = "${courseId}"`,
        sort: '-finalScore',
        requestKey: null,
      });

      return results.items;
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId });
      this.logger.error('Failed to get course grades', appError);
      return [];
    }
  }

  /**
   * Update grade
   */
  async updateGrade(gradeId: string, payload: GradeUpdatePayload): Promise<Grade> {
    this.logger.startTimer('update-grade');

    try {
      const grade = await this.getGradeById(gradeId);
      if (!grade) {
        throw ErrorFactory.notFound('Grade', gradeId);
      }

      // Recalculate scores
      const components = payload.componentGrades || grade.componentGrades;
      const weights = payload.weights || grade.weights;

      const finalScore = this.calculateFinalScore(components, weights);
      const letterGrade = this.scoreToLetterGrade(finalScore);
      const gpa = this.letterGradeToGPA(letterGrade);

      const updated = await pb.collection('grades').update<Grade>(gradeId, {
        ...payload,
        finalScore,
        letterGrade,
        gpa,
        updated: new Date().toISOString(),
      });

      this.logger.endTimer('update-grade', {
        gradeId,
        finalScore,
        letterGrade,
      });

      return updated;
    } catch (error) {
      const appError = normalizeError(error, undefined, { gradeId, ...payload });
      this.logger.error('Failed to update grade', appError);
      throw appError;
    }
  }

  /**
   * Submit grades (mark as final)
   */
  async submitGrades(gradeIds: string[], submittedBy: string): Promise<void> {
    this.logger.startTimer('submit-grades');

    const results = await Promise.allSettled(
      gradeIds.map((id) =>
        pb.collection('grades').update(id, {
          status: 'submitted',
          recordedBy: submittedBy,
          updated: new Date().toISOString(),
        })
      )
    );

    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      this.logger.warn(`Submitted ${gradeIds.length - failed} grades, ${failed} failed`);
    }

    this.logger.endTimer('submit-grades', { gradeCount: gradeIds.length });
  }

  /**
   * Get class statistics
   */
  async getClassStatistics(courseId: string): Promise<{
    courseId: string;
    totalStudents: number;
    averageScore: number | null;
    medianScore: number | null;
    highestScore: number;
    lowestScore: number;
    gradeDistribution: Record<GradeScale, number>;
  }> {
    try {
      const grades = await this.getGradesByCourse(courseId);

      if (grades.length === 0) {
        return {
          courseId,
          totalStudents: 0,
          averageScore: null,
          medianScore: null,
          highestScore: 0,
          lowestScore: 0,
          gradeDistribution: {
            A: 0,
            B: 0,
            C: 0,
            D: 0,
            F: 0,
            Pass: 0,
            Fail: 0,
          },
        };
      }

      const scores = grades.map((g) => g.finalScore).sort((a, b) => a - b);
      const distribution: Record<GradeScale, number> = {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0,
        Pass: 0,
        Fail: 0,
      };

      grades.forEach((g) => {
        distribution[g.letterGrade]++;
      });

      const median =
        scores.length % 2 === 0
          ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
          : scores[Math.floor(scores.length / 2)];

      return {
        courseId,
        totalStudents: grades.length,
        averageScore: scores.reduce((a, b) => a + b) / scores.length,
        medianScore: median,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        gradeDistribution: distribution,
      };
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId });
      this.logger.error('Failed to get class statistics', appError);
      throw appError;
    }
  }

  /**
   * Get student transcript
   */
  async getStudentTranscript(
    studentId: string,
    tenantId: string
  ): Promise<{
    studentId: string;
    totalCourses: number;
    completedCourses: number;
    gpa: number | null;
    courses: Grade[];
  }> {
    try {
      const grades = await pb.collection('grades').getList<Grade>(1, 1000, {
        filter: `studentId = "${studentId}" && tenantId = "${tenantId}"`,
        sort: '-recordedDate',
        requestKey: null,
      });

      const gpaValues = grades
        .filter((g) => g.gpa !== undefined)
        .map((g) => g.gpa as number);

      const gpa =
        gpaValues.length > 0 ? gpaValues.reduce((a, b) => a + b) / gpaValues.length : null;

      return {
        studentId,
        totalCourses: grades.items.length,
        completedCourses: grades.items.filter((g) => g.status === 'submitted').length,
        gpa,
        courses: grades.items,
      };
    } catch (error) {
      const appError = normalizeError(error, undefined, { studentId, tenantId });
      this.logger.error('Failed to get transcript', appError);
      throw appError;
    }
  }

  /**
   * Export grades as CSV
   */
  async exportGradesByCourse(courseId: string): Promise<string> {
    try {
      const grades = await this.getGradesByCourse(courseId);

      const headers = [
        'Student ID',
        'Assignments',
        'Midterm',
        'Final',
        'Participation',
        'Final Score',
        'Letter Grade',
        'GPA',
      ];

      const rows = grades.map((g) => [
        g.studentId,
        g.componentGrades.assignments,
        g.componentGrades.midterm,
        g.componentGrades.final,
        g.componentGrades.participation,
        g.finalScore,
        g.letterGrade,
        g.gpa || '',
      ]);

      const csv =
        headers.join(',') +
        '\n' +
        rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return csv;
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId });
      this.logger.error('Failed to export grades', appError);
      throw appError;
    }
  }
}

export const gradeService = new GradeService();

export default gradeService;
