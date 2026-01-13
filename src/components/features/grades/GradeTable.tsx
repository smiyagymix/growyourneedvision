import React, { useMemo } from 'react';

interface Grade {
  id: string;
  studentId: string;
  studentName?: string;
  finalScore?: number;
  created?: string;
}

interface GradeTableProps {
  grades: Grade[];
  getLetterGrade: (score: number) => string;
  getGPA: (grade: string) => number;
  onSelectStudent?: (studentId: string) => void;
}

/**
 * GradeTable: Presentational component displaying grade records
 * 
 * Business Logic:
 * - Sorts grades by date (newest first)
 * - Converts scores to letter grades
 * - Calculates GPA from letter grades
 * - Displays formatted data
 */
const GradeTable: React.FC<GradeTableProps> = ({
  grades,
  getLetterGrade,
  getGPA,
  onSelectStudent,
}) => {
  // Process grades with calculated fields
  const processedGrades = useMemo(
    () =>
      grades
        .map((grade) => ({
          ...grade,
          letterGrade: grade.finalScore ? getLetterGrade(grade.finalScore) : 'N/A',
          gpa: grade.finalScore ? getGPA(getLetterGrade(grade.finalScore)) : 0,
        }))
        .sort((a, b) => new Date(b.created || '').getTime() - new Date(a.created || '').getTime()),
    [grades, getLetterGrade, getGPA]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">Student ID</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">Final Score</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">Letter Grade</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">GPA</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">Date</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {processedGrades.map((grade) => (
            <tr key={grade.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-medium text-gray-900">{grade.studentId}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-white font-medium ${
                    (grade.finalScore || 0) >= 90
                      ? 'bg-green-600'
                      : (grade.finalScore || 0) >= 80
                      ? 'bg-blue-600'
                      : (grade.finalScore || 0) >= 70
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                >
                  {grade.finalScore?.toFixed(1) || 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-lg">{grade.letterGrade}</td>
              <td className="px-4 py-3">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                  {grade.gpa.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(grade.created || '').toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onSelectStudent?.(grade.studentId)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GradeTable;
