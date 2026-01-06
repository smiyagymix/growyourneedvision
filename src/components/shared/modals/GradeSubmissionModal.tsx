import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { OwnerIcon } from '../OwnerIcons';
import { assignmentService, SubmissionRecord, AssignmentRecord } from '../../../services/assignmentService';
import { useAuth } from '../../../context/AuthContext';
import { AIContentGeneratorModal } from './AIContentGeneratorModal';
import { sanitizeHtml } from '../../../utils/sanitization';
import { gradeSchema } from '../../../validation/schemas';

interface GradeSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    submission: SubmissionRecord;
    assignment: AssignmentRecord;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    submission,
    assignment
}) => {
    const { user } = useAuth();
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    useEffect(() => {
        if (submission) {
            setGrade(submission.grade || 0);
            setFeedback(submission.feedback || '');
        }
    }, [submission]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (grade < 0 || grade > (assignment.points || 100)) {
            alert(`Grade must be between 0 and ${assignment.points || 100}`);
            return;
        }

        // Validate with Zod
        const validationResult = gradeSchema.safeParse({
            tenantId: user.tenantId || '',
            studentId: submission.student_id,
            courseId: assignment.class_id || '',
            assignmentId: assignment.id,
            value: grade,
            maxValue: assignment.points || 100,
            gradedBy: user.id,
            gradedAt: new Date().toISOString(),
            comments: feedback
        });

        if (!validationResult.success) {
            alert(`Validation error: ${validationResult.error.issues[0].message}`);
            return;
        }

        setSubmitting(true);

        try {
            // Sanitize feedback to prevent XSS
            const sanitizedFeedback = sanitizeHtml(feedback, 'BASIC');

            await assignmentService.gradeSubmission(
                submission.id,
                grade,
                sanitizedFeedback,
                user.id
            );

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to grade submission:', error);
            alert('Failed to save grade. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const percentage = ((grade / (assignment.points || 100)) * 100).toFixed(1);

    const handleAIResult = (content: string) => {
        setFeedback(prev => prev ? `${prev}\n\n${content}` : content);
        setIsAIModalOpen(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Grade Submission"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Student</p>
                            <p className="text-sm text-gray-900">
                                {submission.expand?.student_id?.name || 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Submitted</p>
                            <p className="text-sm text-gray-900">
                                {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {submission.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-1">Student Notes</p>
                            <p className="text-sm text-gray-600">{submission.notes}</p>
                        </div>
                    )}
                </div>

                {/* Assignment Details */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Assignment</h3>
                    <p className="text-sm text-gray-700">{assignment.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
                </div>

                {/* Submitted Files */}
                {submission.files && submission.files.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Submitted Files</h3>
                        <div className="space-y-2">
                            {submission.files.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <OwnerIcon name="DocumentText" className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-700 flex-1">{file}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(file, '_blank')}
                                    >
                                        <OwnerIcon name="EyeIcon" className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grade Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Input
                                type="number"
                                value={grade}
                                onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                                min={0}
                                max={assignment.points || 100}
                                step={0.5}
                                disabled={submitting}
                                placeholder="Enter grade"
                            />
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">out of {assignment.points || 100}</p>
                            <p className="text-lg font-semibold text-gray-900">{percentage}%</p>
                        </div>
                    </div>

                    {/* Grade Scale Helper */}
                    <div className="mt-2 flex gap-2">
                        {[
                            { label: 'A (90-100%)', value: 0.95 },
                            { label: 'B (80-89%)', value: 0.85 },
                            { label: 'C (70-79%)', value: 0.75 },
                            { label: 'D (60-69%)', value: 0.65 }
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => setGrade(Math.round((assignment.points || 100) * preset.value))}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                disabled={submitting}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Feedback
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAIModalOpen(true)}
                            leftIcon={<OwnerIcon name="Sparkles" className="w-3 h-3 text-purple-500" />}
                            className="text-xs"
                        >
                            Generate with AI
                        </Button>
                    </div>
                    <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide feedback to the student..."
                        rows={4}
                        disabled={submitting}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={submitting}
                        leftIcon={<OwnerIcon name="CheckIcon" className="w-4 h-4" />}
                    >
                        Save Grade
                    </Button>
                </div>
            </form>

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={handleAIResult}
                title="Generate Feedback"
                promptTemplate={`Generate constructive feedback for a student submission.
                Assignment: ${assignment.title}
                Description: ${assignment.description}
                Student Notes: ${submission.notes || 'None'}
                Grade Given: ${grade}/${assignment.points || 100}
                
                Provide encouraging but specific feedback based on the grade.`}
                contextData={{ submission, assignment, grade }}
            />
        </Modal>
    );
};
