import React, { useState, useEffect } from 'react';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { Heading1, Text } from '../../components/shared/ui/Typography';
import { Card } from '../../components/shared/ui/Card';
import { Button } from '../../components/shared/ui/Button';
import { Table, Thead, Tr, Th, Td } from '../../components/shared/ui/Table';
import { Badge } from '../../components/shared/ui/Badge';
import { assignmentService, AssignmentRecord } from '../../services/assignmentService';
import { AssignmentModal } from '../../components/shared/modals/AssignmentModal';
import { useAuth } from '../../context/AuthContext';
import { errorHandler } from '../../services/errorHandler';

interface Props {
  activeTab: string;
  activeSubNav: string;
}

const TeacherAssignments: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRecord | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchAssignments = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const result = await assignmentService.getAssignments(user.id);
            setAssignments(result.items);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [user]);

    // Filter assignments based on activeTab and activeSubNav
    const filteredAssignments = assignments.filter(assignment => {
        const now = new Date();
        const dueDate = new Date(assignment.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;

        if (activeTab === 'Active') {
            if (activeSubNav === 'Due Soon') return !isOverdue && daysUntilDue <= 3;
            if (activeSubNav === 'All') return !isOverdue;
            return !isOverdue;
        }
        if (activeTab === 'Archive') {
            return isOverdue;
        }
        // For Grading, we would ideally check submissions status, but for now we'll show all
        // or maybe show assignments that have submissions?
        if (activeTab === 'Grading') {
             return true; // Placeholder logic for grading view
        }
        return true;
    });

    useEffect(() => {
        if (activeTab === 'Create' && activeSubNav === 'New Assignment') {
            handleCreateAssignment();
        }
    }, [activeTab, activeSubNav]);

    const handleCreateAssignment = () => {
        setSelectedAssignment(null);
        setIsModalOpen(true);
    };

    const handleEditAssignment = (assignment: AssignmentRecord) => {
        setSelectedAssignment(assignment);
        setIsModalOpen(true);
    };

    const handleDeleteAssignment = async (id: string) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000); // Reset after 3 seconds
            return;
        }

        try {
            await assignmentService.deleteAssignment(id);
            await fetchAssignments();
            setDeleteConfirm(null);
        } catch (error) {
            const appError = errorHandler.handle(error);
            alert(appError.userMessage);
        }
    };

    const handleModalSuccess = async () => {
        await fetchAssignments();
    };

    const getStatusBadge = (dueDate: string) => {
        const due = new Date(dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            return <Badge variant="danger">Overdue</Badge>;
        } else if (daysUntilDue <= 3) {
            return <Badge variant="warning">Due Soon</Badge>;
        } else {
            return <Badge variant="success">Active</Badge>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>Assignments</Heading1>
                    <Text variant="muted">Create and manage assignments for your classes</Text>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<OwnerIcon name="PlusCircleIcon" className="w-4 h-4" />}
                    onClick={handleCreateAssignment}
                >
                    Create Assignment
                </Button>
            </div>

            {/* Assignments Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gyn-blue-medium"></div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="text-center py-12">
                        <OwnerIcon name="DocumentText" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <Text variant="muted">No assignments found for {activeTab} - {activeSubNav}.</Text>
                        {activeTab === 'Active' && (
                             <Button variant="ghost" onClick={handleCreateAssignment}>Create one now?</Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Title</Th>
                                <Th>Class</Th>
                                <Th>Due Date</Th>
                                <Th>Points</Th>
                                <Th>Status</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <tbody>
                            {filteredAssignments.map((assignment) => (
                                <Tr key={assignment.id}>
                                    <Td>
                                        <div>
                                            <p className="font-medium text-gray-900">{assignment.title}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-md">
                                                {assignment.description}
                                            </p>
                                        </div>
                                    </Td>
                                    <Td>
                                        <span className="text-sm text-gray-700">
                                            {assignment.expand?.class_id?.name || 'N/A'}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span className="text-sm text-gray-700">
                                            {new Date(assignment.due_date).toLocaleDateString()}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span className="text-sm font-medium text-gray-900">
                                            {assignment.points || 0}
                                        </span>
                                    </Td>
                                    <Td>{getStatusBadge(assignment.due_date)}</Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditAssignment(assignment)}
                                            >
                                                <OwnerIcon name="PencilIcon" className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                                className={deleteConfirm === assignment.id ? 'text-red-600' : ''}
                                            >
                                                <OwnerIcon name="TrashIcon" className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card>

            {/* Assignment Modal */}
            {user && (
                <AssignmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    assignmentData={selectedAssignment}
                    teacherId={user.id}
                />
            )}
        </div>
    );
};

export default TeacherAssignments;
