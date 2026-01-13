import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface Statistics {
  avgScore: number;
  medianScore: number;
  stdDev: number;
  distribution: Record<string, number>;
}

interface GradeStatsProps {
  statistics: Statistics;
  totalStudents: number;
  avgScore: number;
}

/**
 * GradeStats: Presentational component showing grade statistics
 * 
 * Business Logic:
 * - Displays grade distribution
 * - Shows class statistics (mean, median, stdDev)
 * - Visualizes grade letter frequencies
 * - Calculates performance insights
 */
const GradeStats: React.FC<GradeStatsProps> = ({
  statistics,
  totalStudents,
  avgScore,
}) => {
  // Transform distribution for chart
  const chartData = Object.entries(statistics.distribution).map(([grade, count]) => ({
    grade,
    students: count,
    percentage: ((count / totalStudents) * 100).toFixed(1),
  }));

  // Grade color mapping
  const gradeColors: Record<string, string> = {
    'A': '#22c55e', // green
    'B': '#3b82f6', // blue
    'C': '#f59e0b', // amber
    'D': '#ef4444', // red
    'F': '#7c3aed', // purple
  };

  // Performance insights
  const getPerformanceInsight = () => {
    if (avgScore >= 90) return { text: 'Excellent class performance', color: 'green' };
    if (avgScore >= 80) return { text: 'Good class performance', color: 'blue' };
    if (avgScore >= 70) return { text: 'Average class performance', color: 'yellow' };
    return { text: 'Below average performance', color: 'red' };
  };

  const insight = getPerformanceInsight();

  return (
    <div className="space-y-8">
      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-3xl font-bold text-blue-600">{statistics.avgScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Class Average</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Median Score</p>
          <p className="text-3xl font-bold text-purple-600">{statistics.medianScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Middle Value</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">Std Dev</p>
          <p className="text-3xl font-bold text-orange-600">{statistics.stdDev.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Score Spread</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Total Students</p>
          <p className="text-3xl font-bold text-green-600">{totalStudents}</p>
          <p className="text-xs text-gray-500 mt-1">Graded</p>
        </div>
      </div>

      {/* Performance Insight */}
      <div
        className={`p-4 rounded-lg border-l-4 ${
          insight.color === 'green'
            ? 'bg-green-50 border-green-500'
            : insight.color === 'blue'
            ? 'bg-blue-50 border-blue-500'
            : insight.color === 'yellow'
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-red-50 border-red-500'
        }`}
      >
        <p
          className={`font-medium ${
            insight.color === 'green'
              ? 'text-green-900'
              : insight.color === 'blue'
              ? 'text-blue-900'
              : insight.color === 'yellow'
              ? 'text-yellow-900'
              : 'text-red-900'
          }`}
        >
          {insight.text}
        </p>
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
        {chartData.length > 0 ? (
          <div className="overflow-x-auto">
            <BarChart width={500} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                formatter={(value) => `${value} students`}
              />
              <Legend />
              <Bar dataKey="students" fill="#8884d8" radius={[8, 8, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.grade}`}
                    fill={gradeColors[entry.grade] || '#8884d8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </div>
        ) : (
          <p className="text-gray-500">No grade distribution data</p>
        )}
      </div>

      {/* Distribution Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Grade</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Count</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chartData.map((row) => (
              <tr key={row.grade} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span
                    className="inline-block w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: gradeColors[row.grade] || '#8884d8' }}
                  >
                    {row.grade}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{row.students}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-600">{row.percentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeStats;
