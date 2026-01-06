
# Grow Your Need - Parent Dashboard Wireframe & UI/UX Specification

This document provides a comprehensive wireframe and specification for the "Parent" role view within the Dynamic SaaS Dashboard. It details the specific navigation, components, and features available to a parent monitoring their child's or children's progress within a school tenant.

---

## 1. Parent Dashboard Overview

**Role:** Parent (e.g., Sarah Miller)

**Primary Objective:** To provide parents with a clear, accessible, and informative portal to stay engaged with their child's academic life. The dashboard focuses on monitoring academic performance, tracking attendance, staying informed about school events, managing tuition payments, and facilitating communication with the school.

**General Layout:** The Parent's view uses the main application shell, consisting of a fixed Header, a flexible main content area with a Right Sidebar and an optional Left Sub-navigation, and a fixed Footer with the App Launcher. The components are designed to present key information about their student(s) at a glance.

---

## 2. Style & Appearance

The Parent dashboard adheres to the core UI philosophy and style guide outlined in the main `grow-your-need-wire-frame.md` document, ensuring a consistent and high-quality user experience across all roles.

-   **Color Palette:** Utilizes the primary (light/dark theme) color palette. Active states are highlighted with `--accent-primary` (Right Sidebar) and `--accent-secondary` (Left Sub-navigation).
-   **Typography:** Employs the `Inter` font family for all text.
-   **Layout & Spacing:** All components use the standard `1rem` border-radius and `shadow-custom`.

---

## 3. Component Wireframe: Parent's View

### 3.1. Right Sidebar (Main Navigation)

This is the primary navigation hub for the Parent. The sections are focused on accessing information about their child and the school.

| Icon                            | Label         | ID              | Description                                                                                             |
| ------------------------------- | ------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `home-icon`                     | Dashboard     | `dashboard`     | Displays a summary of the selected child's academic performance, attendance, and upcoming assignments.      |
| `graduation-cap-icon`           | School        | `school`        | Provides detailed views of the student's grades, schedules, and school life information like calendars.   |
| `chat-bubble-left-right-icon`   | Communication | `communication` | Manages messages with teachers and staff, and views school-wide announcements.                             |
| `credit-card-icon`              | Finances      | `finances`      | Accesses tuition bills, payment history, and allows for online payments.                                |
| `heart-icon`                    | Wellness      | `wellness`      | Provides access to wellness resources and monitoring tools for their child.                               |
| `wrench-screwdriver-icon`       | Tools         | `tools`         | Accesses platform-provided productivity tools that the student can use.                                   |
| `sparkles-icon`                 | Concierge AI  | `concierge_ai`  | Utilizes the AI assistant for school-related questions and support.                                       |
| `cog-6-tooth-icon`              | Setting       | `setting`       | Manages the parent's personal profile and notification preferences.                                       |

**Visual States:**
-   **Default:** Gray icon and text (`--secondary`).
-   **Hover:** Background color changes (`--accent-primary/10`).
-   **Active:** Background is `bg-accent-primary/20`, text/icon is `text-accent-primary`, and a vertical `bg-accent-primary` bar appears on the left edge.

### 3.2. Header Navigation (Contextual)

The header's central navigation bar adapts based on the selected Right Sidebar section.

| Right Sidebar Section | Header Buttons Displayed                                         |
| --------------------- | ---------------------------------------------------------------- |
| **Dashboard**         | Overview                                                         |
| **School**            | Academics, Attendance, School Life                               |
| **Communication**     | Email, Community, Social Media, Templates                                                                                  |
| **Finances**          | Billing                                                          |
| **Wellness**          | Overview                                                         |
| **Tools**             | Overview                                                         |
| **Concierge AI**      | Assistant                                                        |
| **Setting**           | Account                                                          |

### 3.3. Left Sub-navigation (Contextual)

This sidebar appears only when the selected Header item has further sub-categories.

| Right Sidebar -> Header | Left Sub-nav Buttons Displayed                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **School** -> Academics | Grades, Assignments, Schedule, Portfolio                                                     |
| **School** -> School Life | Calendar, Lunch Menu, Clubs, Directory                                                       |
| **Communication** -> Email  | Compose, Inbox, Sent                                                                       |
| **Communication** -> Community| General, Announcements                                                                 |
| **Concierge AI** -> Assistant| Chat, History                                                                          |
| **Setting** -> Account  | Profile, Notifications, Billing                                                              |

### 3.4. Main Content Views

#### 3.4.1. Dashboard (`dashboard/overview`)
The default view is designed as a comprehensive summary of the student's current status. It features:
-   **Student Selector:** A prominent dropdown at the top of the page that allows parents with multiple children enrolled to switch between them.
-   **KPI Cards:** A row of cards providing at-a-glance information:
    -   **Academic Snapshot:** Shows the student's current overall grade average (e.g., "88% (A-)").
    -   **Attendance Summary:** Displays the monthly attendance record (e.g., "1 Absence, 0 Tardy").
    -   **Assignments:** Highlights urgent items, specifically the number of overdue assignments and how many are due in the coming week.
-   **Quick Actions Card:** Provides direct navigation buttons to common tasks like "Pay Tuition Bill," "Report an Absence," and "Message Teachers."
-   **Upcoming Events Card:** A feed showing the titles and dates of the next 2-3 school-wide or class-specific events (e.g., "Parent-Teacher Conferences - Oct 15," "School Play - Oct 22").
-   **Recent Messages Card:** A snippet of the most recent unread message from a teacher, with a button to navigate directly to the inbox.
-   **Recent Grades Card:** A list of the most recently graded assignments, showing the assignment title and the score received.

