import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import pb from '../../lib/pocketbase';

interface AttendanceRecord {
    id: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    class_name: string;
}

export const ParentAttendance: React.FC = () => {
    const { user } = useAuth();
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month'); // week, month, year

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            loadAttendance(selectedChild);
        }
    }, [selectedChild, dateRange]);

    const loadChildren = async () => {
        try {
            // Load children linked to this parent
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

    const loadAttendance = async (childId: string) => {
        try {
            // Calculate date range
            const now = new Date();
            const startDate = new Date();

            if (dateRange === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateRange === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else {
                startDate.setFullYear(now.getFullYear() - 1);
            }

            const attendanceRecords = await pb.collection('attendance').getList(1, 100, {
                filter: `student = "${childId}" && date >= "${startDate.toISOString().split('T')[0]}"`,
                sort: '-date',
                expand: 'class'
            });

            setAttendance(attendanceRecords.items.map((record: any) => ({
                id: record.id,
                date: record.date,
                status: record.status,
                class_name: record.expand?.class?.name || 'Unknown'
            })));
        } catch (error) {
            console.error('Failed to load attendance:', error);
        }
    };

    const getStatusColor = (status: AttendanceRecord['status']) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'late': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'excused': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    };

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        rate: attendance.length > 0
            ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
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
            {/* Header with Child Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Attendance</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your child's attendance</p>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                    <p className="text-sm text-green-600 dark:text-green-300">Attendance Rate</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-white mt-2">{stats.rate}%</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Days</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">{stats.present}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">{stats.absent}</p>
                </Card>
                <Card className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">{stats.late}</p>
                </Card>
            </div>

            {/* Date Range Filter */}
            <Card className="p-4">
                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map(range => (
                        <Button
                            key={range}
                            variant={dateRange === range ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setDateRange(range)}
                        >
                            Last {range.charAt(0).toUpperCase() + range.slice(1)}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Attendance Records */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Attendance History</h2>
                <div className="space-y-2">
                    {attendance.map(record => (
                        <div
                            key={record.id}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {new Date(record.date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{record.class_name}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(record.status)}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                        </div>
                    ))}

                    {attendance.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Icon name="CalendarIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p>No attendance records found for this period</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ParentAttendance;
