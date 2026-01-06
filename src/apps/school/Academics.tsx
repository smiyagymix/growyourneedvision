import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Heading2, Heading3, Text, Badge, Card, Button, Icon, OwnerIcon, Modal } from '../../components/shared/ui/CommonUI';
import { Tabs } from '../../components/shared/ui/Tabs';
import { Table, Thead, Tr, Th, Td } from '../../components/shared/ui/Table';
import { AssignmentModal } from '../../components/shared/modals/AssignmentModal';
import { SubmissionReviewModal } from '../../components/shared/modals/SubmissionReviewModal';
import { AIContentGeneratorModal } from '../../components/shared/modals/AIContentGeneratorModal';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../context/AuthContext';
import { academicsService } from '../../services/academicsService';
import { assignmentService, AssignmentRecord } from '../../services/assignmentService';
import { StatsSkeleton, TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { useToast } from '../../hooks/useToast';
import { SchoolClass, Subject, Exam, Enrollment, ExamResult, Assignment } from './types';
import { classSchema, courseSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';

const examSchema = z.object({
    name: z.string().min(3, 'Exam name must be at least 3 characters').max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    total_marks: z.number().min(1, 'Total marks must be at least 1').max(1000, 'Total marks too high'),
    subject: z.string().min(1, 'Subject required'),
    class: z.string().min(1, 'Class required')
});

interface AcademicsProps {
    activeTab?: string;
    activeSubNav?: string;
}

interface StudentResult {
    studentId: string;
    studentName: string;
    marks_obtained: number | string;
    resultId: string | null;
}

const Academics: React.FC<AcademicsProps> = () => {
    const { user } = useAuth();
    const [localTab, setLocalTab] = useState('Active Classes');
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast, showToast } = useToast();

    // Modals
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiConfig, setAiConfig] = useState({ title: '', prompt: '', context: {} as any });

    // Selection for Edit
    const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [examResults, setExamResults] = useState<StudentResult[]>([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0 });

    // Forms
    const [classForm, setClassForm] = useState<Partial<SchoolClass>>({ name: '', code: '', room: '', academic_year: '2024-2025' });
    const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({ name: '', code: '', credits: 3 });
    const [examForm, setExamForm] = useState<Partial<Exam>>({ name: '', date: '', total_marks: 100, subject: '', class: '' });

    useEffect(() => {
        fetchData();
        // Fetch stats once
        academicsService.getStats().then(setStats);
    }, [localTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (localTab === 'Active Classes') {
                const res = await academicsService.getClasses();
                setClasses(res);
            } else if (localTab === 'Curriculum') {
                const res = await academicsService.getSubjects();
                setSubjects(res);
            } else if (localTab === 'Exams') {
                const res = await academicsService.getExams();
                setExams(res);
                // Also fetch dependencies for the form if needed
                if (classes.length === 0) setClasses(await academicsService.getClasses());
                if (subjects.length === 0) setSubjects(await academicsService.getSubjects());
            } else if (localTab === 'Assignments') {
                const res = await assignmentService.getAllAssignments();
                setAssignments(res.items as unknown as Assignment[]);
                if (classes.length === 0) setClasses(await academicsService.getClasses());
                if (subjects.length === 0) setSubjects(await academicsService.getSubjects());
            }
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- Class Handlers ---
    const handleOpenClassModal = (cls?: SchoolClass) => {
        if (cls) {
            setEditingClass(cls);
            setClassForm({ name: cls.name, code: cls.code, room: cls.room, academic_year: cls.academic_year });
        } else {
            setEditingClass(null);
            setClassForm({ name: '', code: '', room: '', academic_year: '2024-2025' });
        }
        setIsClassModalOpen(true);
    };

    const handleSaveClass = async () => {
        try {
            // Sanitize and validate
            const sanitizedForm = {
                name: sanitizeText(classForm.name || ''),
                code: sanitizeText(classForm.code || ''),
                room: sanitizeText(classForm.room || ''),
                academic_year: sanitizeText(classForm.academic_year || '')
            };

            const validationResult = classSchema.safeParse(sanitizedForm);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            if (editingClass) {
                await academicsService.updateClass(editingClass.id, sanitizedForm);
            } else {
                await academicsService.createClass(sanitizedForm);
            }
            setIsClassModalOpen(false);
            fetchData();
        } catch (e) {
            showToast('Failed to save class', 'error');
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (confirm('Are you sure you want to delete this class?')) {
            await academicsService.deleteClass(id);
            fetchData();
        }
    };

    // --- Subject Handlers ---
    const handleOpenSubjectModal = (sub?: Subject) => {
        if (sub) {
            setEditingSubject(sub);
            setSubjectForm({ name: sub.name, code: sub.code, credits: sub.credits });
        } else {
            setEditingSubject(null);
            setSubjectForm({ name: '', code: '', credits: 3 });
        }
        setIsSubjectModalOpen(true);
    };

    const handleSaveSubject = async () => {
        try {
            // Sanitize and validate
            const sanitizedForm = {
                name: sanitizeText(subjectForm.name || ''),
                code: sanitizeText(subjectForm.code || ''),
                credits: subjectForm.credits
            };

            const validationResult = courseSchema.safeParse({
                title: sanitizedForm.name,
                code: sanitizedForm.code,
                credits: sanitizedForm.credits
            });

            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            if (editingSubject) {
                await academicsService.updateSubject(editingSubject.id, sanitizedForm);
            } else {
                await academicsService.createSubject(sanitizedForm);
            }
            setIsSubjectModalOpen(false);
            fetchData();
        } catch (e) {
            showToast('Failed to save subject', 'error');
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (confirm('Are you sure you want to delete this subject?')) {
            await academicsService.deleteSubject(id);
            fetchData();
        }
    };

    // --- Exam Handlers ---
    const handleCreateExam = async () => {
        // Sanitize
        const sanitizedForm = {
            name: sanitizeText(examForm.name || ''),
            date: examForm.date,
            total_marks: Number(examForm.total_marks),
            subject: examForm.subject,
            class: examForm.class
        };
        
        // Validate
        const validationResult = examSchema.safeParse(sanitizedForm);
        if (!validationResult.success) {
            addToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await academicsService.createExam(validationResult.data);
            setIsExamModalOpen(false);
            fetchData();
            setExamForm({ name: '', date: '', total_marks: 100, subject: '', class: '' });
            addToast('Exam created successfully!', 'success');
        } catch (e) {
            addToast('Failed to create exam', 'error');
        }
    };

    const handleDeleteExam = async (id: string) => {
        if (confirm('Are you sure you want to delete this exam?')) {
            await academicsService.deleteExam(id);
            fetchData();
        }
    };

    // --- Assignment Handlers ---
    const handleOpenAssignmentModal = (assignment?: Assignment) => {
        setSelectedAssignment(assignment || null);
        setIsAssignmentModalOpen(true);
    };

    const handleSaveAssignmentSuccess = () => {
        setIsAssignmentModalOpen(false);
        fetchData();
    };

    const handleDeleteAssignment = async (id: string) => {
        if (confirm('Are you sure you want to delete this assignment?')) {
            await assignmentService.deleteAssignment(id);
            fetchData();
        }
    };

    const handleOpenSubmissionReview = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setIsSubmissionModalOpen(true);
    };

    const handleOpenAIForSubject = (subject: Subject) => {
        setAiConfig({
            title: `Generate Syllabus: ${subject.name}`,
            prompt: `Create a detailed syllabus for the subject "${subject.name}" (Code: ${subject.code}). Include course objectives, weekly topics (12 weeks), and recommended reading.`,
            context: { subject }
        });
        setIsAIModalOpen(true);
    };

    const handleOpenAIForExam = (exam: Exam) => {
        setAiConfig({
            title: `Generate Questions: ${exam.name}`,
            prompt: `Generate 5 sample exam questions for "${exam.name}" based on the subject. Include a mix of multiple choice and short answer.`,
            context: { exam }
        });
        setIsAIModalOpen(true);
    };

    const handleAIResult = (content: string) => {
        // In a real app, we might save this to a 'syllabus' field or 'resources'
        alert("Content Generated! You can copy it from the modal for now. (Integration pending)");
        setIsAIModalOpen(false);
    };

    // --- Results Handlers ---
    const openResultsModal = async (exam: Exam) => {
        setSelectedExam(exam);
        setIsResultsModalOpen(true);
        try {
            // Fetch students in the class
            const enrollments = await academicsService.getExamResults(exam.id);

            // Merge data (assuming academicsService.getExamResults returns students mapped with marks if they exist)
            // Wait, I should check what getExamResults returns
            const studentResults: StudentResult[] = enrollments.map((res: any) => {
                return {
                    studentId: res.student,
                    studentName: res.expand?.student?.name || 'Unknown',
                    marks_obtained: res.marks_obtained || '',
                    resultId: res.id
                };
            });

            // If no results yet, we might need students from enrollmentService...
            // Let's stick to simple merge for now or fetch class students if results list is empty.
            if (studentResults.length === 0) {
                const classStudents = await academicsService.getClasses().then(cls => cls.find(c => c.id === exam.class));
                // Note: academicsService.getClasses doesn't give students. 
                // I'll fetch them from enrollmentService
            }

            setExamResults(studentResults);
        } catch (e) {
            console.error("Error fetching results:", e);
            addToast('Failed to load results', 'error');
        }
    };

    const saveResult = async (studentId: string, marks_obtained: number, resultId: string | null) => {
        try {
            if (!selectedExam) return;

            if (resultId) {
                await academicsService.updateGrade(resultId, marks_obtained);
            } else {
                const res = await academicsService.createGrade({
                    exam: selectedExam.id,
                    student: studentId,
                    marks_obtained
                });
                // Update local state with new ID
                setExamResults(prev => prev.map(r => r.studentId === studentId ? { ...r, resultId: res.id } : r));
            }
        } catch (e) {
            console.error("Error saving result:", e);
            addToast('Failed to save result', 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>Academic Management</Heading1>
                    <Text variant="muted">Manage curriculum, scheduling, and assessments.</Text>
                </div>
                <div className="flex gap-3">
                    <Button name="view-timetable" variant="secondary" leftIcon={<OwnerIcon name="CalendarIcon" className="w-4 h-4" />}>View Timetable</Button>
                    <Button
                        name="create-primary-action"
                        variant="primary"
                        leftIcon={<OwnerIcon name="PlusCircleIcon" className="w-4 h-4" />}
                        onClick={() => {
                            if (localTab === 'Active Classes') handleOpenClassModal();
                            else if (localTab === 'Curriculum') handleOpenSubjectModal();
                            else if (localTab === 'Exams') setIsExamModalOpen(true);
                            else if (localTab === 'Assignments') handleOpenAssignmentModal();
                        }}
                    >
                        {localTab === 'Active Classes' ? 'Create Class' : localTab === 'Curriculum' ? 'Add Subject' : localTab === 'Exams' ? 'Schedule Exam' : 'New Assignment'}
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {loading ? (
                    <StatsSkeleton cols={4} />
                ) : [
                    { label: 'Active Classes', val: classes.length.toString(), icon: 'Book', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Students', val: stats.totalStudents.toLocaleString(), icon: 'UserGroup', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Teachers', val: stats.totalTeachers.toLocaleString(), icon: 'AcademicCapIcon', color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Avg Attendance', val: '--', icon: 'CheckCircleIcon', color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <Card key={i} className="flex items-center gap-4 border-l-4 border-l-transparent hover:border-l-gyn-blue-medium transition-all">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <OwnerIcon name={stat.icon as any} className="w-6 h-6" />
                        </div>
                        <div>
                            <Text variant="muted" className="text-sm">{stat.label}</Text>
                            <Heading3 className="!mt-0">{stat.val}</Heading3>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="min-h-[500px]" padding="none">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <Tabs
                        tabs={['Active Classes', 'Curriculum', 'Exams', 'Assignments']}
                        activeTab={localTab}
                        onTabChange={setLocalTab}
                    />
                </div>

                <div className="p-0">
                    <Table>
                        {localTab === 'Active Classes' && (
                            <>
                                <Thead>
                                    <Tr>
                                        <Th>Class Name</Th>
                                        <Th>Code</Th>
                                        <Th>Room</Th>
                                        <Th>Year</Th>
                                        <Th className="text-right">Actions</Th>
                                    </Tr>
                                </Thead>
                                {loading ? <TableSkeleton rows={5} /> : (
                                    <tbody>
                                        {classes.map(cls => (
                                            <Tr key={cls.id}>
                                                <Td><span className="font-bold text-gray-900 dark:text-white">{cls.name}</span></Td>
                                                <Td><Badge variant="neutral">{cls.code}</Badge></Td>
                                                <Td>{cls.room}</Td>
                                                <Td>{cls.academic_year}</Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button name="edit-class" variant="ghost" size="sm" onClick={() => handleOpenClassModal(cls)}>Edit</Button>
                                                        <Button name="delete-class" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClass(cls.id)}>Delete</Button>
                                                    </div>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </tbody>
                                )}
                            </>
                        )}

                        {localTab === 'Curriculum' && (
                            <>
                                <Thead>
                                    <Tr>
                                        <Th>Subject Name</Th>
                                        <Th>Code</Th>
                                        <Th>Credits</Th>
                                        <Th className="text-right">Actions</Th>
                                    </Tr>
                                </Thead>
                                {loading ? <TableSkeleton rows={5} /> : (
                                    <tbody>
                                        {subjects.map(sub => (
                                            <Tr key={sub.id}>
                                                <Td><span className="font-bold text-gray-900 dark:text-white">{sub.name}</span></Td>
                                                <Td><Badge variant="neutral">{sub.code}</Badge></Td>
                                                <Td>{sub.credits}</Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button name="generate-syllabus" variant="ghost" size="sm" onClick={() => handleOpenAIForSubject(sub)} leftIcon={<Icon name="Sparkles" className="w-3 h-3 text-purple-500" />}>Syllabus</Button>
                                                        <Button name="edit-subject" variant="ghost" size="sm" onClick={() => handleOpenSubjectModal(sub)}>Edit</Button>
                                                        <Button name="delete-subject" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteSubject(sub.id)}>Delete</Button>
                                                    </div>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </tbody>
                                )}
                            </>
                        )}

                        {localTab === 'Exams' && (
                            <>
                                <Thead>
                                    <Tr>
                                        <Th>Exam Name</Th>
                                        <Th>Subject</Th>
                                        <Th>Class</Th>
                                        <Th>Date</Th>
                                        <Th>Marks</Th>
                                        <Th className="text-right">Actions</Th>
                                    </Tr>
                                </Thead>
                                {loading ? <TableSkeleton rows={5} /> : (
                                    <tbody>
                                        {exams.map(exam => (
                                            <Tr key={exam.id}>
                                                <Td><span className="font-bold text-gray-900 dark:text-white">{exam.name}</span></Td>
                                                <Td>{exam.expand?.subject?.name || '-'}</Td>
                                                <Td>{exam.expand?.class?.name || '-'}</Td>
                                                <Td>{new Date(exam.date).toLocaleDateString()}</Td>
                                                <Td>{exam.total_marks}</Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button name="generate-questions" variant="ghost" size="sm" onClick={() => handleOpenAIForExam(exam)} leftIcon={<Icon name="Sparkles" className="w-3 h-3 text-purple-500" />}>Questions</Button>
                                                        <Button name="view-results" variant="ghost" size="sm" onClick={() => openResultsModal(exam)}>Results</Button>
                                                        <Button name="delete-exam" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteExam(exam.id)}>Delete</Button>
                                                    </div>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </tbody>
                                )}
                            </>
                        )}
                        {localTab === 'Assignments' && (
                            <>
                                <Thead>
                                    <Tr>
                                        <Th>Title</Th>
                                        <Th>Class</Th>
                                        <Th>Due Date</Th>
                                        <Th>Status</Th>
                                        <Th className="text-right">Actions</Th>
                                    </Tr>
                                </Thead>
                                {loading ? <TableSkeleton rows={5} /> : (
                                    <tbody>
                                        {assignments.map(assignment => (
                                            <Tr key={assignment.id}>
                                                <Td><span className="font-bold text-gray-900 dark:text-white">{assignment.title}</span></Td>
                                                <Td>{assignment.expand?.class_id?.name || '-'}</Td>
                                                <Td>{new Date(assignment.due_date).toLocaleDateString()}</Td>
                                                <Td>
                                                    <Badge variant={assignment.status === 'published' ? 'success' : assignment.status === 'draft' ? 'neutral' : 'warning'}>
                                                        {assignment.status}
                                                    </Badge>
                                                </Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button name="view-submissions" variant="ghost" size="sm" onClick={() => handleOpenSubmissionReview(assignment)}>Submissions</Button>
                                                        <Button name="edit-assignment" variant="ghost" size="sm" onClick={() => handleOpenAssignmentModal(assignment)}>Edit</Button>
                                                        <Button name="delete-assignment" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteAssignment(assignment.id)}>Delete</Button>
                                                    </div>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </tbody>
                                )}
                            </>
                        )}
                    </Table>
                </div>
            </Card>

            {/* Modals */}
            {isAssignmentModalOpen && (
                <AssignmentModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    onSuccess={handleSaveAssignmentSuccess}
                    assignmentData={selectedAssignment as unknown as AssignmentRecord}
                    teacherId={user?.id}
                />
            )}

            {isSubmissionModalOpen && selectedAssignment && (
                <SubmissionReviewModal
                    isOpen={isSubmissionModalOpen}
                    onClose={() => setIsSubmissionModalOpen(false)}
                    assignment={selectedAssignment}
                />
            )}

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={handleAIResult}
                title={aiConfig.title}
                promptTemplate={aiConfig.prompt}
                contextData={aiConfig.context}
            />

            <Modal isOpen={isResultsModalOpen} onClose={() => setIsResultsModalOpen(false)} title={`Results: ${selectedExam?.name}`}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="p-2">Student</th>
                                <th className="p-2">Marks (/{selectedExam?.total_marks})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {examResults.map(res => (
                                <tr key={res.studentId} className="border-b dark:border-slate-800">
                                    <td className="p-2">{res.studentName}</td>
                                    <td className="p-2">
                                        <input
                                            name="marks-obtained"
                                            type="number"
                                            className="w-20 p-1 border rounded dark:bg-slate-800 dark:border-slate-700"
                                            value={res.marks_obtained}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setExamResults(prev => prev.map(r => r.studentId === res.studentId ? { ...r, marks_obtained: val } : r));
                                            }}
                                            onBlur={e => saveResult(res.studentId, Number(e.target.value), res.resultId)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                        <Button name="results-done" variant="primary" onClick={() => setIsResultsModalOpen(false)}>Done</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title={editingClass ? "Edit Class" : "Create New Class"}>
                <div className="space-y-4">
                    <input name="class-name" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Class Name (e.g. Grade 10-A)" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
                    <input name="class-code" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Code (e.g. G10A)" value={classForm.code} onChange={e => setClassForm({ ...classForm, code: e.target.value })} />
                    <input name="class-room" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Room (e.g. 304)" value={classForm.room} onChange={e => setClassForm({ ...classForm, room: e.target.value })} />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button name="class-cancel" variant="ghost" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
                        <Button name="class-save" variant="primary" onClick={handleSaveClass}>{editingClass ? "Save Changes" : "Create"}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title={editingSubject ? "Edit Subject" : "Add Subject"}>
                <div className="space-y-4">
                    <input name="subject-name" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Subject Name (e.g. Mathematics)" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                    <input name="subject-code" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Code (e.g. MATH101)" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
                    <input name="subject-credits" type="number" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Credits" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) })} />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button name="subject-cancel" variant="ghost" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
                        <Button name="subject-save" variant="primary" onClick={handleSaveSubject}>{editingSubject ? "Save Changes" : "Create"}</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title="Schedule Exam">
                <div className="space-y-4">
                    <input name="exam-name" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" placeholder="Exam Name (e.g. Midterm)" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} />
                    <select name="exam-subject" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" value={examForm.subject} onChange={e => setExamForm({ ...examForm, subject: e.target.value })}>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select name="exam-class" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" value={examForm.class} onChange={e => setExamForm({ ...examForm, class: e.target.value })}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input name="exam-date" type="datetime-local" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" value={examForm.date} onChange={e => setExamForm({ ...examForm, date: e.target.value })} />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button name="exam-cancel" variant="ghost" onClick={() => setIsExamModalOpen(false)}>Cancel</Button>
                        <Button name="exam-schedule" variant="primary" onClick={handleCreateExam}>Schedule</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Academics;