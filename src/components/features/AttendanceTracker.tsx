import React, { useState, useCallback } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { Logger } from '../../utils/logging';
import AttendanceForm from './attendance/AttendanceForm';
import AttendanceSheet from './attendance/AttendanceSheet';
import LowAttendanceAlert from './attendance/LowAttendanceAlert';

interface AttendanceTrackerProps {
  courseId: string;
  tenantId: string;
  onAttendanceRecorded?: (recordCount: number) => void;
  onError?: (error: string) => void;
}

/**
 * AttendanceTracker: Smart container for attendance management
 * 
 * Business Logic:
 * - Records individual and bulk attendance
 * - Tracks attendance percentages
 * - Identifies low attendance students
 * - Generates reports
 * - Manages form state
 * 
 * Props:
 * - courseId: Course identifier
 * - tenantId: Tenant/school identifier
 * - onAttendanceRecorded: Callback for recorded attendance
 * - onError: Error callback
 */
const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  courseId,
  tenantId,
  onAttendanceRecorded,
  onError,
}) => {
  const logger = React.useRef(new Logger({ enableConsole: true }));

  // State
  const [activeTab, setActiveTab] = useState<'record' | 'report' | 'alerts'>('record');
  const [viewType, setViewType] = useState<'single' | 'bulk'>('single');
  const [isExporting, setIsExporting] = useState(false);

  // Custom hook
  const {
    records,
    stats,
    report,
    lowAttendanceStudents,
    loading,
    error,
    isRecording,
    recordAttendance,
    bulkRecord,
    fetchCourseReport,
    getLowAttendanceStudents,
    exportReport,
    refresh,
  } = useAttendance({
    courseId,
    tenantId,
    autoFetch: true,
  });

  /**
   * Handle recording single attendance
   */
  const handleRecordAttendance = useCallback(
    async (data: {
      studentId: string;
      date: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }) => {
      logger.current.startTimer('attendance-record');

      try {
        logger.current.info('Recording attendance', {
          studentId: data.studentId,
          status: data.status,
        });

        await recordAttendance({
          courseId,
          studentId: data.studentId,
          date: data.date,
          status: data.status,
          tenantId,
          notes: data.notes,
        });

        logger.current.endTimer('attendance-record', { success: true });
        onAttendanceRecorded?.(1);
      } catch (err) {
        logger.current.error('Failed to record attendance', err);
        onError?.('Failed to record attendance');
      }
    },
    [courseId, tenantId, recordAttendance, onAttendanceRecorded, onError]
  );

  /**
   * Handle bulk attendance recording
   */
  const handleBulkAttendance = useCallback(
    async (data: {
      date: string;
      records: Array<{
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        notes?: string;
      }>;
    }) => {
      logger.current.startTimer('attendance-bulk');

      try {
        logger.current.info('Recording bulk attendance', {
          count: data.records.length,
          date: data.date,
        });

        const result = await bulkRecord({
          courseId,
          date: data.date,
          records: data.records,
          tenantId,
        });

        logger.current.endTimer('attendance-bulk', {
          succeeded: (result as any).succeeded?.length || 0,
        });

        onAttendanceRecorded?.(data.records.length);
      } catch (err) {
        logger.current.error('Failed to bulk record attendance', err);
        onError?.('Failed to record attendance');
      }
    },
    [courseId, tenantId, bulkRecord, onAttendanceRecorded, onError]
  );

  /**
   * Handle loading report
   */
  const handleLoadReport = useCallback(async () => {
    logger.current.info('Loading course report');
    await fetchCourseReport();
  }, [fetchCourseReport]);

  /**
   * Handle loading low attendance
   */
  const handleLoadLowAttendance = useCallback(
    async (threshold = 80) => {
      logger.current.info('Loading low attendance students', { threshold });
      await getLowAttendanceStudents(threshold);
    },
    [getLowAttendanceStudents]
  );

  /**
   * Handle export
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    logger.current.startTimer('attendance-export');

    try {
      await exportReport();
      logger.current.endTimer('attendance-export', { success: true });
    } catch (err) {
      logger.current.error('Export failed', err);
      onError?.('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  }, [exportReport, onError]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracker</h2>
          <p className="mt-1 text-sm text-gray-600">
            Course: {courseId} | Total Records: {records.length}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !report}
            className="px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-medium">Error: {(error as any).message}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 flex gap-4">
        {['record', 'report', 'alerts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'record' && 'Record'}
            {tab === 'report' && 'Report'}
            {tab === 'alerts' && 'Alerts'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Record Tab */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            {/* View Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('single')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  viewType === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Single Record
              </button>
              <button
                onClick={() => setViewType('bulk')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  viewType === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bulk Record
              </button>
            </div>

            {/* Attendance Form */}
            <AttendanceForm
              courseId={courseId}
              viewType={viewType}
              onSingleSubmit={handleRecordAttendance}
              onBulkSubmit={handleBulkAttendance}
              isLoading={isRecording}
            />
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <button
              onClick={handleLoadReport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading Report...' : 'Generate Report'}
            </button>

            {report && report.length > 0 && (
              <AttendanceSheet
                report={report}
                stats={stats}
              />
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {[75, 80, 90].map((threshold) => (
                <button
                  key={threshold}
                  onClick={() => handleLoadLowAttendance(threshold)}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 disabled:opacity-50"
                >
                  Below {threshold}%
                </button>
              ))}
            </div>

            {lowAttendanceStudents && lowAttendanceStudents.length > 0 && (
              <LowAttendanceAlert
                students={lowAttendanceStudents}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