#### 3.4.2. Academics (`school/academics/*`)
-   **Grades View:** Displays a card for each of the student's enrolled courses. Each card shows the course name, teacher's name, current overall grade, and a list of the 3-5 most recent assignments with their scores. Clicking a course card expands to show all assignments and a grade trend chart for that course.
-   **Assignments View:** Features a dual view:
    -   **Calendar View:** A monthly calendar that visually plots assignment due dates. Clicking a date shows a pop-up with details for that day's assignments.
    -   **List View:** A chronological list of upcoming and past assignments, showing the title, course, due date, and status (e.g., Graded, Submitted, Missing, Upcoming).
-   **Schedule View:** A visual weekly grid layout displaying the student's class schedule, including class times, room numbers, and teacher names.
-   **Portfolio View:** A read-only gallery showcasing the student's best work. This includes high-scoring essays, creative projects, or presentations that have been flagged by teachers for inclusion in the portfolio.

#### 3.4.3. School Life (`school/school_life/*`)
-   **Calendar View:** A full-screen, interactive school calendar. Parents can filter events by category (e.g., Holidays, School Closures, Exams, Sports, Performances).
-   **Lunch Menu View:** A weekly or monthly view of the school's lunch menu. Clicking on a menu item can reveal nutritional information and allergen warnings. This section may also integrate with a payment system to allow parents to add funds to their child's lunch account.
-   **Clubs View:** A directory of all available extracurricular clubs and activities. Each listing includes a description, the faculty advisor's name, meeting times/locations, and a "Request to Join" button for interested students.
-   **Directory View:** A searchable directory of school staff. Parents can quickly find contact information (email, office extension) for their child's teachers, counselors, the school nurse, and key administrators.

#### 3.4.4. Finances (`finances/billing`)
-   A summary card at the top shows the "Current Balance Due" and "Next Payment Date."
-   A primary "Make Payment" button initiates the payment workflow, which supports both credit card and ACH bank transfers.
-   **Payment History Table:** A detailed log of all past transactions, including date, amount, payment method, and status, with an option to download a PDF receipt for each.
-   **Optional Fees:** A section where parents can view and pay for optional items like field trip fees, yearbook purchases, or athletic fees.

#### 3.4.5. Wellness (`wellness/overview`)
-   **Mood Trends:** Displays a simple chart showing the student's self-reported mood trends over the past week or month (e.g., "Jane reported feeling 'Happy' on 5 of the last 7 days"). **Note:** To respect student privacy, especially for older students, detailed journal entries are not visible to parents. This view provides a high-level summary.
-   **Active Goals:** Shows a list of any wellness goals the student has set for themselves (e.g., "Practice mindfulness for 10 minutes daily").
-   **School Resources:** Provides quick links to articles, videos, and contact information for school counselors or wellness staff, curated by the school.

---

## 4. Key Notifications for Parents

To ensure parents are always informed, the system should proactively send notifications for key events related to their child. These notifications can be delivered via email, push notifications, or within the dashboard's notification center.

-   **Academic Alerts:**
    -   *New Grade:* "A new grade has been posted for Jane's 'History Essay': 92% (A-)."
    -   *Missing Assignment:* "Alert: Jane's 'Math Homework 5.2' is now overdue."
    -   *Low Grade:* "Heads-up: Jane received a 65% on her 'Science Quiz 3'. You may want to check in."
-   **Attendance Alerts:**
    -   "Jane Doe was marked absent from her Period 2 class today."
    -   "Jane Doe was marked tardy for her Period 1 class today."
-   **Health & Wellness:**
    -   "You have a new message from the school nurse regarding Jane Doe."
    -   "Wellness Alert: Jane has reported feeling 'Sad' for three consecutive days. This may be a good time to check in with her." (Configurable by school policy).
-   **Financial Alerts:**
    -   "Reminder: Your tuition payment of $550.00 is due in 7 days."
    -   "A new invoice (#INV-2024-08) for Fall Semester Fees has been posted to your account."
-   **School Communication:**
    -   "New Message from Mr. Chen (History): 'Update on upcoming exam'."
    -   "New School Announcement: 'Parent-Teacher Conferences Next Month'."

---

## 5. Parent-Specific AI Features (Concierge AI)

The Concierge AI is tailored to act as a parent's personal school liaison, helping them understand school policies and their child's academic life.

-   **Assignment Explanation:** "Can you explain Jane's history assignment about the Roman Empire? What are the key requirements?"
-   **Policy Questions:** "What is the school's policy on late homework for 10th graders?" or "When is the last day for course withdrawal?"
-   **Academic Summary:** "Summarize Jane's academic performance this month. What are her strengths and where can she improve?"
-   **Email Drafting:** "Draft an email to Jane's math teacher, Mr. Chen, to ask about tutoring options for the upcoming exam."
-   **Resource Finding:** "What tests does John have next week and can you find some study guides or practice questions for his Algebra test?"
-   **Calendar Questions:** "When is the next school holiday?" or "What's for lunch on Wednesday and does it contain nuts?"

---

## 6. Privacy & Settings

-   **Notification Preferences:** A dedicated settings page where parents can toggle which notifications they want to receive and how they want to receive them (e.g., "Send me an email for missing assignments, but only a push notification for new grades").
-   **Student Data Visibility:** (For older students, configurable by school policy) A setting that allows parents to respect a student's growing autonomy. For example, a high school junior might have the ability to choose whether their parent can see their daily mood log, while academic and attendance data remain visible by default. This fosters trust while keeping parents informed on essential matters.
