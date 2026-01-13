import React, { useState, useCallback } from 'react';
import { useGrades } from '../../hooks/useGrades';
import { Logger } from '../../utils/logging';
import GradeForm from './grades/GradeForm';
import GradeTable from './grades/GradeTable';
import GradeStats from './grades/GradeStats';

// Strong types to avoid any-casting
type Tab = 'record' | 'view' | 'stats';

interface GradeRecordResult {
  id: string;
  finalScore?: number;
}

// Safe error message extractor
const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as any).message;
    if (typeof m === 'string') return m;
  }
  return 'An unexpected error occurred';
};

interface GradeManagerProps {
  courseId: string;
  tenantId: string;
  onGradeRecorded?: (gradeId: string) => void;
  onError?: (error: string) => void;
}

/**
 * GradeManager: Smart container component managing grade lifecycle
 * 
 * Business Logic:
 * - Records new grades with component validation
 * - Calculates weighted scores and GPA
 * - Displays class statistics and distributions
 * - Exports reports
 * - Manages form state and errors
 * 
 * Props:
 * - courseId: Course identifier
 * - tenantId: Tenant/school identifier
 * - onGradeRecorded: Callback when grade recorded
 * - onError: Error callback
 * 
 * @example
 * ```tsx
 * <GradeManager 
 *   courseId="course123"
 *   tenantId="tenant456"
 *   onGradeRecorded={(id) => console.log('Recorded:', id)}
 * />
 * ```
 */
const GradeManager: React.FC<GradeManagerProps> = ({
  courseId,
  tenantId,
  onGradeRecorded,
  onError,
}) => {
  const logger = React.useRef(new Logger({ enableConsole: true }));

  // State management
  const [activeTab, setActiveTab] = useState<Tab>('record');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Use custom hook
  const {
    grades,
    statistics,
    transcript,
    loading,
    error,
    isRecording,
    recordGrade,
    // updateGrade, // reserved for inline edit feature
    exportGrades,
    refresh,
    getLetterGrade,
    getGPA,
  } = useGrades({
    courseId,
    tenantId,
    autoFetch: true,
  });

  /**
   * Handle recording a new grade
   */
  const handleRecordGrade = useCallback(
    async (formData: {
      studentId: string;
      assignmentScore: number;
      participationScore: number;
      midtermScore: number;
      finalScore: number;
      notes?: string;
    }) => {
      logger.current.startTimer('grade-record-submit');

      try {
        // Avoid logging PII directly
        logger.current.info('Recording grade', {
          courseId,
        });

        const result = (await recordGrade({
          courseId,
          studentId: formData.studentId,
          componentGrades: {
            assignment: formData.assignmentScore,
            participation: formData.participationScore,
            midterm: formData.midtermScore,
            final: formData.finalScore,
          },
          tenantId,
          notes: formData.notes,
        })) as unknown as GradeRecordResult;

        // Show success notice
        setNotice('Grade recorded successfully');

        // Callback
        if (result?.id) {
          onGradeRecorded?.(result.id);
        }

        // Auto-switch to view
        setActiveTab('view');
      } catch (err) {
        const errorMsg = getErrorMessage(err) || 'Failed to record grade';
        logger.current.error('Grade recording failed');
        onError?.(errorMsg);
        setNotice(errorMsg);
      } finally {
        logger.current.endTimer('grade-record-submit');
      }
    },
    [courseId, tenantId, recordGrade, onGradeRecorded, onError]
  );

  /**
   * Handle exporting grades
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setNotice(null);
    logger.current.startTimer('grade-export');

    try {
      // Prefer explicit parameters if hook supports them
      await exportGrades?.({ courseId, tenantId, format: 'csv' } as any);
      setNotice('Grades exported successfully');
      logger.current.info('Grades exported successfully');
    } catch (err) {
      const msg = 'Failed to export grades';
      logger.current.error('Export failed');
      onError?.(msg);
      setNotice(msg);
    } finally {
      logger.current.endTimer('grade-export');
      setIsExporting(false);
    }
  }, [exportGrades, courseId, tenantId, onError]);

  /**
   * Handle refreshing data
   */
  const handleRefresh = useCallback(async () => {
    logger.current.info('Refreshing grade data');
    setNotice(null);
    try {
      await refresh();
      setNotice('Grades refreshed');
    } catch (err) {
      const msg = 'Failed to refresh grades';
      logger.current.error('Refresh failed');
      onError?.(msg);
      setNotice(msg);
    }
  }, [refresh, onError]);

  /**
   * Handle student selection for transcript
   */
  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudent(studentId);
    setActiveTab('stats');
  }, []);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grade Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Course: {courseId} | Total Records: {grades.length}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || grades.length === 0}
            className="px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-medium">Error: {getErrorMessage(error)}</p>
        </div>
      )}

      {notice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
          <p className="text-sm">{notice}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 flex gap-4" role="tablist" aria-label="Grade Manager Tabs">
        {(['record', 'view', 'stats'] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'record' && 'Record Grade'}
            {tab === 'view' && 'View Grades'}
            {tab === 'stats' && 'Statistics'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Record Tab */}
        {activeTab === 'record' && (
          <div id="panel-record" role="tabpanel" aria-labelledby="tab-record" className="space-y-6">
            <GradeForm
              courseId={courseId}
              onSubmit={handleRecordGrade}
              isLoading={isRecording}
              getLetterGrade={getLetterGrade}
              getGPA={getGPA}
            />
          </div>
        )}

        {/* View Tab */}
        {activeTab === 'view' && (
          <div id="panel-view" role="tabpanel" aria-labelledby="tab-view" className="space-y-6">
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading grades...</div>
            ) : grades.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No grades recorded yet</div>
            ) : (
              <GradeTable
                grades={grades}
                getLetterGrade={getLetterGrade}
                getGPA={getGPA}
                onSelectStudent={handleSelectStudent}
              />
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div id="panel-stats" role="tabpanel" aria-labelledby="tab-stats" className="space-y-6">
            {statistics && (
              <>
                <GradeStats
                  statistics={statistics}
                  totalStudents={grades.length}
                  avgScore={statistics.avgScore}
                />
                {/* If a student is selected and transcript is available, show it */}
                {selectedStudent && transcript && (
                  <div className="mt-4 p-4 border rounded">
                    <h3 className="font-semibold mb-2">Student Transcript</h3>
                    <pre className="text-sm text-gray-700 overflow-auto">{JSON.stringify(transcript[selectedStudent] ?? null, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeManager;
