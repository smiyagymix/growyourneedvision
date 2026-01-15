/**
 * Attendance Service - Complete Attendance Tracking and Reporting
 * Handles attendance marking, reporting, and analytics with full production workflow
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { Logger } from '../utils/logging';
import { ErrorFactory, normalizeError } from '../utils/errorHandling';
import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord extends RecordModel {
  courseId: string;
  studentId: string;
  tenantId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  markedBy: string;
  markedAt: string;
  arrivalTime?: string;
  departureTime?: string;
  created: string;
  updated: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  totalDays: number;
}

export interface SchoolClass extends RecordModel {
  name: string;
  code: string;
  tenantId: string;
}

// Zod schemas
const AttendanceCreateSchema = z.object({
  courseId: z.string().min(1),
  studentId: z.string().min(1),
  tenantId: z.string().min(1),
  date: z.string().date('Invalid date'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.optional(z.string().max(500)),
  markedBy: z.string().min(1),
  arrivalTime: z.optional(z.string().time()),
  departureTime: z.optional(z.string().time()),
});

const MOCK_ATTENDANCE: AttendanceRecord[] = [
    {
        id: 'att-1',
        collectionId: 'mock',
        collectionName: 'attendance_records',
        student: 'student-1',
        class: 'class-1',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        marked_by: 'teacher-1',
        arrival_time: '08:00',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        expand: {
            student: { id: 'student-1', collectionId: 'mock', collectionName: 'users', name: 'John Smith', email: 'john@example.com', created: '', updated: '' },
            class: { id: 'class-1', collectionId: 'mock', collectionName: 'classes', name: 'Mathematics 101', code: 'MATH101', created: '', updated: '' }
        }
    }
];

export const attendanceService = {
    /**
     * Get all classes for a tenant
     */
    async getClasses(tenantId?: string) {
        if (isMockEnv()) {
            return [
                { id: 'class-1', name: 'Mathematics 101', code: 'MATH101', tenantId: tenantId || 't1' },
                { id: 'class-2', name: 'Science 202', code: 'SCI202', tenantId: tenantId || 't1' }
            ] as SchoolClass[];
        }

        const result = await pb.collection('school_classes').getList<SchoolClass>(1, 100, {
            sort: 'name',
            filter: tenantId ? `tenantId = "${tenantId}"` : undefined,
            requestKey: null
        });
        return result.items;
    },

    /**
     * Get students enrolled in a class
     */
    async getClassStudents(classId: string, tenantId?: string) {
        if (isMockEnv()) {
            return [
                { id: 'student-1', name: 'John Smith', email: 'john@example.com' },
                { id: 'student-2', name: 'Jane Doe', email: 'jane@example.com' }
            ];
        }

        const enrollments = await pb.collection('enrollments').getFullList({
            filter: `class="${classId}"${tenantId ? ` && tenantId = "${tenantId}"` : ''}`,
            expand: 'student',
            requestKey: null
        });

        return enrollments
            .map((e: any) => e.expand?.student)
            .filter((s: any) => !!s);
    },

    /**
     * Get attendance for a specific class and date
     */
    async getClassAttendance(classId: string, date: string) {
        const dateStr = date.split('T')[0];

        if (isMockEnv()) {
            return MOCK_ATTENDANCE.filter(a =>
                a.class === classId && a.date === dateStr
            );
        }

        return await pb.collection('attendance_records').getFullList<AttendanceRecord>({
            filter: `class = "${classId}" && date >= "${dateStr} 00:00:00" && date <= "${dateStr} 23:59:59"`,
            expand: 'student',
            requestKey: null
        });
    },

    /**
     * Get attendance aggregates for a class and date range
     */
    async getAttendanceAggregates(classId: string, from: string, to: string, tenantId?: string) {
        if (isMockEnv()) {
            return {
                total: 10,
                counts: {
                    Present: 7,
                    Absent: 1,
                    Late: 1,
                    Excused: 1
                }
            };
        }

        // Search for existing aggregates in PB or compute manually if endpoint unavailable
        // For production readiness, we leverage the service to hide complexity
        const records = await pb.collection('attendance_records').getFullList<AttendanceRecord>({
            filter: `class = "${classId}" && date >= "${from}" && date <= "${to}"${tenantId ? ` && tenantId = "${tenantId}"` : ''}`,
            requestKey: null
        });

        const counts: Record<string, number> = {
            Present: 0,
            Absent: 0,
            Late: 0,
            Excused: 0
        };

        records.forEach(r => {
            if (counts[r.status] !== undefined) {
                counts[r.status]++;
            }
        });

        return {
            total: records.length,
            counts
        };
    },

    /**
     * Mark attendance for a single student
     */
    async markAttendance(
        studentId: string,
        classId: string,
        date: string,
        status: AttendanceRecord['status'],
        options?: {
            markedBy?: string;
            notes?: string;
            arrivalTime?: string;
            tenantId?: string;
        }
    ) {
        const dateStr = date.split('T')[0];

        if (isMockEnv()) {
            const existingIndex = MOCK_ATTENDANCE.findIndex(a =>
                a.student === studentId && a.class === classId && a.date === dateStr
            );

            if (existingIndex !== -1) {
                MOCK_ATTENDANCE[existingIndex] = {
                    ...MOCK_ATTENDANCE[existingIndex],
                    status,
                    notes: options?.notes,
                    arrival_time: options?.arrivalTime,
                    updated: new Date().toISOString()
                };
                return MOCK_ATTENDANCE[existingIndex];
            } else {
                const newRecord: AttendanceRecord = {
                    id: `att-${Date.now()}`,
                    collectionId: 'mock',
                    collectionName: 'attendance_records',
                    student: studentId,
                    class: classId,
                    date: dateStr,
                    status,
                    marked_by: options?.markedBy,
                    notes: options?.notes,
                    arrival_time: options?.arrivalTime,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                };
                MOCK_ATTENDANCE.push(newRecord);
                auditLog.log('attendance_marked', { studentId, classId, status }, 'info');
                return newRecord;
            }
        }

        const existing = await pb.collection('attendance_records').getList<AttendanceRecord>(1, 1, {
            filter: `student = "${studentId}" && class = "${classId}" && date >= "${dateStr} 00:00:00" && date <= "${dateStr} 23:59:59"`,
            requestKey: null
        });

        if (existing.items.length > 0) {
            const updated = await pb.collection('attendance_records').update<AttendanceRecord>(existing.items[0].id, {
                status,
                notes: options?.notes,
                arrival_time: options?.arrivalTime
            });
            return updated;
        } else {
            const created = await pb.collection('attendance_records').create<AttendanceRecord>({
                student: studentId,
                class: classId,
                date: new Date(dateStr + ' 12:00:00').toISOString(),
                status,
                marked_by: options?.markedBy,
                notes: options?.notes,
                arrival_time: options?.arrivalTime,
                tenantId: options?.tenantId
            });
            auditLog.log('attendance_marked', { studentId, classId, status }, 'info');
            return created;
        }
    },

    /**
     * Bulk mark attendance for multiple students
     */
    async bulkMarkAttendance(
        studentIds: string[],
        classId: string,
        date: string,
        status: AttendanceRecord['status'],
        options?: {
            markedBy?: string;
            tenantId?: string;
        }
    ) {
        const results: { success: AttendanceRecord[]; failed: string[] } = { success: [], failed: [] };

        // Process in chunks or parallel with limits if needed, but simple loop for now
        for (const studentId of studentIds) {
            try {
                const marked = await this.markAttendance(
                    studentId,
                    classId,
                    date,
                    status,
                    options
                );
                results.success.push(marked);
            } catch (error) {
                results.failed.push(studentId);
            }
        }

        auditLog.log('bulk_attendance_marked', {
            classId,
            date,
            total: studentIds.length,
            success: results.success.length
        }, 'info');

        return results;
    },

    /**
     * Get attendance statistics for a class
     */
    async getClassStats(classId: string, dateRange?: { start: string; end: string }): Promise<AttendanceStats> {
        let records: AttendanceRecord[];

        if (isMockEnv()) {
            records = MOCK_ATTENDANCE.filter(a => a.class === classId);
            if (dateRange) {
                records = records.filter(a =>
                    a.date >= dateRange.start && a.date <= dateRange.end
                );
            }
        } else {
            let filter = `class = "${classId}"`;
            if (dateRange) {
                filter += ` && date >= "${dateRange.start}" && date <= "${dateRange.end}"`;
            }
            records = await pb.collection('attendance_records').getFullList<AttendanceRecord>({
                filter,
                requestKey: null
            });
        }

        const total = records.length;
        if (total === 0) return { present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0, totalDays: 0 };

        const present = records.filter(r => r.status.toLowerCase() === 'present').length;
        const absent = records.filter(r => r.status.toLowerCase() === 'absent').length;
        const late = records.filter(r => r.status.toLowerCase() === 'late').length;
        const excused = records.filter(r => r.status.toLowerCase() === 'excused').length;
        const uniqueDays = new Set(records.map(r => r.date)).size;

        return {
            present,
            absent,
            late,
            excused,
            attendanceRate: Math.round(((present + late) / total) * 100),
            totalDays: uniqueDays
        };
    },

    /**
     * Get attendance statistics for a student
     */
    async getStudentStats(studentId: string, dateRange?: { start: string; end: string }): Promise<AttendanceStats> {
        let records: AttendanceRecord[];

        if (isMockEnv()) {
            records = MOCK_ATTENDANCE.filter(a => a.student === studentId);
            if (dateRange) {
                records = records.filter(a =>
                    a.date >= dateRange.start && a.date <= dateRange.end
                );
            }
        } else {
            let filter = `student = "${studentId}"`;
            if (dateRange) {
                filter += ` && date >= "${dateRange.start}" && date <= "${dateRange.end}"`;
            }
            records = await pb.collection('attendance_records').getFullList<AttendanceRecord>({
                filter,
                requestKey: null
            });
        }

        const total = records.length;
        if (total === 0) return { present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0, totalDays: 0 };

        const present = records.filter(r => r.status.toLowerCase() === 'present').length;
        const absent = records.filter(r => r.status.toLowerCase() === 'absent').length;
        const late = records.filter(r => r.status.toLowerCase() === 'late').length;
        const excused = records.filter(r => r.status.toLowerCase() === 'excused').length;
        const uniqueDays = new Set(records.map(r => r.date)).size;

        return {
            present,
            absent,
            late,
            excused,
            attendanceRate: Math.round(((present + late) / total) * 100),
            totalDays: uniqueDays
        };
    },

    /**
     * Get students with low attendance (below threshold)
     */
    async getLowAttendanceStudents(classId: string, threshold = 80): Promise<Array<{
        studentId: string;
        studentName: string;
        attendanceRate: number;
    }>> {
        const records = await this.getAttendanceByDateRange(classId, '1970-01-01', new Date().toISOString().split('T')[0]);

        const studentMap = new Map<string, { present: number; total: number; name: string }>();

        for (const record of records) {
            const current = studentMap.get(record.student) || { present: 0, total: 0, name: record.expand?.student?.name || 'Unknown student' };
            current.total++;
            if (record.status === 'Present' || record.status === 'Late') {
                current.present++;
            }
            studentMap.set(record.student, current);
        }

        const result: Array<{ studentId: string; studentName: string; attendanceRate: number }> = [];
        studentMap.forEach((data, studentId) => {
            const rate = Math.round((data.present / data.total) * 100);
            if (rate < threshold) {
                result.push({ studentId, studentName: data.name, attendanceRate: rate });
            }
        });

        return result.sort((a, b) => a.attendanceRate - b.attendanceRate);
    },

    /**
     * Get attendance for date range
     */
    async getAttendanceByDateRange(classId: string, startDate: string, endDate: string) {
        if (isMockEnv()) {
            return MOCK_ATTENDANCE.filter(a =>
                a.class === classId &&
                a.date >= startDate &&
                a.date <= endDate
            );
        }

        return await pb.collection('attendance_records').getFullList<AttendanceRecord>({
            filter: `class = "${classId}" && date >= "${startDate} 00:00:00" && date <= "${endDate} 23:59:59"`,
            expand: 'student',
            sort: 'date',
            requestKey: null
        });
    },

    /**
     * Get today's attendance summary for all classes
     */
    async getTodaySummary() {
        const today = new Date().toISOString().split('T')[0];

        if (isMockEnv()) {
            const todayRecords = MOCK_ATTENDANCE.filter(a => a.date === today);
            const classes = new Set(todayRecords.map(a => a.class));

            return {
                date: today,
                totalRecords: todayRecords.length,
                classesMarked: classes.size,
                present: todayRecords.filter(r => r.status === 'Present').length,
                absent: todayRecords.filter(r => r.status === 'Absent').length,
                late: todayRecords.filter(r => r.status === 'Late').length,
                excused: todayRecords.filter(r => r.status === 'Excused').length
            };
        }

        const records = await pb.collection('attendance_records').getFullList<AttendanceRecord>({
            filter: `date >= "${today} 00:00:00" && date <= "${today} 23:59:59"`,
            requestKey: null
        });

        const classes = new Set(records.map(a => a.class));

        return {
            date: today,
            totalRecords: records.length,
            classesMarked: classes.size,
            present: records.filter(r => r.status === 'Present').length,
            absent: records.filter(r => r.status === 'Absent').length,
            late: records.filter(r => r.status === 'Late').length,
            excused: records.filter(r => r.status === 'Excused').length
        };
    }
};
