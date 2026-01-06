import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, TrendingDown, Search, Filter, ChevronDown,
  Award, AlertTriangle, BarChart3, User, BookOpen, Clock, Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teacherService, Student, TeacherClass, GradeEntry } from '../../services/teacherService';
import { cn } from '../../lib/utils';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';

const notesSchema = z.object({
  notes: z.string().min(1, "Notes cannot be empty").max(1000, "Notes are too long")
});

interface Props {
  activeTab?: string;
  activeSubNav?: string;
}

type ViewMode = 'overview' | 'detail';
type SortField = 'name' | 'gpa' | 'attendance' | 'performance';

const StudentAnalytics: React.FC<Props> = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentGrades, setStudentGrades] = useState<GradeEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    const teacherId = user?.id || 't1';
    setLoading(true);
    const [studentsData, classesData] = await Promise.all([
      teacherService.getStudents(teacherId),
      teacherService.getClasses(teacherId),
    ]);
    setStudents(studentsData);
    setClasses(classesData);
    setLoading(false);
  };

  const loadStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    setNotes(student.notes || '');
    const grades = await teacherService.getGradeEntries(user?.id || 't1', undefined, student.id);
    setStudentGrades(grades);
    setViewMode('detail');
  };

  const handleSaveNotes = () => {
    // Sanitize
    const sanitized = sanitizeText(notes);

    // Validate
    const result = notesSchema.safeParse({ notes: sanitized });
    if (!result.success) {
      showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
      return;
    }
    // In a real app, save to backend
    showToast('Notes saved successfully', 'success');
  };

  const filteredStudents = students
    .filter(s => selectedClass === 'all' || s.classIds.includes(selectedClass))
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.student_id.includes(searchTerm))
    .sort((a, b) => {
      const multiplier = sortAsc ? 1 : -1;
      switch (sortField) {
        case 'name': return a.name.localeCompare(b.name) * multiplier;
        case 'gpa': return (a.gpa - b.gpa) * multiplier;
        case 'attendance': return (a.attendance_rate - b.attendance_rate) * multiplier;
        default: return 0;
      }
    });

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-green-500';
    if (gpa >= 3.0) return 'text-blue-500';
    if (gpa >= 2.5) return 'text-yellow-500';
    if (gpa >= 2.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-500';
    if (rate >= 90) return 'text-blue-500';
    if (rate >= 85) return 'text-yellow-500';
    if (rate >= 80) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPerformanceStatus = (gpa: number, attendance: number) => {
    if (gpa >= 3.5 && attendance >= 95) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (gpa >= 3.0 && attendance >= 90) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (gpa >= 2.5 && attendance >= 85) return { label: 'Average', color: 'bg-yellow-100 text-yellow-700' };
    if (gpa < 2.5 || attendance < 80) return { label: 'Needs Support', color: 'bg-red-100 text-red-700' };
    return { label: 'Fair', color: 'bg-orange-100 text-orange-700' };
  };

  const classAvgGPA = students.length > 0 ? students.reduce((s, st) => s + st.gpa, 0) / students.length : 0;
  const classAvgAttendance = students.length > 0 ? students.reduce((s, st) => s + st.attendance_rate, 0) / students.length : 0;
  const atRiskCount = students.filter(s => s.gpa < 2.5 || s.attendance_rate < 85).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => { setViewMode('overview'); setSelectedStudent(null); }}
            className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            ← Back to Overview
          </button>

          {/* Student Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {selectedStudent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStudent.name}</h1>
                <p className="text-gray-500">ID: {selectedStudent.student_id} • Grade {selectedStudent.grade_level} • Section {selectedStudent.section}</p>
                <div className="mt-4 flex items-center gap-6">
                  <div>
                    <div className={cn("text-3xl font-bold", getGPAColor(selectedStudent.gpa))}>{selectedStudent.gpa.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">GPA</div>
                  </div>
                  <div>
                    <div className={cn("text-3xl font-bold", getAttendanceColor(selectedStudent.attendance_rate))}>{selectedStudent.attendance_rate}%</div>
                    <div className="text-sm text-gray-500">Attendance</div>
                  </div>
                  <div>
                    <span className={cn("px-3 py-1 rounded-full text-sm font-medium", getPerformanceStatus(selectedStudent.gpa, selectedStudent.attendance_rate).color)}>
                      {getPerformanceStatus(selectedStudent.gpa, selectedStudent.attendance_rate).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Grade History
              </h2>
              {studentGrades.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No grades recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {studentGrades.map((grade, idx) => (
                    <motion.div
                      key={grade.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{grade.assignment_name}</div>
                        <div className="text-sm text-gray-500">{grade.class_name} • {grade.assignment_type}</div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-xl font-bold", getGPAColor(grade.percentage / 25))}>{grade.grade_letter}</div>
                        <div className="text-sm text-gray-500">{grade.score}/{grade.max_score}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Performance Trend
              </h2>
              <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Performance trend visualization</p>
                  <p className="text-sm">(Chart would render here)</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600">+0.3</div>
                  <div className="text-xs text-gray-500">GPA Change</div>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">12</div>
                  <div className="text-xs text-gray-500">Assignments</div>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">95%</div>
                  <div className="text-xs text-gray-500">On-time Rate</div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teacher Notes</h2>
              <textarea
                name="studentNotes"
                className="w-full h-32 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white resize-none"
                placeholder="Add notes about this student..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Student Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor student performance and identify those who need support
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className={cn("text-2xl font-bold", getGPAColor(classAvgGPA))}>{classAvgGPA.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Average GPA</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className={cn("text-2xl font-bold", getAttendanceColor(classAvgAttendance))}>{classAvgAttendance.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Avg Attendance</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{atRiskCount}</div>
                <div className="text-sm text-gray-500">Need Support</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="searchStudents"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <select
              name="classFilter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <select
              name="sortField"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="gpa">Sort by GPA</option>
              <option value="attendance">Sort by Attendance</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {sortAsc ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade/Section</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student, idx) => {
                  const status = getPerformanceStatus(student.gpa, student.attendance_rate);
                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                      onClick={() => loadStudentDetail(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-medium">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.student_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        Grade {student.grade_level} - {student.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={cn("text-lg font-bold", getGPAColor(student.gpa))}>
                          {student.gpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={cn("text-lg font-bold", getAttendanceColor(student.attendance_rate))}>
                          {student.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium", status.color)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
