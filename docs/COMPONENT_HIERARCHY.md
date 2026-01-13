# Component Hierarchy Documentation

## Overview

This documentation describes the complete component hierarchy system with actual business logic for a teacher-facing platform. The system implements three major feature areas:

1. **Grade Management** - Record, view, and analyze student grades
2. **Attendance Tracking** - Track attendance and identify at-risk students
3. **Notification Management** - Real-time notifications with preferences

## Architecture Principles

### Smart Container + Presentational Pattern

Each feature system uses a clear separation of concerns:

```
Smart Container (State + Logic)
        ↓
    [Hooks]
        ↓
    [Services]
        ↓
   [API/DB]
        
    [Props]
        ↓
Presentational Components (UI Only)
```

**Smart Containers**:
- Manage state via `useState`
- Handle side effects via `useEffect`
- Consume custom hooks for data/logic
- Implement error handling
- Coordinate between presentational components
- Log operations for debugging

**Presentational Components**:
- Pure functions receiving props
- No side effects
- No direct service calls
- Render UI only
- Pass events to parent via callbacks

### TypeScript First

All components are 100% typed:

```typescript
interface GradeManagerProps {
  courseId: string;
  tenantId: string;
  userId: string;
  onGradeRecorded?: (data: Grade) => void;
  onError?: (error: string) => void;
}
```

## Grade Management System

### Component Hierarchy

```
GradeManager (Container)
├── useGrades() hook
├── Tab: "Record"
│   └── GradeForm (Presentational)
├── Tab: "View"
│   └── GradeTable (Presentational)
└── Tab: "Statistics"
    └── GradeStats (Presentational)
```

### GradeManager

**Purpose**: Orchestrate entire grade lifecycle

**Props**:
```typescript
interface GradeManagerProps {
  courseId: string;           // Course identifier
  tenantId: string;           // Tenant context
  userId: string;             // Current user (teacher)
  onGradeRecorded?: (data: Grade) => void;
  onError?: (error: string) => void;
}
```

**State**:
- `activeTab`: 'record' | 'view' | 'stats'
- `selectedStudent`: string | null
- `isExporting`: boolean

**Key Methods**:
- `handleRecordGrade()`: Submit grade via useGrades hook
- `handleExport()`: Export grades to CSV
- `handleRefresh()`: Refetch data from service
- `handleSelectStudent()`: Switch to stats tab for specific student

**Business Logic**:
- Tab navigation state management
- Grade export with proper formatting
- Data refresh and invalidation
- Error propagation to parent

### GradeForm

**Purpose**: Grade input with live preview and validation

**Props**:
```typescript
interface GradeFormProps {
  courseId: string;
  onSubmit: (data: GradeSubmissionData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}
```

**Fields**:
- `studentId` (required, text)
- `assignmentScore` (0-100)
- `participationScore` (0-100)
- `midtermScore` (0-100)
- `finalScore` (0-100)
- `notes` (optional, max 500 chars)

**Calculations** (Live Preview):
- **Final Score**: Weighted calculation
  ```
  finalScore = (assignment × 0.3) + (participation × 0.1) 
             + (midterm × 0.2) + (final × 0.4)
  ```
- **Letter Grade**: A (90+), B (80+), C (70+), D (60+), F (<60)
- **GPA**: (score / 25) for 4.0 scale

**Validation**:
- Per-field validation with error messages
- Score range validation (0-100)
- Student ID required
- Live validation as user types

**Display**:
- Live preview card showing calculated results
- Real-time updates as values change
- Error messages below each field

### GradeTable

**Purpose**: Display recorded grades in sortable table

**Props**:
```typescript
interface GradeTableProps {
  grades: Grade[];
  onSelectStudent?: (studentId: string) => void;
  isLoading?: boolean;
}
```

**Columns**:
- Student ID
- Final Score (numeric)
- Letter Grade (A-F)
- GPA (0.0-4.0)
- Date (formatted)
- Actions (select button)

**Features**:
- Sort by date (descending - newest first)
- Color-coded scores:
  - Green: ≥90
  - Blue: ≥80, <90
  - Amber: ≥70, <80
  - Red: <70
