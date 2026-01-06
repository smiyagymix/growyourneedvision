import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useAuth } from '../../context/AuthContext';
import pb from '../../lib/pocketbase';

interface ScheduleItem {
    id: string;
    day: string;
    time_start: string;
    time_end: string;
    subject: string;
    teacher: string;
    room: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const ParentSchedule: React.FC = () => {
    const { user } = useAuth();
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            loadSchedule(selectedChild);
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

    const loadSchedule = async (childId: string) => {
        try {
            // Load student's class
            const student = await pb.collection('users').getOne(childId, {
                expand: 'class'
            });

            if (student.class) {
                // Load timetable for the class
                const scheduleData = await pb.collection('timetable').getList(1, 100, {
                    filter: `class = "${student.class}"`,
                    sort: 'day,time_start',
                    expand: 'subject,teacher'
                });

                const scheduleItems: ScheduleItem[] = scheduleData.items.map((item: any) => ({
                    id: item.id,
                    day: item.day,
                    time_start: item.time_start,
                    time_end: item.time_end,
                    subject: item.expand?.subject?.name || 'Unknown',
                    teacher: item.expand?.teacher?.name || 'TBA',
                    room: item.room || 'TBA'
                }));

                setSchedule(scheduleItems);
            }
        } catch (error) {
            console.error('Failed to load schedule:', error);
        }
    };

    const getScheduleForDay = (day: string) => {
        return schedule.filter(item => item.day === day).sort((a, b) =>
            a.time_start.localeCompare(b.time_start)
        );
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getSubjectColor = (index: number) => {
        const colors = [
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
            'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
        ];
        return colors[index % colors.length];
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
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Schedule</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">View your child's weekly timetable</p>
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

            {/* View Mode Toggle */}
            <Card className="p-4">
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'week' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('week')}
                    >
                        <Icon name="CalendarDaysIcon" className="w-4 h-4 mr-2" />
                        Week View
                    </Button>
                    <Button
                        variant={viewMode === 'day' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('day')}
                    >
                        <Icon name="CalendarIcon" className="w-4 h-4 mr-2" />
                        Day View
                    </Button>
                </div>
            </Card>

            {viewMode === 'week' ? (
                /* Week View */
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {DAYS.map(day => {
                        const daySchedule = getScheduleForDay(day);
                        const isToday = day === DAYS[new Date().getDay() - 1];

                        return (
                            <Card key={day} className={`p-4 ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{day}</h3>
                                    {isToday && (
                                        <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold">
                                            Today
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {daySchedule.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-lg ${getSubjectColor(index)}`}
                                        >
                                            <div className="font-semibold text-sm mb-1">{item.subject}</div>
                                            <div className="text-xs opacity-80">
                                                {formatTime(item.time_start)} - {formatTime(item.time_end)}
                                            </div>
                                            <div className="text-xs opacity-70 mt-1">
                                                {item.teacher} • {item.room}
                                            </div>
                                        </div>
                                    ))}

                                    {daySchedule.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            No classes
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                /* Day View */
                <>
                    <Card className="p-4">
                        <div className="flex gap-2 overflow-x-auto">
                            {DAYS.map(day => (
                                <Button
                                    key={day}
                                    variant={selectedDay === day ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedDay(day)}
                                >
                                    {day}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {selectedDay}'s Schedule
                        </h2>
                        <div className="space-y-3">
                            {getScheduleForDay(selectedDay).map((item, index) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {formatTime(item.time_start)} - {formatTime(item.time_end)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSubjectColor(index)}`}>
                                                {item.subject}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Teacher</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{item.teacher}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Room</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{item.room}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {getScheduleForDay(selectedDay).length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Icon name="CalendarDaysIcon" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p>No classes scheduled for {selectedDay}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default ParentSchedule;
