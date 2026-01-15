import { RecordModel } from 'pocketbase';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

// ============ INTERFACES ============

export interface TeacherClass extends RecordModel {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  section: string;
  student_count: number;
  schedule: string;
  room: string;
  color: string;
  teacherId: string;
  tenantId?: string;
}

export interface Student extends RecordModel {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  student_id: string;
  grade_level: string;
  section: string;
  gpa: number;
  attendance_rate: number;
  status: 'active' | 'inactive' | 'transferred';
  parent_contact?: string;
  notes?: string;
  classIds: string[];
  tenantId?: string;
}

export interface TeacherAssignment extends RecordModel {
  id: string;
  title: string;
  description: string;
  classId: string;
  class_name: string;
  type: 'homework' | 'quiz' | 'test' | 'project' | 'essay';
  due_date: string;
  created: string;
  max_score: number;
  weight: number;
  status: 'draft' | 'published' | 'closed';
  submissions_count: number;
  graded_count: number;
  teacherId: string;
  tenantId?: string;
}

export interface Submission extends RecordModel {
  id: string;
  assignmentId: string;
  studentId: string;
  student_name: string;
  submitted_at: string;
  content?: string;
  file_url?: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'late' | 'graded' | 'returned';
  graded_at?: string;
}

export interface AttendanceRecord extends RecordModel {
  id: string;
  classId: string;
  date: string;
  records: {
    studentId: string;
    student_name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }[];
  teacherId: string;
  tenantId?: string;
}

export interface LessonPlan extends RecordModel {
  id: string;
  title: string;
  classId: string;
  class_name: string;
  date: string;
  duration: number; // in minutes
  objectives: string[];
  materials: string[];
  activities: {
    name: string;
    duration: number;
    description: string;
  }[];
  homework?: string;
  notes?: string;
  status: 'draft' | 'scheduled' | 'completed';
  teacherId: string;
  tenantId?: string;
}

export interface GradeEntry extends RecordModel {
  id: string;
  studentId: string;
  student_name: string;
  classId: string;
  class_name: string;
  assignment_type: string;
  assignment_name: string;
  score: number;
  max_score: number;
  percentage: number;
  grade_letter: string;
  date: string;
  feedback?: string;
  teacherId: string;
}

export interface TeacherMessage extends RecordModel {
  id: string;
  sender_type: 'teacher' | 'parent' | 'admin';
  sender_name: string;
  recipient_type: 'parent' | 'student' | 'admin';
  recipient_id: string;
  recipient_name: string;
  subject: string;
  content: string;
  created: string;
  read: boolean;
  replied: boolean;
  thread_id?: string;
  teacherId: string;
  tenantId?: string;
}

export interface TeacherScheduleItem {
  id: string;
  classId: string;
  class_name: string;
  subject: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  start_time: string;
  end_time: string;
  room: string;
  type: 'class' | 'meeting' | 'prep' | 'duty';
}

export interface DashboardStats {
  total_students: number;
  total_classes: number;
  pending_submissions: number;
  upcoming_lessons: number;
  attendance_today: number;
  messages_unread: number;
  assignments_due_week: number;
  average_class_performance: number;
}

// ============ SERVICE METHODS ============