- Click to select student and view stats

**Display**:
- Responsive table
- Status badges for score ranges
- Formatted dates (MM/DD/YYYY)

### GradeStats

**Purpose**: Display class statistics and grade distribution

**Props**:
```typescript
interface GradeStatsProps {
  grades: Grade[];
  stats: GradeStatistics | null;
  isLoading?: boolean;
  selectedStudentId?: string | null;
}
```

**Statistics Displayed**:
- Average Score
- Median Score
- Standard Deviation
- Total Students

**Visualization**:
- **Stat Cards**: 4 cards with values and trends
- **Performance Insight**: Feedback based on class average
- **Grade Distribution Chart**: Bar chart showing student count per grade
  - Color mapping: A=green, B=blue, C=amber, D=red, F=purple
- **Distribution Table**: Percentages with visual bars

**Business Logic**:
- Calculate statistics from grade array
- Grade distribution bucketing
- Color coding for performance visualization
- Percentage calculations with visual representation

## Attendance Tracking System

### Component Hierarchy

```
AttendanceTracker (Container)
├── useAttendance() hook
├── Tab: "Record"
│   ├── AttendanceForm (single)
│   └── AttendanceForm (bulk)
├── Tab: "Report"
│   └── AttendanceSheet (Presentational)
└── Tab: "Alerts"
    └── LowAttendanceAlert (Presentational)
```

### AttendanceTracker

**Purpose**: Manage attendance recording and reporting

**Props**:
```typescript
interface AttendanceTrackerProps {
  courseId: string;
  tenantId: string;
  userId: string;
  onAttendanceRecorded?: (data: AttendanceRecord) => void;
  onError?: (error: string) => void;
}
```

**State**:
- `activeTab`: 'record' | 'report' | 'alerts'
- `viewType`: 'single' | 'bulk'
- `isExporting`: boolean

**Key Methods**:
- `handleRecordAttendance()`: Single student recording
- `handleBulkAttendance()`: Batch class recording
- `handleLoadReport()`: Generate course report
- `handleLoadLowAttendance()`: Find at-risk students
- `handleExport()`: Export report as CSV

**Business Logic**:
- Dual-mode attendance input
- Report generation from attendance data
- Low attendance detection and alerting
- Data export with formatting

### AttendanceForm

**Purpose**: Attendance input with single and bulk modes

**Props**:
```typescript
interface AttendanceFormProps {
  courseId: string;
  mode: 'single' | 'bulk';
  onSubmit: (data: AttendanceData) => Promise<void>;
  isSubmitting?: boolean;
}
```

**Single Mode**:
- Fields:
  - `studentId` (required)
  - `date` (YYYY-MM-DD format)
  - `status` (present | absent | late | excused)
  - `notes` (optional)

**Bulk Mode**:
- Date picker (single date for entire class)
- Dynamic student rows:
  - Add row button
  - Remove row buttons
  - Each row: studentId + status
- Submit button processes all rows

**Validation**:
- Required fields validation
- Date format validation (YYYY-MM-DD)
- Status must be one of 4 options
- Student ID format validation

**Display**:
- Mode toggle between single/bulk
- For single: 4-field form
- For bulk: date picker + dynamic row list
- Add/remove row buttons
- Submit button with loading state

### AttendanceSheet

**Purpose**: Display attendance report with statistics

**Props**:
```typescript
interface AttendanceSheetProps {
  courseData: CourseAttendanceData | null;
  isLoading?: boolean;
}
```

**Summary Statistics** (4 cards):
- Total Sessions
- Total Present
- Total Absent
- Average Attendance %

**Attendance Table**:
- Columns: Student ID, Name, Present Count, Total Sessions, Percentage
- Sorting: By percentage descending
- Color-coded by percentage:
  - Green: ≥90%
  - Blue: ≥80%
  - Yellow: ≥70%
  - Red: <70%

**Grade Distribution** (4 ranges):
- 90-100% (Excellent)
- 80-90% (Good)
- 70-80% (Fair)
- <70% (Poor)
- Shows student count in each range

**Display**:
- Responsive layout
- Visual progress bars for percentages
- Color-coded badges
- Summary statistics with gradients

