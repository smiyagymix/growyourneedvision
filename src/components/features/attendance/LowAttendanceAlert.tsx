import React from 'react';

interface LowAttendanceStudent {
  studentId: string;
  studentName: string;
  attendancePercentage: number;
}

interface LowAttendanceAlertProps {
  students: LowAttendanceStudent[];
}

/**
 * LowAttendanceAlert: Displays alerts for at-risk students
 * 
 * Business Logic:
 * - Highlights students below threshold
 * - Shows attendance percentage
 * - Color-codes by severity
 * - Suggests interventions
 */
const LowAttendanceAlert: React.FC<LowAttendanceAlertProps> = ({ students }) => {
  if (!students || students.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
        <p className="font-medium">✓ All students have adequate attendance!</p>
      </div>
    );
  }

  const getSeverity = (percentage: number) => {
    if (percentage < 50) return { level: 'critical', color: 'red', label: 'Critical' };
    if (percentage < 70) return { level: 'warning', color: 'orange', label: 'Warning' };
    return { level: 'caution', color: 'yellow', label: 'Caution' };
  };

  const groupedByLevel = {
    critical: students.filter((s) => s.attendancePercentage < 50),
    warning: students.filter((s) => s.attendancePercentage >= 50 && s.attendancePercentage < 70),
    caution: students.filter((s) => s.attendancePercentage >= 70),
  };

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="font-bold text-red-900">⚠ {students.length} Students Flagged</p>
        <p className="text-sm text-red-700 mt-1">
          Intervention recommended for students below attendance threshold
        </p>
      </div>

      {/* Critical Students */}
      {groupedByLevel.critical.length > 0 && (
        <div className="p-4 rounded-lg border border-red-300 bg-red-50">
          <h3 className="font-bold text-red-900 mb-3">🔴 Critical ({groupedByLevel.critical.length})</h3>
          <div className="space-y-2">
            {groupedByLevel.critical.map((student) => (
              <div key={student.studentId} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{student.studentId}</p>
                  <p className="text-xs text-gray-600">{student.studentName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">{student.attendancePercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">Immediate action needed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Students */}
      {groupedByLevel.warning.length > 0 && (
        <div className="p-4 rounded-lg border border-orange-300 bg-orange-50">
          <h3 className="font-bold text-orange-900 mb-3">🟠 Warning ({groupedByLevel.warning.length})</h3>
          <div className="space-y-2">
            {groupedByLevel.warning.map((student) => (
              <div key={student.studentId} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                <div>
                  <p className="font-medium text-gray-900">{student.studentId}</p>
                  <p className="text-xs text-gray-600">{student.studentName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">{student.attendancePercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">Follow up recommended</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caution Students */}
      {groupedByLevel.caution.length > 0 && (
        <div className="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
          <h3 className="font-bold text-yellow-900 mb-3">🟡 Caution ({groupedByLevel.caution.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {groupedByLevel.caution.map((student) => (
              <div key={student.studentId} className="p-2 bg-white rounded border border-yellow-200">
                <p className="font-medium text-sm text-gray-900">{student.studentId}</p>
                <p className="text-xs text-yellow-700 font-bold">{student.attendancePercentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-3">💡 Recommended Actions</h3>
        <ul className="space-y-2 text-sm text-blue-900">
          <li className="flex gap-2">
            <span>→</span>
            <span>Send automated notification to flagged students</span>
          </li>
          <li className="flex gap-2">
            <span>→</span>
            <span>Schedule meetings with students under 70% attendance</span>
          </li>
          <li className="flex gap-2">
            <span>→</span>
            <span>Notify parents/guardians for critical cases</span>
          </li>
          <li className="flex gap-2">
            <span>→</span>
            <span>Document interventions for academic records</span>
          </li>
        </ul>
      </div>

      {/* Export Action */}
      <button
        onClick={() => {
          // TODO: Implement export
        }}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
      >
        Export Alert List
      </button>
    </div>
  );
};

export default LowAttendanceAlert;
