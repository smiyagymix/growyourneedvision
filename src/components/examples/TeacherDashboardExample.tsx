import React, { useState, useRef, useCallback } from 'react';
import { Logger } from '@/utils/logger';
import GradeManager from '../GradeManager';
import AttendanceTracker from '../AttendanceTracker';
import NotificationCenter from '../NotificationCenter';

interface TeacherDashboardExampleProps {
  userId: string;
  tenantId: string;
  courseId: string;
}

/**
 * TeacherDashboardExample: Integration example showing all feature systems
 * 
 * Demonstrates:
 * - GradeManager for class grading
 * - AttendanceTracker for attendance management
 * - NotificationCenter for notifications
 * - Data flow between systems
 * - Error handling and callbacks
 * 
 * Business Logic:
 * - When grades recorded, auto-notify students
 * - When attendance low, alert parents/students
 * - Real-time notifications for all events
 */
const TeacherDashboardExample: React.FC<TeacherDashboardExampleProps> = ({
  userId,
  tenantId,
  courseId,
}) => {
  const logger = useRef(new Logger('TeacherDashboardExample'));
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance' | 'notifications'>('grades');
  
  // Feedback state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  /**
   * Handle grade recording
   */
  const handleGradeRecorded = useCallback((data: unknown) => {
    logger.current.log('Grade recorded', data);
    setFeedback({
      type: 'success',
      message: 'Grade recorded successfully. Student will be notified.',
    });
    
    // Auto-navigate to notifications
    setTimeout(() => setActiveTab('notifications'), 1500);
  }, []);

  /**
   * Handle attendance recorded
   */
  const handleAttendanceRecorded = useCallback((data: unknown) => {
    logger.current.log('Attendance recorded', data);
    setFeedback({
      type: 'success',
      message: 'Attendance recorded successfully.',
    });
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((error: string) => {
    logger.current.error('Operation failed', { error });
    setFeedback({
      type: 'error',
      message: error,
    });
  }, []);

  /**
   * Clear feedback after 5 seconds
   */
  React.useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600">
            Manage grades, attendance, and communications for your courses
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`max-w-6xl mx-auto mt-4 p-4 rounded-lg border-l-4 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : feedback.type === 'error'
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mt-6 border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'grades' as const, label: '📊 Grade Management', icon: '📊' },
            { id: 'attendance' as const, label: '📋 Attendance Tracking', icon: '📋' },
            { id: 'notifications' as const, label: '🔔 Notifications', icon: '🔔' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`pb-4 font-medium transition-colors ${
                activeTab === id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Grade Management Tab */}
        {activeTab === 'grades' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <GradeManager
              courseId={courseId}
              tenantId={tenantId}
              userId={userId}
              onGradeRecorded={handleGradeRecorded}
              onError={handleError}
            />
          </div>
        )}

        {/* Attendance Tracking Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <AttendanceTracker
              courseId={courseId}
              tenantId={tenantId}
              userId={userId}
              onAttendanceRecorded={handleAttendanceRecorded}
              onError={handleError}
            />
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <NotificationCenter
              userId={userId}
              tenantId={tenantId}
            />
          </div>
        )}
      </div>

      {/* Integration Notes */}
      <div className="max-w-6xl mx-auto mt-8 mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Integration Features
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>✅ Recording grades automatically triggers student notifications</li>
          <li>✅ Attendance changes are logged in the notification system</li>
          <li>✅ All operations show real-time feedback</li>
          <li>✅ Errors are caught and displayed to the user</li>
          <li>✅ Each system operates independently but communicates via callbacks</li>
          <li>✅ All data persisted via PocketBase services</li>
        </ul>
      </div>
    </div>
  );
};

export default TeacherDashboardExample;
