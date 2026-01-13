# Service Integration Guide - React Components

Complete guide for integrating production services into React components.

---

## Service Layer Architecture

```
┌──────────────────────────────┐
│   React Components           │
│  (Display & Interaction)     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│   Custom React Hooks         │
│  (Data fetching & state)     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│   Production Services        │
│  (Business logic & API)      │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│   Utilities (logging, errors)│
│   PocketBase SDK             │
└──────────────────────────────┘
```

---

## Basic Integration Pattern

### 1. Import Service

```typescript
import { gradeService, courseService } from '../services';
```

### 2. Call Service in useEffect

```typescript
export function GradeBook() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchGrades() {
      try {
        setLoading(true);
        const stats = await gradeService.getClassStatistics('course-123');
        setGrades(stats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchGrades();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <h1>Grade Book</h1>
      <p>Class Average: {grades.avgScore}</p>
      {/* Rest of component */}
    </div>
  );
}
```

---

## Complete Component Examples

### Example 1: Grade Recording Component

```typescript
import { useState } from 'react';
import { gradeService } from '../services';
import { useToast } from '../hooks/useToast';

interface GradeFormData {
  courseId: string;
  studentId: string;
  tenantId: string;
  componentGrades: {
    assignments?: number;
    participation?: number;
    midterm?: number;
    final?: number;
  };
}

export function RecordGradeForm() {
  const [formData, setFormData] = useState<GradeFormData>({
    courseId: '',
    studentId: '',
    tenantId: '',
    componentGrades: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const grade = await gradeService.recordGrade(formData);
      
      addToast(
        `Grade recorded: ${grade.letterGrade} (GPA: ${grade.gpa})`,
        'success'
      );
      
      // Reset form
      setFormData({
        courseId: '',
        studentId: '',
        tenantId: '',
        componentGrades: {}
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record grade';
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('component_')) {
      const componentName = name.replace('component_', '');
      setFormData({
        ...formData,
        componentGrades: {
          ...formData.componentGrades,
          [componentName]: parseInt(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grade-form">
      <div className="form-group">
        <label htmlFor="courseId">Course</label>
        <input
          type="text"
          id="courseId"
          name="courseId"
          value={formData.courseId}
          onChange={handleInputChange}
          placeholder="Enter course ID"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="studentId">Student</label>
        <input
          type="text"
          id="studentId"
          name="studentId"
          value={formData.studentId}
          onChange={handleInputChange}
          placeholder="Enter student ID"
          required
        />
      </div>

      <div className="form-section">
        <h3>Component Grades</h3>
        
        <div className="form-group">
          <label htmlFor="assignments">Assignments (0-100)</label>
          <input
            type="number"
            id="assignments"
            name="component_assignments"
            min="0"
            max="100"
            onChange={handleInputChange}
            placeholder="85"
          />
          <span className="help-text">30% weight</span>
        </div>

        <div className="form-group">
          <label htmlFor="participation">Participation (0-100)</label>
          <input
            type="number"
            id="participation"
            name="component_participation"
            min="0"
            max="100"
            onChange={handleInputChange}
            placeholder="90"
          />
          <span className="help-text">10% weight</span>
        </div>

        <div className="form-group">
          <label htmlFor="midterm">Midterm (0-100)</label>
          <input
            type="number"
            id="midterm"
            name="component_midterm"
            min="0"
            max="100"
            onChange={handleInputChange}
            placeholder="78"
          />
          <span className="help-text">20% weight</span>
        </div>

        <div className="form-group">
          <label htmlFor="final">Final Exam (0-100)</label>
          <input
            type="number"
            id="final"
            name="component_final"
            min="0"
            max="100"
            onChange={handleInputChange}
            placeholder="82"
          />
          <span className="help-text">40% weight</span>
        </div>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Recording...' : 'Record Grade'}
      </button>
    </form>
  );
}
```

### Example 2: Attendance Sheet Component

