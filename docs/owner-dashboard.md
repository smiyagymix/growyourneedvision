# OWNER DASHBOARD

## 🏢 **PLATFORM OWNER DASHBOARD**

Comprehensive dashboard for the platform owner (e.g., Yassine Eljebari) with full system access and business intelligence for the entire Grow Your Need SaaS ecosystem.
a
## 🎯 **DASHBOARD OVERVIEW**

**Primary Objective:** To provide the platform owner with a high-level, centralized view of the entire SaaS ecosystem. This includes monitoring key business metrics (MRR, churn), managing tenants (schools, individuals), configuring platform-wide settings, and accessing advanced AI-powered administrative tools.

**General Layout:** The Owner's view uses the main application shell, consisting of a fixed Header, a flexible main content area with a Right Sidebar and an optional Left Sub-navigation, and a fixed Footer with the App Launcher.

## 🧭 **NAVIGATION ARCHITECTURE**

### **🔄 Right Sidebar (Main Navigation)**

This is the primary navigation hub for the Owner. The labels are specifically tailored for this role.

| Icon                          | Label (Owner View) | ID                | Description                                                                               |
| ----------------------------- | ------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| `home-icon`                   | Dashboard          | `dashboard`       | Displays the main overview with platform-wide KPIs and alerts                             |
| `graduation-cap-icon`         | Tenant Mgt         | `school`          | Manages all tenants (schools and individuals), platform billing plans, and invoices       |
| `calculator-icon`             | Platform CRM       | `crm`             | Accesses the top-level CRM for managing the sales pipeline and tenant accounts            |
| `briefcase-icon`              | Tool-Platform      | `tool_platform`   | Manages platform-level integrations and API access for tenants                            |
| `chat-bubble-left-right-icon` | Communication      | `communication`   | Accesses platform-wide communication tools like email and social media management         |
| `sparkles-icon`               | Concierge AI       | `concierge_ai`    | The central hub for configuring, training, and operating the platform's core AI assistant |
| `heart-icon`                  | Wellness           | `wellness`        | Provides an overview of wellness features and usage across the platform                   |
| `wrench-screwdriver-icon`     | Tools              | `tools`           | Provides an overview of productivity tools available to users                             |


#### **Visual States:**
- **Default:** Gray icon and text (`--secondary`)
- **Hover:** Background color changes (`--accent-primary/10`)
- **Active:** Background is `bg-accent-primary/20`, text/icon is `text-accent-primary`, and a vertical `bg-accent-primary` bar appears on the left edge

### **📋 Header Navigation (Contextual)**

The header's central navigation bar adapts based on the selected Right Sidebar section.

| Right Sidebar Section | Header Buttons Displayed                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Dashboard**         | Overview, Analytics, Market, System                                                                |
| **Tenant Mgt**        | Tenants, Platform Billing                                                                          |
| **Platform CRM**      | Sales Pipeline, Tenant Accounts                                                                    |
| **Tool-Platform**     | Overview, Marketing, Finance, Business, Marketplace, Logs                                          |
| **Communication**     | Email, Social-Media, Community, Templates, Management                                              |
| **Concierge AI**      | Assistant, Analytics, Operations, Development, Strategy, Settings                                  |
| **Wellness**          | Dashboard, Physical Health, Mental Wellness, Nutrition                                             |
| **Tools**             | Dev Essentials, Design & Media, Utilities, Resources                                               |
| **Platform Settings** | Appearance, Integrations, API Access, Configuration                                                |

### **🔧 Left Sub-navigation (Contextual)**

This sidebar appears only when the selected Header item has further sub-categories.

