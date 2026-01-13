# 🚀 QUICK REFERENCE CARD

## Services at a Glance

### GradeService
```typescript
import { gradeService } from '../services';

// Record grade with calculations
const grade = await gradeService.recordGrade({
  courseId, studentId, tenantId,
  componentGrades: { assignments, participation, midterm, final }
});
// → { finalScore, letterGrade, gpa }

// Get class statistics
const stats = await gradeService.getClassStatistics(courseId);
// → { avgScore, median, stdDev, distribution }

// Get student transcript
const transcript = await gradeService.getStudentTranscript(studentId, tenantId);
// → Array of courses with cumulative GPA

// Export grades
const csv = await gradeService.exportGradesByCourse(courseId);
```

### AttendanceService
```typescript
import { attendanceService } from '../services';

// Record single attendance
const record = await attendanceService.recordAttendance({
  courseId, studentId, tenantId, date, status, markedBy
});

// Bulk record for entire class
const result = await attendanceService.bulkRecordAttendance({
  courseId, tenantId, date, markedBy,
  records: [{ studentId, status, notes }]
});
// → { succeeded, failed, errors }

// Get student attendance
const summary = await attendanceService.getStudentAttendanceSummary(courseId, studentId);
// → { totalSessions, presentCount, attendancePercentage }

// Get course report
const report = await attendanceService.getCourseAttendanceReport(courseId, tenantId);
// → Array with attendance % per student

// Find at-risk students
const atRisk = await attendanceService.getLowAttendanceStudents(courseId, tenantId, 80);
// → Students below 80% threshold
```

### NotificationService
```typescript
import { notificationService } from '../services';

// Create notification
const notif = await notificationService.createNotification({
  userId, tenantId, type, title, message,
  priority, channels: ['in_app', 'email']
});

// Send to multiple users
const result = await notificationService.sendBulkNotifications({
  userIds, tenantId, type, title, message
});
// → { succeeded, failed, notificationIds }

// Get notifications
const { notifications, unreadCount } = await notificationService.getNotifications(
  userId, tenantId, { unreadOnly: true, limit: 50 }
);

// Real-time subscription
const unsubscribe = notificationService.subscribeToRealtime(
  userId,
  (notification) => { /* handle new notification */ }
);

// Mark as read
await notificationService.markAsRead(notificationId);
```

---

## Common Patterns

### Error Handling
```typescript
try {
  const result = await gradeService.recordGrade(payload);
} catch (error) {
  console.error(error.code, error.message);
  // error.code: 'validation', 'not_found', 'conflict', etc.
  // error.context: { field, value, reason }
}
```

### React Integration
```typescript
function GradeBook() {
  const [grades, setGrades] = useState([]);
  
  useEffect(() => {
    gradeService.getClassStatistics('course-123')
      .then(setGrades)
      .catch(error => console.error(error));
  }, []);
  
  return <div>{/* use grades */}</div>;
}
```

### Custom Hook
```typescript
function useGrades(courseId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    gradeService.getClassStatistics(courseId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [courseId]);
  
  return { stats, loading };
}
```

### Real-time Updates
```typescript
const unsubscribe = notificationService.subscribeToRealtime('user-123', (notif) => {
  setNotifications(prev => [notif, ...prev]);
});

// Cleanup
return () => unsubscribe();
```

---

## Type Definitions

### Grade
```typescript
{
  id: string;
  courseId: string;
  studentId: string;
  componentGrades: Record<string, number>;
  finalScore: number;          // Weighted calculation
  letterGrade: 'A'|'B'|'C'|'D'|'F';
  gpa: number;                 // 4.0 scale
  status: 'in-progress'|'final'|'contested';
  created: string;
  updated: string;
}
```

### AttendanceRecord
```typescript
{
  id: string;
  courseId: string;
  studentId: string;
  date: string;               // YYYY-MM-DD
  status: 'present'|'absent'|'late'|'excused';
  notes?: string;
  markedBy: string;
  markedAt: string;           // Timestamp
  created: string;
  updated: string;
}
```

### Notification
```typescript
{
  id: string;
  userId: string;
  type: 'assignment_due'|'grade_posted'|'message'|'system'|'announcement'|...;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  priority: 'low'|'medium'|'high'|'critical';
  channels: string[];         // 'in_app'|'email'|'sms'|'push'
  created: string;
  updated: string;
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `validation` | 400 | Input validation failed |
| `not_found` | 404 | Resource doesn't exist |
| `conflict` | 409 | Resource already exists |
| `permission_denied` | 403 | Insufficient permissions |
| `network` | 503 | Network error |
| `server` | 500 | Server error |

---

## Validation Rules

### Grade Components
- Score: 0-100 (number)
- All components optional

### Attendance
- Date: YYYY-MM-DD format
- Status: 'present'|'absent'|'late'|'excused'
- Notes: max 500 characters

### Notification
- Title: 1-200 characters
- Message: 1-2000 characters
- Priority: 'low'|'medium'|'high'|'critical'

---

## Performance Tips

### ✅ DO
- Use bulk operations for multiple records
- Cache results when appropriate
- Use pagination for large lists
- Unsubscribe from real-time when done

### ❌ DON'T
- Make separate calls for each record
- Forget error handling
- Leave subscriptions active
- Use implicit types

---

## Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| SERVICE_API_REFERENCE.md | Complete API | 500+ |
| SERVICES_GUIDE.md | Architecture | 400+ |
| REACT_INTEGRATION_GUIDE.md | Integration | 400+ |
| UTILITIES.md | Utilities | 600+ |
| IMPLEMENTATION_SUMMARY.md | Overview | 300+ |
| PRODUCTION_CHECKLIST.md | Readiness | 300+ |

---

## Quick Links

🔗 **SERVICE_API_REFERENCE.md** - See all methods and parameters  
🔗 **REACT_INTEGRATION_GUIDE.md** - See component examples  
🔗 **SERVICES_GUIDE.md** - Understand architecture  
🔗 **UTILITIES.md** - Utility modules guide  

---

## Examples

### Complete Workflow: Grade Assignment
```typescript
// 1. Record grades
const grade = await gradeService.recordGrade({
  courseId, studentId, tenantId,
  componentGrades: { assignments: 85, final: 82, ... }
});

// 2. Get stats
const stats = await gradeService.getClassStatistics(courseId);

// 3. Notify students
await notificationService.sendBulkNotifications({
  userIds: [...students],
  type: 'grade_posted',
  title: 'Grades Posted',
  channels: ['in_app', 'email']
});
```

### Real-time Attendance
```typescript
// 1. Mark attendance
const result = await attendanceService.bulkRecordAttendance({
  courseId, date, markedBy,
  records: [{ studentId, status }]
});

// 2. Get summary
const summary = await attendanceService.getCourseAttendanceReport(courseId, tenantId);

// 3. Identify at-risk
const atRisk = await attendanceService.getLowAttendanceStudents(courseId, tenantId, 80);
```

---

**Learn More**: See full documentation in docs/ folder  
**Questions?**: Check SERVICE_API_REFERENCE.md  
**Ready to Code**: Start with REACT_INTEGRATION_GUIDE.md
