# Grow Your Need - Teacher Dashboard 

## 1. Teacher Dashboard Overview

**Role:** Teacher (e.g., Mr. David Chen)

**Primary Objective:** To provide teachers with an efficient and integrated workspace to manage their daily classroom activities. The dashboard focuses on lesson planning, grade management, student communication, and accessing educational resources, all while minimizing administrative overhead through powerful AI assistance.

**General Layout:** The Teacher's view uses the main application shell, consisting of a fixed Header, a flexible main content area with a Right Sidebar and an optional Left Sub-navigation, and a fixed Footer with the App Launcher. The interface is designed to provide quick access to the most frequently used classroom management tools.


### 3.1. Right Sidebar (Main Navigation)

This is the primary navigation hub for the Teacher. The sections are focused on their classroom and professional responsibilities.

| Icon                            | Label         | ID              | Description                                                                                             |
| ------------------------------- | ------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `home-icon`                     | Dashboard     | `dashboard`     | Displays an overview of the teacher's daily schedule, grading queue, and important student alerts.        |
| `graduation-cap-icon`           | School        | `school`        | The central hub for all teaching activities, including class management, lesson planning, and gradebooks. |
| `chat-bubble-left-right-icon`   | Communication | `communication` | Manages messages with students, parents, and staff, and posts class announcements.                      |
| `sparkles-icon`                 | Concierge AI  | `concierge_ai`  | Utilizes the AI assistant for lesson planning, generating quiz questions, and administrative support.     |
| `heart-icon`                    | Wellness      | `wellness`      | Accesses resources for student wellness and logs any concerns.                                          |
| `wrench-screwdriver-icon`       | Tools         | `tools`         | Accesses platform-provided productivity and educational tools.                                          |
| `cog-6-tooth-icon`              | Setting       | `setting`       | Manages the teacher's personal profile, notification preferences, and account details.                  |

**Visual States:**
-   **Default:** Gray icon and text (`--secondary`).
-   **Hover:** Background color changes (`--accent-primary/10`).
-   **Active:** Background is `bg-accent-primary/20`, text/icon is `text-accent-primary`, and a vertical `bg-accent-primary` bar appears on the left edge.

### 3.2. Header Navigation (Contextual)

The header's central navigation bar adapts based on the selected Right Sidebar section.

| Right Sidebar Section | Header Buttons Displayed                                                                |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Dashboard**         | Overview, Analytics, Market, System                                                     |
| **School**            | My Classes, Lesson Planner, Gradebook, Attendance, Resource Library, Student Analytics, Parent Comms |
| **Communication**     | Email, Social-Media, Community, Templates, Management                                   |
| **Concierge AI**      | Assistant, Analytics, Operations, Development, Settings                                 |
| **Wellness**          | Overview                                                                                |
| **Tools**             | Overview                                                                                |
| **Setting**           | Account                                                                                 |

### 3.3. Left Sub-navigation (Contextual)

This sidebar appears only when the selected Header item has further sub-categories.