export const teacherService = {
  // Classes
  async getClasses(teacherId: string): Promise<TeacherClass[]> {
    return pb.collection('classes').getFullList<TeacherClass>({
      filter: `teacherId = "${teacherId}"`,
      sort: 'name',
      requestKey: null,
    });
  },

  async getClassById(classId: string): Promise<TeacherClass | null> {
    try {
      return await pb.collection('classes').getOne<TeacherClass>(classId);
    } catch {
      return null;
    }
  },

  // Students
  async getStudents(teacherId: string, classId?: string): Promise<Student[]> {
    const filter = classId ? `classIds ~ "${classId}"` : '';
    return pb.collection('students').getFullList<Student>({
      filter,
      sort: 'name',
      requestKey: null,
    });
  },

  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      return await pb.collection('students').getOne<Student>(studentId);
    } catch {
      return null;
    }
  },

  async updateStudentNotes(studentId: string, notes: string): Promise<void> {
    await pb.collection('students').update(studentId, { notes });
  },

  // Assignments
  async getAssignments(teacherId: string, classId?: string): Promise<TeacherAssignment[]> {
    const filter = classId ? `teacherId = "${teacherId}" && classId = "${classId}"` : `teacherId = "${teacherId}"`;
    return pb.collection('assignments').getFullList<TeacherAssignment>({
      filter,
      sort: '-due_date',
      requestKey: null,
    });
  },

  async createAssignment(data: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
    return pb.collection('assignments').create<TeacherAssignment>(data);
  },

  async updateAssignment(id: string, data: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
    return pb.collection('assignments').update<TeacherAssignment>(id, data);
  },

  async deleteAssignment(id: string): Promise<void> {
    await pb.collection('assignments').delete(id);
  },

  // Submissions
  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    return pb.collection('submissions').getFullList<Submission>({
      filter: `assignmentId = "${assignmentId}"`,
      sort: '-submitted_at',
      requestKey: null,
    });
  },

  async getPendingSubmissions(teacherId: string): Promise<Submission[]> {
    return pb.collection('submissions').getFullList<Submission>({
      filter: `status = "submitted"`,
      sort: '-submitted_at',
      requestKey: null,
    });
  },

  async gradeSubmission(submissionId: string, score: number, feedback?: string): Promise<Submission> {
    return pb.collection('submissions').update<Submission>(submissionId, {
      score,
      feedback,
      status: 'graded',
      graded_at: new Date().toISOString(),
    });
  },

  // Lesson Plans
  async getLessonPlans(teacherId: string, classId?: string): Promise<LessonPlan[]> {
    const filter = classId ? `teacherId = "${teacherId}" && classId = "${classId}"` : `teacherId = "${teacherId}"`;
    return pb.collection('lesson_plans').getFullList<LessonPlan>({
      filter,
      sort: '-date',
      requestKey: null,
    });
  },

  async createLessonPlan(data: Partial<LessonPlan>): Promise<LessonPlan> {
    return pb.collection('lesson_plans').create<LessonPlan>(data);
  },

  async updateLessonPlan(id: string, data: Partial<LessonPlan>): Promise<LessonPlan> {
    return pb.collection('lesson_plans').update<LessonPlan>(id, data);
  },

  // Grades
  async getGradeEntries(teacherId: string, classId?: string, studentId?: string): Promise<GradeEntry[]> {
    let filter = `teacherId = "${teacherId}"`;
    if (classId) filter += ` && classId = "${classId}"`;
    if (studentId) filter += ` && studentId = "${studentId}"`;
    return pb.collection('grade_entries').getFullList<GradeEntry>({
      filter,
      sort: '-date',
      requestKey: null,
    });
  },

  async createGradeEntry(data: Partial<GradeEntry>): Promise<GradeEntry> {
    return pb.collection('grade_entries').create<GradeEntry>(data);
  },

  async getClassAverages(classId: string): Promise<{ studentId: string; student_name: string; average: number; grade_letter: string }[]> {
    const grades = await pb.collection('grade_entries').getFullList<GradeEntry>({
      filter: `classId = "${classId}"`
    });
    const studentMap = new Map<string, { name: string; total: number; count: number }>();
    grades.forEach(g => {
      const current = studentMap.get(g.studentId) || { name: g.student_name, total: 0, count: 0 };
      current.total += g.percentage;
      current.count += 1;
      studentMap.set(g.studentId, current);
    });
    return Array.from(studentMap.entries()).map(([studentId, data]) => {
      const average = data.total / data.count;
      return {
        studentId,
        student_name: data.name,
        average,
        grade_letter: average >= 90 ? 'A' : average >= 80 ? 'B' : average >= 70 ? 'C' : average >= 60 ? 'D' : 'F',
      };
    });
  },

  // Attendance
  async getAttendanceRecords(teacherId: string, classId?: string, date?: string): Promise<AttendanceRecord[]> {
    let filter = `teacherId = "${teacherId}"`;
    if (classId) filter += ` && classId = "${classId}"`;
    if (date) filter += ` && date = "${date}"`;
    return pb.collection('attendance').getFullList<AttendanceRecord>({
      filter,
      sort: '-date',
      requestKey: null,
    });
  },

  async markAttendance(classId: string, date: string, records: AttendanceRecord['records'], teacherId: string): Promise<AttendanceRecord> {
    return pb.collection('attendance').create<AttendanceRecord>({
      classId,
      date,
      records,
      teacherId,
    });
  },

  // Messages
  async getMessages(teacherId: string, unreadOnly?: boolean): Promise<TeacherMessage[]> {
    let filter = `teacherId = "${teacherId}"`;
    if (unreadOnly) filter += ` && read = false`;
    return pb.collection('messages').getFullList<TeacherMessage>({
      filter,
      sort: '-created',
      requestKey: null,
    });
  },

  async markMessageRead(messageId: string): Promise<void> {
    await pb.collection('messages').update(messageId, { read: true });
  },

  async sendMessage(data: Partial<TeacherMessage>): Promise<TeacherMessage> {
    return pb.collection('messages').create<TeacherMessage>(data);
  },

  // Schedule
  async getSchedule(teacherId: string): Promise<TeacherScheduleItem[]> {
    return pb.collection('teacher_schedule').getFullList<TeacherScheduleItem>({
      filter: `teacherId = "${teacherId}"`,
      sort: 'day,start_time',
      requestKey: null,
    });
  },

  async getTodaySchedule(teacherId: string): Promise<TeacherScheduleItem[]> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return pb.collection('teacher_schedule').getFullList<TeacherScheduleItem>({
      filter: `teacherId = "${teacherId}" && day = "${today}"`,
      sort: 'start_time',
      requestKey: null,
    });
  },

  // Dashboard Stats
  async getDashboardStats(teacherId: string): Promise<DashboardStats> {
    // In production, aggregate from multiple collections
    const [students, classes, submissions, lessons, messages] = await Promise.all([
      pb.collection('students').getList(1, 1, { filter: `teacherId = "${teacherId}"`, count: true }),
      pb.collection('classes').getList(1, 1, { filter: `teacherId = "${teacherId}"`, count: true }),
      pb.collection('submissions').getList(1, 1, { filter: `status = "submitted"`, count: true }),
      pb.collection('lesson_plans').getList(1, 1, { filter: `teacherId = "${teacherId}" && status = "scheduled"`, count: true }),
      pb.collection('messages').getList(1, 1, { filter: `teacherId = "${teacherId}" && read = false`, count: true }),
    ]);

    return {
      total_students: students.totalItems,
      total_classes: classes.totalItems,
      pending_submissions: submissions.totalItems,
      upcoming_lessons: lessons.totalItems,
      attendance_today: 0, // Would need daily aggregation
      messages_unread: messages.totalItems,
      assignments_due_week: 0, // Would need date filtering
      average_class_performance: 0,
    };
  },

  // Analytics
  async getClassPerformance(classId: string): Promise<{ week: string; average: number }[]> {
    // This would ideally come from a reporting/stats collection
    return [];
  },

  async getStudentPerformanceTrend(studentId: string, classId: string): Promise<{ date: string; score: number }[]> {
    const grades = await pb.collection('grade_entries').getFullList<GradeEntry>({
      filter: `studentId = "${studentId}" && classId = "${classId}"`,
      sort: 'date'
    });
    return grades.map(g => ({ date: g.date, score: g.percentage }));
  },

  async getAttendanceStats(classId: string): Promise<{ present: number; absent: number; late: number; excused: number }> {
    return { present: 0, absent: 0, late: 0, excused: 0 };
  },
};

export default teacherService;
