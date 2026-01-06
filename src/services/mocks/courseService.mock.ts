import { Course } from '../courseService';

export const MOCK_COURSES: Course[] = [
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