| Right Sidebar -> Header          | Left Sub-nav Buttons Displayed                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| **School** -> My Classes         | (A list of the teacher's assigned classes, e.g., Grade 10 History, Period 3 English)              |
| **School** -> Lesson Planner     | Calendar View, Create Plan, My Plans, Curriculum Standards                                        |
| **School** -> Gradebook          | Grade Entry, Reports, Category Weights, Comment Bank, Mastery View                                |
| **School** -> Attendance         | Take Attendance, Attendance History, Reports                                                      |
| **School** -> Resource Library   | My Resources, School Library, Create New, AI Content Finder                                       |
| **School** -> Student Analytics  | Class Performance, Individual Progress, At-Risk Students, Engagement Metrics                      |
| **School** -> Parent Comms       | Bulk Message, Schedule Conferences, Message Log, Office Hours                                     |
| **Communication** -> (All)       | Varies by header (e.g., *Email*: Compose, Inbox, Starred; *Community*: General, Announcements)     |
| **Setting** -> Account           | Profile, Notifications, Billing                                                                   |

### 3.4. Main Content: Teacher Dashboard

The default view (`dashboard/overview`) renders the `TeacherDashboard.tsx` component, designed to provide a snapshot of the teacher's immediate priorities. It features:
-   **Today's Schedule Card:** A chronological list of the teacher's classes and free periods for the current day.
-   **Quick Actions Card:** Buttons for the most common tasks, "Start New Lesson Plan" and "Take Attendance," which navigate directly to the relevant sections.
-   **Student Alerts Card:** An AI-powered widget that flags important student-related information, such as students with multiple missed assignments or a student's birthday.
-   **Assignments to Grade Card:** A list of active assignments showing the number of submissions received versus the total number of students. Each item is a link to the gradebook for that specific assignment.

### 3.5. Footer & App Launcher

-   **Functionality:** The footer provides toggles for the sidebars and access to the App Launcher, consistent with the main platform design.
-   **Available Overlay Apps:** Teachers have access to the full suite of overlay applications. This is crucial for creating educational content (e.g., using **Studio** to build presentations and documents, **Media** to curate educational video playlists, or **Knowledge** to build custom quizzes and exams for their class). The internal navigation within these apps is identical to the Owner's view.

---

## 4. Detailed Feature Descriptions

### 4.1. Advanced Gradebook (`School -> Gradebook`)
-   **Grade Entry:** A spreadsheet-like interface for quick entry of scores. Supports numerical, letter, and complete/incomplete grading. Features bulk actions like "Mark all as graded" or "Excuse all missing".
-   **Category Weights:** Teachers can create categories (e.g., Homework, Exams, Projects) and assign weights to automatically calculate final grades.
-   **Comment Bank:** Teachers can save, categorize, and quickly insert frequently used comments to provide consistent and constructive feedback. Includes AI suggestions for comments based on student performance.
-   **AI-Assisted Grading:** For short-answer or essay questions, the AI can provide a preliminary grade based on a teacher-provided rubric, highlight key points in the student's submission, and check for plagiarism. The teacher always has the final say and can override the AI's suggestion.
-   **Mastery View:** An alternative view for standards-based grading. Teachers can track student proficiency against specific learning standards or curriculum goals (e.g., "Exceeds," "Meets," "Approaching," "Needs Support").
-   **Reports:** Generate and export grade reports (as PDF or CSV) for individual students, entire classes, or specific assignments. Visual analytics show class distribution (e.g., a bell curve of scores) and performance over time.
-   **Student Portfolio Integration:** Graded assignments can be marked to be included in a student's digital portfolio, which can be viewed in the "Academics -> Portfolio" section of the Student's dashboard.

### 4.2. AI-Powered Lesson Planner (`School -> Lesson Planner`)
-   **Calendar View:** A weekly or monthly calendar interface to visually organize lesson plans across all classes.
-   **Create Plan:** A rich text editor for creating detailed lesson plans. Features templates for different teaching methodologies (e.g., 5E Model, Madeline Hunter).
-   **AI Learning Objective Generator:** From a simple topic (e.g., "photosynthesis"), the AI can generate a list of measurable learning objectives (e.g., "Students will be able to describe the process of photosynthesis and identify its key inputs and outputs.").
-   **AI Differentiation Suggestions:** The AI can suggest specific strategies to adapt a lesson for students with different learning needs, such as English Language Learners (ELL), students with an Individualized Education Program (IEP), or advanced learners.
-   **Curriculum Mapping:** The AI assistant can automatically tag lessons with relevant state or national curriculum standards as the teacher writes them.
-   **Resource Integration:** Directly drag and drop resources (PDFs, videos, links) from the Resource Library into a lesson plan. The AI can suggest relevant resources automatically from the school library or the web.
-   **Collaboration:** Share lesson plans with colleagues for feedback or co-teaching.

### 4.3. Student Analytics Dashboard (`School -> Student Analytics`)
-   **Class Performance:** Visual dashboards showing overall class average, performance trends over time, and a breakdown by assignment category.
-   **Individual Progress:** Drill down into a single student's record to view their grade history, attendance patterns, and assignment submission timeliness.
-   **Early Warning System:** An AI-powered view that automatically flags students who may be falling behind based on a combination of triggers, such as:
    -   Grade dropping more than 10% over two weeks.
    -   Three or more consecutively missed assignments.
    -   Consistently low engagement scores.
    -   Negative sentiment detected in journal entries (if Wellness module is used).
-   **Engagement Metrics:** Tracks student activity within the platform, such as login frequency, time spent on resources, and participation in community discussions, compiling it into an "Engagement Score".

### 4.4. Parent Communication Hub (`School -> Parent Comms`)
-   **Bulk Messaging:** Send targeted messages or emails to all parents, or just to parents of students who meet certain criteria (e.g., "all students with a grade below 70%"). Supports merge tags (e.g., `[Student Name]`).
-   **Pre-made Templates:** Use and customize templates for common communications, such as "Missed Homework Notification," "Positive Behavior Report," or "Upcoming Test Reminder."
-   **Conference Scheduling:** A built-in scheduling tool where teachers can set their availability and parents can book appointments for parent-teacher conferences. Integrates with the teacher's calendar.
-   **Office Hours:** Set and publish virtual or in-person office hours that parents and students can book.

### 4.5. Classroom Management Tools
-   **Seating Chart Generator:** An interactive tool to create and save seating charts. Allows for drag-and-drop student placement and can suggest arrangements based on pedagogical goals (e.g., group work, separating disruptive students).
-   **Behavior Logging:** A private log for teachers to document notable student behavior (both positive and negative) with timestamps and notes. This data can be used to inform parent communications and student support plans.
-   **Random Student Selector:** A simple tool to randomly select a student for participation, ensuring fair and equitable classroom engagement.
-   **Random Group Generator:** Automatically create student groups for projects or activities. Can be configured to create groups of a certain size or number, and can create either random or mixed-skill-level groups based on grade data.

### 4.6. Resource Library (`School -> Resource Library`)
-   **My Resources:** A personal space for teachers to upload and organize their own files (PDFs, videos, links, presentations).
-   **School Library:** A shared repository where resources can be published for use by all teachers in the school.
-   **AI Content Finder:** An AI-powered search tool that helps teachers find high-quality, safe, and relevant educational content (videos, articles, simulations) from across the web.
-   **Create New:** A shortcut that launches the **Studio** overlay app, allowing teachers to create new educational materials like documents or presentations from scratch.

---

## 5. Teacher-Specific AI Features (Concierge AI)

The Concierge AI is tailored to act as a teaching assistant, handling pedagogical and administrative tasks.

-   **AI Lesson Plan Generator:** From a simple prompt (e.g., "a 45-minute lesson on the Pythagorean theorem for 9th graders, including a hands-on activity"), the AI can generate a structured lesson plan including objectives, materials, activities, and assessment ideas.
-   **Rubric Generator:** Create a detailed, multi-level grading rubric from a description of an assignment (e.g., "Create a rubric for a 5-page research paper on the American Revolution for 11th graders").
-   **Worksheet & Activity Generator:** The AI can create printable or digital worksheets, practice problems, or creative activities based on a topic (e.g., "Generate a crossword puzzle with 15 vocabulary words from 'The Great Gatsby'"). This includes formats like multiple-choice, fill-in-the-blank, and matching.
-   **Presentation Slide Generator:** Create a set of presentation slides on a given topic. For example, "Generate 5 slides for an introduction to photosynthesis," and the AI will create title and content for each slide, which can then be opened in the Studio app for further design.
-   **Flashcard Generator:** Automatically create a set of digital flashcards from a list of terms and definitions or a block of text.
-   **Differentiated Instruction Assistant:** Teachers can ask the AI for specific ideas on how to adapt a lesson for students with different learning needs (e.g., "How can I modify this history lesson for visual learners or students who struggle with reading?").
-   **Parent Email Drafter:** The AI can draft professional and empathetic emails to parents for various situations (e.g., "Draft an email to a parent about their child's missing assignments," or "Draft a positive email about a student's excellent participation in class").
-   **AI-Generated Feedback Suggestions:** When grading essays or short-answer questions, the AI can analyze the student's text and suggest specific, constructive comments related to grammar, clarity, and argumentation, which the teacher can then edit and approve.
-   **Field Trip Itinerary Planner:** Help teachers plan educational trips by suggesting locations, creating a timed schedule, and drafting permission slips based on a given topic and location.
-   **Sub Plan Generator:** Quickly generate a substitute teacher plan for a class, including a summary of the current topic, a simple activity for students, and key classroom procedures.