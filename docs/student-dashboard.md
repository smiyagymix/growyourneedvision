# Grow Your Need - Student Dashboard Wireframe & UI/UX Specification

This document provides a comprehensive wireframe and specification for the "Student" role view within the Dynamic SaaS Dashboard. It details the specific navigation, components, and features available to a student user within a school tenant.

---

## 1. Student Dashboard Overview

**Role:** Student (e.g., Alex Johnson)

**Primary Objective:** To provide students with a centralized, intuitive, and engaging hub for their academic life. The dashboard is designed to help them manage their courses, track their progress, access learning tools, and stay organized. It emphasizes productivity, wellness, and skill development through integrated AI and specialized tools.

**General Layout:** The Student's view uses the main application shell, consisting of a fixed Header, a flexible main content area with a Right Sidebar and an optional Left Sub-navigation, and a fixed Footer with the App Launcher. The content is highly personalized to the student's enrolled courses and activities.

---

## 2. Style & Appearance

The Student dashboard adheres to the core UI philosophy and style guide outlined in the main `grow-your-need-wire-frame.md` document, ensuring a consistent and high-quality user experience.

-   **Color Palette:** Utilizes the primary (light/dark theme) color palette. Active states are highlighted with `--accent-primary` (Right Sidebar) and `--accent-secondary` (Left Sub-navigation).
-   **Typography:** Employs the `Inter` font family for all text.
-   **Layout & Spacing:** All components use the standard `1rem` border-radius and `shadow-custom`.

---

## 3. Component Wireframe: Student's View

### 3.1. Right Sidebar (Main Navigation)

This is the primary navigation hub for the Student. The sections are focused on their academic and personal development journey.

| Icon                            | Label (Student View) | ID                  | Description                                                                                             |
| ------------------------------- | -------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| `home-icon`                     | Dashboard            | `dashboard`         | Displays an overview of the student's daily schedule, upcoming deadlines, and AI-powered suggestions.     |
| `graduation-cap-icon`           | Academics            | `school`            | The central hub for all academic activities, including courses, grades, assignments, and study tools.   |
| `heart-icon`                    | Wellness             | `wellness`          | Access to personal wellness tools like mood tracking, journaling, and goal setting.                   |
| `wrench-screwdriver-icon`       | Tools                | `tools`             | Accesses productivity and skill-building tools like focus timers, mind mappers, and simulators.         |
| `chat-bubble-left-right-icon`   | Communication        | `communication`     | Manages messages with teachers and participation in school community channels.                          |
| `sparkles-icon`                 | Concierge AI         | `concierge_ai`      | Utilizes the personal AI assistant for tutoring, research, and project assistance.                      |
| `cog-6-tooth-icon`              | Setting              | `setting`           | Manages the student's personal profile, notification preferences, and account details.                  |

**Visual States:**
-   **Default:** Gray icon and text (`--secondary`).
-   **Hover:** Background color changes (`--accent-primary/10`).
-   **Active:** Background is `bg-accent-primary/20`, text/icon is `text-accent-primary`, and a vertical `bg-accent-primary` bar appears on the left edge.

### 3.2. Header Navigation (Contextual)

The header's central navigation bar adapts based on the selected Right Sidebar section.

| Right Sidebar Section | Header Buttons Displayed                                         |
| --------------------- | ---------------------------------------------------------------- |
| **Dashboard**         | Overview                                                         |
| **Academics**         | Courses, Grades & Assignments, AI Study Hub, Learning Path, Portfolio, Department Requests |
| **Wellness**          | Mind & Body                                                      |
| **Tools**             | Productivity, Skill Labs                                         |
| **Communication**     | Email, Community                                                 |
| **Concierge AI**      | Assistant                                                        |
| **Setting**           | Account                                                          |

### 3.3. Left Sub-navigation (Contextual)

This sidebar appears only when the selected Header item has further sub-categories.