```typescript
import { useEffect, useState } from 'react';
import { attendanceService } from '../services';
import { AttendanceRecord } from '../services/AttendanceService';

export function AttendanceSheet({ courseId, date }: { courseId: string; date: string }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadAttendance() {
      try {
        const records = await attendanceService.getClassAttendance(courseId, date, 'tenant-123');
        setAttendance(records);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [courseId, date]);

  const handleStatusChange = (recordId: string, newStatus: string) => {
    setChanges({
      ...changes,
      [recordId]: newStatus
    });
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.entries(changes).map(([recordId, status]) =>
        attendanceService.updateAttendance(
          recordId,
          status as any,
          undefined
        )
      );

      await Promise.all(updates);
      setChanges({});

      // Reload
      const records = await attendanceService.getClassAttendance(
        courseId,
        date,
        'tenant-123'
      );
      setAttendance(records);
    } catch (error) {
      console.error('Failed to save attendance:', error);
    }
  };

  if (loading) return <div>Loading attendance...</div>;

  const statusOptions = ['present', 'absent', 'late', 'excused'];
  const statusColors = {
    present: 'green',
    absent: 'red',
    late: 'orange',
    excused: 'blue'
  };

  return (
    <div className="attendance-sheet">
      <h2>Attendance for {date}</h2>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((record) => (
            <tr key={record.id}>
              <td>{record.studentId}</td>
              <td>
                <select
                  value={changes[record.id] || record.status}
                  onChange={(e) => handleStatusChange(record.id, e.target.value)}
                  style={{
                    borderColor:
                      statusColors[
                        (changes[record.id] || record.status) as keyof typeof statusColors
                      ]
                  }}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td>{record.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSaveAll} disabled={Object.keys(changes).length === 0}>
        Save Changes ({Object.keys(changes).length})
      </button>
    </div>
  );
}
```

### Example 3: Notification Center Component

```typescript
import { useEffect, useState } from 'react';
import { notificationService } from '../services';
import { Notification } from '../services/NotificationService';

export function NotificationCenter({ userId, tenantId }: { userId: string; tenantId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Initial load
    loadNotifications();

    // Real-time subscription
    const unsubscribe = notificationService.subscribeToRealtime(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, [userId]);

  const loadNotifications = async () => {
    const { notifications, unreadCount } = await notificationService.getNotifications(
      userId,
      tenantId,
      { unreadOnly: filter === 'unread', limit: 50 }
    );
    setNotifications(notifications);
    setUnreadCount(unreadCount);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleClearAll = async () => {
    await notificationService.clearAllNotifications(userId, tenantId);
    setNotifications([]);
    setUnreadCount(0);
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </div>

      <div className="notification-filters">
        <button
          onClick={() => {
            setFilter('all');
            loadNotifications();
          }}
          className={filter === 'all' ? 'active' : ''}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter('unread');
            loadNotifications();
          }}
          className={filter === 'unread' ? 'active' : ''}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">No notifications</div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span className="notification-type">{notification.type}</span>
                <span className="notification-time">
                  {new Date(notification.created).toLocaleString()}
                </span>
              </div>

              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="btn-small"
                  >
                    Mark as Read
                  </button>
                )}
                {notification.actionUrl && (
                  <a href={notification.actionUrl} className="btn-small btn-primary">
                    View
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <button onClick={handleClearAll} className="btn-clear-all">
          Clear All
        </button>
      )}
    </div>
  );
}
```

---

## Custom Hook Examples

### useGrades Hook

```typescript
import { useEffect, useState } from 'react';
import { gradeService } from '../services';
import { Grade, GradeStats } from '../services/GradeService';

export function useGrades(courseId: string) {
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const data = await gradeService.getClassStatistics(courseId);
        if (mounted) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const recordGrade = async (payload: Parameters<typeof gradeService.recordGrade>[0]) => {
    try {
      const grade = await gradeService.recordGrade(payload);
      // Refresh stats
      const updated = await gradeService.getClassStatistics(courseId);
      setStats(updated);
      return grade;
    } catch (err) {
      throw err;
    }
  };

  return { stats, loading, error, recordGrade };
}

// Usage in component
export function GradeAnalytics({ courseId }: { courseId: string }) {
  const { stats, loading, error } = useGrades(courseId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!stats) return <div>No data</div>;

  return (
    <div>
      <h2>Grade Analytics</h2>
      <p>Average: {stats.avgScore.toFixed(2)}</p>
      <p>Median: {stats.median}</p>
      <p>Passing Rate: {stats.passingRate}%</p>
      <pre>{JSON.stringify(stats.distribution, null, 2)}</pre>
    </div>
  );
}
```

### useAttendance Hook

```typescript
import { useEffect, useState } from 'react';
import { attendanceService } from '../services';
import { AttendanceStats } from '../services/AttendanceService';

export function useAttendance(courseId: string, studentId: string) {
  const [summary, setSummary] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const data = await attendanceService.getStudentAttendanceSummary(courseId, studentId);
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [courseId, studentId]);

  const markAttendance = async (date: string, status: string) => {
    await attendanceService.recordAttendance({
      courseId,
      studentId,
      tenantId: 'tenant-123',
      date,
      status: status as any,
      markedBy: 'teacher-123'
    });

    // Refresh
    const updated = await attendanceService.getStudentAttendanceSummary(courseId, studentId);
    setSummary(updated);
  };

  return { summary, loading, markAttendance };
}
```

