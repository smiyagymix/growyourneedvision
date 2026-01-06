import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../../../components/shared/ui/WidgetErrorBoundary';
import { Modal, Button } from '../../../../components/shared/ui/CommonUI';
import { userService, CreateUserParams, User } from '../../../../services/userService';
import { sanitizeText } from '../../../../utils/sanitization';
import { studentSchema, emailSchema } from '../../../../validation/schemas';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentToEdit?: User | null;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSuccess, studentToEdit }) => {
    const [formData, setFormData] = useState<Partial<CreateUserParams>>({
        name: '',
        email: '',
        role: 'Student',
        student_id: '',
        grade_level: '',
        verified: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (studentToEdit) {
            setFormData({
                name: studentToEdit.name,
                email: studentToEdit.email,
                role: 'Student',
                student_id: studentToEdit.student_id || '',
                grade_level: studentToEdit.grade_level || '',
                verified: studentToEdit.verified
            });
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'Student',
                student_id: '',
                grade_level: '',
                verified: true
            });
        }
    }, [studentToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate email format
            const emailResult = emailSchema.safeParse(formData.email);
            if (!emailResult.success) {
                setError(emailResult.error.issues[0].message);
                setLoading(false);
                return;
            }

            // Sanitize inputs to prevent XSS
            const sanitizedData = {
                ...formData,
                name: sanitizeText(formData.name || ''),
                email: sanitizeText(formData.email || ''),
                student_id: sanitizeText(formData.student_id || ''),
                grade_level: sanitizeText(formData.grade_level || '')
            };

            if (studentToEdit) {
                await userService.updateUser(studentToEdit.id, sanitizedData);
            } else {
                await userService.createUser(sanitizedData as CreateUserParams);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save student:', err);
            setError(err.message || 'Failed to save student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={studentToEdit ? 'Edit Student' : 'Add New Student'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        disabled={!!studentToEdit} // Prevent email change for now as it's the ID
                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@school.edu"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.student_id}
                            onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                            placeholder="STU-2024-001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Level</label>
                        <select
                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.grade_level}
                            onChange={e => setFormData({ ...formData, grade_level: e.target.value })}
                        >
                            <option value="">Select Grade</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="verified"
                        checked={formData.verified}
                        onChange={e => setFormData({ ...formData, verified: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="verified" className="text-sm text-gray-700 dark:text-gray-300">
                        Mark as Verified (Email confirmed)
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700 mt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Saving...' : studentToEdit ? 'Update Student' : 'Create Student'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