| Right Sidebar -> Header         | Left Sub-nav Buttons Displayed                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Academics** -> Courses        | (A list of the student's enrolled courses, e.g., Math 101, History 202)                                                                                                                                                   |
| **Academics** -> Grades & Assignments | Gradebook, Upcoming                                                                                                                                                                                                     |
| **Academics** -> AI Study Hub   | AI Tutor, Planner, Visualizer                                                                                                                                                                                             |
| **Academics** -> Learning Path  | My Journey, Leaderboards                                                                                                                                                                                                  |
| **Academics** -> Portfolio      | My Skills, Showcase, Career Compass                                                                                                                                                                                     |
| **Academics** -> Department Requests | Finance, Human Resources, Marketing, Inquiries                                                                                                                                                                          |
| **Wellness** -> Mind & Body     | Dashboard, Resources, Journal, Goals                                                                                                                                                                                    |
| **Tools** -> Productivity       | FOCUS TIMER, MIND MAPPER, CITATION GENERATOR                                                                                                                                                                            |
| **Tools** -> Skill Labs         | DEBATE SIMULATOR, VIRTUAL LABS, AR LAB, FINANCE SIM                                                                                                                                                                       |
| **Communication** -> (All)      | Varies by header (e.g., *Email*: Compose, Inbox, Starred; *Community*: General, Announcements)                                                                                                                           |
| **Setting** -> Account          | Profile, Notifications, Billing                                                                                                                                                                                         |

### 3.4. Main Content Views

#### 3.4.1. Student Dashboard (`dashboard/overview`)
The default view renders the `StudentDashboard.tsx` component, designed to give the student an immediate, personalized summary of their day.
-   **Welcome Header:** "Welcome back, Alex!"
-   **Today's Agenda Card:** A list of the student's classes for the day, including times, room numbers, and icons for the subject (e.g., calculator for Math). It also highlights any assignments due today with a distinct warning style.
-   **Wellness Snapshot Card:** An interactive widget prompting "How are you feeling today?" with emoji buttons (😊, 😐, 😔). After selection, it shows a confirmation and a link to the full Wellness Hub to add a journal entry.
-   **My Learning Path Progress Card:** A gamified card showing the student's current level (e.g., "Level 12 Scholar"), an XP progress bar to the next level, and their current rank on the class leaderboard.
-   **AI Suggestions Card:** A feed of personalized recommendations, powered by the Concierge AI.
    -   *Example 1:* "Your History essay is due in 3 days. Want me to help you create an outline?" (Action button: "Help Me Outline").
    -   *Example 2:* "You did great on your last algebra quiz! Here's a challenge problem to test your skills." (Action button: "Show Challenge").
    -   *Example 3:* "Here's a 5-minute video that explains the 'cell mitosis' topic from your Biology class." (Action button: "Watch Video").

#### 3.4.2. Academics (`school/*`)

-   **Courses View:**
    -   When a specific course is selected from the sub-nav (e.g., History 202), this view shows a dedicated page for that course.
    -   **Layout:** Includes the course name, teacher's name, current grade, a link to the syllabus, a list of upcoming assignments for that course, a feed of class-specific announcements from the teacher, and a file/resource section with materials uploaded by the teacher.

-   **Grades & Assignments View:**
    -   **Gradebook:** A comprehensive view showing a card for each course. Each card displays the overall grade, a breakdown by category (e.g., Homework: 90%, Exams: 85%), and a list of all graded assignments with scores and teacher feedback. Includes an AI-powered "Grade Calculator" where a student can input hypothetical scores for future assignments to see how it impacts their final grade.
    -   **Upcoming:** An agenda-style view or a calendar view that aggregates all upcoming assignments and exams from all courses, with sorting and filtering options.

-   **AI Study Hub View:**
    -   **AI Tutor:** An interactive chat interface. Students can ask questions ("Explain photosynthesis"), upload a worksheet and ask for help on a specific problem, or ask the AI to generate practice questions for a topic.
    -   **Study Planner:** An AI tool where a student can input their upcoming tests and assignments. The AI generates a suggested study schedule, breaking down large tasks into smaller chunks and blocking out time on their calendar.
    -   **Concept Visualizer:** A tool where students can paste a block of text (e.g., from a textbook or article). The AI analyzes the text and generates a visual representation like a mind map, flowchart, or simplified summary to aid understanding.

-   **Learning Path (Gamification) View:**
    -   **My Journey:** A visual, map-like interface or a skill tree that represents the curriculum. As the student masters topics (confirmed by good grades), new areas of the map or branches of the tree unlock. This provides a clear, visual sense of progress and accomplishment.
    -   **Leaderboards:** Displays weekly or monthly leaderboards for each class. Leaderboards can be based on "XP" earned from grades, completing bonus challenges, or participating in class discussions. This fosters friendly competition.

-   **Portfolio View:**
    -   **My Skills:** An AI-powered dashboard that analyzes all of the student's submitted work (essays, projects, etc.) and identifies recurring skills. It displays these as tags (e.g., "Analytical Writing," "Historical Research," "Data Visualization," "Creative Problem Solving") and shows which assignments contributed to each skill.
    -   **Showcase:** A personal, curated gallery where the student can feature their best work. Teachers can nominate assignments for inclusion, and the student makes the final choice to add them.
    -   **Career Compass:** An AI tool that analyzes the student's strongest subjects and skills from their portfolio. It suggests potential college majors, career paths, and even specific professionals to research.

-   **Department Requests View:**
    -   A simple form-based system for students to submit administrative requests to school departments like Finance (e.g., questions about fees), IT (e.g., password reset), or Counseling (e.g., request an appointment).

#### 3.4.3. Wellness (`wellness/*`)
-   **Dashboard:** Shows a chart of mood trends over time, a streak counter for daily journal entries, and a checklist of the student's active wellness goals.
-   **Journal:** A private, encrypted digital journal. The AI can provide optional daily prompts (e.g., "What was the best part of your day?"). The content is private, but the AI's sentiment analysis can contribute anonymous, high-level data to the "Early Warning System" for teachers/counselors if school policy allows.
-   **Goals:** A tool for students to set and track S.M.A.R.T. (Specific, Measurable, Achievable, Relevant, Time-bound) personal goals, both academic and non-academic.

#### 3.4.4. Tools (`tools/*`)
-   **Focus Timer:** A Pomodoro-style timer to help with focused study sessions.
-   **Mind Mapper:** A digital whiteboarding tool for brainstorming and organizing ideas.
-   **Citation Generator:** A tool where students can input information about a source (book, website, etc.) and have it automatically formatted into MLA, APA, or Chicago style citations.
-   **Debate Simulator:** An AI opponent where students can practice their argumentation and public speaking skills on a given topic.
-   **Virtual Labs:** A collection of interactive simulations for subjects like Physics, Chemistry, and Biology.

---

## 5. Student-Specific AI Capabilities (Concierge AI)

The Concierge AI is tailored to act as a personal academic tutor and study partner.

-   **Tutoring & Explanation:**
    -   "Explain the Pythagorean theorem like I'm 10 years old."
    -   "What's the difference between a metaphor and a simile?"
    -   "Can you walk me through how to solve this algebra problem? `2x + 5 = 15`"
-   **Content Generation & Writing Assistance:**
    -   "Help me brainstorm ideas for my essay on 'The Great Gatsby'."
    -   "Create an outline for a 5-paragraph essay about the causes of the American Revolution."
    -   "Can you rephrase this sentence to sound more academic: 'The king did a lot of bad stuff and the people got mad.'"
-   **Practice & Preparation:**
    -   "Give me 5 multiple-choice practice questions about cell mitosis for my biology quiz."
    -   "Act as a French teacher and have a basic conversation with me."
    -   "What are the key themes I should study for my upcoming test on 'To Kill a Mockingbird'?"
-   **Proofreading & Feedback:**
    -   "Proofread this paragraph and fix any grammar or spelling mistakes."
    -   "Does my introduction have a strong thesis statement?"
-   **Quick Facts & Research:**
    -   "What year did World War II end?"
    -   "Find me a reliable source about the water cycle."

---

## 6. Footer & App Launcher

-   **Functionality:** The footer provides toggles for the sidebars and access to the App Launcher, consistent with the main platform design.
-   **Available Overlay Apps:** The Student has access to the full suite of overlay applications. The internal navigation within these apps is identical to the Owner's view.