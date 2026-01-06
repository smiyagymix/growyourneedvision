import { RecordModel } from 'pocketbase';

export interface SchoolClass extends RecordModel {
    name: string;
    code: string;
    room: string;
    academic_year: string;
    teacher?: string;
    schedule?: Record<string, string>;
    expand?: {
        teacher?: {
            name: string;
            email: string;
        };
    };
}

export interface Subject extends RecordModel {
    name: string;
    code: string;
    credits: number;
}

export interface Exam extends RecordModel {
    name: string;
    date: string;
    total_marks: number;
    subject: string;
    class: string;
    expand?: {
        subject?: Subject;
        class?: SchoolClass;
    };
}

export interface ExamResult extends RecordModel {
    exam: string;
    student: string;
    marks_obtained: number;
    grade?: string;
    expand?: {
        student?: Student;
        exam?: Exam;
    };
}

export interface Student extends RecordModel {
    name: string;
    email: string;
    role: string;
    // Add other user fields if necessary
}

export interface Enrollment extends RecordModel {
    student: string;
    class: string;
    enrolled_at: string;
    expand?: {
        student?: Student;
        class?: SchoolClass;
    };
}

export interface AttendanceRecord extends RecordModel {
    student: string;
    class: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    expand?: {
        student?: Student;
    };
}

export interface Fee extends RecordModel {
    name: string;
    amount: number;
    frequency: 'One-time' | 'Monthly' | 'Yearly';
    due_day?: number;
}

export interface Invoice extends RecordModel {
    student: string;
    fee: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    amount: number;
    expand?: {
        student?: Student;
        fee?: Fee;
    };
}

export interface Inquiry extends RecordModel {
    name: string;
    email: string;
    phone: string;
    grade_interest: string;
    status: 'New Inquiry' | 'Contacted' | 'Interview Scheduled' | 'Offer Sent' | 'Enrolled' | 'Rejected';
    source: string;
    notes: string;
    next_follow_up?: string;
}

export interface Interaction extends RecordModel {
    inquiry?: string;
    student?: string;
    type: 'Call' | 'Email' | 'Meeting' | 'Note';
    summary: string;
    details: string;
    date: string;
    logged_by: string;
    expand?: {
        inquiry?: Inquiry;
        student?: Student;
        logged_by?: Student; // Reusing Student type for User as they share basic fields
    };
}

export interface ParentStudentLink extends RecordModel {
    parent: string;
    student: string;
    relationship: string;
    expand?: {
        parent?: Student; // User
        student?: Student; // User
    };
}

export interface Service extends RecordModel {
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    category: 'Transport' | 'Canteen' | 'Extra Class' | 'Health';
}

export interface Booking extends RecordModel {
    service: string;
    parent: string;
    student?: string;
    date: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    notes: string;
    payment_status?: 'Unpaid' | 'Paid' | 'Refunded';
    payment_reference?: string;
    amount_paid?: number;
    expand?: {
        service?: Service;
        parent?: Student;
        student?: Student;
    };
}

export interface Assignment extends RecordModel {
    title: string;
    description: string;
    due_date: string;
    class_id: string;
    teacher_id: string;
    points?: number;
    attachments?: string[];
    expand?: {
        class_id?: SchoolClass;
        teacher_id?: Student; // User
    };
}

export interface Submission extends RecordModel {
    assignment_id: string;
    student_id: string;
    submitted_at: string;
    files?: string[];
    grade?: number;
    feedback?: string;
    graded_by?: string;
    graded_at?: string;
    notes?: string;
    expand?: {
        student_id?: Student;
        assignment_id?: Assignment;
    };
}
