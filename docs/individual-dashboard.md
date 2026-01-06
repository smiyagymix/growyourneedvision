
# Grow Your Need - Individual User Dashboard Wireframe & UI/UX Specification

This document provides a comprehensive wireframe and specification for the "Individual User" role view within the Dynamic SaaS Dashboard. It details the specific navigation, components, and features available to a single user, such as a creator or learner, who is not part of a larger school tenant.

---

## 1. Individual User Dashboard Overview

**Role:** Individual User (e.g., Chris Rogers, Creator)

**Primary Objective:** To provide a powerful, project-centric workspace for creators, learners, and individual professionals. The experience is tailored to content creation, personal productivity, and skill development, leveraging the platform's full suite of tools and overlay applications.

**General Layout:** The Individual User's view uses the main application shell, consisting of a fixed Header, a flexible main content area with a Right Sidebar and an optional Left Sub-navigation, and a fixed Footer with the App Launcher. The components and data displayed are focused on personal projects and resources.
---

## 3. Component Wireframe: Individual User's View

### 3.1. Right Sidebar (Main Navigation)

This is the primary navigation hub for the Individual User. The labels are specifically tailored for this role to reflect a project-based workflow.

| Icon                          | Label (Individual View) | ID              | Description                                                                                           |
| ----------------------------- | ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `home-icon`                   | Dashboard               | `dashboard`     | Displays the main overview with quick-start actions for creating content and viewing recent projects. |
| `briefcase-icon`              | Projects                | `tool_platform` | The central hub for managing all creative work, including designs, videos, documents, and assets.     |
| `heart-icon`                  | Wellness                | `wellness`      | Access to personal wellness tools like mood tracking, journaling, and goal setting to avoid burnout.  |
| `wrench-screwdriver-icon`     | Tools                   | `tools`         | Accesses productivity and skill-building tools like focus timers, mind mappers, and simulators.       |
| `book-open-icon`              | Learn                   | `learn`         | A dedicated section for tutorials, courses, and other learning resources to improve creative skills.  |
| `chat-bubble-left-right-icon` | Communication           | `communication` | Manages personal messages and community interactions.                                                 |
| `sparkles-icon`               | Concierge AI            | `concierge_ai`  | Utilizes the personal AI assistant for creative assistance, research, and support.                    |
| `cog-6-tooth-icon`            | Setting                 | `setting`       | Manages the user's personal profile, notifications, and subscription/billing information.             |

**Visual States:**
-   **Default:** Gray icon and text (`--secondary`).
-   **Hover:** Background color changes (`--accent-primary/10`).
-   **Active:** Background is `bg-accent-primary/20`, text/icon is `text-accent-primary`, and a vertical `bg-accent-primary` bar appears on the left edge.

### 3.2. Header Navigation (Contextual)

The header's central navigation bar adapts based on the selected Right Sidebar section.

| Right Sidebar Section | Header Buttons Displayed                                         |
| --------------------- | ---------------------------------------------------------------- |
| **Dashboard**         | Overview                                                         |
| **Projects**          | Project Dashboard, My Creations, Asset Library, Template Library |
| **Wellness**          | Mind & Body                                                      |
| **Tools**             | Productivity, Skill Labs                                         |
| **Learn**             | My Learning, Explore                                             |
| **Communication**     | Email, Social Media, Community, Templates                        |
| **Concierge AI**      | Assistant                                                        |
| **Setting**           | Account                                                          |

### 3.3. Left Sub-navigation (Contextual)

This sidebar appears only when the selected Header item has further sub-categories.

