import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import pb from '../../lib/pocketbase';
import { parentService } from '../../services/parentService';
import { academicsService } from '../../services/academicsService';
import { attendanceService } from '../../services/attendanceService';
import { AIContentGeneratorModal } from '../../components/shared/modals/AIContentGeneratorModal';
import { Icon, Heading1, Card, Text, Button } from '../../components/shared/ui/CommonUI';
import { TableSkeleton, StatsSkeleton } from '../../components/shared/ui/DashboardSkeletons';

interface Props {
    activeTab: string;
    activeSubNav: string;
}

const ParentAcademic: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const [children, setChildren] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<string | null>(null);
    const [view, setView] = useState<'overview' | 'grades' | 'attendance' | 'schedule'>('overview');
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);

    // Data states
    const [grades, setGrades] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (activeTab === 'Grades') setView('grades');
        else if (activeTab === 'Attendance') setView('attendance');
        else setView('overview');
    }, [activeTab]);

    useEffect(() => {
        if (selectedChild) {
            loadChildData(selectedChild);
        }
    }, [selectedChild, view]);

    const loadChildren = async () => {
        try {
            const user = pb.authStore.model;
            if (user) {
                const kids = await parentService.getChildren(user.id);
                setChildren(kids);
                if (kids.length > 0) {
                    setSelectedChild(kids[0]?.id || null);
                }
            }
        } catch (error) {
            console.error('Error loading children:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChildData = async (studentId: string) => {
        setDataLoading(true);
        try {
            if (view === 'grades' || view === 'overview') {
                const g = await academicsService.getStudentGrades(studentId);
                setGrades(g);
            }

            if (view === 'attendance' || view === 'overview') {
                const attendanceStats = await attendanceService.getStudentStats(studentId);
                // Mock attendance records from stats
                setAttendance([]);
                setStats({
                    rate: attendanceStats.percentage,
                    total: attendanceStats.total,
                    present
                });
            }

            if (view === 'schedule') {
                const s = await academicsService.getStudentClasses(studentId);
                setSchedule(s);
            }
        } catch (error) {
            console.error('Error loading child data:', error);
        } finally {
            setDataLoading(false);
        }
    };

    if (loading) return (
        <div className="p-8 space-y-8">
            <StatsSkeleton cols={1} />
            <TableSkeleton rows={10} />
        </div>
    );

    if (children.length === 0) {
        return (
            <div className="p-12 text-center max-w-2xl mx-auto">
                <Card className="p-12 shadow-premium rounded-[2.5rem] border-0">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="UserPlusIcon" className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Heading1 className="mb-4">No Students Linked</Heading1>
                    <Text>Please contact the school administration to link your account to your children's profiles.</Text>
                </Card>
            </div>
        );
    }

    const currentChild = children.find(c => c.id === selectedChild);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-12">
            {/* Dynamic Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-8">
                <div>
                    <Heading1 className="text-3xl text-gray-900 dark:text-white uppercase tracking-tight">{activeTab}</Heading1>
                    <Text className="text-gray-500 font-medium">Monitoring academic journey for {currentChild?.name}</Text>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="p-3 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-gray-800 transition-all hover:shadow-md group"
                        title="Generate AI Progress Report"
                    >
                        <Icon name="SparklesIcon" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <div className="flex gap-1">
                        {children.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChild(child.id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${selectedChild === child.id
                                        ? 'bg-white dark:bg-gray-700 shadow-lg text-blue-600 dark:text-blue-400 scale-105'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {child.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sub Navigation */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {[
                    { id: 'overview', icon: 'Squares2X2Icon' },
                    { id: 'grades', icon: 'AcademicCapIcon' },
                    { id: 'attendance', icon: 'CalendarDaysIcon' },
                    { id: 'schedule', icon: 'ClockIcon' }
                ].map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setView(v.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black capitalize whitespace-nowrap transition-all ${view === v.id
                                ? 'bg-blue-600 text-white shadow-xl translate-y-[-2px]'
                                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                            }`}
                    >
                        <Icon name={v.icon as any} className="w-5 h-5" />
                        {v.id}
                    </button>
                ))}
            </div>

            {dataLoading ? (
                <div className="space-y-6">
                    <StatsSkeleton cols={2} />
                    <TableSkeleton rows={6} />
                </div>
            ) : (
                <>
                    {view === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Grades Card */}
                            <Card className="shadow-premium rounded-[2rem] border-0 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <Heading1 className="text-xl">Academic Performance</Heading1>
                                    <Icon name="ChartBarIcon" className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="space-y-4">
                                    {grades.slice(0, 5).map((grade: any) => (
                                        <div key={grade.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-lg font-black text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-110 transition-transform">
                                                    {(grade.expand?.exam?.expand?.subject?.name || 'S').charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-black text-gray-900 dark:text-white block">{grade.expand?.exam?.expand?.subject?.name || 'Subject'}</span>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{grade.expand?.exam?.title}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-lg text-blue-600 dark:text-blue-400 block">{grade.score}/{grade.expand?.exam?.max_score}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${grade.grade === 'A' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    GRADE: {grade.grade}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {grades.length === 0 && (
                                        <div className="text-center py-12 opacity-40">
                                            <Icon name="DocumentMagnifyingGlassIcon" className="w-12 h-12 mx-auto mb-2" />
                                            <Text className="font-bold">No academic records yet</Text>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Attendance Analysis */}
                            <Card className="shadow-premium rounded-[2rem] border-0 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <Heading1 className="text-xl">Attendance Health</Heading1>
                                    <Icon name="HeartIcon" className="w-6 h-6 text-red-500" />
                                </div>
                                {stats && (
                                    <div className="flex flex-col items-center py-6">
                                        <div className="relative w-48 h-48 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="96" cy="96" r="88" fill="none" stroke="#f3f4f6" dark-stroke="#1f2937" strokeWidth="12" />
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="88"
                                                    fill="none"
                                                    stroke={stats.rate > 90 ? '#22c55e' : stats.rate > 75 ? '#eab308' : '#ef4444'}
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(stats.rate / 100) * 553} 553`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute text-center">
                                                <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.rate}%</span>
                                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Consistency</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full mt-12">
                                            <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-[1.5rem] border border-green-100 dark:border-green-900/30 text-center">
                                                <span className="block text-3xl font-black text-green-600 dark:text-green-400">{stats?.present || 0}</span>
                                                <span className="text-[10px] font-black text-green-800 dark:text-green-300 uppercase tracking-widest">Days Present</span>
                                            </div>
                                            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-[1.5rem] border border-red-100 dark:border-red-900/30 text-center">
                                                <span className="block text-3xl font-black text-red-600 dark:text-red-400">{(stats?.total || 0) - (stats?.present || 0)}</span>
                                                <span className="text-[10px] font-black text-red-800 dark:text-red-300 uppercase tracking-widest">Days Absent</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {view === 'grades' && (
                        <Card className="shadow-premium rounded-[2rem] border-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                            <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Subject</th>
                                            <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Assessment</th>
                                            <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Date</th>
                                            <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-right">Raw Score</th>
                                            <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-right">Letter Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {grades.map((grade: any) => (
                                            <tr key={grade.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-black text-blue-600">
                                                            {(grade.expand?.exam?.expand?.subject?.name || 'S').charAt(0)}
                                                        </div>
                                                        <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                            {grade.expand?.exam?.expand?.subject?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm font-bold text-gray-600 dark:text-gray-400">{grade.expand?.exam?.title}</td>
                                                <td className="p-6">
                                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-black text-gray-500">
                                                        {new Date(grade.expand?.exam?.date).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right font-black text-blue-600 dark:text-blue-400">
                                                    {grade.score}<span className="text-gray-300 mx-1">/</span>{grade.expand?.exam?.max_score}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className={`inline-block px-4 py-1.5 rounded-xl font-black text-sm shadow-sm ${grade.grade.startsWith('A') ? 'bg-green-500 text-white' :
                                                            grade.grade.startsWith('B') ? 'bg-blue-500 text-white' :
                                                                'bg-orange-500 text-white'
                                                        }`}>
                                                        {grade.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {view === 'attendance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {attendance.map((record: any) => (
                                <Card key={record.id} className="p-6 shadow-premium rounded-3xl border-0 hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform group-hover:rotate-3 ${record.status === 'Present' ? 'bg-green-600 text-white' :
                                                    record.status === 'Absent' ? 'bg-red-600 text-white' :
                                                        'bg-amber-500 text-white'
                                                }`}>
                                                <span className="text-[10px] font-black uppercase tracking-tight opacity-80">
                                                    {new Date(record.date).toLocaleDateString(undefined, { month: 'short' })}
                                                </span>
                                                <span className="text-2xl font-black leading-none">
                                                    {new Date(record.date).getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-900 dark:text-white block uppercase tracking-tight">
                                                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                                </span>
                                                <span className="text-xs font-bold text-gray-400">{record.expand?.class?.name}</span>
                                            </div>
                                        </div>
                                        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${record.status === 'Present' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                record.status === 'Absent' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                    'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                            }`}>
                                            {record.status}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {view === 'schedule' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {schedule.map((cls: any) => (
                                <Card key={cls.id} className="p-8 shadow-premium rounded-[2rem] border-0 group hover:bg-blue-600 transition-all duration-500">
                                    <div className="flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 bg-blue-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                                <Icon name="AcademicCapIcon" className="w-6 h-6" />
                                            </div>
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 group-hover:bg-white/10 group-hover:text-white rounded-lg text-[10px] font-black uppercase transition-colors">
                                                {cls.room}
                                            </span>
                                        </div>
                                        <Heading1 className="text-xl mb-2 group-hover:text-white transition-colors">{cls.expand?.subject?.name}</Heading1>
                                        <div className="mt-auto pt-6 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white/60">{cls.day_of_week}</span>
                                                <span className="text-lg font-black text-gray-900 dark:text-white group-hover:text-white">{cls.start_time} - {cls.end_time}</span>
                                            </div>
                                            <Icon name="ClockIcon" className="w-8 h-8 text-gray-100 group-hover:text-white/20 transition-colors" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {schedule.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-40">
                                    <Icon name="CalendarIcon" className="w-16 h-16 mx-auto mb-4" />
                                    <Text className="font-black uppercase tracking-widest text-sm">No classes scheduled</Text>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={() => setIsAIModalOpen(false)}
                title={`Progress Report: ${currentChild?.name || 'Student'}`}
                promptTemplate={`Generate a professional, encouraging academic performance report for a parent regarding their child, ${currentChild?.name}. 
        
        DATA CONTEXT:
        Academic Performance:
        ${grades.map((g: any) => `- ${g.expand?.exam?.expand?.subject?.name}: ${g.score}/${g.expand?.exam?.max_score} (Grade: ${g.grade})`).join('\n')}
        
        Attendance Record:
        - Consistency: ${stats?.rate || 0}%
        - Present: ${stats?.present || 0} days
        - Absent: ${(stats?.total || 0) - (stats?.present || 0)} days
        
        REQUIREMENTS:
        1. Tone: Professional, optimistic, and supportive.
        2. Format: Clear sections (Executive Summary, Subject Breakdown, Recommendations).
        3. Highlight: Identify the top-performing subject and one area with growth potential.`}
                contextData={{ grades, stats, child: currentChild }}
            />
        </div>
    );
};

export default ParentAcademic;
