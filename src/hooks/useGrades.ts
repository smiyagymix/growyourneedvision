import { useState, useCallback, useEffect, useRef } from 'react';
import { gradeService, Grade } from '../services/GradeService';
import { Logger } from '../utils/logging';
import { normalizeError, AppError } from '../utils/errorHandling';

interface UseGradesOptions {
  courseId?: string;
  studentId?: string;
  tenantId?: string;
  autoFetch?: boolean;
  cacheTimeout?: number;
  realtime?: boolean;
}

interface GradesState {
  grades: Grade[];
  statistics: {
    avgScore: number;
    medianScore: number;
    stdDev: number;
    distribution: Record<string, number>;
  } | null;
  transcript: Array<{
    courseId: string;
    courseName: string;
    finalScore: number;
    letterGrade: string;
    gpa: number;
  }> | null;
  loading: boolean;
  error: AppError | null;
  isRecording: boolean;
}

interface RecordGradeParams {
  courseId: string;
  studentId: string;
  componentGrades: Record<string, number>;
  tenantId: string;
  notes?: string;
}

const initialState: GradesState = {
  grades: [],
  statistics: null,
  transcript: null,
  loading: false,
  error: null,
  isRecording: false,
};

/**
 * Custom hook for managing grades with real-time updates
 * 
 * @example
 * ```tsx
 * const { grades, recordGrade, loading, error } = useGrades({
 *   courseId: 'course123',
 *   tenantId: 'tenant456'
 * });
 * 
 * const handleRecord = async () => {
 *   await recordGrade({
 *     courseId: 'course123',
 *     studentId: 'student789',
 *     componentGrades: {
 *       assignment: 85,
 *       participation: 90,
 *       midterm: 88,
 *       final: 92
 *     },
 *     tenantId: 'tenant456'
 *   });
 * };
 * ```
 */