### LowAttendanceAlert

**Purpose**: Alert on students with low attendance

**Props**:
```typescript
interface LowAttendanceAlertProps {
  students: LowAttendanceStudent[];
  threshold?: number; // Default: 70%
  onExport?: () => void;
}
```

**Severity Levels**:
- **Critical** (<50%): Red background, urgent action required
- **Warning** (50-70%): Amber background, intervention needed
- **Caution** (70%+): Blue background, monitor

**Display**:
- Alert banner showing total count
- Grouped sections by severity level
- Each student: ID, Name, Current %, Severity label
- Recommended interventions (4 actions per severity):

**Critical Interventions**:
- Contact parents immediately
- Schedule meeting with student
- Create attendance improvement plan
- Refer to school counselor

**Warning Interventions**:
- Send attendance reminder email
- Schedule follow-up meeting
- Review academic performance
- Discuss barriers to attendance

**Export**:
- Button to export alert list as CSV
- Includes severity levels and dates

## Notification Management System

### Component Hierarchy

```
NotificationCenter (Container)
├── useNotifications() hook
├── Real-time subscriptions
├── Tab: "All"
│   └── NotificationList (Presentational)
├── Tab: "Unread"
│   └── NotificationList (Presentational - filtered)
└── Tab: "Preferences"
    └── NotificationPreferencesPanel (Presentational)
```

### NotificationCenter

**Purpose**: Manage notifications with real-time updates

**Props**:
```typescript
interface NotificationCenterProps {
  userId: string;
  tenantId: string;
}
```

**State**:
- `activeTab`: 'all' | 'unread' | 'preferences'
- `filterType`: 'all' | 'unread' | other types

**Key Methods**:
- `handleNotificationClick()`: Mark as read
- `handleMarkAllAsRead()`: Batch mark all as read
- `handleUpdatePreferences()`: Save preference changes

**Features**:
- Auto-subscribe to real-time updates (autoSubscribe=true)
- Type-based filtering with dynamic counts
- Unread badge display
- Real-time notification delivery
- Auto-cleanup on unmount

**Real-time Integration**:
- PocketBase subscription enabled automatically
- Auto-refresh on new notifications
- Handles disconnection gracefully
- Updates unread count in real-time

### NotificationList

**Purpose**: Display notifications with type indicators

**Props**:
```typescript
interface NotificationListProps {
  notifications: Notification[];
  filterType?: string;
  onNotificationClick?: (id: string) => void;
  isLoading?: boolean;
}
```

**Columns**:
- Unread indicator (blue dot for unread)
- Icon (type-specific emoji)
- Title and message
- Type badge (color-coded)
- Timestamp (relative format)
- Status indicator

**Notification Types** (10 types):
1. `assignment_due` - Yellow badge
2. `grade_posted` - Blue badge
3. `message` - Purple badge
4. `system` - Gray badge
5. `announcement` - Orange badge
6. `reminder` - Green badge
7. `course_update` - Cyan badge
8. `payment` - Red badge
9. `attendance` - Indigo badge
10. `achievement` - Pink badge

**Time Formatting**:
- Just now (< 1 minute)
- Xm ago (< 60 minutes)
- Xh ago (< 24 hours)
- Xd ago (< 7 days)
- Date (older notifications)

**Sorting**:
- Most recent first
- Unread notifications above read

**Display**:
- List view
- Visual distinction between read/unread
- Color-coded type badges
- Relative time display
- Click to select/mark as read

### NotificationPreferencesPanel

**Purpose**: Manage notification preferences

**Props**:
```typescript
interface NotificationPreferencesPanelProps {
  preferences: Preferences | null;
  onUpdate: (prefs: Preferences) => Promise<void>;
}
```

**Channel Preferences**:
- Email notifications (toggle)
- SMS/Text messages (toggle)
- Push notifications (toggle)
- In-app notifications (toggle)

**Quiet Hours**:
- Enable/disable toggle
- Start time picker (24-hour format)
- End time picker (24-hour format)
- Notifications suppressed during quiet hours

**Mute Keywords**:
- Comma-separated list
- Notifications containing keywords are silenced
- Example: "spam, promotional, offer"
- Trimmed and filtered on save