| Right Sidebar → Header                | Left Sub-nav Buttons Displayed                                                                                                                                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant Mgt** → Tenants              | Schools, Individuals                                                                                                                                                                                                                                                                               |
| **Tenant Mgt** → Platform Billing     | Plans, Invoices, Gateways                                                                                                                                                                                                                                                                          |
| **Tool-Platform** → Overview          | Platform overview, Marketing bento, Finance bento, Business bento                                                                                                                                                                                                                                  |
| **Tool-Platform** → Marketing         | Campaigns, Assets, Templates, Audience Segments, AI Campaign Generator, Personalization Engine, A/B & Multivariate Testing, Customer Data Platform (CDP), Journey Builder, Predictive Lead Scoring, Social Scheduler & Publisher, Creative Studio, Attribution & ROI Analyzer, Experimentation Lab |
| **Tool-Platform** → Finance           | Billing Reports, Revenue, Plan Analytics, Reconciliation                                                                                                                                                                                                                                           |
| **Tool-Platform** → Business          | Business Rules, Pricing, Segmentation, Feature Bundles                                                                                                                                                                                                                                             |
| **Tool-Platform** → Marketplace       | Published Apps, Submissions, Approvals, Revenue Share, Developer Portal                                                                                                                                                                                                                            |
| **Communication** → (All)             | Varies by header (e.g., *Email*: Compose, Inbox, Starred; *Management*: Email, Social-Media, Community)                                                                                                                                                                                            |
| **Concierge AI** → (All)              | Varies by header (e.g., *Development*: Playground, Data Management, Model Routing, API Logs, Fine-Tuning; *Strategy*: Objectives, Scalability; *Settings*: Model Config, Access Control, Billing, Preferences)                                                            |
| **Wellness** → Dashboard              | Overview, My Goals, AI Coach                                                                                                                                                                                                                                                                                       |
| **Wellness** → Physical Health        | Activity, Sleep, Workouts                                                                                                                                                                                                                                                                                          |
| **Wellness** → Mental Wellness        | Meditation, Mood Log                                                                                                                                                                                                                                                                                               |
| **Wellness** → Nutrition              | Planner, Intake                                                                                                                                                                                                                                                                                                    |
| **Tools** → Dev Essentials            | JSON Formatter, Regex Tester, Markdown Editor, UUID Gen, URL Encoder, Diff Viewer                                                                                                                                                                                                                                                                  |
| **Tools** → Design & Media            | Image Converter, Color Palette, QR Generator, Blob Maker, Glassmorphism                                                                                                                                                                                                                                                                            |
| **Tools** → Utilities                 | PDF Tools, Unit Converter, Password Gen, Lorem Ipsum, Speed Test, Time Zones, Stopwatch, Pomodoro, Word Counter, IP Lookup, Reaction Test                                                                                                                                                                                                          |
| **Tools** → Resources                 | Documentation, Feature Grid                                                                                                                                                                                                                                                                                                                        |
| **Platform Settings** → Configuration | General, Feature Flags, Integrations, Security & Access, Legal                                                                                                                                                                                                                                     |

## 📱 **FOOTER & APP LAUNCHER**

### **Footer Control Hub**
The footer serves as a persistent, multi-functional control surface with:
- **Left Zone:** Sub-navigation Toggle
- **Center Zone:** App Launcher & Dock
- **Right Zone:** Minimized Apps & Main Navigation Toggle

### **App Launcher Applications (Owner Access)**

#### ** setting**
- **Icon:**
| `squares-plus-icon`           | Overlay-Setting    | `overlay_setting` | Manages the settings and content for all overlay applications (Studio, Media, etc.)       |
| `cog-6-tooth-icon`            | Platform Settings  | `setting`         | Configures global platform settings like feature flags, security, and legal information   |

#### **🎨 Creator Studio**
- **Icon:** `StudioIcon` (3D realistic SVG depicting overlapping colored diamonds)
- **Description:** A suite of creative tools for designing graphics, editing videos, writing code, and creating documents
- **Header Tabs & Sub-Navigation:**
  - **Designer:** Templates, Elements, Uploads, Text
  - **Video:** Media, Audio, Text, Effects, Transitions
  - **Coder:** Explorer, Search, AI Assistant, Run & Debug
  - **Office:** Word, Excel, PowerPoint

#### **⚙️ Settings**
- **Icon:** `SettingsIcon` (3D realistic SVG depicting a stylized cog)
- **Description:** The master control panel for the entire platform
- **Header Tabs & Sub-Navigation:**
  - **Platform:** Theme, Content, Assets, Permissions, API Keys, Versions
  - **Backend:** Marketplace, Calendar, Studio, Messaging, Media, Hobbies, Religion, Sport, Events, Services, Gamification, Help
  - **Integrations:** Available

#### **💬 Messaging**
- **Icon:** `MessagingIcon` (3D realistic SVG depicting a chat bubble)
- **Description:** A communication hub for internal messaging, announcements, and group chats
- **Header Tabs & Sub-Navigation:**
  - **Main:** Inbox, Channels

#### **❓ Help Center**
- **Icon:** `HelpIcon` (3D realistic SVG depicting a question mark in a circle)
- **Description:** Provides access to documentation, support tickets, and FAQs

#### **🎯 Hobbies**
- **Icon:** `HobbiesIcon` (3D realistic SVG)
- **Description:** An application for users to explore and track various hobbies
- **Header Tabs & Sub-Navigation:**
  - **Creative:** Painting, Writing
  - **Collecting:** Stamps, Coins
  - **Gaming:** Solo, Multiplayer

#### **🕊️ Religion**
- **Icon:** `ReligionIcon` (3D realistic SVG)
- **Description:** Provides information and community features related to different faiths
- **Header Tabs & Sub-Navigation:**
  - **Quran:** Read, Search
  - **Hadith:** Collections, Search
  - **Prayer Times:** Dashboard, Settings

