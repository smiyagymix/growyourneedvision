import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { OwnerIcon } from '../OwnerIcons';
import { AssignmentRecord, SubmissionRecord } from '../../../services/assignmentService';
import { FileUploader } from '../FileUploader';
import { fileUploadService } from '../../../services/fileUploadService';
import { Badge } from '../ui/Badge';
import { storageQuotaService, StorageQuota } from '../../../services/storageQuotaService';
import { submissionSchema } from '../../../validation/schemas';
import { sanitizeText } from '../../../utils/sanitization';

interface SubmitAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assignment: AssignmentRecord;
    studentId: string;
    existingSubmission?: SubmissionRecord;
    onSubmit: (data: { notes: string; files: File[] }) => Promise<void>;
}

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    assignment,
    studentId,
    existingSubmission,
    onSubmit
}) => {
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
    const [quota, setQuota] = useState<StorageQuota>({ used: 0, total: 0, percentage: 0 });
    const [history, setHistory] = useState<SubmissionRecord[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadQuota();
            // History loading moved to parent responsibility or removed for MVP
        } else {
            setNotes('');
            setFiles([]);
            setActiveTab('upload');
            setHistory([]);
        }

        if (existingSubmission) {
            setNotes(existingSubmission.notes || '');
        }
    }, [isOpen, existingSubmission]);

    const loadQuota = async () => {
        const data = await storageQuotaService.getUsage(studentId);
        setQuota(data);
    };

    // Load history removed from here to decouple from assignmentService
    // It should be passed as a prop if needed
    /* 
    const loadHistory = async () => {
        try {
            const data = await assignmentService.getSubmissionHistory(assignment.id, studentId);
            setHistory(data);
        } catch (error) {
            console.error('Failed to load submission history:', error);
        }
    };
    */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize notes
        const sanitizedNotes = sanitizeText(notes);

        // Validate with Zod
        const validationResult = submissionSchema.safeParse({
            assignment_id: assignment.id,
            student_id: studentId,
            notes: sanitizedNotes,
            status: 'Submitted'
        });

        if (!validationResult.success) {
            alert(`Validation error: ${validationResult.error.issues[0].message}`);
            return;
        }

        if (files.length === 0 && !existingSubmission) {
            alert('Please upload at least one file');
            return;
        }

        // Check quota
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        const hasSpace = await storageQuotaService.checkQuota(studentId, totalSize);

        if (!hasSpace) {
            alert('Not enough storage space!');
            return;
        }

        setSubmitting(true);

        try {
            // Call the provided submit handler
            await onSubmit({ notes, files });

            // NOTE: File upload logic should likely be handled by the parent or the onSubmit handler too
            // But for now keeping it here if it's generic, or assuming onSubmit handles it.
            // Actually, to fully decouple, the parent should handle file uploads too.
            // But let's assume simple decoupling first.
            if (files.length > 0) {
                await storageQuotaService.updateUsage(studentId, totalSize);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit assignment:', error);
            alert('Failed to submit assignment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Submit: ${assignment.title}`}
            size="lg"
        >
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upload' ? 'border-gyn-blue-medium text-gyn-blue-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        Submission
                    </button>
                    {existingSubmission && (
                        <button
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-gyn-blue-medium text-gyn-blue-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('history')}
                        >
                            History & Feedback
                        </button>
                    )}
                </div>

                {activeTab === 'upload' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Assignment Details */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Due Date</p>
                                    <p className="text-sm text-gray-900">
                                        {new Date(assignment.due_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-700">Points</p>
                                    <p className="text-sm text-gray-900">{assignment.points || 0}</p>
                                </div>
                            </div>

                            {assignment.description && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-1">Instructions</p>
                                    <p className="text-sm text-gray-600">{assignment.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Storage Quota */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-blue-800">Storage Quota</span>
                                <span className="text-blue-600">
                                    {(quota.used / 1024 / 1024).toFixed(1)}MB / {(quota.total / 1024 / 1024).toFixed(0)}MB
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${quota.percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                            </label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes or comments about your submission..."
                                rows={3}
                                disabled={submitting}
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Your Work <span className="text-red-500">*</span>
                            </label>
                            <FileUploader
                                onUpload={(uploadedFiles) => setFiles(uploadedFiles)}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.zip"
                                maxSize={10 * 1024 * 1024} // 10MB
                                maxFiles={5}
                                label="Drop assignment files here"
                                helperText="PDF, Word, PowerPoint, Images, or ZIP (Max 10MB)"
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
                                leftIcon={<OwnerIcon name="PaperAirplaneIcon" className="w-4 h-4" />}
                            >
                                {existingSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
                        {/* History View */}
                        {history.length > 0 ? (
                            history.map((submission, index) => (
                                <div key={submission.id} className="space-y-4 mb-8 border-b border-gray-100 pb-8 last:border-0 last:pb-0 last:mb-0">
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900">
                                                    {index === 0 ? 'Latest Submission' : `Submission ${history.length - index}`}
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    Submitted on {new Date(submission.submitted_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <Badge variant={submission.grade ? 'success' : 'info'}>
                                                {submission.grade ? 'Graded' : 'Pending Review'}
                                            </Badge>
                                        </div>

                                        {submission.files && submission.files.length > 0 && (
                                            <div className="space-y-2 mb-4">
                                                <p className="text-xs font-bold text-gray-500 uppercase">Files</p>
                                                {submission.files.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                                                        <OwnerIcon name="DocumentText" className="w-4 h-4 text-gray-400" />
                                                        <a
                                                            href={fileUploadService.getFileUrl(submission, file)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-gray-700 truncate flex-1 hover:text-gyn-blue-medium hover:underline"
                                                        >
                                                            {file}
                                                        </a>
                                                        <OwnerIcon name="EyeIcon" className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {submission.notes && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-500 uppercase">Your Notes</p>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">{submission.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {submission.grade !== undefined && (
                                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                            <h4 className="font-bold text-green-900 mb-2">Teacher Feedback</h4>
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="text-3xl font-black text-green-700">
                                                    {submission.grade}<span className="text-lg text-green-500 font-medium">/{assignment.points}</span>
                                                </div>
                                                <div className="h-8 w-px bg-green-200"></div>
                                                <div>
                                                    <p className="text-xs text-green-600 font-bold uppercase">Graded By</p>
                                                    <p className="text-sm text-green-800">{submission.graded_by || 'Teacher'}</p>
                                                </div>
                                            </div>
                                            {submission.feedback && (
                                                <p className="text-sm text-green-800 italic">"{submission.feedback}"</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No submission history found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
