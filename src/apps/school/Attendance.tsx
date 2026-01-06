import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon, Heading1, Heading2, Text, Badge } from '../../components/shared/ui/CommonUI';
import { StatsSkeleton, TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { attendanceService, AttendanceRecord, SchoolClass } from '../../services/attendanceService';
import { Student } from './types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

const attendanceSchema = z.object({
    studentId: z.string().min(1, 'Student ID required'),
    classId: z.string().min(1, 'Class ID required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
    tenantId: z.string().optional(),
    markedBy: z.string().optional()
});

const bulkAttendanceSchema = z.object({
    studentIds: z.array(z.string()).min(1, 'Select at least one student').max(100, 'Cannot mark more than 100 students at once'),
    status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
    classId: z.string().min(1, 'Class ID required'),
    date: z.string().min(1, 'Date required')
});

interface AttendanceProps {
    activeTab?: string;
    activeSubNav?: string;
}

const Attendance: React.FC<AttendanceProps> = ({ activeTab }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({});
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0
    });

    const [aggregateFrom, setAggregateFrom] = useState<string>(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [aggregateTo, setAggregateTo] = useState<string>(new Date().toISOString().split('T')[0]);
    const [aggregateCounts, setAggregateCounts] = useState<{ total: number; counts: Record<string, number> }>({ total: 0, counts: {} });

    const canManage = useMemo(() => ['Teacher', 'SchoolAdmin', 'Owner'].includes((user as any)?.role), [user]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const fetchedClasses = await attendanceService.getClasses(user?.tenantId);
                setClasses(fetchedClasses);
                if (fetchedClasses.length > 0) {
                    setSelectedClass(fetchedClasses[0].id);
                }
            } catch (error) {
                addToast('Failed to load classes', 'error');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user?.tenantId, addToast]);

    const updateStatsLocal = useCallback((statuses: string[]) => {
        const total = statuses.length;
        const present = statuses.filter(s => s === 'Present').length;
        const absent = statuses.filter(s => s === 'Absent').length;
        const late = statuses.filter(s => s === 'Late').length;
        const excused = statuses.filter(s => s === 'Excused').length;

        setStats({
            present,
            absent,
            late,
            excused,
            attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
        });
    }, []);

    const fetchData = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const [classStudents, attendance] = await Promise.all([
                attendanceService.getClassStudents(selectedClass, user?.tenantId),
                attendanceService.getClassAttendance(selectedClass, attendanceDate)
            ]);

            setStudents(classStudents as Student[]);

            const statusMap: Record<string, string> = {};
            attendance.forEach((a) => {
                statusMap[a.student] = a.status;
            });
            setAttendanceStatus(statusMap);
            updateStatsLocal(Object.values(statusMap));

        } catch (error) {
            addToast('Failed to load attendance data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAggregates = async () => {
        if (!selectedClass) return;
        try {
            const data = await attendanceService.getAttendanceAggregates(selectedClass, aggregateFrom, aggregateTo, user?.tenantId);
            setAggregateCounts(data);
        } catch (error) {
            console.error('Failed to load aggregates', error);
        }
    };

    useEffect(() => {
        if (selectedClass) {
            fetchData();
            fetchAggregates();
        }
    }, [selectedClass, attendanceDate]);

    useEffect(() => {
        if (selectedClass) {
            fetchAggregates();
        }
    }, [aggregateFrom, aggregateTo, selectedClass]);

    const handleMarkAttendance = async (studentId: string, status: AttendanceRecord['status']) => {
        if (!canManage) return;

        // Validate attendance data
        const attendanceData = {
            studentId,
            classId: selectedClass,
            date: attendanceDate,
            status,
            tenantId: user?.tenantId,
            markedBy: user?.id
        };
        
        const result = attendanceSchema.safeParse(attendanceData);
        if (!result.success) {
            addToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        // Optimistic update
        const prevStatus = { ...attendanceStatus };
        setAttendanceStatus(prev => {
            const newStatus = { ...prev, [studentId]: status };
            updateStatsLocal(Object.values(newStatus));
            return newStatus;
        });

        try {
            await attendanceService.markAttendance(studentId, selectedClass, attendanceDate, status, {
                tenantId: user?.tenantId,
                markedBy: user?.id
            });
            addToast(`Marked ${status}`, 'success');
        } catch (error) {
            addToast('Failed to mark attendance', 'error');
            setAttendanceStatus(prevStatus);
            updateStatsLocal(Object.values(prevStatus));
        }
    };

    const handleBulkMark = async (status: AttendanceRecord['status']) => {
        if (!selectedClass || !canManage) return;

        const unmarkedStudents = students
            .filter(s => !attendanceStatus[s.id])
            .map(s => s.id);

        if (unmarkedStudents.length === 0) {
            addToast('All students already marked', 'info');
            return;
        }
        
        const validationResult = bulkAttendanceSchema.safeParse({
            studentIds: unmarkedStudents,
            status,
            classId: selectedClass,
            date: attendanceDate
        });
        
        if (!validationResult.success) {
            addToast(validationResult.error.issues[0].message, 'error');
            return;
        }

        if (!window.confirm(`Mark ${unmarkedStudents.length} students as ${status}?`)) return;

        setMarking(true);
        try {
            await attendanceService.bulkMarkAttendance(
                validationResult.data.studentIds, 
                validationResult.data.classId, 
                validationResult.data.date, 
                validationResult.data.status, 
                {
                    tenantId: user?.tenantId,
                    markedBy: user?.id
                }
            );
            addToast('Bulk update successful', 'success');
            await fetchData();
        } catch (error) {
            addToast('Bulk update failed', 'error');
        } finally {
            setMarking(false);
        }
    };

    // Generic CSV Export (simplified for client-side or use existing endpoint if preferred)
    const exportCsv = () => {
        if (students.length === 0) return;

        const headers = ['Student', 'Email', 'Date', 'Status'];
        const rows = students.map(s => [
            s.name,
            s.email,
            attendanceDate,
            attendanceStatus[s.id] || 'Not marked'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_${selectedClass}_${attendanceDate}.csv`);
        link.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <Heading1 className="text-3xl tracking-tight">{activeTab || 'Attendance Tracking'}</Heading1>
                    <Text className="font-medium text-slate-500">Manage and monitor student attendance across your classes</Text>
                    {!canManage && (
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold ring-1 ring-red-500/20">
                            <Icon name="LockClosedIcon" className="w-3 h-3 mr-1" />
                            Read Only
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={exportCsv}
                        disabled={loading || students.length === 0}
                        className="rounded-2xl"
                    >
                        <Icon name="ArrowDownTrayIcon" className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => handleBulkMark('Present')}
                        disabled={loading || marking || !canManage}
                        className="rounded-2xl shadow-premium"
                    >
                        <Icon name="CheckCircleIcon" className="w-4 h-4 mr-2" />
                        Mark All Present
                    </Button>
                </div>
            </div>

            {/* Controls & Stats Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8 p-6 rounded-[2.5rem] shadow-premium bg-white/50 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Academic Class</Text>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-gyn-blue-medium font-bold text-slate-700 transition-all"
                            >
                                <option value="">Select a class...</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} ({cls.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Target Date</Text>
                            <input
                                type="date"
                                className="w-full h-12 px-4 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-gyn-blue-medium font-bold text-slate-700 transition-all"
                                value={attendanceDate}
                                onChange={e => setAttendanceDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 ml-1">Performance Aggregates</Text>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Present', val: aggregateCounts.counts?.Present || 0, color: 'emerald' },
                                { label: 'Absent', val: aggregateCounts.counts?.Absent || 0, color: 'rose' },
                                { label: 'Late', val: aggregateCounts.counts?.Late || 0, color: 'amber' },
                                { label: 'Excused', val: aggregateCounts.counts?.Excused || 0, color: 'blue' },
                            ].map((agg) => (
                                <div key={agg.label} className={`p-4 rounded-3xl bg-${agg.color}-50 border border-${agg.color}-100 transition-all hover:scale-[1.02]`}>
                                    <Text className={`text-${agg.color}-600 font-bold block mb-1`}>{agg.label}</Text>
                                    <Text className={`text-2xl font-black text-${agg.color}-700`}>{agg.val}</Text>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-4 p-6 rounded-[2.5rem] shadow-premium bg-gradient-to-br from-gyn-blue-dark to-slate-900 border-none text-white overflow-hidden relative">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <Heading2 className="text-white text-xl mb-1">Today's Pulse</Heading2>
                            <Text className="text-slate-300 text-sm">Overall attendance efficiency</Text>
                        </div>

                        <div className="my-8">
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-6xl font-black tracking-tighter">{stats.attendanceRate}%</span>
                                <Badge className="bg-white/20 text-white border-none py-1">Target 95%</Badge>
                            </div>
                            <div className="h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.attendanceRate}%` }}
                                    className={`h-full rounded-full ${stats.attendanceRate >= 90 ? 'bg-emerald-400' : stats.attendanceRate >= 75 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <Text className="text-xs font-bold text-slate-400 uppercase">Present</Text>
                                <Text className="text-lg font-black">{stats.present}</Text>
                            </div>
                            <div className="text-center">
                                <Text className="text-xs font-bold text-slate-400 uppercase">Absent</Text>
                                <Text className="text-lg font-black">{stats.absent}</Text>
                            </div>
                            <div className="text-center">
                                <Text className="text-xs font-bold text-slate-400 uppercase">Late</Text>
                                <Text className="text-lg font-black">{stats.late}</Text>
                            </div>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                </Card>
            </div>

            {/* List Area */}
            <Card className="rounded-[2.5rem] shadow-premium border-none overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <Heading2 className="text-xl">Student Roster</Heading2>
                    <Badge variant="neutral" className="px-4 py-1 rounded-full font-bold">{students.length} Students</Badge>
                </div>

                {loading ? (
                    <div className="p-6">
                        <TableSkeleton rows={8} />
                    </div>
                ) : !selectedClass ? (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon name="AcademicCapIcon" className="w-10 h-10 text-slate-400" />
                        </div>
                        <Heading2 className="text-slate-400">Class selection required</Heading2>
                        <Text>Choose a class from the selector above to manage attendance</Text>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">
                                    <th className="px-8 py-5">Student Identity</th>
                                    <th className="px-4 py-5 text-center">Status Control</th>
                                    <th className="px-8 py-5 text-right">Summary</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {students.map((student, idx) => {
                                        const status = attendanceStatus[student.id];
                                        return (
                                            <motion.tr
                                                layout
                                                key={student.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gyn-blue-light to-blue-100 flex items-center justify-center text-gyn-blue-dark font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                                                            {student.name?.charAt(0) || 'S'}
                                                        </div>
                                                        <div>
                                                            <Text className="font-bold text-slate-900 text-lg">{student.name}</Text>
                                                            <Text className="text-sm text-slate-400">{student.email}</Text>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        {[
                                                            { s: 'Present', icon: 'CheckCircleIcon', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', active: 'ring-2 ring-emerald-500 bg-emerald-100' },
                                                            { s: 'Absent', icon: 'XCircleIcon', color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', active: 'ring-2 ring-rose-500 bg-rose-100' },
                                                            { s: 'Late', icon: 'ClockIcon', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', active: 'ring-2 ring-amber-500 bg-amber-100' },
                                                            { s: 'Excused', icon: 'InformationCircleIcon', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', active: 'ring-2 ring-blue-500 bg-blue-100' }
                                                        ].map((btn) => (
                                                            <button
                                                                key={btn.s}
                                                                onClick={() => handleMarkAttendance(student.id, btn.s as any)}
                                                                disabled={!canManage || marking}
                                                                className={`p-3 rounded-2xl transition-all ${status === btn.s ? btn.active : 'text-slate-300 hover:bg-slate-100'} group/btn relative`}
                                                                title={`Mark ${btn.s}`}
                                                            >
                                                                <Icon name={btn.icon as any} className="w-7 h-7" />
                                                                {status === btn.s && (
                                                                    <motion.div
                                                                        layoutId={`status-dot-${student.id}`}
                                                                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-${btn.color}-500 border-2 border-white`}
                                                                    />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    {status ? (
                                                        <Badge variant={
                                                            status === 'Present' ? 'success' :
                                                                status === 'Absent' ? 'danger' :
                                                                    status === 'Late' ? 'warning' : 'neutral'
                                                        } className="px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-widest">
                                                            {status}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter italic">Pending Mark</span>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Attendance;
