# Production Services Guide

Complete documentation for all production-grade services with real data flows, type safety, and comprehensive error handling.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Pattern](#service-pattern)
3. [User Service](#user-service)
4. [Course Service](#course-service)
5. [Assignment Service](#assignment-service)
6. [Grade Service](#grade-service)
7. [Attendance Service](#attendance-service)
8. [Notification Service](#notification-service)
9. [Error Handling](#error-handling)
10. [Validation](#validation)
11. [Testing](#testing)

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────┐
│        React Components                 │
│     (UI Layer - consume hooks)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Custom Hooks                     │
│   (useUserData, useCourses, etc.)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Services Layer                   │
│  (Business Logic, API Calls, Caching)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Utilities Layer                  │
│  (Logging, Errors, Validation, etc.)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        PocketBase API                   │
│   (Database, Authentication)            │
└─────────────────────────────────────────┘
```

### Service Responsibilities

Each service handles:
- **Data Access**: CRUD operations via PocketBase SDK
- **Business Logic**: Calculations, validations, transformations
- **Error Handling**: Try/catch with ErrorFactory and normalizeError
- **Logging**: Performance tracking and troubleshooting
- **Validation**: Zod schema validation for all inputs
- **Type Safety**: Strict TypeScript with no implicit any

---

## Service Pattern

### Base Service Structure

All services follow a consistent pattern:

```typescript
import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { Logger } from '../utils/logging';
import { ErrorFactory, normalizeError } from '../utils/errorHandling';
import { z } from 'zod';

// 1. TYPES & SCHEMAS
export interface Entity extends RecordModel {
  /* ... fields ... */
}

export interface CreatePayload {
  /* ... fields ... */
}

const CreateSchema = z.object({
  /* ... validation rules ... */
});

// 2. SERVICE CLASS
export class EntityService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ enableConsole: true });
  }

  async create(payload: CreatePayload): Promise<Entity> {
    this.logger.startTimer('create-entity');

    try {
      const validated = CreateSchema.parse(payload);
      const result = await pb.collection('entities').create<Entity>(validated);
      
      this.logger.endTimer('create-entity', { entityId: result.id });
      return result;
    } catch (error) {
      const appError = normalizeError(error, undefined, { payload });
      this.logger.error('Failed to create entity', appError);
      throw appError;
    }
  }
}

// 3. SINGLETON EXPORT
export const entityService = new EntityService();
export default entityService;
```

### Key Principles

✅ **Type Safety**
- All inputs validated with Zod schemas
- No `any`, `unknown`, or implicit types
- Strict TypeScript configuration

✅ **Error Handling**
- All async operations in try/catch blocks
- Errors normalized with `normalizeError()`
- Errors created with `ErrorFactory`
- All errors logged with context

✅ **Logging**
- All operations timed with `startTimer()/endTimer()`
- Errors logged with `logger.error()`
- Info messages for successful operations
- Performance metrics collected

✅ **Validation**
- All payloads validated with Zod before use
- Validation errors include field-level details
- Business logic validation after schema validation

---

## User Service

### Purpose
Manages user accounts, roles, permissions, and authentication metadata.

### Key Types

```typescript
export interface User extends RecordModel {
  email: string;
  name: string;
  role: 'owner' | 'schoolAdmin' | 'teacher' | 'student' | 'parent' | 'individual';
  tenantId?: string;
  isActive: boolean;
  lastLogin?: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserCreatePayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  tenantId?: string;
}
```

### Key Methods

#### `createUser(payload)`
Create new user with validation and password hashing.

```typescript
const user = await userService.createUser({
  email: 'student@school.com',
  name: 'John Doe',
  password: 'SecurePass123!',
  role: 'student',
  tenantId: 'school-123'
});
```

**Validation**:
- Email format and uniqueness
- Password strength (8+ chars, uppercase, lowercase, number, special)
- Role validity
- Tenant existence (if provided)

#### `updateUserRole(userId, role)`
Update user role with audit logging.

```typescript
await userService.updateUserRole('user-456', 'teacher');
```

**Restrictions**:
- Only Owner can change roles
- Cannot change own role
- Validates new role is valid

#### `searchUsers(tenantId, query)`
Search users by name or email within tenant.

```typescript
const results = await userService.searchUsers('tenant-123', 'john');
// Returns: [{ id: '...', name: 'John Doe', email: '...' }]
```

#### `getUserStats(tenantId)`
Get user statistics for analytics.

```typescript
const stats = await userService.getUserStats('tenant-123');
// Returns: { total: 150, active: 140, inactive: 10, byRole: {...} }
```

### Error Cases

| Error | Scenario | Resolution |
|-------|----------|-----------|
| `conflict` | Duplicate email | Validate email uniqueness |
| `validation` | Invalid password | Enforce password requirements |
| `not_found` | User doesn't exist | Verify user ID |
| `permission_denied` | Insufficient permissions | Check user role |

---

## Course Service

### Purpose
Manages courses, enrollments, and course scheduling with real enrollment workflows.

### Key Types

```typescript
export interface Course extends RecordModel {
  code: string;
  name: string;
  description?: string;
  teacherId: string;
  tenantId: string;
  credits: number;
  capacity: number;
  enrolledCount: number;
  status: 'draft' | 'active' | 'archived';
  startDate: string;
  endDate: string;
}

export interface Enrollment extends RecordModel {
  courseId: string;
  studentId: string;
  tenantId: string;
  enrolledDate: string;
  status: 'active' | 'completed' | 'dropped';
  grade?: string;
  finalScore?: number;
}
```

### Key Methods

#### `createCourse(payload)`
Create course with capacity validation.

```typescript
const course = await courseService.createCourse({
  code: 'MATH101',
  name: 'Calculus I',
  teacherId: 'teacher-123',
  tenantId: 'school-456',
  credits: 3,
  capacity: 30,
  startDate: '2024-01-15',
  endDate: '2024-05-15'
});
```

#### `enrollStudent(courseId, studentId)`
Enroll student in course with capacity checking.

```typescript
const enrollment = await courseService.enrollStudent('course-123', 'student-456');
```

**Validation**:
- Course capacity not exceeded
- Student not already enrolled
- Course is active
- Student exists

#### `getEnrolledStudents(courseId)`
Get list of enrolled students for a course.

```typescript
const students = await courseService.getEnrolledStudents('course-123');
// Returns: [{ studentId, name, email, enrolledDate, status }, ...]
```

#### `getCourseStats(courseId)`
Get course statistics for dashboards.

```typescript
const stats = await courseService.getCourseStats('course-123');
// Returns: {
//   totalEnrolled: 28,
//   avgGrade: 3.45,
//   passingRate: 92,
//   dropRate: 4
// }
```

### Error Cases

| Error | Scenario | Resolution |
|-------|----------|-----------|
| `conflict` | Duplicate course code | Use unique code |
| `validation` | Capacity exceeded | Remove other enrollments |
| `not_found` | Course/student not found | Verify IDs |
| `validation` | Invalid dates | Ensure startDate < endDate |

---

## Assignment Service

### Purpose
Manages assignments, submissions, and grading workflows with overdue tracking.

### Key Types

```typescript
export interface Assignment extends RecordModel {
  courseId: string;
  title: string;
  description?: string;
  dueDate: string;
  pointsTotal: number;
  assignmentType: 'homework' | 'quiz' | 'project' | 'exam';
  rubricId?: string;
  status: 'draft' | 'published' | 'closed';
}

export interface AssignmentSubmission extends RecordModel {
  assignmentId: string;
  studentId: string;
  submissionDate: string;
  content: string;
  fileUrl?: string;
  status: 'submitted' | 'graded' | 'returned';
  score?: number;
  feedback?: string;
}
```

### Key Methods

#### `createAssignment(payload)`
Create assignment with date validation.

```typescript
const assignment = await assignmentService.createAssignment({
  courseId: 'course-123',
  title: 'Midterm Project',
  description: 'Build a calculator app',
  dueDate: '2024-03-15',
  pointsTotal: 100,
  assignmentType: 'project'
});
```

#### `submitAssignment(payload)`
Submit assignment with timestamp.

```typescript
const submission = await assignmentService.submitAssignment({
  assignmentId: 'assign-123',
  studentId: 'student-456',
  content: 'My submission text',
  fileUrl: 's3://bucket/file.pdf'
});
```

**Validation**:
- Student is enrolled in course
- Assignment is published
- Submission is before deadline or within grace period
- Required fields present

#### `gradeSubmission(submissionId, score, feedback)`
Grade a submission.

```typescript
await assignmentService.gradeSubmission('submission-123', 85, 'Great work!');
```

#### `getSubmissionStats(assignmentId)`
Get submission statistics.

```typescript
const stats = await assignmentService.getSubmissionStats('assign-123');
// Returns: {
//   total: 28,
//   submitted: 26,
//   pending: 2,
//   avgScore: 82.5,
//   onTime: 24,
//   late: 2
// }
```

### Error Cases

| Error | Scenario | Resolution |
|-------|----------|-----------|
| `validation` | Past due date | Set future date |
| `not_found` | Student not enrolled | Enroll student first |
| `conflict` | Already submitted | Delete previous submission |
| `validation` | Late submission | Check grace period |

---

## Grade Service

### Purpose
Manages grading with weighted components, GPA calculation, and transcripts.

### Key Types

```typescript
export interface Grade extends RecordModel {
  courseId: string;
  studentId: string;
  tenantId: string;
  componentGrades: {
    assignments?: number;
    participation?: number;
    midterm?: number;
    final?: number;
  };
  finalScore: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  gpa: number;
  status: 'in-progress' | 'final' | 'contested';
}

export interface GradeCreatePayload {
  courseId: string;
  studentId: string;
  tenantId: string;
  componentGrades: Record<string, number>;
}
```

### Key Methods

#### `recordGrade(payload)`
Record grade with automatic calculations.

```typescript
const grade = await gradeService.recordGrade({
  courseId: 'course-123',
  studentId: 'student-456',
  tenantId: 'tenant-789',
  componentGrades: {
    assignments: 85,
    participation: 90,
    midterm: 78,
    final: 82
  }
});
// Returns: {
//   finalScore: 81.2,
//   letterGrade: 'B',
//   gpa: 3.0
// }
```

**Calculations**:
- Weighted final score: assignments(30%) + participation(10%) + midterm(20%) + final(40%)
- Letter grade: A(90+), B(80-89), C(70-79), D(60-69), F(<60)
- GPA: A=4.0, B=3.0, C=2.0, D=1.0, F=0.0

#### `getClassStatistics(courseId)`
Get class statistics.

```typescript
const stats = await gradeService.getClassStatistics('course-123');
// Returns: {
//   avgScore: 78.5,
//   median: 80,
//   stdDev: 8.2,
//   distribution: { A: 5, B: 12, C: 8, D: 2, F: 1 }
// }
```

#### `getStudentTranscript(studentId, tenantId)`
Generate student transcript with GPA.

```typescript
const transcript = await gradeService.getStudentTranscript('student-456', 'tenant-789');
// Returns: [
//   { courseName: 'Math 101', credits: 3, grade: 'A', gpa: 4.0 },
//   { courseName: 'English 101', credits: 3, grade: 'B', gpa: 3.0 }
// ]
// Plus cumulative GPA: 3.5
```

#### `exportGradesByCourse(courseId)`
Export grades as CSV.

```typescript
const csv = await gradeService.exportGradesByCourse('course-123');
// Returns CSV with headers:
// Student ID, Name, Assignments, Participation, Midterm, Final, Final Score, Grade
```

### Error Cases

| Error | Scenario | Resolution |
|-------|----------|-----------|
| `validation` | Component score out of range | Ensure 0-100 |
| `not_found` | Course/student not found | Verify IDs |
| `conflict` | Grade already recorded | Update instead of create |

---

## Attendance Service

### Purpose
Manages attendance marking, reporting, and analytics with low-attendance alerts.

### Key Types

```typescript
export interface AttendanceRecord extends RecordModel {
  courseId: string;
  studentId: string;
  tenantId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  markedBy: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  totalDays: number;
}
```

### Key Methods

#### `recordAttendance(payload)`
Record attendance for student.

```typescript
const attendance = await attendanceService.recordAttendance({
  courseId: 'course-123',
  studentId: 'student-456',
  tenantId: 'tenant-789',
  date: '2024-01-15',
  status: 'present',
  markedBy: 'teacher-123'
});
```

#### `bulkRecordAttendance(payload)`
Record attendance for entire class.

```typescript
const result = await attendanceService.bulkRecordAttendance({
  courseId: 'course-123',
  tenantId: 'tenant-789',
  date: '2024-01-15',
  markedBy: 'teacher-123',
  records: [
    { studentId: 'student-1', status: 'present' },
    { studentId: 'student-2', status: 'absent', notes: 'Sick' }
  ]
});
```

#### `getStudentAttendanceSummary(courseId, studentId)`
Get attendance summary for student.

```typescript
const summary = await attendanceService.getStudentAttendanceSummary(
  'course-123',
  'student-456'
);
// Returns: {
//   totalSessions: 28,
//   presentCount: 26,
//   absentCount: 2,
//   attendancePercentage: 92.9
// }
```

#### `getCourseAttendanceReport(courseId, tenantId)`
Get course attendance report.

```typescript
const report = await attendanceService.getCourseAttendanceReport(
  'course-123',
  'tenant-789'
);
// Returns: [
//   { studentId, totalSessions, attended, absent, attendancePercentage }
// ]
```

#### `getLowAttendanceStudents(courseId, tenantId, threshold)`
Get students below attendance threshold.

```typescript
const atRisk = await attendanceService.getLowAttendanceStudents(
  'course-123',
  'tenant-789',
  80 // 80% threshold
);
```

### Error Cases

| Error | Scenario | Resolution |
|-------|----------|-----------|
| `conflict` | Duplicate record | Update existing |
| `validation` | Future date | Use past/current date |
| `not_found` | Student not enrolled | Enroll first |

---

## Notification Service

### Purpose
Manages user notifications with multi-channel delivery and real-time subscriptions.

### Key Types

```typescript
export type NotificationType =
  | 'assignment_due'
  | 'grade_posted'
  | 'message'
  | 'system'
  | 'announcement';

export interface Notification extends RecordModel {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  channels: Array<'in_app' | 'email' | 'sms' | 'push'>;
}

export interface NotificationCreatePayload {
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: Array<'in_app' | 'email' | 'sms' | 'push'>;
}
```

### Key Methods

#### `createNotification(payload)`
Create and deliver notification.

```typescript
const notification = await notificationService.createNotification({
  userId: 'user-123',
  tenantId: 'tenant-456',
  type: 'grade_posted',
  title: 'Grade Posted',
  message: 'Your Calculus exam has been graded',
  channels: ['in_app', 'email']
});
```

#### `sendBulkNotifications(payload)`
Send notifications to multiple users.

```typescript
const result = await notificationService.sendBulkNotifications({
  userIds: ['user-1', 'user-2', 'user-3'],
  tenantId: 'tenant-456',
  type: 'announcement',
  title: 'School Holiday',
  message: 'School is closed Monday'
});
```

#### `getNotifications(userId, tenantId, options)`
Get user notifications with filtering.

```typescript
const { notifications, unreadCount } = await notificationService.getNotifications(
  'user-123',
  'tenant-456',
  { unreadOnly: true, limit: 20 }
);
```

#### `markAsRead(notificationId)`
Mark notification as read.

```typescript
await notificationService.markAsRead('notif-123');
```

#### `subscribeToRealtime(userId, callback)`
Subscribe to real-time notifications.

```typescript
const unsubscribe = notificationService.subscribeToRealtime(
  'user-123',
  (notification) => {
    console.log('New notification:', notification);
  }
);

// Clean up when done
unsubscribe();
```

### Error Cases

| Error | Scenario | Resolution |
|-------|----------|-----------|
| `validation` | Invalid type | Use valid notification type |
| `not_found` | User doesn't exist | Verify user ID |
| `conflict` | Duplicate notification | Check delivery status |

---

## Error Handling

### ErrorFactory

All services use `ErrorFactory` to create typed errors:

```typescript
import { ErrorFactory } from '../utils/errorHandling';

// Validation errors
throw ErrorFactory.validation('Email must be valid');

// Not found errors
throw ErrorFactory.notFound('User not found');

// Conflict errors (duplicate)
throw ErrorFactory.conflict('Email already exists');

// Permission errors
throw ErrorFactory.permissionDenied('Insufficient permissions');

// Network errors
throw ErrorFactory.network('Failed to connect');

// Server errors
throw ErrorFactory.server('Internal server error');
```

### normalizeError

All caught errors are normalized:

```typescript
try {
  await someOperation();
} catch (error) {
  const normalized = normalizeError(error, 'operation_key', { context: 'data' });
  // Returns consistent error object with:
  // - code: error code
  // - message: human readable
  // - context: additional info
  logger.error('Operation failed', normalized);
}
```

### Error Recovery

Services include recovery strategies:

```typescript
import { ErrorRecovery } from '../utils/errorHandling';

// Retry with exponential backoff
const data = await ErrorRecovery.exponentialBackoff(
  () => fetchData(),
  { maxRetries: 3, initialDelayMs: 1000 }
);

// Timeout protection
const result = await ErrorRecovery.withTimeout(
  () => expensiveOperation(),
  5000 // 5 second timeout
);
```

---

## Validation

### Zod Schemas

All services use Zod for runtime validation:

```typescript
import { z } from 'zod';

const UserCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1).max(100),
  password: z
    .string()
    .min(8, 'Password must be 8+ characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&#]/, 'Must contain special character'),
  role: z.enum(['owner', 'student', 'teacher']),
  tenantId: z.optional(z.string()),
});

// Validate and get typed result
const result = UserCreateSchema.safeParse(payload);
if (!result.success) {
  const errors = result.error.flatten();
  // errors.fieldErrors = { email: ['Invalid email format'] }
}

// Or throw on validation error
const validated = UserCreateSchema.parse(payload);
```

### Custom Validators

Utilities provide additional validators:

```typescript
import {
  validateEmail,
  validatePassword,
  validateURL,
  validatePhoneNumber,
} from '../utils/validators';

const emailCheck = validateEmail('user@example.com');
if (!emailCheck.isValid) {
  console.error(emailCheck.error); // "Invalid email format"
}

const passwordCheck = validatePassword('MyPass123!');
if (!passwordCheck.isValid) {
  console.error(passwordCheck.error);
  // Returns specific requirement that failed
}
```

---

## Testing

### Mock Data Generation

```typescript
import { MockDataGenerator } from '../utils/testHelpers';

const mockUser = MockDataGenerator.generateUser({
  role: 'student',
  tenantId: 'test-tenant'
});

const mockCourse = MockDataGenerator.generateCourse({
  tenantId: 'test-tenant',
  capacity: 30
});
```

### Test Assertions

```typescript
import { TestAssert } from '../utils/testHelpers';

TestAssert.assertEqual(result.score, 85, 'Score should be 85');
TestAssert.assertTrue(result.isValid, 'Should be valid');
TestAssert.expectError(() => invalidOperation(), 'Should throw error');
```

### Performance Testing

```typescript
import { PerformanceTest } from '../utils/testHelpers';

const perf = new PerformanceTest('grade-calculation');
await perf.benchmark(
  () => gradeService.recordGrade(payload),
  100 // 100 iterations
);
console.log(perf.getReport());
// Outputs: min, max, avg, p95, p99 timings
```

---

## Usage Examples

### Complete Grade Assignment Workflow

```typescript
// 1. Create course
const course = await courseService.createCourse({
  code: 'MATH101',
  name: 'Calculus I',
  teacherId: 'teacher-123',
  tenantId: 'tenant-456',
  credits: 3,
  capacity: 30,
  startDate: '2024-01-15',
  endDate: '2024-05-15'
});

// 2. Enroll student
const enrollment = await courseService.enrollStudent(course.id, 'student-123');

// 3. Create assignment
const assignment = await assignmentService.createAssignment({
  courseId: course.id,
  title: 'Midterm Exam',
  dueDate: '2024-03-15',
  pointsTotal: 100
});

// 4. Student submits
const submission = await assignmentService.submitAssignment({
  assignmentId: assignment.id,
  studentId: 'student-123',
  content: 'My answers...',
  fileUrl: 's3://bucket/file.pdf'
});

// 5. Teacher grades
await assignmentService.gradeSubmission(submission.id, 85, 'Excellent work!');

// 6. Record final grades
const grade = await gradeService.recordGrade({
  courseId: course.id,
  studentId: 'student-123',
  tenantId: 'tenant-456',
  componentGrades: {
    assignments: 85,
    participation: 90,
    midterm: 78,
    final: 82
  }
});
// grade.finalScore = 81.2, letterGrade = 'B', gpa = 3.0

// 7. Get class stats
const stats = await gradeService.getClassStatistics(course.id);
// { avgScore: 78.5, median: 80, distribution: {...} }

// 8. Notify student
const notification = await notificationService.createNotification({
  userId: 'student-123',
  tenantId: 'tenant-456',
  type: 'grade_posted',
  title: 'Grades Posted',
  message: `Your grade in ${course.name} is ${grade.letterGrade}`,
  channels: ['in_app', 'email']
});
```

---

## Best Practices

### ✅ DO

- Always use Zod validation before service operations
- Handle all errors with try/catch and normalizeError()
- Log all operations with timing information
- Use type-safe error codes from ErrorFactory
- Validate business logic after schema validation
- Include tenant context in all queries
- Check permissions before operations
- Return meaningful error messages to clients

### ❌ DON'T

- Use `any` or `unknown` types
- Skip validation on inputs
- Ignore error cases
- Make unlogged database queries
- Forget to add tenant filters
- Hard-code values instead of using configuration
- Create mutable singleton state
- Mix business logic with API logic

---

## Performance Considerations

### Caching

Services support query caching via `DatabaseCache`:

```typescript
import { DatabaseCache } from '../utils/databaseUtilities';

const cache = DatabaseCache.getInstance();
cache.set('course-123-stats', statsData, 300); // 5 min TTL
const cached = cache.get('course-123-stats');
```

### Pagination

All list operations support pagination:

```typescript
const { notifications, totalItems } = await notificationService.getNotifications(
  'user-123',
  'tenant-456',
  { page: 2, limit: 50 } // Get items 51-100
);
```

### Bulk Operations

Use bulk methods for multiple records:

```typescript
// Instead of:
for (const record of records) {
  await service.create(record); // N queries
}

// Do:
await service.bulkOperation(records); // 1 query
```

---

## Future Enhancements

- [ ] GraphQL API layer for more efficient queries
- [ ] Service-level caching with Redis
- [ ] Batch export to analytics warehouse
- [ ] Real-time presence tracking
- [ ] Advanced permission matrix
- [ ] Rate limiting per service
- [ ] Service monitoring dashboard
- [ ] Automatic schema migrations
- [ ] Event streaming for webhooks
- [ ] Multi-region replication

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0-production  
**Status**: ✅ Production Ready
