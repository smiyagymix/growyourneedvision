import React, { useState, useEffect } from 'react';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { Heading1, Heading3, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Button } from '../../components/shared/ui/Button';
import { Badge } from '../../components/shared/ui/Badge';
import { Tabs } from '../../components/shared/ui/Tabs';
import { assignmentService, AssignmentRecord, SubmissionRecord } from '../../services/assignmentService';
import { GradeSubmissionModal } from '../../components/shared/modals/GradeSubmissionModal';
import { useAuth } from '../../context/AuthContext';

import { TableSkeleton, StatsSkeleton } from '../../components/shared/ui/DashboardSkeletons';

const TeacherGrading: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRecord | null>(null);
    const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);

    const fetchAssignments = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const result = await assignmentService.getAssignments(user.id);
            setAssignments(result.items);

            if (result.items.length > 0 && !selectedAssignment) {
                setSelectedAssignment(result.items[0]);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async (assignmentId: string) => {
        setLoadingSubmissions(true);
        try {
            const subs = await assignmentService.getSubmissions(assignmentId);
            setSubmissions(subs);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [user]);

    useEffect(() => {
        if (selectedAssignment) {
            fetchSubmissions(selectedAssignment.id);
        }
    }, [selectedAssignment]);

    const handleGradeClick = (submission: SubmissionRecord) => {
        setSelectedSubmission(submission);
        setIsGradeModalOpen(true);
    };

    const handleGradeSuccess = async () => {
        if (selectedAssignment) {
            await fetchSubmissions(selectedAssignment.id);
        }
    };

    const pendingSubmissions = submissions.filter(s => s.grade === undefined || s.grade === null);
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined && s.grade !== null);
    const averageGrade = gradedSubmissions.length > 0
        ? (gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length).toFixed(1)
        : 'N/A';

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Heading1 className="text-gray-900 dark:text-white font-black">Grading Center</Heading1>
                    <Text variant="muted" className="font-medium">Review and evaluate student achievement</Text>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Teacher</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <StatsSkeleton cols={3} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="flex items-center gap-4 border-l-4 border-l-orange-500 shadow-sm border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 shadow-inner">
                            <OwnerIcon name="ClockIcon" className="w-6 h-6" />
                        </div>
                        <div>
                            <Text variant="muted" className="text-xs font-black uppercase tracking-tighter">Pending Review</Text>
                            <Heading3 className="!mt-0 font-black text-2xl">{pendingSubmissions.length}</Heading3>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-4 border-l-4 border-l-green-500 shadow-sm border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600 shadow-inner">
                            <OwnerIcon name="CheckCircleIcon" className="w-6 h-6" />
                        </div>
                        <div>
                            <Text variant="muted" className="text-xs font-black uppercase tracking-tighter">Completed</Text>
                            <Heading3 className="!mt-0 font-black text-2xl">{gradedSubmissions.length}</Heading3>
                        </div>
                    </Card>

                    <Card className="flex items-center gap-4 border-l-4 border-l-blue-500 shadow-sm border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 shadow-inner">
                            <OwnerIcon name="ChartBarIcon" className="w-6 h-6" />
                        </div>
                        <div>
                            <Text variant="muted" className="text-xs font-black uppercase tracking-tighter">Average Grade</Text>
                            <Heading3 className="!mt-0 font-black text-2xl">{averageGrade}%</Heading3>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assignment List */}
                <Card className="lg:col-span-1 shadow-sm border-gray-100 dark:border-gray-700">
                    <Heading3 className="font-black mb-4">Assignments</Heading3>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : assignments.length === 0 ? (
                        <Text variant="muted" className="text-center py-8">No active assignments</Text>
                    ) : (
                        <div className="space-y-2">
                            {assignments.map((assignment) => (
                                <button
                                    key={assignment.id}
                                    onClick={() => setSelectedAssignment(assignment)}
                                    className={`w-full text-left p-4 rounded-xl transition-all border-2 ${selectedAssignment?.id === assignment.id
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md scale-[1.02]'
                                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                                        }`}
                                >
                                    <p className="font-black text-sm text-gray-900 dark:text-white truncate">{assignment.title}</p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">
                                        {assignment.expand?.class_id?.name || 'Academic Class'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Submissions List */}
                <Card className="lg:col-span-2 shadow-sm border-gray-100 dark:border-gray-700">
                    {selectedAssignment ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <Heading3 className="font-black text-indigo-600">{selectedAssignment.title}</Heading3>
                                    <Text variant="muted" className="text-xs font-bold uppercase tracking-widest mt-1">
                                        {submissions.length} submission{submissions.length !== 1 ? 's' : ''} recorded
                                    </Text>
                                </div>
                            </div>

                            {loadingSubmissions ? (
                                <TableSkeleton rows={5} />
                            ) : submissions.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <OwnerIcon name="InboxIcon" className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                                    <Text variant="muted" className="font-bold">No students have submitted yet</Text>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {submissions.map((submission) => {
                                        const isGraded = submission.grade !== undefined && submission.grade !== null;
                                        const percentage = isGraded
                                            ? ((submission.grade! / (selectedAssignment.points || 100)) * 100).toFixed(0)
                                            : null;

                                        return (
                                            <div
                                                key={submission.id}
                                                className="p-5 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-lg transition-all bg-white dark:bg-gray-800/30 group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <p className="font-black text-gray-900 dark:text-white text-lg">
                                                                {submission.expand?.student_id?.name || 'Student Participant'}
                                                            </p>
                                                            {isGraded ? (
                                                                <Badge variant="success" className="font-black rounded-full px-3">Graded</Badge>
                                                            ) : (
                                                                <Badge variant="warning" className="font-black rounded-full px-3">Pending</Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-6 text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                                    <OwnerIcon name="CalendarIcon" className="w-4 h-4 text-indigo-500" />
                                                                </div>
                                                                <span>{new Date(submission.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                            {submission.files && submission.files.length > 0 && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                                        <OwnerIcon name="PaperClipIcon" className="w-4 h-4 text-indigo-500" />
                                                                    </div>
                                                                    <span>{submission.files.length} attachment{submission.files.length !== 1 ? 's' : ''}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {isGraded && (
                                                            <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-black text-green-900 dark:text-green-400">
                                                                        Score: {submission.grade}/{selectedAssignment.points || 100} ({percentage}%)
                                                                    </p>
                                                                    <div className="h-2 w-32 bg-green-200 dark:bg-green-900/40 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-green-500" style={{ width: `${percentage}%` }} />
                                                                    </div>
                                                                </div>
                                                                {submission.feedback && (
                                                                    <p className="text-sm text-green-700 dark:text-green-500/80 mt-2 font-medium">"{submission.feedback}"</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Button
                                                        variant={isGraded ? 'outline' : 'primary'}
                                                        size="sm"
                                                        className="font-black rounded-xl"
                                                        onClick={() => handleGradeClick(submission)}
                                                        leftIcon={<OwnerIcon name={isGraded ? 'PencilIcon' : 'CheckIcon'} className="w-4 h-4" />}
                                                    >
                                                        {isGraded ? 'Update Grade' : 'Evaluate'}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-24 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <OwnerIcon name="AcademicCapIcon" className="w-10 h-10 text-indigo-600" />
                            </div>
                            <Text variant="muted" className="font-black text-gray-400">Select an assignment to lead the grading process</Text>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal remains same but check props */}
            {selectedSubmission && selectedAssignment && (
                <GradeSubmissionModal
                    isOpen={isGradeModalOpen}
                    onClose={() => setIsGradeModalOpen(false)}
                    onSuccess={handleGradeSuccess}
                    submission={selectedSubmission}
                    assignment={selectedAssignment}
                />
            )}
        </div>
    );
};

export default TeacherGrading;