| Right Sidebar -> Header           | Left Sub-nav Buttons Displayed                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Projects** -> Project Dashboard | Overview, Kanban Board                                                                         |
| **Projects** -> My Creations      | Designs, Videos, Documents                                                                     |
| **Projects** -> Asset Library     | My Uploads, Brand Kit                                                                          |
| **Projects** -> Template Library  | My Templates, Community Templates, Create From                                                 |
| **Wellness** -> Mind & Body       | Dashboard, Resources, Journal, Goals                                                           |
| **Tools** -> Productivity         | FOCUS TIMER, MIND MAPPER, AI CONTENT REPURPOSER                                                |
| **Tools** -> Skill Labs           | DEBATE SIMULATOR, PITCH SIMULATOR, PUBLIC SPEAKING COACH                                       |
| **Learn** -> My Learning          | Dashboard, Courses                                                                             |
| **Learn** -> Explore              | Tutorials, Learning Paths, Content Library                                                     |
| **Communication** -> (All)        | Varies by header (e.g., *Email*: Compose, Inbox, Starred; *Community*: General, Announcements) |
| **Setting** -> Account            | Profile, Notifications, Billing                                                                |

### 3.4. Main Content Views

#### 3.4.1. Individual's Dashboard (`dashboard/overview`)
The default view is an inspirational and functional launchpad for creative work. It renders the `IndividualDashboard.tsx` component, featuring:
-   **"What will you create today?" Card:** A large, inviting card at the top.
    -   Includes quick-start buttons ("New Design," "New Video," "New Presentation") that launch the appropriate tool in the Studio overlay.
    -   Features an integrated AI prompt input: "Or, ask the AI to generate an idea for..." with example prompts cycling underneath (e.g., "a blog post outline," "a video script," "a social media campaign").
-   **Recent Projects Card:** A horizontally scrollable grid of larger project thumbnails. Each thumbnail shows the project name and "Last modified" date. Hovering reveals a progress bar indicating task completion from the project's Kanban board.
-   **My Stats Card:** A gamified look at productivity.
    -   Displays metrics like "Projects Completed," "Current Streak" (days with platform activity), "XP Earned," and "Skills Mastered" (from the Learn section).
-   **Recommended for You Card:** An AI-driven section suggesting relevant content to help the user grow.
    -   Suggests tutorials from the "Learn" section based on the user's project history (e.g., "Learn Advanced Video Transitions").
    -   Suggests professional templates from the **Template Library** that match the user's typical content style.
-   **Scratchpad Card:** A persistent textarea for jotting down quick notes and ideas without leaving the dashboard.

#### 3.4.2. Projects (`tool_platform/*`)
This is the core workspace for the Individual User.

-   **Project Dashboard View (`/projects/dashboard/overview`)**: This is the homepage for a *single selected project*.
    -   **Header:** Displays the project title and a brief description.
    -   **Project Goals & KPIs:** A small widget where the user can define success metrics for the project (e.g., "YouTube Views > 10,000," "Blog Post Shares > 100").
    -   **Project Files:** A file-manager-like grid showing all the creations (designs, videos, documents) associated with this project.
    -   **Kanban Board:** An embedded task board with columns like "To Do," "In Progress," and "Done." Cards can have checklists, due dates, and linked assets from the Asset Library.
    -   **Project Resources:** A list of linked resources, both internal (from the Asset Library) and external (web links for research).
    -   **Project Notes:** A dedicated notes area for project-specific brainstorming and details.

-   **My Creations View (`/projects/creations/*`)**: A global library of all finished assets across all projects.
    -   Presents a filterable grid of all designs, videos, and documents created by the user.
    -   Each item includes options to **Share**, **Download**, **View Version History**, or **Repurpose** (using the AI Content Repurposer tool).

-   **Asset Library View (`/projects/assets/*`)**: A central repository for raw materials.
    -   **My Uploads:** An interface for uploading, organizing into folders, and tagging raw assets like images, logos, video clips, and audio files. Features AI-powered auto-tagging for images.
    -   **Brand Kit:** A dedicated space to store brand assets for quick access in the Studio. Users can define a color palette, upload logos, and specify brand fonts.

-   **Template Library View (`/projects/templates/*`)**:
    -   **My Templates:** A gallery of the user's own saved designs, which can be reused for new projects.
    -   **Community Templates:** A browsable gallery of templates created and shared by other users on the platform.
    -   **Create From:** A library of platform-provided professional templates to kickstart new designs, videos, or documents.

