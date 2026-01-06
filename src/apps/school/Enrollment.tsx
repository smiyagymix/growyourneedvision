import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Heading2, Heading3, Text, Badge, Card, Button, Icon, OwnerIcon, Select } from '../../components/shared/ui/CommonUI';
import { EnrollmentModal } from '../../components/shared/modals/EnrollmentModal';
import { enrollmentService, EnrollmentRecord } from '../../services/enrollmentService';
import { academicsService } from '../../services/academicsService';
import { TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { useToast } from '../../hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';

export const Enrollment: React.FC = () => {
    const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    // Load classes on mount
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const result = await academicsService.getClasses();
                setClasses(result);
                if (result.length > 0) {
                    setSelectedClass(result[0].id);
                }
            } catch (error) {
                console.error('Failed to load classes:', error);
                addToast('Failed to load classes', 'error');
            }
        };
        loadClasses();
    }, []);

    // Load enrollments when class changes
    useEffect(() => {
        if (selectedClass) {
            fetchEnrollments(selectedClass);
        }
    }, [selectedClass]);

    const fetchEnrollments = async (classId: string) => {
        setLoading(true);
        try {
            const result = await enrollmentService.getClassEnrollments(classId);
            setEnrollments(result.items as EnrollmentRecord[]);
        } catch (error) {
            console.error('Failed to load enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (enrollmentId: string) => {
        if (!window.confirm('Are you sure you want to withdraw this student?')) return;

        try {
            await enrollmentService.withdrawStudent(enrollmentId);
            await fetchEnrollments(selectedClass);
            addToast('Student withdrawn successfully', 'success');
        } catch (error) {
            console.error('Failed to withdraw student:', error);
            addToast('Failed to withdraw student', 'error');
        }
    };

    const handleModalSuccess = () => {
        if (selectedClass) {
            fetchEnrollments(selectedClass);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Heading1>Student Enrollment</Heading1>
                    <Text variant="muted">Manage class enrollments and student status</Text>
                </div>
                <Button
                    name="enroll-student"
                    variant="primary"
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={<OwnerIcon name="PlusCircleIcon" className="w-4 h-4" />}
                >
                    Enroll Student
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Class
                        </label>
                        <Select
                            name="select-class"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select a class...</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} ({cls.code})
                                </option>
                            ))}
                        </Select>
                    </div>

                    {selectedClass && (
                        <div className="mt-6">
                            <Text variant="muted">
                                {enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled
                            </Text>
                        </div>
                    )}
                </div>
            </Card>

            {/* Enrollment List */}
            <Card>
                {loading ? (
                    <TableSkeleton rows={8} />
                ) : !selectedClass ? (
                    <div className="text-center py-12">
                        <OwnerIcon name="AcademicCapIcon" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <Text variant="muted">Select a class to view enrollments</Text>
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-12">
                        <OwnerIcon name="UsersIcon" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <Text variant="muted">No students enrolled in this class yet</Text>
                        <Button
                            name="enroll-first-student"
                            variant="secondary"
                            className="mt-4"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Enroll First Student
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Enrolled Date</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {enrollments.map((enrollment) => (
                                        <motion.tr
                                            key={enrollment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gyn-blue-light flex items-center justify-center text-gyn-blue-dark font-medium">
                                                        {enrollment.expand?.student?.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {enrollment.expand?.student?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {enrollment.expand?.student?.email || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(enrollment.created).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={enrollment.status === 'active' ? 'success' : 'neutral'}>
                                                    {enrollment.status || 'active'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    name="withdraw-student"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                    onClick={() => handleWithdraw(enrollment.id)}
                                                >
                                                    Withdraw
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Enrollment Modal */}
            <EnrollmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
                classId={selectedClass}
            />
        </div>
    );
};

export default Enrollment;
