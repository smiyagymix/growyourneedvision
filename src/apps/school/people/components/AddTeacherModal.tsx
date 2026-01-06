import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../../../components/shared/ui/WidgetErrorBoundary';
import { Modal, Button } from '../../../../components/shared/ui/CommonUI';
import { userService, CreateUserParams, User } from '../../../../services/userService';
import { sanitizeText } from '../../../../utils/sanitization';
import { emailSchema } from '../../../../validation/schemas';

const teacherSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: emailSchema,
    role: z.literal('Teacher'),
    department: z.string().max(100, 'Department name too long').optional(),
    specialization: z.string().max(200, 'Specialization too long').optional(),
    verified: z.boolean()
});

interface AddTeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    teacherToEdit?: User | null;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose, onSuccess, teacherToEdit }) => {
    const [formData, setFormData] = useState<Partial<CreateUserParams>>({
        name: '',
        email: '',
        role: 'Teacher',
        department: '',
        specialization: '',
        verified: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (teacherToEdit) {
            setFormData({
                name: teacherToEdit.name,
                email: teacherToEdit.email,
                role: 'Teacher',
                department: teacherToEdit.department || '',
                specialization: teacherToEdit.specialization || '',
                verified: teacherToEdit.verified
            });
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'Teacher',
                department: '',
                specialization: '',
                verified: true
            });
        }
    }, [teacherToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Sanitize inputs to prevent XSS
            const sanitizedData = {
                name: sanitizeText(formData.name || ''),
                email: formData.email?.trim().toLowerCase() || '',
                role: 'Teacher' as const,
                department: sanitizeText(formData.department || ''),
                specialization: sanitizeText(formData.specialization || ''),
                verified: formData.verified ?? true
            };
            
            // Validate with Zod
            const result = teacherSchema.safeParse(sanitizedData);
            if (!result.success) {
                setError(result.error.issues[0].message);
                setLoading(false);
                return;
            }

            if (teacherToEdit) {
                await userService.updateUser(teacherToEdit.id, result.data);
            } else {
                await userService.createUser(result.data as CreateUserParams);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save teacher:', err);
            setError(err.message || 'Failed to save teacher');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={teacherToEdit ? 'Edit Teacher' : 'Add New Teacher'}>
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
                        placeholder="Jane Smith"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        disabled={!!teacherToEdit}
                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jane.smith@school.edu"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                        <select
                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                        >
                            <option value="">Select Department</option>
                            <option value="Science">Science</option>
                            <option value="Math">Math</option>
                            <option value="English">English</option>
                            <option value="History">History</option>
                            <option value="Arts">Arts</option>
                            <option value="PE">Physical Education</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.specialization}
                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                            placeholder="e.g. Physics"
                        />
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
                        {loading ? 'Saving...' : teacherToEdit ? 'Update Teacher' : 'Create Teacher'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
