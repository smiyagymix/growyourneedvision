import React from 'react';

interface AttendanceReport {
  studentId: string;
  studentName: string;
  attendancePercentage: number;
  presentCount: number;
  totalSessions: number;
}

interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
  isLowAttendance: boolean;
}

interface AttendanceSheetProps {
  report: AttendanceReport[];
  stats?: AttendanceStats | null;
}

/**
 * AttendanceSheet: Displays attendance report table
 * 
 * Business Logic:
 * - Shows attendance statistics per student
 * - Calculates percentages
 * - Color-codes by attendance level
 * - Sorts by percentage descending
 */
const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ report, stats }) => {
  // Sort by percentage descending
  const sortedReport = [...report].sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 80) return 'bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-700 bg-green-100';
    if (percentage >= 80) return 'text-blue-700 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Class Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Total Sessions</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalSessions}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Average</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.attendancePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Student ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Present</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Total</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedReport.map((student, idx) => (
              <tr key={idx} className={`border-l-4 transition ${getStatusColor(student.attendancePercentage)}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{student.studentId}</td>
                <td className="px-4 py-3 text-gray-700">{student.studentName}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    {student.presentCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                    {student.totalSessions}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-bold ${getPercentageColor(
                      student.attendancePercentage
                    )}`}
                  >
                    {student.attendancePercentage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Attendance Distribution</h3>
        <div className="space-y-2">
          {[
            { range: '90-100%', color: 'bg-green-500', count: sortedReport.filter((s) => s.attendancePercentage >= 90).length },
            { range: '80-89%', color: 'bg-blue-500', count: sortedReport.filter((s) => s.attendancePercentage >= 80 && s.attendancePercentage < 90).length },
            { range: '70-79%', color: 'bg-yellow-500', count: sortedReport.filter((s) => s.attendancePercentage >= 70 && s.attendancePercentage < 80).length },
            { range: '<70%', color: 'bg-red-500', count: sortedReport.filter((s) => s.attendancePercentage < 70).length },
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm text-gray-600 flex-1">{item.range}</span>
              <span className="font-medium text-gray-900">{item.count} students</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheet;
