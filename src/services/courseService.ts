import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Course extends RecordModel {
    title: string; // Mapped from 'name'
    name?: string; // Original field
    code: string;
    description: string;
    teacher: string; // Mapped from 'teacher'
    schedule: string;
    syllabus?: string;
    tenantId?: string;
    credits?: number;
    semester?: string;
    status?: 'active' | 'archived' | 'draft';
    // Computed or optional fields
    progress?: number;
    grade?: string | number;
    expand?: {
        teacher?: RecordModel;
    }
}

export interface CreateCourseData {
    name: string;
    code: string;
    description: string;
    teacher: string;
    schedule?: string;
    syllabus?: string;
    tenantId?: string;
    credits?: number;
    semester?: string;
    status?: 'active' | 'archived' | 'draft';
}

const MOCK_COURSES: Course[] = [
    {
        id: 'course-1',
        collectionId: 'mock',
        collectionName: 'school_classes',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        title: 'Mathematics 101',
        name: 'Mathematics 101',
        code: 'MATH101',
        description: 'Introduction to algebra and calculus',
        teacher: 'teacher-1',
        schedule: 'MWF 9:00 AM',
        credits: 3,
        semester: 'Fall 2025',
        status: 'active',
        progress: 65
    },
    {
        id: 'course-2',
        collectionId: 'mock',
        collectionName: 'school_classes',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        title: 'English Literature',
        name: 'English Literature',
        code: 'ENG201',
        description: 'Survey of English literature',
        teacher: 'teacher-2',
        schedule: 'TTh 10:30 AM',
        credits: 3,
        semester: 'Fall 2025',
        status: 'active',
        progress: 78
    }
];

export const courseService = {
    /**
     * Get all courses (with optional filter)
     */
    async getCourses(filter?: { tenantId?: string; status?: string; teacher?: string }): Promise<Course[]> {
        if (isMockEnv()) {
            return MOCK_COURSES;
        }

        try {
            const filterParts: string[] = [];
            if (filter?.tenantId) filterParts.push(`tenantId = "${filter.tenantId}"`);
            if (filter?.status) filterParts.push(`status = "${filter.status}"`);
            if (filter?.teacher) filterParts.push(`teacher = "${filter.teacher}"`);

            const courses = await pb.collection('school_classes').getFullList<RecordModel>({
                filter: filterParts.join(' && ') || undefined,
                expand: 'teacher',
                sort: '-created',
                requestKey: null
            });

            return courses.map(c => ({
                ...c,
                title: c.name,
                progress: c.progress || 0
            })) as Course[];
        } catch (error) {
            console.error('Error fetching courses:', error);
            return [];
        }
    },

    /**
     * Get courses for a student
     */
    async getStudentCourses(studentId: string): Promise<Course[]> {
        if (isMockEnv()) {
            return MOCK_COURSES;
        }

        try {
            // Get enrollments
            const enrollments = await pb.collection('enrollments').getFullList({
                filter: `student = "${studentId}"`,
                expand: 'class',
                requestKey: null
            });

            if (enrollments.length === 0) {
                return [];
            }

            // Extract classes from enrollments
            const courses: Course[] = enrollments.map((enrollment: RecordModel) => {
                const courseData = enrollment.expand?.class;
                if (!courseData) return null;
                
                return {
                    ...courseData,
                    title: courseData.name, // Map name to title
                    progress: courseData.progress || 0,
                    expand: courseData.expand
                } as Course;
            }).filter((c): c is Course => c !== null);

            // Fetch full course details to get teacher info
            if (courses.length > 0) {
                const courseIds = courses.map(c => c.id);
                const filter = courseIds.map(id => `id = "${id}"`).join(' || ');
                
                const fullCourses = await pb.collection('school_classes').getFullList<RecordModel>({
                    filter,
                    expand: 'teacher',
                    requestKey: null
                });
                
                return fullCourses.map(c => ({
                    ...c,
                    title: c.name,
                    progress: c.progress || Math.floor(Math.random() * 100)
                })) as Course[];
            }

            return courses;
        } catch (error) {
            console.error('Error fetching student courses:', error);
            return [];
        }
    },

    /**
     * Get course details
     */
    async getCourseDetails(courseId: string): Promise<Course | null> {
        if (isMockEnv()) {
            return MOCK_COURSES.find(c => c.id === courseId) || null;
        }

        try {
            const course = await pb.collection('school_classes').getOne<RecordModel>(courseId, {
                expand: 'teacher',
                requestKey: null
            });
            
            return {
                ...course,
                title: course.name,
                progress: course.progress || 0
            } as Course;
        } catch (error) {
            console.error('Error fetching course details:', error);
            return null;
        }
    },

    /**
     * Create a new course
     */
    async createCourse(data: CreateCourseData): Promise<Course | null> {
        if (isMockEnv()) {
            const newCourse: Course = {
                id: `course-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'school_classes',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                title: data.name,
                name: data.name,
                code: data.code,
                description: data.description,
                teacher: data.teacher,
                schedule: data.schedule || '',
                syllabus: data.syllabus,
                tenantId: data.tenantId,
                credits: data.credits,
                semester: data.semester,
                status: data.status || 'active',
                progress: 0
            };
            MOCK_COURSES.unshift(newCourse);
            return newCourse;
        }

        try {
            const course = await pb.collection('school_classes').create<RecordModel>(data);
            return {
                ...course,
                title: course.name,
                progress: 0
            } as Course;
        } catch (error) {
            console.error('Error creating course:', error);
            return null;
        }
    },

    /**
     * Update a course
     */
    async updateCourse(courseId: string, data: Partial<CreateCourseData>): Promise<Course | null> {
        if (isMockEnv()) {
            const idx = MOCK_COURSES.findIndex(c => c.id === courseId);
            if (idx >= 0) {
                MOCK_COURSES[idx] = {
                    ...MOCK_COURSES[idx],
                    ...data,
                    title: data.name || MOCK_COURSES[idx].title,
                    updated: new Date().toISOString()
                };
                return MOCK_COURSES[idx];
            }
            return null;
        }

        try {
            const course = await pb.collection('school_classes').update<RecordModel>(courseId, data);
            return {
                ...course,
                title: course.name,
                progress: course.progress || 0
            } as Course;
        } catch (error) {
            console.error('Error updating course:', error);
            return null;
        }
    },

    /**
     * Delete a course
     */
    async deleteCourse(courseId: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_COURSES.findIndex(c => c.id === courseId);
            if (idx >= 0) {
                MOCK_COURSES.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection('school_classes').delete(courseId);
            return true;
        } catch (error) {
            console.error('Error deleting course:', error);
            return false;
        }
    },

    /**
     * Archive a course (soft delete)
     */
    async archiveCourse(courseId: string): Promise<Course | null> {
        return this.updateCourse(courseId, { status: 'archived' });
    },

    /**
     * Get courses by teacher
     */
    async getTeacherCourses(teacherId: string): Promise<Course[]> {
        return this.getCourses({ teacher: teacherId });
    }
};
