import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { OwnerIcon } from '../OwnerIcons';
import { useValidation } from '../../../hooks/useValidation';
import { enrollmentService } from '../../../services/enrollmentService';
import pb from '../../../lib/pocketbase';
import { z } from 'zod';

// Enrollment validation schema
const enrollmentSchema = z.object({
    studentId: z.string().min(1, 'Student is required'),
    classId: z.string().min(1, 'Class is required')
});

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classId?: string; // Optional: if enrolling into a specific class
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    classId
}) => {
    const [selectedClass, setSelectedClass] = useState(classId || '');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Load classes if not provided
                if (!classId) {
                    const classesResult = await pb.collection('classes').getFullList({
                        sort: 'name',
                        requestKey: null
                    });
                    setClasses(classesResult);
                }

                // Load students
                const studentsResult = await pb.collection('students').getFullList({
                    sort: 'name',
                    requestKey: null
                });
                setStudents(studentsResult);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
            setError('');
            if (!classId) setSelectedClass('');
            setSelectedStudent('');
        }
    }, [isOpen, classId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate with Zod
        const validationResult = enrollmentSchema.safeParse({
            studentId: selectedStudent,
            classId: selectedClass
        });

        if (!validationResult.success) {
            setError(validationResult.error.issues[0].message);
            return;
        }

        setSubmitting(true);

        try {
            await enrollmentService.enrollStudent(selectedStudent, selectedClass);
            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Enrollment failed:', err);
            const message = err instanceof Error ? err.message : 'Failed to enroll student';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Enroll Student"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                        {error}
                    </div>
                )}

                {/* Class Selection (if not pre-selected) */}
                {!classId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Class <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
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
                )}

                {/* Student Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        disabled={submitting || loading}
                    >
                        <option value="">Select a student</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.name} ({student.email})
                            </option>
                        ))}
                    </Select>
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
                        leftIcon={<OwnerIcon name="PlusCircleIcon" className="w-4 h-4" />}
                    >
                        Enroll Student
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
