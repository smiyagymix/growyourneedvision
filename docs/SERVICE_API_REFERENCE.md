# Complete Service API Reference

Production-grade REST API documentation for all services with real data flows and examples.

---

## Quick Reference

### Service Imports

```typescript
import {
  userService,
  courseService,
  assignmentService,
  gradeService,
  attendanceService,
  notificationService
} from '../services';
```

---

## Grade Service API

### `recordGrade(payload: GradeCreatePayload): Promise<Grade>`

Record grades with automatic calculations.

**Parameters**:
```typescript
{
  courseId: string;          // Course ID
  studentId: string;         // Student ID
  tenantId: string;          // Tenant/school ID
  componentGrades: {
    assignments?: number;    // 0-100
    participation?: number;  // 0-100
    midterm?: number;        // 0-100
    final?: number;          // 0-100
  };
}
```

**Returns**:
```typescript
{
  id: string;
  courseId: string;
  studentId: string;
  componentGrades: Record<string, number>;
  finalScore: number;        // Weighted calculation
  letterGrade: 'A'|'B'|'C'|'D'|'F';
  gpa: number;               // 4.0 scale
  status: 'in-progress'|'final'|'contested';
  created: string;           // ISO timestamp
  updated: string;           // ISO timestamp
}
```

**Example**:
```typescript
const grade = await gradeService.recordGrade({
  courseId: 'course-123',
  studentId: 'student-456',
  tenantId: 'tenant-789',
  componentGrades: {
    assignments: 85,   // 30% = 25.5
    participation: 90, // 10% = 9.0
    midterm: 78,       // 20% = 15.6
    final: 82          // 40% = 32.8
  }
});
// Result: finalScore = 82.9, letterGrade = 'B', gpa = 3.0
```

**Errors**:
- `validation`: Component scores out of range
- `not_found`: Course or student not found
- `conflict`: Grade already exists

---

### `updateGrade(gradeId: string, payload: Partial<GradeCreatePayload>): Promise<Grade>`

Update existing grade.

**Example**:
```typescript
const updated = await gradeService.updateGrade('grade-123', {
  componentGrades: {
    final: 88  // Update final score
  }
});
```

---

### `getClassStatistics(courseId: string): Promise<GradeStats>`

Get class grading statistics.

**Returns**:
```typescript
{
  avgScore: number;          // Average final score
  median: number;            // Median score
  stdDev: number;            // Standard deviation
  distribution: {
    A: number;               // Count of A grades
    B: number;
    C: number;
    D: number;
    F: number;
  };
  totalStudents: number;
  passingRate: number;       // Percentage with C or better
}
```

**Example**:
```typescript
const stats = await gradeService.getClassStatistics('course-123');
// { avgScore: 78.5, median: 80, distribution: { A: 5, B: 12, C: 8, D: 2, F: 1 } }
```

---

### `getStudentTranscript(studentId: string, tenantId: string): Promise<TranscriptEntry[]>`

Get student's academic transcript.

**Returns**:
```typescript
[
  {
    courseId: string;
    courseName: string;
    credits: number;
    letterGrade: 'A'|'B'|'C'|'D'|'F';
    gpa: number;
    gradePoints: number;      // letterGrade * credits
    semester: string;
  }
]
// Plus metadata:
// { cumulativeGPA: number; totalCredits: number; completedCredits: number }
```

**Example**:
```typescript
const transcript = await gradeService.getStudentTranscript('student-123', 'tenant-456');
// Returns array of courses with cumulative GPA calculation
```

---

### `exportGradesByCourse(courseId: string): Promise<string>`

Export course grades as CSV.

**Returns**: CSV formatted string

**Format**:
```
Student ID,Name,Assignments,Participation,Midterm,Final,Final Score,Grade
student-1,John Doe,85,90,78,82,81.2,B
student-2,Jane Smith,92,88,85,89,88.4,A
```

---

## Attendance Service API

### `recordAttendance(payload: AttendanceCreatePayload): Promise<AttendanceRecord>`

