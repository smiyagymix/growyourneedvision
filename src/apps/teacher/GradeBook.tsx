import React, { useState, useEffect } from 'react';
import { Heading1, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Table, Thead, Tr, Th, Td } from '../../components/shared/ui/Table';
import { Badge } from '../../components/shared/ui/Badge';
import { Select } from '../../components/shared/ui/Select';
import { Button } from '../../components/shared/ui/Button';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { academicsService } from '../../services/academicsService';
import { useAuth } from '../../context/AuthContext';
import pb from '../../lib/pocketbase';
import { SchoolClass, Exam, ExamResult, Student } from '../school/types';
import { useToast } from '../../hooks/useToast';

interface GradebookProps {
    classId?: string;
}

const Gradebook: React.FC<GradebookProps> = ({ classId }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>(classId || '');
    const [students, setStudents] = useState<Student[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [grades, setGrades] = useState<Record<string, Record<string, ExamResult>>>({}); // studentId -> examId -> Result
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (classId) {
            setSelectedClassId(classId);
        } else if (user) {
            loadClasses();
        }
    }, [user, classId]);

    useEffect(() => {
        if (selectedClassId) {
            loadGradebookData();
        }
    }, [selectedClassId]);

    const loadClasses = async () => {
        if (!user) return;
        try {
            const res = await academicsService.getTeacherClasses(user.id);
            setClasses(res);
            if (res.length > 0) {
                setSelectedClassId(res[0].id);
            }
        } catch (e) {
            console.error("Failed to load classes", e);
        }
    };

    const loadGradebookData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Students
            const enrollments = await pb.collection('enrollments').getFullList({
                filter: `class = "${selectedClassId}"`,
                expand: 'student'
            });
            const classStudents = enrollments.map(e => e.expand?.student).filter(Boolean) as Student[];
            setStudents(classStudents);

            // 2. Fetch Exams
            const classExams = await academicsService.getClassExams(selectedClassId);
            setExams(classExams);

            // 3. Fetch Grades
            const classGrades = await academicsService.getClassGrades(selectedClassId);
            
            // Organize grades
            const gradesMap: Record<string, Record<string, ExamResult>> = {};
            classGrades.forEach(g => {
                if (!gradesMap[g.student]) gradesMap[g.student] = {};
                gradesMap[g.student][g.exam] = g;
            });
            setGrades(gradesMap);

        } catch (e) {
            console.error("Failed to load gradebook data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = async (studentId: string, examId: string, value: string) => {
        const marks = parseFloat(value);
        
        // Validate marks
        if (isNaN(marks)) {
            return;
        }
        if (marks < 0) {
            alert('Grade cannot be negative');
            return;
        }
        if (marks > 100) {
            alert('Grade cannot exceed 100');
            return;
        }

        // Optimistic update
        const existingResult = grades[studentId]?.[examId];
        
        try {
            if (existingResult) {
                await academicsService.updateGrade(existingResult.id, marks);
            } else {
                const newResult = await academicsService.createGrade({
                    student: studentId,
                    exam: examId,
                    marks_obtained: marks,
                    grade: calculateLetterGrade(marks) // Helper function
                });
                // Update local state with new ID
                setGrades(prev => ({
                    ...prev,
                    [studentId]: {
                        ...prev[studentId],
                        [examId]: newResult as unknown as ExamResult
                    }
                }));
            }
        } catch (e) {
            console.error("Failed to save grade", e);
            alert("Failed to save grade");
        }
    };

    const calculateLetterGrade = (marks: number) => {
        if (marks >= 90) return 'A';
        if (marks >= 80) return 'B';
        if (marks >= 70) return 'C';
        if (marks >= 60) return 'D';
        return 'F';
    };

    const calculateTotal = (studentId: string) => {
        // Simple average for now, could be weighted
        const studentGrades = grades[studentId] || {};
        const results = Object.values(studentGrades);
        if (results.length === 0) return 0;
        
        const sum = results.reduce((acc, curr) => acc + (curr.marks_obtained || 0), 0);
        return Math.round(sum / results.length); // Average
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>Gradebook</Heading1>
                    <Text variant="muted">Manage student grades and performance</Text>
                </div>
                <div className="flex gap-4 items-center">
                    {!classId && (
                        <Select 
                            value={selectedClassId} 
                            onChange={e => setSelectedClassId(e.target.value)}
                            className="w-64"
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    )}
                    <Button variant="outline">Export CSV</Button>
                </div>
            </div>

            <Card padding="none" className="overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading gradebook...</div>
                ) : students.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No students found in this class.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th className="w-64 sticky left-0 bg-gray-50 z-10 shadow-r">Student Name</Th>
                                    {exams.map(exam => (
                                        <Th key={exam.id} className="text-center min-w-[120px]">
                                            {exam.name}
                                            <div className="text-xs font-normal text-gray-500">Max: {exam.total_marks}</div>
                                        </Th>
                                    ))}
                                    <Th className="text-center bg-blue-50/50 w-32">Average</Th>
                                </Tr>
                            </Thead>
                            <tbody>
                                {students.map((student) => {
                                    const total = calculateTotal(student.id);
                                    return (
                                        <Tr key={student.id}>
                                            <Td className="sticky left-0 bg-white z-10 shadow-r font-bold text-gray-800 border-r border-gray-100">
                                                {student.name}
                                            </Td>
                                            {exams.map(exam => {
                                                const result = grades[student.id]?.[exam.id];
                                                return (
                                                    <Td key={exam.id} className="text-center p-2">
                                                        <input 
                                                            type="number" 
                                                            defaultValue={result?.marks_obtained}
                                                            onBlur={(e) => handleGradeChange(student.id, exam.id, e.target.value)}
                                                            className="w-20 text-center bg-gray-50 border border-transparent hover:border-gray-200 rounded p-1 focus:border-blue-500 focus:bg-white outline-none transition-all" 
                                                            placeholder="-"
                                                        />
                                                    </Td>
                                                );
                                            })}
                                            <Td className="text-center bg-blue-50/10 font-bold">
                                                <Badge variant={total >= 60 ? 'success' : 'danger'} size="sm">
                                                    {total}%
                                                </Badge>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Gradebook;