### useNotifications Hook

```typescript
import { useEffect, useState } from 'react';
import { notificationService } from '../services';
import { Notification } from '../services/NotificationService';

export function useNotifications(userId: string, tenantId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial notifications
    notificationService
      .getNotifications(userId, tenantId, { limit: 20 })
      .then(({ notifications, unreadCount }) => {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      });

    // Subscribe to real-time
    const unsubscribe = notificationService.subscribeToRealtime(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, [userId, tenantId]);

  const markAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return {
    notifications,
    unreadCount,
    markAsRead
  };
}
```

---

## Error Handling in Components

### Pattern 1: Try/Catch

```typescript
const handleSubmit = async () => {
  try {
    const result = await gradeService.recordGrade(payload);
    console.log('Success:', result);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      showErrorMessage(error.message);
    }
  }
};
```

### Pattern 2: Error Boundary

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <GradeBook />
    </ErrorBoundary>
  );
}
```

### Pattern 3: Error State

```typescript
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  gradeService.getClassStatistics(courseId).catch(setError);
}, [courseId]);

if (error) {
  return <ErrorDisplay error={error} onRetry={() => setError(null)} />;
}
```

---

## Performance Optimization

### Memoization

```typescript
const MemoizedGradeBook = React.memo(function GradeBook({ courseId }: Props) {
  const { stats } = useGrades(courseId);
  return <>{/* component */}</>;
});
```

### Lazy Loading

```typescript
const GradeBook = React.lazy(() => import('./GradeBook'));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GradeBook />
    </Suspense>
  );
}
```

### Pagination

```typescript
const [page, setPage] = useState(1);

const { notifications } = await notificationService.getNotifications(userId, tenantId, {
  page,
  limit: 50
});

// Load more
const handleLoadMore = () => setPage((p) => p + 1);
```

---

## Complete Working Example

```typescript
import { useEffect, useState } from 'react';
import { gradeService, notificationService } from '../services';
import { Grade } from '../services/GradeService';

export function CompleteGradingWorkflow({ courseId, tenantId }: Props) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // Load grades
  useEffect(() => {
    async function loadGrades() {
      try {
        const stats = await gradeService.getClassStatistics(courseId);
        setGrades(stats);
      } catch (error) {
        console.error('Failed to load grades:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, [courseId]);

  // Handle grade update
  const handleUpdateGrade = async (gradeId: string, newScore: number) => {
    try {
      const updated = await gradeService.updateGrade(gradeId, {
        componentGrades: { final: newScore }
      });

      // Update local state
      setGrades((prev) =>
        prev.map((g) => (g.id === gradeId ? updated : g))
      );

      // Notify student
      await notificationService.createNotification({
        userId: updated.studentId,
        tenantId,
        type: 'grade_posted',
        title: 'Grade Updated',
        message: `Your grade in ${courseId} has been updated to ${updated.letterGrade}`,
        channels: ['in_app', 'email']
      });

      console.log('Grade updated and notification sent');
    } catch (error) {
      console.error('Failed to update grade:', error);
    }
  };

  if (loading) return <div>Loading grades...</div>;

  return (
    <div className="grading-workflow">
      <h1>Grade Management</h1>

      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Final Score</th>
            <th>Grade</th>
            <th>GPA</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.id}>
              <td>{grade.studentId}</td>
              <td>{grade.finalScore.toFixed(1)}</td>
              <td>{grade.letterGrade}</td>
              <td>{grade.gpa.toFixed(2)}</td>
              <td>
                <button
                  onClick={() => setSelectedGrade(grade)}
                  className="btn-edit"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedGrade && (
        <EditGradeModal
          grade={selectedGrade}
          onSave={(score) => handleUpdateGrade(selectedGrade.id, score)}
          onClose={() => setSelectedGrade(null)}
        />
      )}
    </div>
  );
}
```

---

## Summary

Services provide:
✅ Real business logic  
✅ Type-safe operations  
✅ Error handling  
✅ Performance tracking  
✅ Easy integration with React  

Use in components via:
1. Direct service calls in useEffect
2. Custom hooks for reusability
3. Error boundaries for error handling
4. Real-time subscriptions for live updates

**See SERVICES_GUIDE.md for complete API reference.**
