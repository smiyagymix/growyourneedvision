import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { OwnerIcon } from '../OwnerIcons';
import { useValidation } from '../../../hooks/useValidation';
import { validateAssignment } from '../../../utils/validators';
import { assignmentService, AssignmentRecord } from '../../../services/assignmentService';
import { FileUpload } from '../FileUpload';
import { fileUploadService } from '../../../services/fileUploadService';
import pb from '../../../lib/pocketbase';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { useRateLimit, RateLimitPresets } from '../../../hooks/useRateLimit';
import { assignmentSchema } from '../../../validation/schemas';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assignmentData?: AssignmentRecord | null;
    teacherId?: string;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    assignmentData,
    teacherId
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        class_id: '',
        points: 100
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { errors, validate, getFieldError, touchField } = useValidation(validateAssignment);
    const { executeIfAllowed } = useRateLimit(RateLimitPresets.FORM_SUBMIT);

    // Load classes
    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const filter = teacherId ? `teacher = "${teacherId}"` : '';
                const result = await pb.collection('classes').getList(1, 100, {
                    filter,
                    sort: 'name',
                    expand: 'teacher',
                    requestKey: null
                });
                setClasses(result.items);
            } catch (error) {
                console.error('Failed to load classes:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchClasses();
        }
    }, [isOpen, teacherId]);

    // Populate form when editing
    useEffect(() => {
        if (assignmentData) {
            setFormData({
                title: assignmentData.title || '',
                description: assignmentData.description || '',
                due_date: assignmentData.due_date?.split('T')[0] || '',
                class_id: assignmentData.class_id || '',
                points: assignmentData.points || 100
            });
        } else {
            setFormData({
                title: '',
                description: '',
                due_date: '',
                class_id: '',
                points: 100
            });
            setFiles([]);
        }
    }, [assignmentData, isOpen]);

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        touchField(field);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate(formData)) {
            return;
        }

        // Validate with Zod schema
        const validationData = {
            tenantId: pb.authStore.model?.tenantId || '',
            courseId: formData.class_id,
            teacherId: teacherId || pb.authStore.model?.id || '',
            title: formData.title,
            description: formData.description,
            dueDate: new Date(formData.due_date).toISOString(),
            maxPoints: formData.points,
            type: 'homework' as const,
            status: 'published' as const
        };

        const zodResult = assignmentSchema.safeParse(validationData);
        if (!zodResult.success) {
            const errors = zodResult.error.format();
            alert(`Validation failed: ${Object.values(errors).filter(e => e && typeof e === 'object' && '_errors' in e).map((e: any) => e._errors[0]).join(', ')}`);
            return;
        }

        setSubmitting(true);

        try {
            // Determine teacher_id
            let finalTeacherId = teacherId;
            if (!finalTeacherId) {
                const selectedClass = classes.find(c => c.id === formData.class_id);
                if (selectedClass && selectedClass.teacher) {
                    finalTeacherId = selectedClass.teacher;
                } else if (selectedClass && selectedClass.expand?.teacher?.id) {
                    finalTeacherId = selectedClass.expand.teacher.id;
                } else {
                    // Fallback: if we can't find a teacher, we might need to use the current user or fail
                    // For now, let's assume the class has a teacher or the backend handles it (though backend usually requires it)
                    // If we are admin, maybe we assign ourselves?
                    // Let's try to proceed, but it might fail if teacher_id is required by schema
                    console.warn("No teacher ID found for assignment");
                }
            }

            if (!finalTeacherId) {
                alert("Could not determine the teacher for this class. Please ensure the class has a teacher assigned.");
                setSubmitting(false);
                return;
            }

            // Sanitize inputs to prevent XSS
            const sanitizedTitle = sanitizeText(formData.title);
            const sanitizedDescription = sanitizeHtml(formData.description, 'BASIC');

            const assignmentPayload = {
                ...formData,
                title: sanitizedTitle,
                description: sanitizedDescription,
                teacher_id: finalTeacherId,
                due_date: new Date(formData.due_date).toISOString()
            };

            let assignment;
            if (assignmentData) {
                // Update existing assignment
                assignment = await assignmentService.updateAssignment(assignmentData.id, assignmentPayload);
            } else {
                // Create new assignment
                assignment = await assignmentService.createAssignment(assignmentPayload);
            }

            // Upload files if any
            if (files.length > 0 && assignment) {
                await fileUploadService.uploadFiles(
                    files,
                    'assignments',
                    assignment.id,
                    'attachments'
                );
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save assignment:', error);
            alert('Failed to save assignment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={assignmentData ? 'Edit Assignment' : 'Create New Assignment'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignment Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g., Chapter 5 Homework"
                        error={getFieldError('title')}
                        disabled={submitting}
                    />
                </div>

                {/* Class */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={formData.class_id}
                        onChange={(e) => handleChange('class_id', e.target.value)}
                        error={getFieldError('class_id')}
                        disabled={submitting || loading}
                    >
                        <option value="">Select a class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.code})
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe the assignment, requirements, and instructions..."
                        rows={4}
                        error={getFieldError('description')}
                        disabled={submitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => handleChange('due_date', e.target.value)}
                            error={getFieldError('due_date')}
                            disabled={submitting}
                        />
                    </div>

                    {/* Points */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points
                        </label>
                        <Input
                            type="number"
                            value={formData.points}
                            onChange={(e) => handleChange('points', parseInt(e.target.value))}
                            placeholder="100"
                            min={0}
                            max={1000}
                            error={getFieldError('points')}
                            disabled={submitting}
                        />
                    </div>
                </div>

                {/* File Attachments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments (Optional)
                    </label>
                    <FileUpload
                        onUpload={(uploadedFiles) => setFiles(uploadedFiles)}
                        multiple={true}
                        maxSize={10}
                        maxFiles={5}
                        allowedExtensions={['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png']}
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
                        {assignmentData ? 'Update Assignment' : 'Create Assignment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
