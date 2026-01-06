import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { OwnerIcon } from '../OwnerIcons';
import { assignmentService } from '../../../services/assignmentService';
import { Submission, Assignment } from '../../../apps/school/types';
import pb from '../../../lib/pocketbase';
import { sanitizeHtml } from '../../../utils/sanitization';

const gradingSchema = z.object({
    grade: z.number().min(0, 'Grade cannot be negative').max(100, 'Grade cannot exceed 100'),
    feedback: z.string().min(10, 'Feedback must be at least 10 characters').max(2000, 'Feedback too long'),
    submissionId: z.string().min(1),
    graderId: z.string().min(1)
});

interface SubmissionReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

export const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
    isOpen,
    onClose,
    assignment
}) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    
    // Grading Form
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [grading, setGrading] = useState(false);

    useEffect(() => {
        if (isOpen && assignment) {
            fetchSubmissions();
        }
    }, [isOpen, assignment]);

    const fetchSubmissions = async () => {
        if (!assignment) return;
        setLoading(true);
        try {
            const res = await assignmentService.getSubmissions(assignment.id);
            // Cast to our Submission type if needed, though assignmentService returns SubmissionRecord which is compatible
            setSubmissions(res as unknown as Submission[]);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSubmission = (sub: Submission) => {
        setSelectedSubmission(sub);
        setGrade(sub.grade || 0);
        setFeedback(sub.feedback || '');
    };

    const handleGrade = async () => {
        if (!selectedSubmission || !assignment) return;
        
        const graderId = pb.authStore.model?.id;
        if (!graderId) {
            alert('User not authenticated');
            return;
        }
        
        // Sanitize feedback
        const sanitized = {
            grade,
            feedback: sanitizeHtml(feedback, 'BASIC'),
            submissionId: selectedSubmission.id,
            graderId
        };
        
        // Validate
        const result = gradingSchema.safeParse(sanitized);
        if (!result.success) {
            alert(`Validation error: ${result.error.issues[0].message}`);
            return;
        }
        
        setGrading(true);
        try {
            await assignmentService.gradeSubmission(
                result.data.submissionId,
                result.data.grade,
                result.data.feedback,
                result.data.graderId
            );
            
            // Update local state
            setSubmissions(prev => prev.map(s => 
                s.id === selectedSubmission.id 
                    ? { ...s, grade: result.data.grade, feedback: result.data.feedback, graded_at: new Date().toISOString() } 
                    : s
            ));
            setSelectedSubmission(null);
            alert('Grade saved successfully!');
        } catch (error) {
            console.error('Failed to grade submission:', error);
            alert('Failed to save grade');
        } finally {
            setGrading(false);
        }
    };

    const getFileUrl = (recordId: string, fileName: string) => {
        return pb.files.getUrl({ collectionId: 'submissions', id: recordId } as any, fileName);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Submissions: ${assignment?.title}`}
            size="xl"
        >
            <div className="flex h-[600px] gap-4">
                {/* List of Submissions */}
                <div className="w-1/3 border-r border-gray-200 dark:border-slate-700 pr-4 overflow-y-auto">
                    <h3 className="font-bold mb-4 text-sm uppercase text-gray-500">Students</h3>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No submissions yet</div>
                    ) : (
                        <div className="space-y-2">
                            {submissions.map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() => handleSelectSubmission(sub)}
                                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                                        selectedSubmission?.id === sub.id
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                            : 'bg-white border-gray-100 hover:border-blue-200 dark:bg-slate-800 dark:border-slate-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm">{sub.expand?.student_id?.name || 'Unknown Student'}</span>
                                        {sub.grade !== undefined && sub.grade !== null ? (
                                            <Badge variant="success">{sub.grade}/{assignment?.points}</Badge>
                                        ) : (
                                            <Badge variant="warning">Needs Grading</Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grading Area */}
                <div className="w-2/3 pl-4 overflow-y-auto">
                    {selectedSubmission ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedSubmission.expand?.student_id?.name}</h3>
                                    <p className="text-sm text-gray-500">Submitted on {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                                </div>
                                {selectedSubmission.submitted_at > (assignment?.due_date || '') && (
                                    <Badge variant="danger">Late Submission</Badge>
                                )}
                            </div>

                            {/* Files */}
                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                                <h4 className="font-bold text-sm mb-2">Attached Files</h4>
                                {selectedSubmission.files && selectedSubmission.files.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSubmission.files.map((file, i) => (
                                            <a
                                                key={i}
                                                href={getFileUrl(selectedSubmission.id, file)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md hover:text-blue-600 transition-colors"
                                            >
                                                <OwnerIcon name="DocumentIcon" className="w-4 h-4" />
                                                <span className="text-sm truncate max-w-[150px]">{file}</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No files attached</p>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedSubmission.notes && (
                                <div>
                                    <h4 className="font-bold text-sm mb-1">Student Notes</h4>
                                    <p className="text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">{selectedSubmission.notes}</p>
                                </div>
                            )}

                            {/* Grading Form */}
                            <div className="border-t pt-6 mt-6">
                                <h4 className="font-bold text-lg mb-4">Grade & Feedback</h4>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Score (/{assignment?.points})</label>
                                        <Input
                                            type="number"
                                            value={grade}
                                            onChange={e => setGrade(Number(e.target.value))}
                                            max={assignment?.points}
                                            min={0}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Feedback</label>
                                    <Textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        rows={4}
                                        placeholder="Enter feedback for the student..."
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleGrade} isLoading={grading}>Post Grade</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <OwnerIcon name="DocumentCheckIcon" className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a submission to view and grade</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
