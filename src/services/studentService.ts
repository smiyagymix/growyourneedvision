/**
 * Student Service - Data layer for Student role functionality
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

// ========================================
// INTERFACES
// ========================================

export interface StudentCourse extends RecordModel {
    student: string;
    name: string;
    code: string;
    teacher: string;
    teacher_name?: string;
    description?: string;
    schedule: { day: string; time: string; room: string }[];
    credits: number;
    grade?: number;
    status: 'active' | 'completed' | 'dropped';
    progress: number;
    color: string;
}

export interface StudentAssignment extends RecordModel {
    student: string;
    course_id: string;
    course_name?: string;
    title: string;
    description?: string;
    type: 'homework' | 'quiz' | 'exam' | 'project' | 'essay' | 'lab';
    due_date: string;
    due_time?: string;
    status: 'pending' | 'submitted' | 'graded' | 'late' | 'missed';
    grade?: number;
    max_grade: number;
    submission_date?: string;
    feedback?: string;
    attachments?: string[];
    priority: 'low' | 'medium' | 'high';
}

export interface StudentGrade extends RecordModel {
    student: string;
    course_id: string;
    course_name: string;
    assignment_id?: string;
    assignment_name?: string;
    type: 'assignment' | 'quiz' | 'exam' | 'participation' | 'project' | 'final';
    score: number;
    max_score: number;
    percentage: number;
    letter_grade?: string;
    weight: number;
    date: string;
    comments?: string;
}

export interface ScheduleItem extends RecordModel {
    student: string;
    course_id?: string;
    title: string;
    type: 'class' | 'exam' | 'study' | 'activity' | 'break' | 'event';
    day: number; // 0-6 (Sun-Sat)
    start_time: string;
    end_time: string;
    room?: string;
    teacher?: string;
    color: string;
    recurring: boolean;
    notes?: string;
}

export interface StudySession extends RecordModel {
    student: string;
    course_id?: string;
    subject?: string;
    duration: number; // minutes
    type: 'pomodoro' | 'free' | 'flashcards' | 'reading' | 'practice';
    date: string;
    notes?: string;
    completed: boolean;
}

export interface Flashcard extends RecordModel {
    student: string;
    deck_id: string;
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
    last_reviewed?: string;
    review_count: number;
    correct_count: number;
    next_review?: string;
}

export interface FlashcardDeck extends RecordModel {
    student: string;
    name: string;
    subject?: string;
    description?: string;
    card_count: number;
    mastery: number;
    color: string;
    is_public: boolean;
}

export interface StudentNote extends RecordModel {
    student: string;
    course_id?: string;
    title: string;
    content: string;
    tags: string[];
    is_favorite: boolean;
    color?: string;
}

export interface AttendanceRecord extends RecordModel {
    student: string;
    course_id: string;
    course_name: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
}

export interface Announcement extends RecordModel {
    title: string;
    content: string;
    type: 'general' | 'course' | 'urgent' | 'event';
    course_id?: string;
    author: string;
    date: string;
    is_read: boolean;
}

// ========================================
// SERVICE CLASS
// ========================================

class StudentService {
    // Courses
    async getCourses(studentId: string, status?: StudentCourse['status']): Promise<StudentCourse[]> {
        try {
            let filter = `student = "${studentId}"`;
            if (status) filter += ` && status = "${status}"`;
            return await pb.collection('student_courses').getFullList<StudentCourse>({ filter });
        } catch (error) {
            console.error('Failed to get courses:', error);
            return [];
        }
    }

    async getCourseById(courseId: string): Promise<StudentCourse | null> {
        try {
            return await pb.collection('student_courses').getOne<StudentCourse>(courseId);
        } catch (error) {
            console.error('Failed to get course:', error);
            return null;
        }
    }

    // Assignments
    async getAssignments(studentId: string, status?: StudentAssignment['status']): Promise<StudentAssignment[]> {
        try {
            let filter = `student = "${studentId}"`;
            if (status) filter += ` && status = "${status}"`;
            return await pb.collection('student_assignments').getFullList<StudentAssignment>({ filter, sort: 'due_date' });
        } catch (error) {
            console.error('Failed to get assignments:', error);
            return [];
        }
    }

    async getUpcomingAssignments(studentId: string, days: number = 7): Promise<StudentAssignment[]> {
        const endDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
        try {
            return await pb.collection('student_assignments').getFullList<StudentAssignment>({
                filter: `student = "${studentId}" && status = "pending" && due_date <= "${endDate}"`,
                sort: 'due_date'
            });
        } catch (error) {
            console.error('Failed to get upcoming assignments:', error);
            return [];
        }
    }

    async submitAssignment(assignmentId: string, data: { attachments?: string[]; notes?: string }): Promise<StudentAssignment | null> {
        try {
            return await pb.collection('student_assignments').update<StudentAssignment>(assignmentId, {
                status: 'submitted',
                submission_date: new Date().toISOString(),
                ...data
            });
        } catch (error) {
            console.error('Failed to submit assignment:', error);
            return null;
        }
    }

    // Grades
    async getGrades(studentId: string, courseId?: string): Promise<StudentGrade[]> {
        try {
            let filter = `student = "${studentId}"`;
            if (courseId) filter += ` && course_id = "${courseId}"`;
            return await pb.collection('student_grades').getFullList<StudentGrade>({ filter, sort: '-date' });
        } catch (error) {
            console.error('Failed to get grades:', error);
            return [];
        }
    }

    async getGPA(studentId: string): Promise<{ gpa: number; letterGrade: string }> {
        const grades = await this.getGrades(studentId);
        if (grades.length === 0) return { gpa: 0, letterGrade: 'N/A' };

        const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
        const weightedSum = grades.reduce((sum, g) => sum + (g.percentage * g.weight), 0);
        const avgPercentage = weightedSum / totalWeight;

        const gpa = (avgPercentage / 100) * 4;
        const letterGrade = avgPercentage >= 93 ? 'A' : avgPercentage >= 90 ? 'A-' : avgPercentage >= 87 ? 'B+' :
            avgPercentage >= 83 ? 'B' : avgPercentage >= 80 ? 'B-' : avgPercentage >= 77 ? 'C+' :
                avgPercentage >= 73 ? 'C' : avgPercentage >= 70 ? 'C-' : avgPercentage >= 67 ? 'D+' :
                    avgPercentage >= 60 ? 'D' : 'F';

        return { gpa: Math.round(gpa * 100) / 100, letterGrade };
    }

    // Schedule
    async getSchedule(studentId: string, day?: number): Promise<ScheduleItem[]> {
        try {
            let filter = `student = "${studentId}"`;
            if (day !== undefined) filter += ` && day = ${day}`;
            return await pb.collection('student_schedule').getFullList<ScheduleItem>({ filter, sort: 'start_time' });
        } catch (error) {
            console.error('Failed to get schedule:', error);
            return [];
        }
    }

    async addScheduleItem(studentId: string, data: Partial<ScheduleItem>): Promise<ScheduleItem | null> {
        try {
            return await pb.collection('student_schedule').create<ScheduleItem>({ student: studentId, ...data });
        } catch (error) {
            console.error('Failed to add schedule item:', error);
            return null;
        }
    }

    // Study Sessions
    async getStudySessions(studentId: string, days: number = 7): Promise<StudySession[]> {
        const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        try {
            return await pb.collection('study_sessions').getFullList<StudySession>({
                filter: `student = "${studentId}" && date >= "${startDate}"`,
                sort: '-date'
            });
        } catch (error) {
            console.error('Failed to get study sessions:', error);
            return [];
        }
    }

    async logStudySession(studentId: string, data: Partial<StudySession>): Promise<StudySession | null> {
        try {
            return await pb.collection('study_sessions').create<StudySession>({ student: studentId, completed: true, date: new Date().toISOString().split('T')[0], ...data });
        } catch (error) {
            console.error('Failed to log study session:', error);
            return null;
        }
    }

    async getTotalStudyTime(studentId: string, days: number = 7): Promise<number> {
        const sessions = await this.getStudySessions(studentId, days);
        return sessions.reduce((sum, s) => sum + s.duration, 0);
    }

    // Flashcards
    async getFlashcardDecks(studentId: string): Promise<FlashcardDeck[]> {
        try {
            return await pb.collection('flashcard_decks').getFullList<FlashcardDeck>({ filter: `student = "${studentId}"` });
        } catch (error) {
            console.error('Failed to get flashcard decks:', error);
            return [];
        }
    }

    async getFlashcards(deckId: string): Promise<Flashcard[]> {
        try {
            return await pb.collection('flashcards').getFullList<Flashcard>({ filter: `deck_id = "${deckId}"` });
        } catch (error) {
            console.error('Failed to get flashcards:', error);
            return [];
        }
    }

    async createFlashcard(studentId: string, deckId: string, front: string, back: string): Promise<Flashcard | null> {
        try {
            return await pb.collection('flashcards').create<Flashcard>({ student: studentId, deck_id: deckId, front, back, difficulty: 'medium', review_count: 0, correct_count: 0 });
        } catch (error) {
            console.error('Failed to create flashcard:', error);
            return null;
        }
    }

    async reviewFlashcard(cardId: string, correct: boolean): Promise<Flashcard | null> {
        try {
            const card = await pb.collection('flashcards').getOne<Flashcard>(cardId);
            return await pb.collection('flashcards').update<Flashcard>(cardId, {
                review_count: card.review_count + 1,
                correct_count: correct ? card.correct_count + 1 : card.correct_count,
                last_reviewed: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to review flashcard:', error);
            return null;
        }
    }

    // Attendance
    async getAttendance(studentId: string, courseId?: string): Promise<AttendanceRecord[]> {
        try {
            let filter = `student = "${studentId}"`;
            if (courseId) filter += ` && course_id = "${courseId}"`;
            return await pb.collection('student_attendance').getFullList<AttendanceRecord>({ filter, sort: '-date' });
        } catch (error) {
            console.error('Failed to get attendance:', error);
            return [];
        }
    }

    async getAttendanceRate(studentId: string): Promise<number> {
        const records = await this.getAttendance(studentId);
        if (records.length === 0) return 100;
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
        return Math.round((present / records.length) * 100);
    }

    // Announcements
    async getAnnouncements(studentId: string): Promise<Announcement[]> {
        try {
            // Get course IDs for student
            const courses = await this.getCourses(studentId, 'active');
            const courseIds = courses.map(c => c.id);
            const courseFilter = courseIds.length > 0 ? ` || course_id ~ "${courseIds.join('||')}"` : '';
            return await pb.collection('announcements').getFullList<Announcement>({
                filter: `type = "general"${courseFilter}`,
                sort: '-date'
            });
        } catch (error) {
            console.error('Failed to get announcements:', error);
            return [];
        }
    }

    async markAnnouncementRead(announcementId: string): Promise<void> {
        try {
            await pb.collection('announcements').update(announcementId, { is_read: true });
        } catch (error) {
            console.error('Failed to mark announcement read:', error);
        }
    }

    // Dashboard Stats
    async getDashboardStats(studentId: string): Promise<{
        gpa: number;
        attendanceRate: number;
        upcomingAssignments: number;
        totalStudyTime: number;
        coursesCount: number;
        streakDays: number;
    }> {
        const [gpaData, attendanceRate, assignments, studyTime, courses] = await Promise.all([
            this.getGPA(studentId),
            this.getAttendanceRate(studentId),
            this.getUpcomingAssignments(studentId, 7),
            this.getTotalStudyTime(studentId, 7),
            this.getCourses(studentId, 'active')
        ]);

        return {
            gpa: gpaData.gpa,
            attendanceRate,
            upcomingAssignments: assignments.length,
            totalStudyTime: studyTime,
            coursesCount: courses.length,
            streakDays: 5 // Would calculate from study sessions
        };
    }
}

export const studentService = new StudentService();
