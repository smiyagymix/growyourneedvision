import React, { useState, useEffect } from 'react';
import pb from '../../lib/pocketbase';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { studentService, Course } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { Icon, Card, Badge, Button } from '../../components/shared/ui/CommonUI';
import StudentGrades from './Grades';

interface Props {
    activeTab: string;
    activeSubNav: string;
}

interface CourseMaterial {
    id: string;
    name: string;
    file: string;
    size: number;
    created: string;
    course_id: string;
    type: string;
}

const StudentCourses: React.FC<Props> = ({ activeTab, activeSubNav }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMaterials, setLoadingMaterials] = useState(true);


    useEffect(() => {
        const fetchCourses = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Use studentService to get courses from 'student_courses' collection
                const data = await studentService.getCourses(user.id);
                setCourses(data);
            } catch (err) {
                console.error("Failed to load courses", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [user]);

    useEffect(() => {
        // Material fetching logic update if needed, but keeping as is for now if verified
        const fetchMaterials = async () => {
            if (!user) return;
            setLoadingMaterials(true);
            try {
                // Note: 'file_uploads' might not be seeded or used in studentService yet.
                // We'll keep this as is for now but log error safely.
                const allMaterials = await pb.collection('file_uploads').getFullList<CourseMaterial>({
                    filter: 'course_id != null && type = "course_material"',
                    sort: '-created',
                });
                setMaterials(allMaterials);
            } catch (err) {
                console.error('Failed to load materials', err);
                setMaterials([]);
            } finally {
                setLoadingMaterials(false);
            }
        };
        fetchMaterials();
    }, [user]);

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const downloadFile = async (material: CourseMaterial) => {
        try {
            const fileUrl = pb.files.getUrl(material, material.file);
            window.open(fileUrl, '_blank');
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    const renderSubjects = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
                <div key={course.id} className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-glass-edge overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative p-6 flex items-end">
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-bold">{course.code}</div>
                        <h3 className="text-2xl font-black text-white drop-shadow-md">{course.title}</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 font-bold">Progress</span>
                            <span className="text-blue-600 font-bold">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mb-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <OwnerIcon name="UserIcon" className="w-3 h-3" />
                                {course.teacher_name || 'Instructor'}
                            </div>

                            <div className="flex items-center gap-1">
                                <OwnerIcon name="ClockIcon" className="w-3 h-3" />
                                {Array.isArray(course.schedule)
                                    ? course.schedule.map(s => `${s.day} ${s.time}`).join(', ')
                                    : (course.schedule || 'TBA')}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors">Syllabus</button>
                            <button className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold text-blue-700 transition-colors">Assignments</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderMaterials = () => (
        <div className="space-y-4">
            {courses.map((course) => {
                const courseMats = materials.filter(m => m.course_id === course.id);
                return (
                    <Card key={course.id} className="p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Icon name="BookOpenIcon" className="w-5 h-5 text-blue-500" />
                            {course.title} <span className="text-gray-400 text-sm font-normal">({course.code})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loadingMaterials ? (
                                <div className="text-sm text-gray-500">Loading materials...</div>
                            ) : courseMats.length > 0 ? (
                                courseMats.map((mat) => (
                                    <div key={mat.id} className="flex items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group">
                                        <div className="w-10 h-10 rounded bg-white dark:bg-slate-700 flex items-center justify-center text-red-500 shadow-sm mr-3">
                                            <Icon name="DocumentIcon" className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{mat.name}</p>
                                            <p className="text-xs text-gray-400">{formatBytes(mat.size)} • {formatDate(mat.created)}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon="ArrowDownTrayIcon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => downloadFile(mat)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm col-span-3">No materials uploaded yet for this course</p>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );

    const renderContent = () => (
        <div className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-gyn-blue-dark">{activeTab}</h2>
                    <p className="text-sm text-gray-500">
                        {activeTab === 'Subjects' && 'Access your enrolled courses.'}
                        {activeTab === 'Materials' && 'Download course materials and resources.'}
                        {activeTab === 'Grades' && 'View your academic performance.'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading courses...</div>
            ) : courses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No courses found.</div>
            ) : (
                <>
                    {activeTab === 'Subjects' && renderSubjects()}
                    {activeTab === 'Materials' && renderMaterials()}
                    {activeTab === 'Grades' && <StudentGrades activeTab={activeTab} activeSubNav={activeSubNav} />}
                    {/* Fallback for other tabs */}
                    {!['Subjects', 'Materials', 'Grades'].includes(activeTab) && renderSubjects()}
                </>
            )}
        </div>
    );

    return renderContent();
};

export default StudentCourses;
