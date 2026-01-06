import React, { useState, useEffect } from 'react';
import pb from '../../lib/pocketbase';
import { useToast } from '../../hooks/useToast';
import { useApiError } from '../../hooks/useApiError';
import { Button, Card, Icon, EmptyState } from '../../components/shared/ui/CommonUI';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { TableSkeleton, StatsSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { attendanceSchema } from '../../validation/schemas';

interface Student {
    id: string;
    name: string;
    avatar?: string;
    status?: 'present' | 'absent' | 'late' | 'excused';
}

export const AttendanceMarking: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { handleError } = useApiError();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadStudents(selectedClass);
        }
    }, [selectedClass, attendanceDate]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const classesData = await pb.collection('classes').getList(1, 50, {
                sort: 'name'
            });
            setClasses(classesData.items);
            if (classesData.items.length > 0) {
                setSelectedClass(classesData.items[0].id);
            }
        } catch (error) {
            handleError(error, 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async (classId: string) => {
        try {
            // Load students in this class
            const studentsData = await pb.collection('users').getList(1, 100, {
                filter: `class = "${classId}" && role = "Student"`,
                sort: 'name'
            });

            // Check existing attendance for today
            const attendanceRecords = await pb.collection('attendance').getList(1, 100, {
                filter: `class = "${classId}" && date = "${attendanceDate}"`
            });

            const attendanceMap = new Map(
                attendanceRecords.items.map((record: any) => [
                    record.student,
                    record.status
                ])
            );

            const studentsWithStatus: Student[] = studentsData.items.map((student: any) => ({
                id: student.id,
                name: student.name,
                avatar: student.avatar,
                status: attendanceMap.get(student.id) || undefined
            }));

            setStudents(studentsWithStatus);
        } catch (error) {
            handleError(error, 'Failed to load students');
        }
    };

    const markAttendance = async (studentId: string, status: Student['status']) => {
        const previousStatus = students.find(s => s.id === studentId)?.status;

        // Optimistic UI Update
        setStudents(prev =>
            prev.map(student =>
                student.id === studentId ? { ...student, status } : student
            )
        );

        setSavingId(studentId);
        try {
            const existing = await pb.collection('attendance').getList(1, 1, {
                filter: `student = "${studentId}" && class = "${selectedClass}" && date = "${attendanceDate}"`
            });

            const data = {
                student: studentId,
                class: selectedClass,
                date: attendanceDate,
                status: status
            };

            // Validate with Zod
            const validationResult = attendanceSchema.safeParse({
                studentId,
                classId: selectedClass,
                date: attendanceDate,
                status: status || 'present'
            });

            if (!validationResult.success) {
                console.error('Validation error:', validationResult.error.issues[0].message);
                setStudents(prev =>
                    prev.map(student =>
                        student.id === studentId ? { ...student, status: previousStatus } : student
                    )
                );
                setSavingId(null);
                return;
            }

            if (existing.items.length > 0) {
                await pb.collection('attendance').update(existing.items[0].id, data);
            } else {
                await pb.collection('attendance').create(data);
            }
        } catch (error) {
            // Rollback on failure
            setStudents(prev =>
                prev.map(student =>
                    student.id === studentId ? { ...student, status: previousStatus } : student
                )
            );
            handleError(error, 'Failed to update attendance');
        } finally {
            setSavingId(null);
        }
    };

    const markAll = async (status: Student['status']) => {
        const previousStudents = [...students];
        setStudents(prev => prev.map(student => ({ ...student, status })));

        try {
            // Perform updates
            for (const student of students) {
                await markAttendance(student.id, status);
            }
            showToast(`All marked as ${status}`, 'success');
        } catch (error) {
            setStudents(previousStudents);
            handleError(error, 'Failed to update all students');
        }
    };

    const getStatusColor = (status?: Student['status']) => {
        switch (status) {
            case 'present': return 'bg-green-500';
            case 'absent': return 'bg-red-500';
            case 'late': return 'bg-orange-500';
            case 'excused': return 'bg-blue-500';
            default: return 'bg-gray-400';
        }
    };

    const stats = {
        total: students.length,
        present: students.filter(s => s.status === 'present').length,
        absent: students.filter(s => s.status === 'absent').length,
        late: students.filter(s => s.status === 'late').length,
        unmarked: students.filter(s => !s.status).length
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                </div>
                <StatsSkeleton cols={5} />
                <TableSkeleton rows={8} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Attendance Marking</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium italic">Changes are saved automatically as you work.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                        Teacher: {user?.name || 'Academic Staff'}
                    </span>
                </div>
            </div>

            {/* Selectors */}
            <Card className="p-6 border-2 border-indigo-50 dark:border-indigo-900/10">
                <WidgetErrorBoundary title="Class Selector">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">Select Class</label>
                            <select
                                className="w-full p-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 font-bold transition-all focus:border-indigo-500 outline-none"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2">Attendance Date</label>
                            <input
                                type="date"
                                className="w-full p-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 font-bold transition-all focus:border-indigo-500 outline-none"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                            />
                        </div>
                    </div>
                </WidgetErrorBoundary>
            </Card>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white' },
                    { label: 'Present', value: stats.present, color: 'text-green-600' },
                    { label: 'Absent', value: stats.absent, color: 'text-red-600' },
                    { label: 'Late', value: stats.late, color: 'text-orange-500' },
                    { label: 'Unmarked', value: stats.unmarked, color: 'text-gray-400' }
                ].map(item => (
                    <Card key={item.label} className="p-4 text-center border-b-4 border-b-transparent hover:border-b-indigo-500 transition-all">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                        <p className={cn("text-3xl font-black mt-1", item.color)}>{item.value}</p>
                    </Card>
                ))}
            </div>

            {/* Quick Batch Actions */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/40 border-none">
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="font-bold shadow-sm" onClick={() => markAll('present')}>
                        <Icon name="CheckCircleIcon" className="w-4 h-4 mr-2 text-green-500" />
                        Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" className="font-bold shadow-sm" onClick={() => markAll('absent')}>
                        <Icon name="XCircleIcon" className="w-4 h-4 mr-2 text-red-500" />
                        Mark All Absent
                    </Button>
                </div>
            </Card>

            {/* Student Grid */}
            <Card className="p-6">
                <WidgetErrorBoundary title="Student List">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Participants</h2>
                        {savingId && (
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
                                <Icon name="ArrowPathIcon" className="w-4 h-4 animate-spin" />
                                Syncing with server...
                            </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        {students.map(student => (
                            <div
                                key={student.id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xl overflow-hidden shadow-inner">
                                        {student.avatar ? (
                                            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                        ) : student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="text-lg font-black text-gray-900 dark:text-white block">{student.name}</span>
                                        {savingId === student.id && <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter animate-pulse">Saving...</span>}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {(['present', 'late', 'excused', 'absent'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => markAttendance(student.id, status)}
                                            className={`px-4 py-2 rounded-xl font-black capitalize transition-all text-xs border-2 ${student.status === status
                                                ? `${getStatusColor(status)} text-white border-transparent shadow-lg scale-105`
                                                : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700 hover:border-indigo-200'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {students.length === 0 && (
                            <EmptyState
                                title="No Records"
                                description="No students have been enrolled in this selection."
                                icon="UserGroupIcon"
                            />
                        )}
                    </div>
                </WidgetErrorBoundary>
            </Card>
        </div>
    );
};

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export default AttendanceMarking;