#### **🏃 Sport**
- **Icon:** `SportIcon` (3D realistic SVG)
- **Description:** An app for tracking sports, teams, and personal fitness
- **Header Tabs & Sub-Navigation:**
  - **Sports:** Team Sports
  - **Outdoor:** Hiking
  - **Wellness:** Fitness

#### **🎪 Events**
- **Icon:** `EventsIcon` (3D realistic SVG)
- **Description:** A tool for discovering, creating, and managing events
- **Header Tabs & Sub-Navigation:**
  - **Discover:** Browse Events
  - **My Events:** Upcoming
  - **Planning:** Create Event

#### **🔧 Services**
- **Icon:** `ServicesIcon` (3D realistic SVG)
- **Description:** A marketplace for booking various personal and professional services
- **Header Tabs & Sub-Navigation:**
  - **Home:** Cleaning
  - **Professional:** Consulting
  - **Personal:** Coaching

#### **🏆 Gamification**
- **Icon:** `GamificationIcon` (3D realistic SVG)
- **Description:** Manages achievements, leaderboards, and rewards across the platform
- **Header Tabs & Sub-Navigation:**
  - **Achievements:** Badges
  - **Leaderboards:** Ranking
  - **Rewards:** Reward Store

## 📊 **MAIN DASHBOARD VIEWS**

### **🏠 Owner's Dashboard (`dashboard/overview`)**
The default view renders the `OwnerDashboard.tsx` component:

#### **KPI Cards:**
- **MRR:** "$15,230" with subtext "+2.1% from last month"
- **Active Tenants:** "120" with subtext "85 Schools, 35 Individuals"
- **LTV:** "$2,450" (Customer Lifetime Value)
- **Churn Rate:** "2.1%" with subtext "-0.5% from last month"

#### **Actionable Alerts Card:**
- **Red Alert:** "High API Error Rate Detected (5.2%)"
- **Yellow Alert:** "Payment Gateway Connection Issue"
- **Blue Alert:** "3 High-Priority Support Escalations"

#### **Growth Charts:**
- **MRR Growth:** Line chart showing Monthly Recurring Revenue over the last 12 months
- **New Trials:** Bar chart showing new trial sign-ups per month

#### **Platform Controls Card:**
Quick navigation buttons to key management areas like "Manage Subscription Plans" and "Platform Settings"

### **🎓 Tenant Management (`school/*`)**
- **Tenants View:** Searchable, filterable table of all tenants with columns: Tenant Name, Type (School/Individual), Status (Active/Trial/Suspended), User Count, Subscription Plan
- **Platform Billing View:**
  - **Plans:** Interface to create, edit, and archive subscription plans
  - **Invoices:** Searchable log of all invoices generated for all tenants
  - **Gateways:** Configuration for payment gateways like Stripe

### **📈 Platform CRM (`crm/*`)**
- **Sales Pipeline View:** Kanban-style board with columns for "Lead," "Contacted," "Demo Scheduled," "Trial," and "Subscribed"
- **Tenant Accounts View:** Detailed view of each tenant with CRM-specific fields

### **🤖 Concierge AI (`concierge_ai/*`)**

#### **AI Intelligence Levels Framework**

The Concierge AI operates on five progressive levels of understanding:

| Level       | Intelligence Type          | Key Question                          | Files to Add                                      | Capabilities Unlocked                                                            |
| ----------- | -------------------------- | ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Level 1** | Static Analysis            | "What is the code structure & style?" | `package.json`, `tsconfig.json`, `biome.config.*` | Basic code generation, dependency awareness, style consistency                   |
| **Level 2** | Functional Intelligence    | "How should it behave?"               | `*.test.tsx` (Vitest)                             | Behavior-driven development, test-aware modifications, regression prevention     |
| **Level 3** | Visual Intelligence        | "How should it look?"                 | `*.stories.tsx` (Storybook)                       | UI/UX aware changes, component library integration, design system compliance     |
| **Level 4** | Data Intelligence          | "What data will it handle?"           | `openapi.json`, Auto-generated types              | API-first development, type-safe modifications, database schema awareness        |
| **Level 5** | Architectural Intelligence | "What are the project's goals?"       | `README.md`, `CONTRIBUTING.md`, ADRs              | Strategic feature development, architectural decision support, roadmap alignment |

#### **AI Views:**
- **Assistant View:** Full-screen chat interface for platform-wide commands and queries
- **Analytics View:** AI usage statistics, token consumption, estimated costs per provider, and most common user queries
- **Operations View:**
  - **System Health:** Real-time dashboards monitoring API response times, database load, and background job queues
  - **Tenant Management:** Configure AI feature access on a per-tenant or per-plan basis
  - **Support:** Queue of escalated support tickets where AI couldn't provide answers
