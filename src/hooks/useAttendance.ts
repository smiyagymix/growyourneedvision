import { useState, useCallback, useEffect, useRef } from 'react';
import { attendanceService, AttendanceRecord } from '../services/attendanceService';
import { Logger } from '../utils/logging';
import { normalizeError, AppError } from '../utils/errorHandling';

interface UseAttendanceOptions {
  courseId?: string;
  studentId?: string;
  tenantId?: string;
  autoFetch?: boolean;
  cacheTimeout?: number;
}

interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
  isLowAttendance: boolean;
}

interface AttendanceState {
  records: AttendanceRecord[];
  stats: AttendanceStats | null;
  report: Array<{
    studentId: string;
    studentName: string;
    attendancePercentage: number;
    presentCount: number;
    totalSessions: number;
  }> | null;
  lowAttendanceStudents: Array<{
    studentId: string;
    studentName: string;
    attendancePercentage: number;
  }> | null;
  loading: boolean;
  error: AppError | null;
  isRecording: boolean;
}

interface RecordAttendanceParams {
  courseId: string;
  studentId: string;
  date: string; // YYYY-MM-DD format
  status: 'present' | 'absent' | 'late' | 'excused';
  tenantId: string;
  notes?: string;
}

interface BulkAttendanceParams {
  courseId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;
  tenantId: string;
}

const initialState: AttendanceState = {
  records: [],
  stats: null,
  report: null,
  lowAttendanceStudents: null,
  loading: false,
  error: null,
  isRecording: false,
};

/**
 * Custom hook for managing attendance records and reporting
 * 
 * @example
 * ```tsx
 * const { stats, recordAttendance, bulkRecord, loading } = useAttendance({
 *   courseId: 'course123',
 *   studentId: 'student789',
 *   tenantId: 'tenant456'
 * });
 * 
 * // Record single attendance
 * await recordAttendance({
 *   courseId: 'course123',
 *   studentId: 'student789',
 *   date: '2024-01-15',
 *   status: 'present',
 *   tenantId: 'tenant456'
 * });
 * 
 * // Bulk record for entire class
 * await bulkRecord({
 *   courseId: 'course123',
 *   date: '2024-01-15',
 *   records: [
 *     { studentId: 'student1', status: 'present' },
 *     { studentId: 'student2', status: 'absent' }
 *   ],
 *   tenantId: 'tenant456'
 * });
 * ```
 */
