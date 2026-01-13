import React, { useState, useCallback } from 'react';
import { Logger } from '../../../utils/logging';

interface AttendanceFormProps {
  courseId: string;
  viewType: 'single' | 'bulk';
  onSingleSubmit: (data: {
    studentId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }) => Promise<void>;
  onBulkSubmit: (data: {
    date: string;
    records: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }>;
  }) => Promise<void>;
  isLoading: boolean;
}

interface SingleFormData {
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}

interface BulkRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

/**
 * AttendanceForm: Handles single and bulk attendance recording
 * 
 * Business Logic:
 * - Validates student IDs and dates
 * - Supports 4 status types
 * - Bulk import from student list
 * - Date format validation (YYYY-MM-DD)
 */
const AttendanceForm: React.FC<AttendanceFormProps> = ({
  courseId,
  viewType,
  onSingleSubmit,
  onBulkSubmit,
  isLoading,
}) => {
  const logger = React.useRef(new Logger({ enableConsole: true }));

  const [singleForm, setSingleForm] = useState<SingleFormData>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: '',
  });

  const [bulkForm, setBulkForm] = useState({
    date: new Date().toISOString().split('T')[0],
    students: [{ studentId: '', status: 'present' as const }],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Handle single form submission
   */
  const handleSingleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      logger.current.startTimer('attendance-single-submit');

      try {
        // Validate
        if (!singleForm.studentId.trim()) {
          setErrors({ studentId: 'Student ID required' });
          return;
        }

        if (!singleForm.date) {
          setErrors({ date: 'Date required' });
          return;
        }

        logger.current.info('Submitting single attendance', {
          studentId: singleForm.studentId,
          date: singleForm.date,
        });

        await onSingleSubmit({
          studentId: singleForm.studentId,
          date: singleForm.date,
          status: singleForm.status,
          notes: singleForm.notes,
        });

        logger.current.endTimer('attendance-single-submit', { success: true });

        // Reset
        setSingleForm({
          studentId: '',
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          notes: '',
        });
        setErrors({});
      } catch (err) {
        logger.current.error('Single submit failed', err);
      }
    },
    [singleForm, onSingleSubmit]
  );

  /**
   * Handle bulk form submission
   */
  const handleBulkSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      logger.current.startTimer('attendance-bulk-submit');

      try {
        // Validate
        const validRecords = bulkForm.students.filter((s) => s.studentId.trim());
        if (validRecords.length === 0) {
          setErrors({ students: 'At least one student required' });
          return;
        }

        logger.current.info('Submitting bulk attendance', {
          count: validRecords.length,
          date: bulkForm.date,
        });

        await onBulkSubmit({
          date: bulkForm.date,
          records: validRecords,
        });

        logger.current.endTimer('attendance-bulk-submit', {
          recordCount: validRecords.length,
        });

        // Reset
        setBulkForm({
          date: new Date().toISOString().split('T')[0],
          students: [{ studentId: '', status: 'present' }],
        });
        setErrors({});
      } catch (err) {
        logger.current.error('Bulk submit failed', err);
      }
    },
    [bulkForm, onBulkSubmit]
  );

  /**
   * Add student row for bulk
   */
  const addStudentRow = useCallback(() => {
    setBulkForm((prev) => ({
      ...prev,
      students: [...prev.students, { studentId: '', status: 'present' as const }],
    }));
  }, []);

  /**
   * Remove student row for bulk
   */
  const removeStudentRow = useCallback((index: number) => {
    setBulkForm((prev) => ({
      ...prev,
      students: prev.students.filter((_, i) => i !== index),
    }));
  }, []);

  // Single View
  if (viewType === 'single') {
    return (
      <form onSubmit={handleSingleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-900">Student ID *</label>
          <input
            type="text"
            value={singleForm.studentId}
            onChange={(e) => setSingleForm((p) => ({ ...p, studentId: e.target.value }))}
            placeholder="Enter student ID"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
          {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">Date *</label>
          <input
            type="date"
            value={singleForm.date}
            onChange={(e) => setSingleForm((p) => ({ ...p, date: e.target.value }))}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">Status *</label>
          <select
            value={singleForm.status}
            onChange={(e) =>
              setSingleForm((p) => ({
                ...p,
                status: e.target.value as any,
              }))
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">Notes</label>
          <textarea
            value={singleForm.notes}
            onChange={(e) => setSingleForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Optional notes"
            rows={2}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Recording...' : 'Record Attendance'}
        </button>
      </form>
    );
  }

  // Bulk View
  return (
    <form onSubmit={handleBulkSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900">Date *</label>
        <input
          type="date"
          value={bulkForm.date}
          onChange={(e) => setBulkForm((p) => ({ ...p, date: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-900">Students</label>
          <button
            type="button"
            onClick={addStudentRow}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Row
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bulkForm.students.map((student, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <input
                type="text"
                value={student.studentId}
                onChange={(e) => {
                  const newStudents = [...bulkForm.students];
                  newStudents[idx].studentId = e.target.value;
                  setBulkForm((p) => ({ ...p, students: newStudents }));
                }}
                placeholder="Student ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
              />
              <select
                value={student.status}
                onChange={(e) => {
                  const newStudents = [...bulkForm.students];
                  newStudents[idx].status = e.target.value as any;
                  setBulkForm((p) => ({ ...p, students: newStudents }));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
              <button
                type="button"
                onClick={() => removeStudentRow(idx)}
                className="px-3 py-2 text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {errors.students && <p className="mt-1 text-sm text-red-600">{errors.students}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Recording...' : `Record ${bulkForm.students.length} Attendance`}
      </button>
    </form>
  );
};

export default AttendanceForm;