- **Development View (Advanced):**
  - **Playground:** Interactive model testing environment
  - **Model Routing:** Configure and optimize AI model selection strategies
  - **API Logs:** Detailed logs of AI API interactions for debugging and auditing
  - **Fine-Tuning:** Manage fine-tuning jobs and datasets
  - **Data Management:** Tools for managing training data and knowledge bases
  - **AI Intelligence Levels:** Comprehensive framework for managing AI's project understanding
- **Settings View:** Configure AI providers (API keys, models), vector database connections, and global system prompt

### **⚙️ Platform Settings (`setting/*`)**
- **Feature Flags View:** List of all platform features with switches to enable/disable globally or restrict to certain subscription plans
- **Integrations View:** Configure platform-wide integrations (email service, analytics provider)
- **Security & Access View:** Manage access control for owner-level administrative staff

## 🔐 **OWNER-SPECIFIC PERMISSIONS**

### **Access Control:**
```typescript
const OWNER_PERMISSIONS = {
  platform: ['*:*'], // Full access to everything
  tenants: ['create', 'read', 'update', 'delete', 'suspend', 'billing'],
  settings: ['feature-flags', 'integrations', 'security', 'api-access'],
  ai: ['development', 'training', 'configuration', 'analytics'],
  financial: ['revenue', 'billing', 'plans', 'reconciliation'],
  system: ['monitoring', 'logs', 'performance', 'maintenance']
};
```

### **Security Requirements:**
- **MFA Required:** For sensitive changes (API keys, provider credentials, deleting tenants)
- **Audit Logging:** All owner actions logged with user ID, IP, timestamp, action details
- **Approval Flow:** AI-driven changes require manual approval before production deployment

## 📊 **SUCCESS METRICS & KPIs**

### **Business Intelligence:**
- **MRR (Monthly Recurring Revenue):** Primary growth metric
- **LTV (Customer Lifetime Value):** Long-term customer value
- **Churn Rate:** Customer retention indicator
- **Active Tenants:** Platform utilization metrics

### **System Health:**
- **API Response Times:** Performance monitoring
- **Error Rates:** System reliability metrics
- **Database Load:** Infrastructure health
- **AI Usage:** AI feature adoption and cost analysis

### **Data Sources & Refresh Policy:**
- **KPI Sources:** MRR/LTV/Churn from Billing Service (nightly batch with hourly rollups)
- **Active Tenants:** Derived from Tenant Service (refreshed every 5 minutes)
- **System Health:** Real-time monitoring data (refreshed every 30 seconds)
- **Retention:** Business metrics retained for 24 months

## 🚨 **ALERTS & ESCALATIONS**

### **Alert Severity Levels:**
- **Critical (Red):** Immediate action required (payment gateway down, major API error spike)
- **Warning (Yellow):** Action needed soon (degraded performance, intermittent errors)
- **Info (Blue):** Notifications or updates (scheduled maintenance completed)

### **Alert Delivery:**
- **Critical alerts:** Dashboard, email, and optional Slack/Webhook integration
- **Actions:** Acknowledge/assign/resolve functionality
- **Remediation:** Suggested steps and links to runbooks included

## 🎨 **DESIGN SYSTEM**

### **Owner Dashboard Color Scheme:**
```css
:root {
  --owner-primary: hsl(260 100% 50%);     /* Purple */
  --owner-secondary: hsl(270 85% 70%);    /* Light Purple */
  --owner-accent: hsl(280 100% 60%);      /* Magenta */
  --owner-success: hsl(142 76% 36%);      /* Green */
  --owner-warning: hsl(45 93% 47%);       /* Yellow */
  --owner-error: hsl(0 84% 60%);          /* Red */
  
  /* Gradient backgrounds */
  --owner-gradient: linear-gradient(
    135deg, 
    hsl(260 100% 50%) 0%, 
    hsl(280 100% 60%) 100%
  );
}
```

### **Layout Standards:**
- **Border Radius:** `1rem` for consistent rounded corners
- **Shadow:** `shadow-custom` for elevated elements
- **Spacing:** Predictable scale based on `1rem` units
- **Typography:** `Inter` font family with consistent type scale hierarchy

---

**Implementation Priority:**
1. ✅ Core dashboard layout with right sidebar navigation
2. ✅ Header contextual navigation system
3. ✅ Left sub-navigation for complex sections
4. ✅ Footer with app launcher integration
5. ✅ KPI dashboard with real-time metrics
6. 🔄 Concierge AI development tools
7. ⏳ Advanced analytics and reporting
8. ⏳ Complete app launcher overlay applications