Record attendance for single student.

**Parameters**:
```typescript
{
  courseId: string;
  studentId: string;
  tenantId: string;
  date: string;              // YYYY-MM-DD format
  status: 'present'|'absent'|'late'|'excused';
  notes?: string;            // Max 500 chars
  markedBy: string;          // Teacher ID
  arrivalTime?: string;      // HH:MM format
  departureTime?: string;    // HH:MM format
}
```

**Returns**:
```typescript
{
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: 'present'|'absent'|'late'|'excused';
  notes?: string;
  markedBy: string;
  markedAt: string;          // Timestamp
  arrivalTime?: string;
  departureTime?: string;
  created: string;
  updated: string;
}
```

**Example**:
```typescript
const record = await attendanceService.recordAttendance({
  courseId: 'course-123',
  studentId: 'student-456',
  tenantId: 'tenant-789',
  date: '2024-01-15',
  status: 'present',
  markedBy: 'teacher-123'
});
```

---

### `bulkRecordAttendance(payload: BulkAttendancePayload): Promise<BulkResult>`

Record attendance for entire class.

**Parameters**:
```typescript
{
  courseId: string;
  tenantId: string;
  date: string;
  markedBy: string;
  records: [
    {
      studentId: string;
      status: 'present'|'absent'|'late'|'excused';
      notes?: string;
    }
  ]
}
```

**Returns**:
```typescript
{
  succeeded: number;
  failed: number;
  errors: [
    { studentId: string; error: string }
  ]
}
```

**Example**:
```typescript
const result = await attendanceService.bulkRecordAttendance({
  courseId: 'course-123',
  tenantId: 'tenant-789',
  date: '2024-01-15',
  markedBy: 'teacher-123',
  records: [
    { studentId: 'student-1', status: 'present' },
    { studentId: 'student-2', status: 'absent', notes: 'Sick' },
    { studentId: 'student-3', status: 'late' }
  ]
});
// { succeeded: 3, failed: 0, errors: [] }
```

---

### `getStudentAttendanceSummary(courseId: string, studentId: string): Promise<AttendanceSummary>`

Get attendance summary for student.

**Returns**:
```typescript
{
  studentId: string;
  courseId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}
```

**Example**:
```typescript
const summary = await attendanceService.getStudentAttendanceSummary('course-123', 'student-456');
// { totalSessions: 28, presentCount: 26, attendancePercentage: 92.9 }
```

---

### `getCourseAttendanceReport(courseId: string, tenantId: string): Promise<AttendanceReport[]>`

Get full course attendance report.

**Returns**:
```typescript
[
  {
    studentId: string;
    totalSessions: number;
    attended: number;
    absent: number;
    attendancePercentage: number;
  }
]
// Sorted by attendance percentage (highest first)
```

**Example**:
```typescript
const report = await attendanceService.getCourseAttendanceReport('course-123', 'tenant-789');
```

---

### `getLowAttendanceStudents(courseId: string, tenantId: string, threshold?: number): Promise<LowAttendanceStudent[]>`

Get students below attendance threshold.

**Parameters**:
- `threshold`: Number 0-100 (default: 80)

**Returns**:
```typescript
[
  {
    studentId: string;
    attendancePercentage: number;
  }
]
// Sorted by lowest attendance first
```

**Example**:
```typescript
const atRisk = await attendanceService.getLowAttendanceStudents('course-123', 'tenant-789', 75);
// Students with < 75% attendance
```

---

### `exportAttendanceReport(courseId: string, tenantId: string): Promise<string>`

Export attendance as CSV.

**Returns**: CSV formatted string

**Format**:
```
Student ID,Total Sessions,Attended,Absent,Attendance %
student-1,28,26,2,92
student-2,28,27,1,96
student-3,28,22,6,78
```

---

## Notification Service API

### `createNotification(payload: NotificationCreatePayload): Promise<Notification>`

Create and send notification.

