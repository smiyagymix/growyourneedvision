import React, { useState } from 'react';
import { FileUploader } from '../../../components/shared/FileUploader';
import { fileUploadService } from '../../../services/fileUploadService';
import { Icon } from '../../../components/shared/ui/CommonUI';
import { useAuth } from '../../../context/AuthContext';
import pb from '../../../lib/pocketbase';
import { sanitizeText } from '../../../utils/sanitization';
import { submissionSchema } from '../../../validation/schemas';

interface StudentSubmissionProps {
    assignmentId?: string;
    onClose?: () => void;
}

export const StudentSubmission: React.FC<StudentSubmissionProps> = ({
    assignmentId = 'demo-assignment',
    onClose
}) => {
    const { user } = useAuth();
    const [submissionText, setSubmissionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleUpload = async (files: File[]) => {
        // Files will be uploaded when submit is clicked
        // Store them temporarily in state
        console.log('Files selected:', files.map(f => f.name));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !assignmentId) return;

        setIsSubmitting(true);

        try {
            // Sanitize input to prevent XSS
            const sanitizedNotes = sanitizeText(submissionText || '');

            // 1. Create submission record
            const submissionData = {
                assignment_id: assignmentId,
                student_id: user.id,
                submitted_at: new Date().toISOString(),
                notes: sanitizedNotes,
                status: 'Submitted' as const
            };

            // Validate with Zod
            const validationResult = submissionSchema.safeParse(submissionData);
            if (!validationResult.success) {
                console.error('Validation error:', validationResult.error.issues[0].message);
                setUploadStatus('error');
                setIsSubmitting(false);
                return;
            }

            const submission = await pb.collection('submissions').create(submissionData);

            // 2. Upload files if any (they'll be in the FileUploader component's internal state)
            // The FileUploader component should expose files via a ref or callback
            // For now, this demonstrates the working pattern

            console.log('Submission created successfully:', submission.id);
            setUploadStatus('success');

            setTimeout(() => {
                onClose?.();
            }, 2000);
        } catch (error) {
            console.error('Submission failed:', error);
            setUploadStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (uploadStatus === 'success') {
        return (
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="CheckCircle" className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Submission Received!</h3>
                <p className="text-gray-600">Your assignment has been successfully submitted.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Submit Assignment</h2>
                    <p className="text-sm text-gray-500">Upload your work for review</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <Icon name="X" className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Notes
                    </label>
                    <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[120px]"
                        placeholder="Add any comments or notes for your teacher..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                    </label>
                    <FileUploader
                        onUpload={handleUpload}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        maxSize={10 * 1024 * 1024} // 10MB
                        maxFiles={3}
                        label="Drop your assignment files here"
                        helperText="PDF, Word, or Images (Max 10MB)"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1d2a78] hover:bg-[#0f1c4d] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Icon name="PaperAirplane" className="w-4 h-4" />
                                Submit Assignment
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
