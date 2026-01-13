import React, { useState, useCallback } from 'react';
import { Logger } from '../../../utils/logging';
import { z } from 'zod';

interface GradeFormProps {
  courseId: string;
  onSubmit: (data: {
    studentId: string;
    assignmentScore: number;
    participationScore: number;
    midtermScore: number;
    finalScore: number;
    notes?: string;
  }) => Promise<void>;
  isLoading: boolean;
  getLetterGrade: (score: number) => string;
  getGPA: (grade: string) => number;
}

interface FormData {
  studentId: string;
  assignmentScore: number;
  participationScore: number;
  midtermScore: number;
  finalScore: number;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * GradeForm: Presentational component for recording grades
 * 
 * Business Logic:
 * - Validates all component scores (0-100)
 * - Calculates weighted final score
 * - Converts to letter grade
 * - Shows live preview of GPA
 * - Validates studentId format
 */
const GradeForm: React.FC<GradeFormProps> = ({
  courseId,
  onSubmit,
  isLoading,
  getLetterGrade,
  getGPA,
}) => {
  const logger = React.useRef(new Logger({ enableConsole: true }));

  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    assignmentScore: 0,
    participationScore: 0,
    midtermScore: 0,
    finalScore: 0,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);

  /**
   * Validate individual field
   */
  const validateField = useCallback(
    (name: string, value: any): string | undefined => {
      logger.current.debug('Validating field', { name, value });

      switch (name) {
        case 'studentId':
          if (!value || value.trim().length === 0) return 'Student ID required';
          if (value.length < 3) return 'Student ID too short';
          return undefined;

        case 'assignmentScore':
        case 'participationScore':
        case 'midtermScore':
        case 'finalScore':
          const score = Number(value);
          if (isNaN(score)) return 'Must be a number';
          if (score < 0 || score > 100) return 'Score must be 0-100';
          return undefined;

        case 'notes':
          if (value && value.length > 500) return 'Notes too long (max 500)';
          return undefined;

        default:
          return undefined;
      }
    },
    []
  );

  /**
   * Handle field change
   */
  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      logger.current.debug('Field changed', { name, value });

      // Update form data
      const newData = {
        ...formData,
        [name]: name === 'notes' ? value : Number(value),
      };
      setFormData(newData);

      // Validate
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error || undefined,
      }));

      // Calculate preview
      if (['assignmentScore', 'participationScore', 'midtermScore', 'finalScore'].includes(name)) {
        const weights = {
          assignment: 0.3,
          participation: 0.1,
          midterm: 0.2,
          final: 0.4,
        };

        const weighted =
          (newData.assignmentScore || 0) * weights.assignment +
          (newData.participationScore || 0) * weights.participation +
          (newData.midtermScore || 0) * weights.midterm +
          (newData.finalScore || 0) * weights.final;

        setCalculatedScore(Math.round(weighted));
      }
    },
    [formData, validateField]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      logger.current.startTimer('grade-form-submit');

      try {
        // Validate all fields
        const allErrors: FormErrors = {};
        Object.keys(formData).forEach((key) => {
          const error = validateField(key, formData[key as keyof FormData]);
          if (error) allErrors[key] = error;
        });

        if (Object.keys(allErrors).length > 0) {
          logger.current.warn('Form validation failed', { errors: allErrors });
          setErrors(allErrors);
          return;
        }

        logger.current.info('Submitting grade form', {
          studentId: formData.studentId,
          courseId,
        });

        await onSubmit({
          studentId: formData.studentId,
          assignmentScore: formData.assignmentScore,
          participationScore: formData.participationScore,
          midtermScore: formData.midtermScore,
          finalScore: formData.finalScore,
          notes: formData.notes,
        });

        logger.current.endTimer('grade-form-submit', { success: true });

        // Reset form
        setFormData({
          studentId: '',
          assignmentScore: 0,
          participationScore: 0,
          midtermScore: 0,
          finalScore: 0,
          notes: '',
        });
        setCalculatedScore(null);
      } catch (err) {
        logger.current.error('Form submission failed', err);
      }
    },
    [formData, validateField, onSubmit, courseId]
  );

  const letterGrade = calculatedScore !== null ? getLetterGrade(calculatedScore) : null;
  const gpa = letterGrade ? getGPA(letterGrade) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Student ID */}
      <div>
        <label className="block text-sm font-medium text-gray-900">Student ID *</label>
        <input
          type="text"
          name="studentId"
          value={formData.studentId}
          onChange={handleFieldChange}
          placeholder="Enter student ID"
          className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none ${
            errors.studentId ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
      </div>

      {/* Component Scores Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: 'assignmentScore', label: 'Assignment', weight: '30%' },
          { key: 'participationScore', label: 'Participation', weight: '10%' },
          { key: 'midtermScore', label: 'Midterm', weight: '20%' },
          { key: 'finalScore', label: 'Final', weight: '40%' },
        ].map(({ key, label, weight }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-900">
              {label} ({weight}) *
            </label>
            <input
              type="number"
              name={key}
              min="0"
              max="100"
              value={formData[key as keyof FormData]}
              onChange={handleFieldChange}
              placeholder="0-100"
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none ${
                errors[key] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
          </div>
        ))}
      </div>

      {/* Calculated Preview */}
      {calculatedScore !== null && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Final Score</p>
              <p className="text-2xl font-bold text-blue-600">{calculatedScore}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Letter Grade</p>
              <p className="text-2xl font-bold text-blue-600">{letterGrade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">GPA (4.0)</p>
              <p className="text-2xl font-bold text-blue-600">{gpa?.toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-900">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleFieldChange}
          placeholder="Additional notes (optional)"
          rows={3}
          maxLength={500}
          className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="mt-1 text-xs text-gray-500">{formData.notes.length}/500</p>
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Recording...' : 'Record Grade'}
      </button>
    </form>
  );
};

export default GradeForm;