**Parameters**:
```typescript
{
  userId: string;
  tenantId: string;
  type: 'assignment_due'|'grade_posted'|'message'|'system'|'announcement'|'reminder'|'course_update'|'payment'|'attendance'|'achievement';
  title: string;             // Max 200 chars
  message: string;           // Max 2000 chars
  priority?: 'low'|'medium'|'high'|'critical'; // default: medium
  actionUrl?: string;        // Link to resource
  actionType?: string;       // 'link'|'assignment'|'message'|'course'
  actionId?: string;         // ID of resource
  metadata?: Record<string, any>; // Custom data
  channels?: ['in_app'|'email'|'sms'|'push']; // default: ['in_app']
  expiresAt?: string;        // ISO timestamp
}
```

**Returns**:
```typescript
{
  id: string;
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  channels: string[];
  deliveryStatus: {
    in_app: 'pending'|'delivered'|'failed';
    email?: 'pending'|'sent'|'failed';
    sms?: 'pending'|'sent'|'failed';
    push?: 'pending'|'sent'|'failed';
  };
  created: string;
  updated: string;
}
```

**Example**:
```typescript
const notification = await notificationService.createNotification({
  userId: 'user-123',
  tenantId: 'tenant-456',
  type: 'grade_posted',
  title: 'Grade Posted',
  message: 'Your exam grade is now available',
  priority: 'high',
  actionType: 'link',
  actionUrl: '/grades/exam-123',
  channels: ['in_app', 'email']
});
```

---

### `sendBulkNotifications(payload: BulkNotificationPayload): Promise<BulkResult>`

Send notifications to multiple users.

**Parameters**:
```typescript
{
  userIds: string[];
  tenantId: string;
  type: string;
  title: string;
  message: string;
  priority?: string;
  channels?: string[];
  metadata?: Record<string, any>;
}
```

**Returns**:
```typescript
{
  succeeded: number;
  failed: number;
  notificationIds: string[];
}
```

**Example**:
```typescript
const result = await notificationService.sendBulkNotifications({
  userIds: ['user-1', 'user-2', 'user-3'],
  tenantId: 'tenant-456',
  type: 'announcement',
  title: 'School Closed',
  message: 'School is closed Monday',
  priority: 'high'
});
```

---

### `getNotifications(userId: string, tenantId: string, options?): Promise<NotificationList>`

Get user notifications with filtering.

**Parameters**:
```typescript
{
  unreadOnly?: boolean;      // default: false
  limit?: number;            // default: 20
  page?: number;             // default: 1
  types?: string[];          // Filter by notification types
}
```

**Returns**:
```typescript
{
  notifications: Notification[];
  unreadCount: number;
  total: number;
}
```

**Example**:
```typescript
const { notifications, unreadCount } = await notificationService.getNotifications(
  'user-123',
  'tenant-456',
  { unreadOnly: true, limit: 50 }
);
```

---

### `markAsRead(notificationId: string): Promise<Notification>`

Mark notification as read.

**Example**:
```typescript
await notificationService.markAsRead('notif-123');
```

---

### `markManyAsRead(notificationIds: string[]): Promise<void>`

Mark multiple notifications as read.

**Example**:
```typescript
await notificationService.markManyAsRead(['notif-1', 'notif-2', 'notif-3']);
```

---

### `subscribeToRealtime(userId: string, callback: (notif: Notification) => void): () => void`

Subscribe to real-time notifications.

**Returns**: Unsubscribe function

**Example**:
```typescript
const unsubscribe = notificationService.subscribeToRealtime('user-123', (notification) => {
  console.log('New notification:', notification.title);
  showNotificationBanner(notification);
});

// Later: cleanup
unsubscribe();
```

---

### `getNotificationPreferences(userId: string, tenantId: string): Promise<Preferences|null>`

Get user notification preferences.

**Returns**:
```typescript
{
  id: string;
  userId: string;
  tenantId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  muteUntil?: string;
  preferences: {
    [notificationType]: {
      enabled: boolean;
      channels: string[];
    }
  };
}
```

---