export const useGrades = (options: UseGradesOptions = {}) => {
  const {
    courseId,
    studentId,
    tenantId,
    autoFetch = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    realtime = true,
  } = options;

  const [state, setState] = useState<GradesState>(initialState);
  const logger = useRef(new Logger({ enableConsole: true }));
  const cacheRef = useRef<{
    timestamp: number;
    grades: Grade[];
    statistics: GradesState['statistics'];
  } | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Fetch grades from service with caching
   */
  const fetchGrades = useCallback(async () => {
    if (!courseId || !tenantId) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(
          new Error('courseId and tenantId are required'),
          'MISSING_PARAMS'
        ),
      }));
      return;
    }

    // Check cache
    if (
      cacheRef.current &&
      Date.now() - cacheRef.current.timestamp < cacheTimeout
    ) {
      logger.current.info('Using cached grades', { courseId });
      setState((prev) => ({
        ...prev,
        grades: cacheRef.current!.grades,
        statistics: cacheRef.current!.statistics,
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    logger.current.startTimer('fetch-grades');

    try {
      const [gradesData, stats] = await Promise.all([
        gradeService.getClassStatistics(courseId),
        gradeService.getClassStatistics(courseId),
      ]);

      logger.current.endTimer('fetch-grades', {
        count: gradesData.distribution ? Object.values(gradesData.distribution).reduce((a, b) => a + b, 0) : 0,
      });

      // Cache results
      cacheRef.current = {
        timestamp: Date.now(),
        grades: Array.isArray(gradesData) ? gradesData : [],
        statistics: stats as GradesState['statistics'],
      };

      setState((prev) => ({
        ...prev,
        grades: Array.isArray(gradesData) ? gradesData : [],
        statistics: stats as GradesState['statistics'],
        loading: false,
      }));
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId, tenantId });
      logger.current.error('Failed to fetch grades', appError);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: appError,
      }));
    }
  }, [courseId, tenantId, cacheTimeout]);

  /**
   * Fetch student transcript
   */
  const fetchTranscript = useCallback(async () => {
    if (!studentId || !tenantId) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(
          new Error('studentId and tenantId are required'),
          'MISSING_PARAMS'
        ),
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    logger.current.startTimer('fetch-transcript');

    try {
      const transcriptData = await gradeService.getStudentTranscript(
        studentId,
        tenantId
      );

      logger.current.endTimer('fetch-transcript', {
        courseCount: Array.isArray(transcriptData) ? transcriptData.length : 0,
      });

      setState((prev) => ({
        ...prev,
        transcript: Array.isArray(transcriptData) ? transcriptData : null,
        loading: false,
      }));
    } catch (error) {
      const appError = normalizeError(error, undefined, {
        studentId,
        tenantId,
      });
      logger.current.error('Failed to fetch transcript', appError);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: appError,
      }));
    }
  }, [studentId, tenantId]);

  /**
   * Record a new grade
   */
  const recordGrade = useCallback(
    async (params: RecordGradeParams) => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
      logger.current.startTimer('record-grade');

      try {
        const result = await gradeService.recordGrade({
          courseId: params.courseId,
          studentId: params.studentId,
          componentGrades: params.componentGrades,
          tenantId: params.tenantId,
          notes: params.notes,
        });

        logger.current.endTimer('record-grade', {
          gradeId: (result as any).id,
          finalScore: (result as any).finalScore,
        });

        // Invalidate cache
        cacheRef.current = null;

        // Refetch grades
        await fetchGrades();

        setState((prev) => ({ ...prev, isRecording: false }));
        return result;
      } catch (error) {
        const appError = normalizeError(error, undefined, params);
        logger.current.error('Failed to record grade', appError);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: appError,
        }));
        throw appError;
      }
    },
    [fetchGrades]
  );

  /**
   * Update an existing grade
   */
  const updateGrade = useCallback(
    async (gradeId: string, updates: Partial<RecordGradeParams>) => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
      logger.current.startTimer('update-grade');

      try {
        const result = await gradeService.updateGrade(gradeId, updates as any);

        logger.current.endTimer('update-grade', { gradeId });

        // Invalidate cache
        cacheRef.current = null;

        // Refetch grades
        await fetchGrades();

        setState((prev) => ({ ...prev, isRecording: false }));
        return result;
      } catch (error) {
        const appError = normalizeError(error, undefined, {
          gradeId,
          updates,
        });
        logger.current.error('Failed to update grade', appError);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: appError,
        }));
        throw appError;
      }
    },
    [fetchGrades]
  );

  /**
   * Export grades as CSV
   */
  const exportGrades = useCallback(async () => {
    if (!courseId) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(
          new Error('courseId is required'),
          'MISSING_PARAMS'
        ),
      }));
      return;
    }

    logger.current.startTimer('export-grades');

    try {
      const csv = await gradeService.exportGradesByCourse(courseId);

      logger.current.endTimer('export-grades', {
        csvSize: (csv as any).length,
      });

      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grades-${courseId}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      return csv;
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId });
      logger.current.error('Failed to export grades', appError);
      setState((prev) => ({
        ...prev,
        error: appError,
      }));
      throw appError;
    }
  }, [courseId]);

  /**
   * Get letter grade for a score
   */
  const getLetterGrade = useCallback((score: number): string => {
    return gradeService.scoreToLetterGrade(score);
  }, []);

  /**
   * Get GPA for a letter grade
   */
  const getGPA = useCallback((letterGrade: string): number => {
    return gradeService.letterGradeToGPA(letterGrade);
  }, []);

  /**
   * Refresh grades (invalidate cache and refetch)
   */
  const refresh = useCallback(async () => {
    cacheRef.current = null;
    await fetchGrades();
  }, [fetchGrades]);

  /**
   * Cleanup subscription on unmount
   */
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  /**
   * Auto-fetch on mount or when dependencies change
   */
  useEffect(() => {
    if (autoFetch && courseId && tenantId) {
      fetchGrades();
    }
  }, [autoFetch, courseId, tenantId, fetchGrades]);

  return {
    // State
    grades: state.grades,
    statistics: state.statistics,
    transcript: state.transcript,
    loading: state.loading,
    error: state.error,
    isRecording: state.isRecording,

    // Methods
    fetchGrades,
    fetchTranscript,
    recordGrade,
    updateGrade,
    exportGrades,
    getLetterGrade,
    getGPA,
    refresh,

    // Utils
    hasError: state.error !== null,
    isIdle: !state.loading && !state.isRecording,
  };
};

export default useGrades;
