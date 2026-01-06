import { StudentRecord, ParentStudentLink, ChildGrade, ChildAttendance, ChildSchedule } from '../parentService';

export const MOCK_STUDENTS: StudentRecord[] = [
    {
        id: 'student-child-1',
        name: 'Emma Wilson',
        email: 'emma@school.com',
        grade_level: '10th Grade',
        class_id: 'class-1',
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'student-child-2',
        name: 'James Wilson',
        email: 'james@school.com',
        grade_level: '7th Grade',
        class_id: 'class-2',
        collectionId: '', collectionName: '', created: '', updated: ''
    }
];

export const MOCK_LINKS: ParentStudentLink[] = [
    {
        id: 'link-1',
        parent: 'parent-1',
        student: 'student-child-1',
        relationship: 'Mother',
        collectionId: '', collectionName: '', created: '', updated: '',
        expand: {
            student: MOCK_STUDENTS[0]
        }
    },
    {
        id: 'link-2',
        parent: 'parent-1',
        student: 'student-child-2',
        relationship: 'Mother',
        collectionId: '', collectionName: '', created: '', updated: '',
        expand: {
            student: MOCK_STUDENTS[1]
        }
    }
];

export const MOCK_GRADES: ChildGrade[] = [
    { id: 'grade-1', student: 'student-child-1', subject: 'Mathematics', assignment_name: 'Algebra Quiz 1', score: 92, max_score: 100, grade_letter: 'A', teacher: 'Mr. Smith', date: '2024-02-10' },
    { id: 'grade-2', student: 'student-child-1', subject: 'Physics', assignment_name: 'Lab Report', score: 88, max_score: 100, grade_letter: 'B+', teacher: 'Dr. Johnson', date: '2024-02-08' },
    { id: 'grade-3', student: 'student-child-1', subject: 'English', assignment_name: 'Essay', score: 95, max_score: 100, grade_letter: 'A', teacher: 'Ms. Davis', date: '2024-02-05' },
    { id: 'grade-4', student: 'student-child-2', subject: 'Mathematics', assignment_name: 'Pre-Algebra Test', score: 85, max_score: 100, grade_letter: 'B', teacher: 'Mrs. Brown', date: '2024-02-12' },
    { id: 'grade-5', student: 'student-child-2', subject: 'Science', assignment_name: 'Project', score: 90, max_score: 100, grade_letter: 'A-', teacher: 'Mr. Garcia', date: '2024-02-09' }
];

export const MOCK_ATTENDANCE: ChildAttendance[] = [
    { id: 'att-1', student: 'student-child-1', date: '2024-02-15', status: 'Present' },
    { id: 'att-2', student: 'student-child-1', date: '2024-02-14', status: 'Present' },
    { id: 'att-3', student: 'student-child-1', date: '2024-02-13', status: 'Late', notes: 'Arrived 10 minutes late' },
    { id: 'att-4', student: 'student-child-1', date: '2024-02-12', status: 'Present' },
    { id: 'att-5', student: 'student-child-1', date: '2024-02-11', status: 'Absent', notes: 'Sick - doctor\'s note provided' },
    { id: 'att-6', student: 'student-child-2', date: '2024-02-15', status: 'Present' },
    { id: 'att-7', student: 'student-child-2', date: '2024-02-14', status: 'Present' },
    { id: 'att-8', student: 'student-child-2', date: '2024-02-13', status: 'Excused', notes: 'Field trip' }
];

export const MOCK_SCHEDULE: ChildSchedule[] = [
    { id: 'sch-1', student: 'student-child-1', day: 'Monday', class_name: 'Math 10', subject: 'Mathematics', teacher: 'Mr. Smith', start_time: '08:00', end_time: '09:00', room: 'Room 101' },
    { id: 'sch-2', student: 'student-child-1', day: 'Monday', class_name: 'Physics', subject: 'Physics', teacher: 'Dr. Johnson', start_time: '09:15', end_time: '10:15', room: 'Lab 2' },
    { id: 'sch-3', student: 'student-child-1', day: 'Monday', class_name: 'English 10', subject: 'English', teacher: 'Ms. Davis', start_time: '10:30', end_time: '11:30', room: 'Room 205' },
    { id: 'sch-4', student: 'student-child-2', day: 'Monday', class_name: 'Math 7', subject: 'Mathematics', teacher: 'Mrs. Brown', start_time: '08:00', end_time: '09:00', room: 'Room 102' },
    { id: 'sch-5', student: 'student-child-2', day: 'Monday', class_name: 'Science 7', subject: 'Science', teacher: 'Mr. Garcia', start_time: '09:15', end_time: '10:15', room: 'Lab 1' }
];