**Features**:
- All changes in real-time preview
- Save button with loading state
- Error handling with user feedback
- Type-safe preference structure

## Integration Example: TeacherDashboardExample

Demonstrates all three feature systems working together:

```typescript
<TeacherDashboardExample
  userId="teacher1"
  tenantId="school1"
  courseId="math101"
/>
```

**Features**:
- Tabbed interface for switching between systems
- Grade recording with auto-notifications
- Attendance tracking with alerting
- Real-time notification center
- Feedback banners for user actions
- Error handling across all systems
- Integration notes section

**Data Flow**:
1. User records grade in GradeManager
2. Grade submitted via useGrades hook
3. Service validates and stores grade
4. Success callback triggers notification
5. NotificationCenter auto-updates with student notification
6. User sees success banner and is navigated to notifications tab

## Usage Examples

### Using Grade Management

```typescript
import { GradeManager } from '@/components/features';

<GradeManager
  courseId="math101"
  tenantId="school1"
  userId="teacher1"
  onGradeRecorded={(data) => {
    console.log('Grade recorded:', data);
  }}
  onError={(error) => {
    console.error('Grade recording failed:', error);
  }}
/>
```

### Using Attendance Tracking

```typescript
import { AttendanceTracker } from '@/components/features';

<AttendanceTracker
  courseId="math101"
  tenantId="school1"
  userId="teacher1"
  onAttendanceRecorded={(data) => {
    console.log('Attendance recorded:', data);
  }}
  onError={(error) => {
    console.error('Attendance recording failed:', error);
  }}
/>
```

### Using Notification Center

```typescript
import { NotificationCenter } from '@/components/features';

<NotificationCenter
  userId="student1"
  tenantId="school1"
/>
```

## State Management Pattern

All components follow a consistent pattern:

```typescript
// Container component
const [state, setState] = useState(...);
const { data, methods } = useCustomHook(...);

// Async operations with loading
const handleAction = useCallback(async (params) => {
  setIsLoading(true);
  try {
    const result = await methods.operation(params);
    onSuccess?.(result);
  } catch (error) {
    onError?.(normalizeError(error).message);
  } finally {
    setIsLoading(false);
  }
}, [methods, onSuccess, onError]);
```

## Error Handling

All components implement comprehensive error handling:

1. **Input Validation**: Form-level validation with error messages
2. **Async Error Handling**: Try-catch in async operations
3. **Error Display**: User-friendly error messages via callbacks
4. **Logging**: All errors logged via Logger utility
5. **Recovery**: Loading states prevent repeated operations

## Performance Optimizations

- `useCallback` for event handlers to prevent re-renders
- `useMemo` for expensive calculations
- Logger instance cached in `useRef`
- Subscription cleanup on component unmount
- Proper dependency arrays in `useEffect`

## Testing Patterns

Each component is testable via:

1. **Props-based testing**: Pass mock data via props
2. **Callback testing**: Verify callbacks are called with correct data
3. **User interaction**: Simulate clicks, form submissions, etc.
4. **Error scenarios**: Test error callbacks and error states
5. **Loading states**: Verify loading UI is displayed

Example test:

```typescript
test('GradeManager calls onGradeRecorded on successful submission', async () => {
  const onGradeRecorded = jest.fn();
  const { getByRole } = render(
    <GradeManager
      courseId="test"
      tenantId="test"
      userId="test"
      onGradeRecorded={onGradeRecorded}
    />
  );
  
  // Fill form and submit...
  // Verify callback was called
  expect(onGradeRecorded).toHaveBeenCalledWith(expect.objectContaining({
    finalScore: expect.any(Number),
  }));
});
```

## Future Enhancements

1. **Animations**: Add transitions for tab switches and list updates
2. **Export Formats**: Support PDF, Excel exports
3. **Batch Operations**: Bulk edit grades, attendance
4. **Scheduling**: Schedule notifications for specific times
5. **Analytics**: Charts and graphs for trends
6. **Mobile**: Responsive design for mobile devices
7. **Accessibility**: ARIA labels and keyboard navigation
8. **Dark Mode**: Support for dark theme
