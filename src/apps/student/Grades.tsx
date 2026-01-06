
import React, { useState, useEffect } from 'react';
import { Icon, Card, Badge } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import { studentService, Grade } from '../../services/studentService';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const StudentGrades: React.FC<Props> = ({ activeTab }) => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await studentService.getGrades(user.id);
        setGrades(data);
      } catch (err) {
        console.error("Failed to load grades", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user]);

  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'default';
    if (['A', 'A+', 'A-'].some(g => grade.startsWith(g))) return 'success';
    if (['B', 'B+', 'B-'].some(g => grade.startsWith(g))) return 'primary';
    if (['C', 'C+', 'C-'].some(g => grade.startsWith(g))) return 'warning';
    return 'danger';
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your academic performance and exam results.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading grades...</div>
      ) : grades.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
          <Icon name="AcademicCapIcon" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">No grades yet</h3>
          <p className="text-gray-500">Exam results will appear here once published.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Max</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                  <th className="px-6 py-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {grades.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                      {result.course_name || 'Unknown Subject'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {result.assignment_name || result.type}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs uppercase">
                      {result.type}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{result.score}</td>
                    <td className="px-6 py-4 text-center text-gray-400">{result.max_score}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">{result.percentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={getGradeColor(result.letter_grade)}>{result.letter_grade || 'N/A'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentGrades;