---

## 5. User Workflow Example

This illustrates how an Individual User might navigate the platform from concept to completion.

1.  **Idea Generation:** The user starts on their **Dashboard**. They type "Generate ideas for a 5-part social media series on Stoicism" into the "What will you create today?" AI prompt.
2.  **Project Setup:** Liking one of the AI's suggestions, the user navigates to **Projects** and creates a new project named "Stoicism Series."
3.  **Task Management:** Inside the new **Project Dashboard**, they add cards to the **Kanban Board**: "Research Marcus Aurelius," "Write Blog Post on Meditations," "Create Thumbnail," "Record Video Script," "Edit Video." They set due dates for each.
4.  **Content Creation & AI Assist:**
    -   They use the **Concierge AI** to "summarize the key teachings of Marcus Aurelius' Meditations."
    -   They use the **Concierge AI** again to "Write a 1000-word blog post based on this summary."
    -   They launch the **Studio** overlay app. In the **Designer**, they create a thumbnail for the series, pulling brand colors from their **Brand Kit** in the **Asset Library**. They save this design.
5.  **Content Repurposing:**
    -   The user navigates to the **Tools** section and selects the **AI Content Repurposer**.
    -   They input the blog post they just created and ask the AI to "Generate a 3-minute video script" and "Create 5 Twitter-friendly bullet points."
6.  **Video Production:**
    -   Back in the **Studio** app, they open the **Video Editor**. They record the voiceover for the script and edit the video, pulling in background music from their **Asset Library**. They export the final video.
7.  **Review:** The finished video, design, and blog post now appear in the "Project Files" section of their "Stoicism Series" project dashboard and also globally under **My Creations**.
8.  **Iteration:** The user moves the Kanban cards to "Done" and begins the process for the next part of the series.

---

## 6. Individual-Specific AI Capabilities (Concierge AI)

The Concierge AI is tailored to act as a personal creative and productivity partner.

-   **Brainstorming & Ideation:**
    -   "Give me 5 viral video ideas for a YouTube channel about sustainable living."
    -   "Suggest 10 unique topics for a personal finance blog."
    -   "Brainstorm a name for my new podcast about historical events."
-   **Content Generation & Writing:**
    -   "Write a 500-word blog post on the benefits of intermittent fasting, with an SEO-friendly title."
    -   "Create a 3-part Twitter thread based on the blog post I just wrote."
    -   "Write a script for a 30-second ad for my new coffee brand."
    -   "Give me 10 catchy titles for a blog post about productivity."
-   **Feedback & Critique:**
    -   "Analyze this landing page copy. Make it more persuasive and improve the call to action."
    -   "Critique my design. Is the visual hierarchy clear? Suggest improvements."
    -   "Review my video script for clarity and engagement. Does it have a strong hook?"
-   **Technical Assistance & Research:**
    -   "Give me the CSS code for a responsive 3-column grid using Tailwind CSS."
    -   "Summarize the key points of the American Revolution for a presentation."
    -   "Find 3 royalty-free images of astronauts that I can use." (Integrates with Studio).
    -   "Explain the 'rule of thirds' in photography in simple terms."
-   **Marketing & SEO:**
    -   "Suggest 10 SEO keywords for an article about digital nomadism."
    -   "Write a compelling YouTube video description for a video titled 'My First Week in Tokyo', including relevant hashtags."
    -   "Create a 7-day social media content plan to promote my new online course."

---

## 7. Footer & App Launcher

-   **Functionality:** The footer provides toggles for the sidebars and access to the App Launcher, consistent with the main platform design.
-   **Available Overlay Apps:** The Individual User has access to the full suite of overlay applications, as these are the core tools for their creative and learning workflows. This includes Studio, Media, Market, etc. The internal navigation within these apps is identical to the Owner's view, as it is self-contained and not role-dependent.