export const useAttendance = (options: UseAttendanceOptions = {}) => {
  const {
    courseId,
    studentId,
    tenantId,
    autoFetch = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [state, setState] = useState<AttendanceState>(initialState);
  const logger = useRef(new Logger({ enableConsole: true }));
  const cacheRef = useRef<{
    timestamp: number;
    records: AttendanceRecord[];
    stats: AttendanceStats | null;
  } | null>(null);

  /**
   * Fetch attendance records for student
   */
  const fetchRecords = useCallback(async () => {
    if (!courseId || !studentId || !tenantId) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(
          new Error('courseId, studentId, and tenantId are required'),
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
      logger.current.info('Using cached attendance records', { courseId, studentId });
      setState((prev) => ({
        ...prev,
        records: cacheRef.current!.records,
        stats: cacheRef.current!.stats,
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    logger.current.startTimer('fetch-attendance-records');

    try {
      const [recordsData, statsData] = await Promise.all([
        attendanceService.recordAttendance({
          courseId,
          studentId,
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          tenantId,
        } as any).then(() => []), // Placeholder for fetch logic
        attendanceService.getStudentAttendanceSummary(courseId, studentId),
      ]);

      const stats: AttendanceStats = {
        totalSessions: (statsData as any).totalSessions || 0,
        presentCount: (statsData as any).presentCount || 0,
        absentCount: ((statsData as any).totalSessions || 0) - ((statsData as any).presentCount || 0),
        lateCount: 0, // This would come from actual record filtering
        attendancePercentage: (statsData as any).attendancePercentage || 0,
        isLowAttendance: ((statsData as any).attendancePercentage || 0) < 80,
      };

      logger.current.endTimer('fetch-attendance-records', {
        recordCount: (recordsData as any).length || 0,
        percentage: stats.attendancePercentage,
      });

      // Cache results
      cacheRef.current = {
        timestamp: Date.now(),
        records: recordsData as AttendanceRecord[],
        stats,
      };

      setState((prev) => ({
        ...prev,
        records: recordsData as AttendanceRecord[],
        stats,
        loading: false,
      }));
    } catch (error) {
      const appError = normalizeError(error, undefined, {
        courseId,
        studentId,
        tenantId,
      });
      logger.current.error('Failed to fetch attendance records', appError);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: appError,
      }));
    }
  }, [courseId, studentId, tenantId, cacheTimeout]);

  /**
   * Record single attendance
   */
  const recordAttendance = useCallback(
    async (params: RecordAttendanceParams) => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
      logger.current.startTimer('record-attendance');

      try {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
          throw new Error('Date must be in YYYY-MM-DD format');
        }

        const result = await attendanceService.recordAttendance({
          courseId: params.courseId,
          studentId: params.studentId,
          date: params.date,
          status: params.status,
          tenantId: params.tenantId,
          notes: params.notes,
        });

        logger.current.endTimer('record-attendance', {
          studentId: params.studentId,
          status: params.status,
        });

        // Invalidate cache
        cacheRef.current = null;

        // Refetch records
        if (params.courseId === courseId && params.studentId === studentId) {
          await fetchRecords();
        }

        setState((prev) => ({ ...prev, isRecording: false }));
        return result;
      } catch (error) {
        const appError = normalizeError(error, undefined, params);
        logger.current.error('Failed to record attendance', appError);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: appError,
        }));
        throw appError;
      }
    },
    [courseId, studentId, fetchRecords]
  );

  /**
   * Record attendance for entire class (bulk operation)
   */
  const bulkRecord = useCallback(
    async (params: BulkAttendanceParams) => {
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
      logger.current.startTimer('bulk-record-attendance');

      try {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
          throw new Error('Date must be in YYYY-MM-DD format');
        }

        const result = await attendanceService.bulkRecordAttendance({
          courseId: params.courseId,
          date: params.date,
          records: params.records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            notes: r.notes,
          })),
          tenantId: params.tenantId,
        } as any);

        logger.current.endTimer('bulk-record-attendance', {
          studentCount: params.records.length,
          succeeded: (result as any).succeeded?.length || 0,
          failed: (result as any).failed?.length || 0,
        });

        // Invalidate cache
        cacheRef.current = null;

        // Refetch if this is for the current course
        if (params.courseId === courseId) {
          await fetchRecords();
        }

        setState((prev) => ({ ...prev, isRecording: false }));
        return result;
      } catch (error) {
        const appError = normalizeError(error, undefined, {
          courseId: params.courseId,
          recordCount: params.records.length,
        });
        logger.current.error('Failed to record bulk attendance', appError);
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: appError,
        }));
        throw appError;
      }
    },
    [courseId, fetchRecords]
  );

  /**
   * Fetch course attendance report
   */
  const fetchCourseReport = useCallback(async () => {
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

    setState((prev) => ({ ...prev, loading: true, error: null }));
    logger.current.startTimer('fetch-attendance-report');

    try {
      const reportData = await attendanceService.getCourseAttendanceReport(
        courseId,
        tenantId
      );

      logger.current.endTimer('fetch-attendance-report', {
        studentCount: (reportData as any)?.length || 0,
      });

      setState((prev) => ({
        ...prev,
        report: (reportData as any) || [],
        loading: false,
      }));
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId, tenantId });
      logger.current.error('Failed to fetch attendance report', appError);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: appError,
      }));
    }
  }, [courseId, tenantId]);

  /**
   * Get low attendance students (below threshold)
   */
  const getLowAttendanceStudents = useCallback(
    async (threshold: number = 80) => {
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

      setState((prev) => ({ ...prev, loading: true, error: null }));
      logger.current.startTimer('get-low-attendance-students');

      try {
        const students = await attendanceService.getLowAttendanceStudents(
          courseId,
          tenantId,
          threshold
        );

        logger.current.endTimer('get-low-attendance-students', {
          count: (students as any)?.length || 0,
          threshold,
        });

        setState((prev) => ({
          ...prev,
          lowAttendanceStudents: (students as any) || [],
          loading: false,
        }));

        return students;
      } catch (error) {
        const appError = normalizeError(error, undefined, {
          courseId,
          tenantId,
          threshold,
        });
        logger.current.error('Failed to get low attendance students', appError);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: appError,
        }));
        throw appError;
      }
    },
    [courseId, tenantId]
  );

  /**
   * Export attendance report as CSV
   */
  const exportReport = useCallback(async () => {
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

    logger.current.startTimer('export-attendance-report');

    try {
      const csv = await attendanceService.exportAttendanceReport(
        courseId,
        tenantId
      );

      logger.current.endTimer('export-attendance-report', {
        csvSize: (csv as any).length,
      });

      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${courseId}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      return csv;
    } catch (error) {
      const appError = normalizeError(error, undefined, { courseId, tenantId });
      logger.current.error('Failed to export attendance report', appError);
      setState((prev) => ({
        ...prev,
        error: appError,
      }));
      throw appError;
    }
  }, [courseId, tenantId]);

  /**
   * Refresh attendance data (invalidate cache and refetch)
   */
  const refresh = useCallback(async () => {
    cacheRef.current = null;
    await fetchRecords();
  }, [fetchRecords]);

  /**
   * Auto-fetch on mount or when dependencies change
   */
  useEffect(() => {
    if (autoFetch && courseId && studentId && tenantId) {
      fetchRecords();
    }
  }, [autoFetch, courseId, studentId, tenantId, fetchRecords]);

  return {
    // State
    records: state.records,
    stats: state.stats,
    report: state.report,
    lowAttendanceStudents: state.lowAttendanceStudents,
    loading: state.loading,
    error: state.error,
    isRecording: state.isRecording,

    // Methods
    fetchRecords,
    recordAttendance,
    bulkRecord,
    fetchCourseReport,
    getLowAttendanceStudents,
    exportReport,
    refresh,

    // Utils
    hasError: state.error !== null,
    isIdle: !state.loading && !state.isRecording,
    isLowAttendance: state.stats?.isLowAttendance ?? false,
  };
};

export default useAttendance;