### `updateNotificationPreferences(userId: string, tenantId: string, prefs: Partial<Preferences>): Promise<Preferences>`

Update notification preferences.

**Example**:
```typescript
await notificationService.updateNotificationPreferences('user-123', 'tenant-456', {
  emailNotifications: true,
  smsNotifications: false,
  muteUntil: '2024-01-20T18:00:00Z',
  preferences: {
    grade_posted: {
      enabled: true,
      channels: ['in_app', 'email']
    },
    announcement: {
      enabled: true,
      channels: ['in_app']
    }
  }
});
```

---

## Error Response Format

All services follow consistent error format:

```typescript
{
  code: string;              // Error code (validation, not_found, conflict, etc.)
  message: string;           // Human readable message
  context?: {
    field?: string;          // Field causing error
    value?: any;             // Value provided
    reason?: string;         // Specific reason
  };
  severity: 'error'|'warning'|'info'; // Error severity
}
```

**Example**:
```typescript
try {
  await gradeService.recordGrade(invalidPayload);
} catch (error) {
  console.error(error);
  // {
  //   code: 'validation',
  //   message: 'Component scores must be between 0 and 100',
  //   context: { field: 'componentGrades.final', value: 105 },
  //   severity: 'error'
  // }
}
```

---

## Common Error Codes

| Code | HTTP | Meaning | Resolution |
|------|------|---------|-----------|
| `validation` | 400 | Input validation failed | Check parameter types and ranges |
| `not_found` | 404 | Resource not found | Verify ID exists |
| `conflict` | 409 | Resource already exists | Use update instead or delete first |
| `permission_denied` | 403 | Insufficient permissions | Check user role |
| `network` | 503 | Network error | Retry with backoff |
| `server` | 500 | Server error | Contact support |

---

## Complete Workflow Example

### Grade Assignment + Notification

```typescript
// 1. Record grades for all students
const grades = [];
for (const studentId of enrolledStudentIds) {
  const grade = await gradeService.recordGrade({
    courseId: 'course-123',
    studentId,
    tenantId: 'tenant-456',
    componentGrades: {
      assignments: Math.random() * 100,
      participation: Math.random() * 100,
      midterm: Math.random() * 100,
      final: Math.random() * 100
    }
  });
  grades.push(grade);
}

// 2. Get class statistics
const stats = await gradeService.getClassStatistics('course-123');
console.log(`Class avg: ${stats.avgScore}, Distribution: ${stats.distribution}`);

// 3. Notify all students
const result = await notificationService.sendBulkNotifications({
  userIds: enrolledStudentIds,
  tenantId: 'tenant-456',
  type: 'grade_posted',
  title: 'Exam Grades Posted',
  message: 'Your exam grades are now available. Check your transcript!',
  priority: 'high',
  actionUrl: '/grades/exam-123',
  channels: ['in_app', 'email']
});

console.log(`Notified: ${result.succeeded}/${enrolledStudentIds.length}`);
```

---

## Performance Considerations

### Query Optimization

```typescript
// ❌ DON'T: Multiple separate queries
for (const studentId of studentIds) {
  const grade = await gradeService.recordGrade(payload);
}

// ✅ DO: Use bulk operations when available
await attendanceService.bulkRecordAttendance(bulkPayload);
```

### Caching

Services support caching for expensive operations:

```typescript
// First call: computes and caches
const stats = await gradeService.getClassStatistics('course-123');

// Subsequent calls within TTL use cache
const stats2 = await gradeService.getClassStatistics('course-123');
```

### Pagination

Use pagination for large result sets:

```typescript
const page1 = await notificationService.getNotifications(userId, tenantId, {
  page: 1,
  limit: 50
});

const page2 = await notificationService.getNotifications(userId, tenantId, {
  page: 2,
  limit: 50
});
```

---

## Rate Limiting

Services respect rate limits:

- Single operations: No limit
- Bulk operations: 100 items per request
- Queries: 1000 results per page
- Real-time subscriptions: 10 concurrent per user

---

**API Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Status**: ✅ Production Ready
