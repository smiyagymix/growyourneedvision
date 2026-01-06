import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import pb from '../../lib/pocketbase';

interface Grade {
    id: string;
    subject: string;
    assignment_title: string;
    grade: number;
    max_grade: number;
    percentage: number;
    submitted_date: string;
    graded_date?: string;
    feedback?: string;
}

export const ParentGrades: React.FC = () => {
    const { user } = useAuth();
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSubject, setFilterSubject] = useState<string>('all');

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            loadGrades(selectedChild);
        }
    }, [selectedChild]);

    const loadChildren = async () => {
        try {
            const childrenData = await pb.collection('users').getList(1, 10, {
                filter: `parent = "${user?.id}" && role = "Student"`,
                sort: 'name'
            });

            setChildren(childrenData.items);
            if (childrenData.items.length > 0) {
                setSelectedChild(childrenData.items[0].id);
            }
        } catch (error) {
            console.error('Failed to load children:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGrades = async (childId: string) => {
        try {
            const submissions = await pb.collection('submissions').getList(1, 100, {
                filter: `student = "${childId}" && grade != null`,
                sort: '-graded_date',
                expand: 'assignment,assignment.subject'
            });

            const gradesData: Grade[] = submissions.items.map((sub: any) => ({
                id: sub.id,
                subject: sub.expand?.assignment?.expand?.subject?.name || 'Unknown',
                assignment_title: sub.expand?.assignment?.title || 'Unknown Assignment',
                grade: sub.grade || 0,
                max_grade: sub.expand?.assignment?.max_points || 100,
                percentage: sub.grade && sub.expand?.assignment?.max_points
                    ? Math.round((sub.grade / sub.expand.assignment.max_points) * 100)
                    : 0,
                submitted_date: sub.submitted_at,
                graded_date: sub.graded_at,
                feedback: sub.feedback
            }));

            setGrades(gradesData);
        } catch (error) {
            console.error('Failed to load grades:', error);
        }
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 dark:text-green-400';
        if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
        if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
        if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getGradeBadge = (percentage: number) => {
        if (percentage >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (percentage >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        if (percentage >= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    };

    const subjects = ['all', ...new Set(grades.map(g => g.subject))];
    const filteredGrades = filterSubject === 'all'
        ? grades
        : grades.filter(g => g.subject === filterSubject);

    // Calculate stats
    const stats = {
        totalAssignments: filteredGrades.length,
        averageGrade: filteredGrades.length > 0
            ? Math.round(filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / filteredGrades.length)
            : 0,
        highestGrade: filteredGrades.length > 0
            ? Math.max(...filteredGrades.map(g => g.percentage))
            : 0,
        lowestGrade: filteredGrades.length > 0
            ? Math.min(...filteredGrades.map(g => g.percentage))
            : 0
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Icon name="ArrowPathIcon" className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Grades</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your child's academic performance</p>
                </div>

                {children.length > 0 && (
                    <select
                        className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        value={selectedChild}
                        onChange={(e) => setSelectedChild(e.target.value)}
                    >
                        {children.map((child: any) => (
                            <option key={child.id} value={child.id}>{child.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-300">Average Grade</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-white mt-2">{stats.averageGrade}%</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Grades</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalAssignments}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Highest</p>
                    <p className={`text-2xl font-bold mt-2 ${getGradeColor(stats.highestGrade)}`}>{stats.highestGrade}%</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lowest</p>
                    <p className={`text-2xl font-bold mt-2 ${getGradeColor(stats.lowestGrade)}`}>{stats.lowestGrade}%</p>
                </Card>
            </div>

            {/* Subject Filter */}
            <Card className="p-4">
                <div className="flex gap-2 overflow-x-auto">
                    {subjects.map(subject => (
                        <Button
                            key={subject}
                            variant={filterSubject === subject ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilterSubject(subject)}
                        >
                            {subject === 'all' ? 'All Subjects' : subject}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Grades List */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Grade History</h2>
                <div className="space-y-3">
                    {filteredGrades.map(grade => (
                        <div
                            key={grade.id}
                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{grade.assignment_title}</h3>
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                                            {grade.subject}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span>Graded: {grade.graded_date ? new Date(grade.graded_date).toLocaleDateString() : 'Pending'}</span>
                                    </div>

                                    {grade.feedback && (
                                        <div className="mt-2 p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Feedback:</strong> {grade.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-right">
                                    <div className={`text-3xl font-black ${getGradeColor(grade.percentage)}`}>
                                        {grade.percentage}%
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {grade.grade} / {grade.max_grade}
                                    </p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getGradeBadge(grade.percentage)}`}>
                                        {grade.percentage >= 90 ? 'A' : grade.percentage >= 80 ? 'B' : grade.percentage >= 70 ? 'C' : grade.percentage >= 60 ? 'D' : 'F'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredGrades.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Icon name="AcademicCapIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p>No grades available yet</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ParentGrades;
