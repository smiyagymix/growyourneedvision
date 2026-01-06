import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Badge, Modal } from '../../components/shared/ui/CommonUI';
import { Spinner } from '../../components/shared/ui/Spinner';
import { FileUpload } from '../../components/shared/ui/FileUpload';
import { academicsService } from '../../services/academicsService';
import { enrollmentService, EnrollmentRecord } from '../../services/enrollmentService';
import { attendanceService } from '../../services/attendanceService';
import Gradebook from './GradeBook';
import pb from '../../lib/pocketbase';
import { SchoolClass } from '../school/types';
import { formatBytes, getFileIcon, getFileColorClass } from '../../utils/fileUtils';
import { isMockEnv } from '../../utils/mockData';
import { useToast } from '../../hooks/useToast';

const deleteConfirmationSchema = z.object({
    resourceId: z.string().min(1, 'Resource ID required')
});

interface Props {
    activeTab: string;
    activeSubNav: string;
}

interface ClassMaterial {
    id: string;
    name: string;
    file: string;
    size: number;
    created: string;
    type: string;
    uploaded_by: string;
}

const TeacherClasses: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
    const [students, setStudents] = useState<EnrollmentRecord[]>([]);
    const [materials, setMaterials] = useState<ClassMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [markingAttendance, setMarkingAttendance] = useState(false);

    // Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    // Attendance Stats
    const [attendanceStats, setAttendanceStats] = useState<any>(null);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'document' | 'image' | 'video' | 'archive'>('all');

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadRoster(selectedClass.id);
            if (activeTab === 'Classroom' && activeSubNav === 'Materials') {
                loadMaterials(selectedClass.id);
            }
            if (activeTab === 'Attendance' && activeSubNav === 'History') {
                loadAttendanceStats(selectedClass.id);
            }
        }
    }, [selectedClass, activeTab, activeSubNav]);

    const loadClasses = async () => {
        setLoading(true);
        try {
            if (isMockEnv()) {
                const mockClasses: SchoolClass[] = [
                    { id: 'math-101', name: 'Mathematics 101', teacher: 'Sarah Smith', room: 'Room 12', schedule: 'MWF 10:00-11:00', subject: 'Mathematics', created: new Date().toISOString(), updated: new Date().toISOString() } as any,
                    { id: 'physics-202', name: 'Physics 202', teacher: 'Sarah Smith', room: 'Lab 2', schedule: 'TTh 1:00-2:30', subject: 'Physics', created: new Date().toISOString(), updated: new Date().toISOString() } as any,
                ];
                setClasses(mockClasses);
                setSelectedClass(mockClasses[0]);
                setLoading(false);
                return;
            }

            const teacherId = pb.authStore.model?.id;
            if (teacherId) {
                const data = await academicsService.getTeacherClasses(teacherId);
                setClasses(data);
                if (data.length > 0 && !selectedClass) {
                    setSelectedClass(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load classes", error);
        } finally {
            setLoading(false);
        }
    };

    const loadRoster = async (classId: string) => {
        try {
            const data = await enrollmentService.getClassEnrollments(classId);
            setStudents(data.items as EnrollmentRecord[]);
        } catch (error) {
            console.error("Failed to load roster", error);
        }
    };

    const loadMaterials = async (classId: string) => {
        try {
            const records = await pb.collection('file_uploads').getFullList<ClassMaterial>({
                filter: `course_id = "${classId}"`,
                sort: '-created',
            });
            setMaterials(records);
        } catch (error) {
            console.error("Failed to load materials", error);
        }
    };

    const loadAttendanceStats = async (classId: string) => {
        try {
            const stats = await attendanceService.getClassStats(classId);
            setAttendanceStats(stats);
        } catch (error) {
            console.error("Failed to load attendance stats", error);
        }
    };

    const handleUpload = async () => {
        if (!selectedClass || uploadFiles.length === 0) {
            return;
        }
        
        // Validate file size (10MB max per file)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const invalidFiles = uploadFiles.filter(f => f.size > MAX_FILE_SIZE);
        if (invalidFiles.length > 0) {
            alert(`Files exceed 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`);
            return;
        }

        setUploading(true);
        try {
            const teacherId = pb.authStore.model?.id;

            for (const file of uploadFiles) {
                const formData = new FormData();
                formData.append('name', file.name);
                formData.append('file', file);
                formData.append('size', file.size.toString());
                formData.append('type', 'course_material');
                formData.append('course_id', selectedClass.id);
                if (teacherId) formData.append('uploaded_by', teacherId);

                await pb.collection('file_uploads').create(formData);
            }

            // Refresh list
            await loadMaterials(selectedClass.id);
            setIsUploadModalOpen(false);
            setUploadFiles([]);
            alert('Files uploaded successfully!');
        } catch (error) {
            console.error("Upload failed", error);
            alert('Failed to upload files.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (material: ClassMaterial) => {
        const url = pb.files.getUrl(material, material.file);
        window.open(url, '_blank');
    };

    const handleDeleteMaterial = async (id: string) => {
        const validationResult = deleteConfirmationSchema.safeParse({ resourceId: id });
        if (!validationResult.success) {
            showToast(validationResult.error.issues[0].message, 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await pb.collection('file_uploads').delete(validationResult.data.resourceId);
            setMaterials(prev => prev.filter(m => m.id !== id));
            showToast('File deleted successfully', 'success');
        } catch (error) {
            console.error("Delete failed", error);
            showToast('Failed to delete file', 'error');
        }
    };

    const handleMarkAttendance = async (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
        if (!selectedClass) return;
        setMarkingAttendance(true);
        try {
            await attendanceService.markAttendance(studentId, selectedClass.id, attendanceDate, status);
        } catch (error) {
            console.error("Failed to mark attendance", error);
        } finally {
            setMarkingAttendance(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;

    const renderContent = () => {
        if (!selectedClass) {
            return (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                    <Icon name="AcademicCapIcon" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">No Classes Found</h3>
                    <p className="text-gray-400 text-sm">You are not assigned to any classes yet.</p>
                </div>
            );
        }

        // --- CLASSROOM TAB ---
        if (activeTab === 'Classroom') {
            if (activeSubNav === 'Materials') {
                return (
                    <Card variant="default" className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Icon name="FolderIcon" className="w-5 h-5 text-blue-500" />
                                Class Materials
                            </h3>
                            <Button
                                variant="primary"
                                size="sm"
                                icon="PlusIcon"
                                onClick={() => setIsUploadModalOpen(true)}
                            >
                                Upload Material
                            </Button>
                        </div>

                        {/* Search and Filter UI */}
                        <div className="mb-6 space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Icon name="MagnifyingGlassIcon" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search materials..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {[
                                    { key: 'all', label: 'All', icon: 'FolderIcon' },
                                    { key: 'document', label: 'Documents', icon: 'DocumentTextIcon' },
                                    { key: 'image', label: 'Images', icon: 'PhotoIcon' },
                                    { key: 'video', label: 'Videos', icon: 'VideoCameraIcon' },
                                    { key: 'archive', label: 'Archives', icon: 'ArchiveBoxIcon' },
                                ].map((filter) => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setFilterType(filter.key as typeof filterType)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${filterType === filter.key
                                                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon name={filter.icon as any} className="w-4 h-4" />
                                        <span className="text-sm font-medium">{filter.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(() => {
                            // Filter materials based on search and type
                            const getFileCategory = (filename: string): typeof filterType => {
                                const ext = filename.split('.').pop()?.toLowerCase();
                                if (['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext || '')) return 'document';
                                if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
                                if (['mp4', 'mov', 'avi', 'webm', 'mp3', 'wav'].includes(ext || '')) return 'video';
                                if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return 'archive';
                                return 'all';
                            };

                            const filteredMaterials = materials.filter(material => {
                                // Search filter
                                const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());

                                // Type filter
                                const fileCategory = getFileCategory(material.name);
                                const matchesType = filterType === 'all' || fileCategory === filterType;

                                return matchesSearch && matchesType;
                            });

                            return filteredMaterials.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                    <Icon name="MagnifyingGlassIcon" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {searchQuery || filterType !== 'all'
                                            ? 'No materials match your search or filter criteria.'
                                            : 'No materials uploaded for this class yet.'}
                                    </p>
                                    {!searchQuery && filterType === 'all' && (
                                        <Button variant="ghost" className="mt-2 text-blue-500" onClick={() => setIsUploadModalOpen(true)}>Upload your first file</Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredMaterials.map(material => (
                                        <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColorClass(material.name)}`}>
                                                    <Icon name={getFileIcon(material.name)} className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{material.name}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatBytes(material.size)} • {new Date(material.created).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon="ArrowDownTrayIcon"
                                                    onClick={() => handleDownload(material)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:bg-red-50"
                                                    icon="TrashIcon"
                                                    onClick={() => handleDeleteMaterial(material.id)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </Card>
                );
            }
            // Default: Students (Roster)
            return (
                <Card variant="default" className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Icon name="UserGroupIcon" className="w-5 h-5 text-blue-500" />
                            Class Roster
                        </h3>
                        <Button variant="outline" size="sm" icon="PrinterIcon">Print Roster</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-100 dark:border-slate-700">
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Student</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Email</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {students.map(enrollment => (
                                    <tr key={enrollment.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {enrollment.expand?.student?.name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                                    {enrollment.expand?.student?.name || 'Unknown Student'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {enrollment.expand?.student?.email}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Button variant="ghost" size="sm" icon="ChatBubbleLeftIcon">Message</Button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-400">
                                            No students enrolled in this class.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            );
        }

        // --- ATTENDANCE TAB ---
        if (activeTab === 'Attendance') {
            if (activeSubNav === 'History') {
                return (
                    <Card variant="default" className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Icon name="ClockIcon" className="w-5 h-5 text-blue-500" />
                                Attendance History
                            </h3>
                            <Button variant="outline" size="sm" icon="ArrowDownTrayIcon">Export</Button>
                        </div>
                        
                        {attendanceStats ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <div className="text-sm text-green-600 dark:text-green-400 font-bold uppercase">Present</div>
                                    <div className="text-2xl font-black text-green-700 dark:text-green-300">{attendanceStats.present}</div>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <div className="text-sm text-red-600 dark:text-red-400 font-bold uppercase">Absent</div>
                                    <div className="text-2xl font-black text-red-700 dark:text-red-300">{attendanceStats.absent}</div>
                                </div>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                    <div className="text-sm text-yellow-600 dark:text-yellow-400 font-bold uppercase">Late</div>
                                    <div className="text-2xl font-black text-yellow-700 dark:text-yellow-300">{attendanceStats.late}</div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase">Rate</div>
                                    <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{attendanceStats.attendanceRate}%</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Spinner />
                            </div>
                        )}
                    </Card>
                );
            }
            // Default: Mark Attendance
            return (
                <Card variant="default" className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Icon name="CheckCircleIcon" className="w-5 h-5 text-blue-500" />
                            Mark Attendance
                        </h3>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm dark:text-white"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-100 dark:border-slate-700">
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Student</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {students.map(enrollment => (
                                    <tr key={enrollment.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {enrollment.expand?.student?.name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                                        {enrollment.expand?.student?.name || 'Unknown Student'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <Badge variant="neutral" size="sm">Not Marked</Badge>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleMarkAttendance(enrollment.student_id, 'Present')}
                                                    className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                                                    title="Present"
                                                >
                                                    <Icon name="CheckCircleIcon" className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAttendance(enrollment.student_id, 'Absent')}
                                                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                    title="Absent"
                                                >
                                                    <Icon name="XCircleIcon" className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAttendance(enrollment.student_id, 'Late')}
                                                    className="p-1.5 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 transition-colors"
                                                    title="Late"
                                                >
                                                    <Icon name="ClockIcon" className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            );
        }

        // --- GRADING TAB ---
        if (activeTab === 'Grading') {
            return (
                <div className="space-y-6">
                    <Gradebook classId={selectedClass.id} />
                </div>
            );
        }

        // Fallback
        return null;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-gyn-blue-dark dark:text-white">{activeTab}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your classes and students.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                    {activeSubNav || 'Overview'}
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
                {classes.map(cls => (
                    <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${selectedClass?.id === cls.id
                            ? 'bg-gyn-blue-medium text-white border-gyn-blue-medium shadow-md'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {cls.name}
                    </button>
                ))}
            </div>

            {selectedClass && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {renderContent()}
                    </div>

                    <div className="space-y-6">
                        <Card variant="glass" className="p-6">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Class Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Subject</span>
                                    <span className="font-medium dark:text-gray-200">{selectedClass.subject || selectedClass.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Room</span>
                                    <span className="font-medium dark:text-gray-200">{selectedClass.room || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Students</span>
                                    <span className="font-medium dark:text-gray-200">{students.length}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Upload Class Materials"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={uploadFiles.length === 0 || uploading}
                        >
                            {uploading ? 'Uploading...' : `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upload documents, slides, or other materials for <strong>{selectedClass?.name}</strong>.
                    </p>
                    <FileUpload
                        onFileSelect={(files) => setUploadFiles(files)}
                        multiple={true}
                        label="Drop files here (PDF, DOC, PPT, Images)"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png"
                    />
                    {uploadFiles.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase text-gray-400">Selected Files</h4>
                            {uploadFiles.map((file, i) => (
                                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-800 p-2 rounded">
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default TeacherClasses;
