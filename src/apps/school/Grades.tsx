import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Heading3, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Button } from '../../components/shared/ui/Button';
import { Badge } from '../../components/shared/ui/Badge';
import { Select } from '../../components/shared/ui/Select';
import { Modal } from '../../components/shared/ui/CommonUI';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { gradesService, GradeRecord } from '../../services/gradesService';
import { enrollmentService } from '../../services/enrollmentService';
import pb from '../../lib/pocketbase';
import { SchoolClass, Student, Exam } from './types';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const gradeSubmissionSchema = z.object({
  student: z.string().min(1, 'Student is required'),
  class: z.string().min(1, 'Class is required'),
  exam: z.string().optional(),
  score: z.number().min(0, 'Score cannot be negative'),
  max_score: z.number().min(1, 'Max score must be positive'),
  weight: z.number().min(0).max(10),
  type: z.enum(['Exam', 'Quiz', 'Homework', 'Project']),
  feedback: z.string().max(1000, 'Feedback too long')
});

interface GradesProps {
    activeTab?: string;
    activeSubNav?: string;
}

const Grades: React.FC<GradesProps> = ({ activeTab, activeSubNav }) => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<GradeRecord[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [gradeForm, setGradeForm] = useState({
        exam: '',
        score: 0,
        max_score: 100,
        weight: 1,
        type: 'Exam' as const,
        feedback: ''
    });

    // Load classes
    useEffect(() => {
        pb.collection('school_classes').getFullList<SchoolClass>({ sort: 'name' }).then(setClasses);
    }, []);

    // Load class data
    useEffect(() => {
        if (selectedClass) {
            fetchClassData();
        }
    }, [selectedClass]);

    const fetchClassData = async () => {
        setLoading(true);
        try {
            // 1. Get Students
            const enrollments = await enrollmentService.getClassEnrollments(selectedClass);
            const classStudents = enrollments.items
                .map((e: any) => e.expand?.student)
                .filter((s: any) => !!s);
            setStudents(classStudents);

            // 2. Get Grades
            const classGrades = await gradesService.getClassGrades(selectedClass);
            setGrades(classGrades);

            // 3. Get Exams
            const classExams = await pb.collection('exams').getFullList<Exam>({
                filter: `class = "${selectedClass}"`,
                sort: '-date'
            });
            setExams(classExams);

        } catch (error) {
            console.error('Failed to load class data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitGrade = async () => {
        const { showToast } = useToast();

        // Sanitize
        const sanitized = {
            student: selectedStudent,
            class: selectedClass,
            exam: gradeForm.exam || undefined,
            score: Number(gradeForm.score),
            max_score: Number(gradeForm.max_score),
            weight: Number(gradeForm.weight),
            type: gradeForm.type,
            feedback: sanitizeText(gradeForm.feedback)
        };

        // Validate
        const result = gradeSubmissionSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await gradesService.submitGrade(result.data as any);
            setIsGradeModalOpen(false);
            fetchClassData(); // Refresh
            // Reset form
            setGradeForm({
                exam: '',
                score: 0,
                max_score: 100,
                weight: 1,
                type: 'Exam',
                feedback: ''
            });
            showToast('Grade submitted successfully', 'success');
        } catch (error) {
            console.error('Failed to submit grade:', error);
            showToast('Failed to submit grade', 'error');
        }
    };

    const getStudentAverage = (studentId: string) => {
        const studentGrades = grades.filter(g => g.student === studentId);
        if (studentGrades.length === 0) return 'N/A';

        let totalWeightedScore = 0;
        let totalWeight = 0;

        studentGrades.forEach(g => {
            const normalized = (g.score / g.max_score) * 100;
            totalWeightedScore += normalized * g.weight;
            totalWeight += g.weight;
        });

        return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) + '%' : 'N/A';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn p-6">
            <div className="flex justify-between items-start">
                <div>
                    <Heading1>Grade Management</Heading1>
                    <Text variant="muted">Record and track student performance</Text>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<OwnerIcon name="PlusCircleIcon" className="w-4 h-4" />}
                    onClick={() => setIsGradeModalOpen(true)}
                    disabled={!selectedClass}
                >
                    Enter Grade
                </Button>
            </div>

            <Card className="p-4">
                <div className="w-64">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select a class...</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.code})
                            </option>
                        ))}
                    </Select>
                </div>
            </Card>

            {selectedClass && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Average</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Recent Grades</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                                ) : students.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-gray-500">No students found</td></tr>
                                ) : (
                                    students.map(student => (
                                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.email}</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="neutral">{getStudentAverage(student.id)}</Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    {grades
                                                        .filter(g => g.student === student.id)
                                                        .slice(0, 3)
                                                        .map(g => (
                                                            <div key={g.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                <span className="font-medium">{g.score}/{g.max_score}</span>
                                                                <span className="text-gray-500 ml-1">({g.type})</span>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedStudent(student.id);
                                                        setIsGradeModalOpen(true);
                                                    }}
                                                >
                                                    Add Grade
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Grade Entry Modal */}
            <Modal
                isOpen={isGradeModalOpen}
                onClose={() => setIsGradeModalOpen(false)}
                title="Enter Grade"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                        <Select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            <option value="">Select Student...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <Select
                                value={gradeForm.type}
                                onChange={(e) => setGradeForm({ ...gradeForm, type: e.target.value as any })}
                            >
                                <option value="Exam">Exam</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Project">Project</option>
                                <option value="Participation">Participation</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam (Optional)</label>
                            <Select
                                value={gradeForm.exam}
                                onChange={(e) => setGradeForm({ ...gradeForm, exam: e.target.value })}
                            >
                                <option value="">None</option>
                                {exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md"
                                value={gradeForm.score}
                                onChange={(e) => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md"
                                value={gradeForm.max_score}
                                onChange={(e) => setGradeForm({ ...gradeForm, max_score: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md"
                                value={gradeForm.weight}
                                onChange={(e) => setGradeForm({ ...gradeForm, weight: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                        <textarea
                            className="w-full p-2 border rounded-md"
                            rows={3}
                            value={gradeForm.feedback}
                            onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsGradeModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmitGrade}>Submit Grade</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Grades;
