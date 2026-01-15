
// --- CENTRAL APP CONFIGURATION ---

// 1. Right Sidebar Modules (Main Dashboard Pages)
export const NAV_CONFIG: Record<string, { label: string, icon: string, tabs: string[], subnav: Record<string, string[]> }> = {
    dashboard: {
        label: 'Dashboard',
        icon: 'Home',
        tabs: ['Overview', 'Analytics', 'Market', 'System'],
        subnav: {}
    },
    school: { // Tenant Mgt
        label: 'Tenant Mgt',
        icon: 'GraduationCap',
        tabs: ['Tenants', 'Platform Billing'],
        subnav: {
            'Tenants': ['Schools', 'Individuals'],
            'Platform Billing': ['Plans', 'Invoices', 'Gateways']
        }
    },
    crm: {
        label: 'Platform CRM',
        icon: 'Calculator',
        tabs: ['Sales Pipeline', 'Communication', 'Tenant Accounts'],
        subnav: {
            'Sales Pipeline': ['Deals', 'Contacts', 'Forecast', 'Analytics', 'Assignments', 'Enhancements'],
            'Communication': ['Email'],
            'Tenant Accounts': ['Active', 'Onboarding']
        }
    },
    tool_platform: {
        label: 'Tool-Platform',
        icon: 'Briefcase',
        tabs: ['Overview', 'Marketing', 'Finance', 'Business', 'Marketplace', 'Logs'],
        subnav: {
            'Overview': ['Platform', 'Marketing', 'Finance', 'Business'],
            'Marketing': ['Campaigns', 'Assets', 'Templates', 'Audience', 'AI Generator', 'Personalization', 'A/B Testing', 'CDP', 'Journey Builder', 'Scoring', 'Social Scheduler', 'Creative Studio', 'Attribution', 'Experiments'],
            'Finance': ['Reports', 'Revenue', 'Analytics', 'Reconciliation'],
            'Business': ['Rules', 'Pricing', 'Bundles', 'Segmentation'],
            'Marketplace': ['Apps', 'Submissions', 'Approvals', 'Dev Portal', 'Revenue Share'],
            'Logs': ['System', 'Error', 'Audit', 'API']
        }
    },
    communication: {
        label: 'Communication',
        icon: 'ChatBubbleLeftRight',
        tabs: ['Email', 'Social-Media', 'Community', 'Templates', 'Management'],
        subnav: {
            'Email': ['Inbox', 'Compose', 'Sent', 'Drafts', 'Archive', 'Spam'],
            'Social-Media': ['Posts', 'Scheduler', 'Analytics', 'Accounts'],
            'Community': ['Forums', 'Members', 'Moderation', 'Announcements'],
            'Templates': ['Email', 'Social', 'Notifications', 'SMS'],
            'Management': ['Settings', 'Permissions', 'Channels']
        }
    },
    activities: {
        label: 'Activities',
        icon: 'ActivitiesIcon3D',
        tabs: ['Local', 'Social', 'Planning'],
        subnav: {
            'Local': ['Community', 'Workshops'],
            'Social': ['Groups', 'Meetups'],
            'Planning': ['My Calendar']
        }
    },
    concierge_ai: {
        label: 'Concierge AI',
        icon: 'Sparkles',
        tabs: ['Assistant', 'Analytics', 'Operations', 'Development', 'Strategy', 'Settings'],
        subnav: {
            'Assistant': ['Chat', 'Workflows', 'Prompts', 'Knowledge Base'],
            'Analytics': ['Usage', 'Cost', 'Performance', 'User Behavior'],
            'Operations': ['Moderation', 'Trace', 'Health', 'Review Queue'],
            'Development': ['Playground', 'Routing', 'Fine-Tuning', 'Data Management', 'API Logs', 'Intelligence Levels'],
            'Strategy': ['Objectives', 'Scalability'],
            'Settings': ['Config', 'Access', 'Billing', 'Preferences']
        }
    },
    wellness: {
        label: 'Wellness',
        icon: 'Heart',
        tabs: ['Dashboard', 'Physical Health', 'Mental Wellness', 'Nutrition'],
        subnav: {
            'Dashboard': ['Overview', 'Goals', 'AI Coach'],
            'Physical Health': ['Activity', 'Sleep', 'Workouts'],
            'Mental Wellness': ['Meditation', 'Mood Log'],
            'Nutrition': ['Planner', 'Intake']
        }
    },
    tools: {
        label: 'Tools',
        icon: 'WrenchScrewdriver',
        tabs: ['Dev Essentials', 'Design & Media', 'Utilities', 'Resources'],
        subnav: {
            'Dev Essentials': ['JSON Formatter', 'Regex Tester', 'Markdown', 'UUID Gen', 'URL Encoder', 'Diff Viewer'],
            'Design & Media': ['Converter', 'Palette', 'QR Gen', 'Blob Maker', 'Glassmorphism'],
            'Utilities': ['PDF Tools', 'Units', 'Password', 'Speed Test', 'Time Zones', 'Stopwatch', 'Pomodoro', 'IP Lookup'],
            'Resources': ['Docs', 'Feature Grid']
        }
    },
    users: {
        label: 'Users',
        icon: 'UserGroup',
        tabs: ['All Users'],
        subnav: {
            'All Users': ['Directory', 'Roles']
        }
    },
    business_intelligence: {
        label: 'Business Intelligence',
        icon: 'ChartBar',
        tabs: ['Operations', 'Analytics', 'Reports', 'Automation', 'Compliance'],
        subnav: {
            'Operations': ['Trial Management', 'Subscription Lifecycle', 'Automated Tasks'],
            'Analytics': ['Churn Prediction', 'Revenue Analysis', 'Customer Health', 'Anomaly Detection', 'Advanced Analytics'],
            'Reports': ['Report Builder', 'Export Center', 'Scheduled Reports'],
            'Automation': ['Trial Automation', 'Email Workflows', 'IP Rate Limiting'],
            'Compliance': ['GDPR Tools', 'Data Retention', 'Audit Logs', 'Compliance Reports']
        }
    },
    settings: {
        label: 'Platform Settings',
        icon: 'Cog6Tooth',
        tabs: ['Account', 'Appearance', 'Configuration'],
        subnav: {
            'Account': ['Profile', 'Billing', 'Usage', 'Export'],
            'Appearance': ['Themes', 'Layout', 'Branding'],
            'Configuration': ['General', 'Feature Flags', 'Integrations', 'Security', 'Legal']
        }
    }
};

// School Admin Configuration
export const SCHOOL_ADMIN_CONFIG: typeof NAV_CONFIG = {
    dashboard: {
        label: 'Dashboard',
        icon: 'Home',
        tabs: ['Overview', 'Attendance', 'Performance', 'Events'],
        subnav: {
            'Overview': ['Stats', 'Alerts'],
            'Attendance': ['Daily', 'Reports', 'Staff'],
            'Performance': ['Grades', 'Exams'],
            'Events': ['Calendar', 'Announcements']
        }
    },
    crm: {
        label: 'Admissions & CRM',
        icon: 'Calculator',
        tabs: ['Admissions', 'Relations', 'Alumni'],
        subnav: {
            'Admissions': ['Pipeline', 'Inquiries', 'Applications', 'Stats'],
            'Relations': ['Student Log', 'Parent Log', 'Issues'],
            'Alumni': ['Directory', 'Events', 'Donations']
        }
    },
    academics: {
        label: 'Academics',
        icon: 'Book',
        tabs: ['Classes', 'Timetable', 'Curriculum', 'Exams'],
        subnav: {
            'Classes': ['All Classes', 'Add Class'],
            'Timetable': ['View', 'Edit'],
            'Curriculum': ['Subjects', 'Syllabus'],
            'Exams': ['Schedule', 'Grades', 'Reports']
        }
    },
    enrollment: {
        label: 'Enrollment',
        icon: 'UserPlusIcon',
        tabs: ['Class Enrollment', 'Waitlists'],
        subnav: {
            'Class Enrollment': ['Manage', 'History'],
            'Waitlists': ['View', 'Process']
        }
    },
    people: {
        label: 'People',
        icon: 'UserGroup',
        tabs: ['Students', 'Teachers', 'Staff', 'Parents'],
        subnav: {
            'Students': ['Directory', 'Admissions'],
            'Teachers': ['Directory', 'Assignments'],
            'Staff': ['Directory', 'Roles'],
            'Parents': ['Directory', 'Communications']
        }
    },
    finance: {
        label: 'Finance',
        icon: 'CurrencyDollarIcon',
        tabs: ['Overview', 'Fees', 'Payroll', 'Expenses', 'Invoices'],
        subnav: {
            'Overview': ['Summary'],
            'Fees': ['Collect', 'Reports', 'Defaulters'],
            'Payroll': ['Staff Salaries', 'Payslips'],
            'Expenses': ['Log Expense', 'Categories'],
            'Invoices': ['All', 'Create']
        }
    },
    attendance: {
        label: 'Attendance',
        icon: 'ClockIcon',
        tabs: ['Daily', 'Reports', 'Settings'],
        subnav: {
            'Daily': ['Mark Attendance', 'View Today'],
            'Reports': ['Student', 'Class', 'Monthly'],
            'Settings': ['Holidays', 'Sessions']
        }
    },
    grades: {
        label: 'Grades',
        icon: 'AcademicCapIcon',
        tabs: ['Gradebook', 'Reports', 'Settings'],
        subnav: {
            'Gradebook': ['Enter Grades', 'View All'],
            'Reports': ['Student Report', 'Class Analysis'],
            'Settings': ['Grading Scales', 'Weighting']
        }
    },
    services: {
        label: 'Services',
        icon: 'Briefcase',
        tabs: ['Offerings', 'Bookings'],
        subnav: {
            'Offerings': ['Manage', 'Categories'],
            'Bookings': ['Pending', 'Confirmed', 'History']
        }
    },
    communication: NAV_CONFIG.communication,
    concierge_ai: {
        label: 'Concierge AI',
        icon: 'Sparkles',
        tabs: ['Admin Assistant', 'Reports', 'Config'],
        subnav: {
            'Admin Assistant': ['Chat', 'Drafts'],
            'Reports': ['School Performance', 'Staff Usage'],
            'Config': ['Access Control', 'Integration']
        }
    },
    tools: {
        label: 'Admin Tools',
        icon: 'WrenchScrewdriver',
        tabs: ['Utilities', 'Resources'],
        subnav: {
            'Utilities': ['Data Import', 'Bulk Edit', 'Audit Log'],
            'Resources': ['Policy Docs', 'Templates']
        }
    },
    wellness: {
        label: 'School Wellness',
        icon: 'Heart',
        tabs: ['Staff', 'Students', 'Programs'],
        subnav: {
            'Staff': ['Health Checks', 'Surveys'],
            'Students': ['Activity Logs', 'Nutrition'],
            'Programs': ['Events', 'Initiatives']
        }
    },
    settings: {
        label: 'School Settings',
        icon: 'Cog6Tooth',
        tabs: ['Profile', 'Configuration', 'Access'],
        subnav: {
            'Profile': ['Info', 'Branding'],
            'Configuration': ['Academic Year', 'Grading System'],
            'Access': ['Roles', 'Permissions']
        }
    }
};

// Teacher Configuration
export const TEACHER_CONFIG: typeof NAV_CONFIG = {
    dashboard: {
        label: 'Dashboard',
        icon: 'Home',
        tabs: ['Overview', 'Schedule', 'Tasks'],
        subnav: {
            'Overview': ['Today', 'Alerts'],
            'Schedule': ['Week', 'Month'],
            'Tasks': ['To Do', 'Completed']
        }
    },
    classes: {
        label: 'My Classes',
        icon: 'Book',
        tabs: ['Classroom', 'Attendance', 'Grading'],
        subnav: {
            'Classroom': ['Students', 'Materials'],
            'Attendance': ['Mark', 'History'],
            'Grading': ['Enter Grades', 'Report Cards']
        }
    },
    assignments: {
        label: 'Assignments',
        icon: 'DocumentTextIcon',
        tabs: ['Active', 'Grading', 'Create', 'Archive'],
        subnav: {
            'Active': ['Due Soon', 'All'],
            'Grading': ['Pending', 'Completed'],
            'Create': ['New Assignment', 'Quiz'],
            'Archive': ['Past Terms']
        }
    },
    resources: {
        label: 'Resources',
        icon: 'Briefcase',
        tabs: ['Library', 'Lesson Plans', 'Shared'],
        subnav: {
            'Library': ['Books', 'Media'],
            'Lesson Plans': ['My Plans', 'Curriculum'],
            'Shared': ['Department', 'Public']
        }
    },
    communication: {
        label: 'Communication',
        icon: 'ChatBubbleLeftRight',
        tabs: ['Messages', 'Announcements'],
        subnav: {
            'Messages': ['Students', 'Parents', 'Staff'],
            'Announcements': ['Class', 'School']
        }
    },
    concierge_ai: {
        label: 'Teaching Assistant',
        icon: 'Sparkles',
        tabs: ['Lesson Prep', 'Grading AI', 'Insights'],
        subnav: {
            'Lesson Prep': ['Generate Plan', 'Create Quiz'],
            'Grading AI': ['Rubric Check', 'Feedback Gen'],
            'Insights': ['Student Progress', 'Class Trends']
        }
    },
    tools: {
        label: 'Teacher Tools',
        icon: 'WrenchScrewdriver',
        tabs: ['Classroom', 'Productivity'],
        subnav: {
            'Classroom': ['Whiteboard', 'Timer', 'Random Picker'],
            'Productivity': ['Notes', 'ToDo', 'Calendar']
        }
    },
    wellness: {
        label: 'My Wellness',
        icon: 'Heart',
        tabs: ['Stress', 'Activity', 'Resources'],
        subnav: {
            'Stress': ['Mindfulness', 'Breathing'],
            'Activity': ['Steps', 'Break Timer'],
            'Resources': ['Teacher Support', 'Community']
        }
    }
};

// Student Configuration
export const STUDENT_CONFIG: typeof NAV_CONFIG = {
    dashboard: {
        label: 'Dashboard',
        icon: 'Home',
        tabs: ['Overview', 'Timetable', 'Due Dates'],
        subnav: {
            'Overview': ['Progress', 'Announcements'],
            'Timetable': ['Today', 'Full Schedule'],
            'Due Dates': ['This Week', 'Next Week']
        }
    },
    courses: {
        label: 'My Courses',
        icon: 'Book',
        tabs: ['Subjects', 'Materials', 'Grades'],
        subnav: {
            'Subjects': ['All', 'Active'],
            'Materials': ['Downloads', 'Links'],
            'Grades': ['Recent', 'Transcript']
        }
    },
    assignments: {
        label: 'Assignments',
        icon: 'DocumentTextIcon',
        tabs: ['To Do', 'Submitted', 'Missed'],
        subnav: {
            'To Do': ['Urgent', 'All'],
            'Submitted': ['Graded', 'Pending'],
            'Missed': ['Late', 'History']
        }
    },
    activities: NAV_CONFIG.activities,
    concierge_ai: {
        label: 'Study Buddy',
        icon: 'Sparkles',
        tabs: ['Tutor', 'Writing Aid', 'Research'],
        subnav: {
            'Tutor': ['Ask Question', 'Explain Topic'],
            'Writing Aid': ['Grammar', 'Structure'],
            'Research': ['Find Sources', 'Summarize']
        }
    },
    wellness: NAV_CONFIG.wellness,
    tools: {
        label: 'Study Tools',
        icon: 'WrenchScrewdriver',
        tabs: ['Notes', 'Flashcards', 'Timer'],
        subnav: {
            'Notes': ['My Notes', 'Shared'],
            'Flashcards': ['Decks', 'Create'],
            'Timer': ['Pomodoro', 'Stopwatch']
        }
    }
};

// Parent Configuration
export const PARENT_CONFIG: typeof NAV_CONFIG = {
    dashboard: {
        label: 'Dashboard',
        icon: 'Home',
        tabs: ['Overview', 'Children', 'Notices'],
        subnav: {
            'Overview': ['Summary', 'Alerts'],
            'Children': ['Child 1', 'Child 2'],
            'Notices': ['School', 'Class']
        }
    },
    academic: {
        label: 'Academic Progress',
        icon: 'AcademicCapIcon',
        tabs: ['Grades', 'Attendance', 'Report Cards'],
        subnav: {
            'Grades': ['Recent', 'Term'],
            'Attendance': ['History', 'Absences'],
            'Report Cards': ['Download', 'View']
        }
    },
    finance: {
        label: 'Fees & Billing',
        icon: 'CurrencyDollarIcon',
        tabs: ['Invoices', 'Payment History', 'Methods'],
        subnav: {
            'Invoices': ['Due', 'Paid'],
            'Payment History': ['All Transactions'],
            'Methods': ['Cards', 'Bank']
        }
    },
    communication: {
        label: 'Communication',
        icon: 'ChatBubbleLeftRight',
        tabs: ['Teachers', 'Admin'],
        subnav: {
            'Teachers': ['Message', 'Meetings'],
            'Admin': ['Support', 'Inquiries']
        }
    },
    concierge_ai: {
        label: 'Parent Assistant',
        icon: 'Sparkles',
        tabs: ['Support', 'Insights'],
        subnav: {
            'Support': ['Ask Questions', 'School Policies'],
            'Insights': ['Learning Trends', 'Recommendations']
        }
    },
    wellness: {
        label: 'Family Wellness',
        icon: 'Heart',
        tabs: ['Overview', 'Resources'],
        subnav: {
            'Overview': ['Activity Summary', 'Nutrition'],
            'Resources': ['Articles', 'Tips']
        }
    },
    tools: {
        label: 'Tools',
        icon: 'WrenchScrewdriver',
        tabs: ['Documents', 'Calendar'],
        subnav: {
            'Documents': ['Forms', 'Uploads'],
            'Calendar': ['Family Sync', 'Events']
        }
    }
};

// Individual Configuration
export const INDIVIDUAL_CONFIG: typeof NAV_CONFIG = {
    dashboard: {
        label: 'Dashboard',
        icon: 'Home',
        tabs: ['Overview', 'Activity', 'Goals'],
        subnav: {
            'Overview': ['Stats', 'Suggestions'],
            'Activity': ['Recent', 'History'],
            'Goals': ['Personal', 'Professional']
        }
    },
    projects: {
        label: 'Projects',
        icon: 'FolderOpenIcon',
        tabs: ['All Projects', 'My Creations', 'Asset Library', 'Template Library'],
        subnav: {
            'All Projects': ['Active', 'Archived'],
            'My Creations': ['Images', 'Videos', 'Documents'],
            'Asset Library': ['Brand Kit', 'Stock', 'Uploads'],
            'Template Library': ['My Templates', 'Community']
        }
    },
    learning: {
        label: 'Learning',
        icon: 'AcademicCapIcon',
        tabs: ['Courses', 'Certificates', 'Pathways'],
        subnav: {
            'Courses': ['My Courses', 'Explore'],
            'Certificates': ['Earned', 'In Progress'],
            'Pathways': ['Skills', 'Career']
        }
    },
    concierge_ai: {
        label: 'Concierge AI',
        icon: 'Sparkles',
        tabs: ['Assistant', 'Productivity', 'Life'],
        subnav: {
            'Assistant': ['Chat', 'Tasks'],
            'Productivity': ['Drafting', 'Research'],
            'Life': ['Advice', 'Planning']
        }
    },
    wellness: NAV_CONFIG.wellness,
    tools: {
        label: 'Tools',
        icon: 'WrenchScrewdriver',
        tabs: ['Productivity', 'Utilities'],
        subnav: {
            'Productivity': ['Notes', 'ToDo', 'Calendar'],
            'Utilities': ['Converter', 'Calculator']
        }
    },
    settings: NAV_CONFIG.settings
};

// 2. Overlay Apps (Footer Dock Apps)
export const OVERLAY_CONFIG: Record<string, { tabs: string[], subnav: Record<string, string[]> }> = {
    'User Profile': {
        tabs: ['Personal Info', 'Security', 'Notifications', 'Preferences'],
        subnav: {
            'Personal Info': ['General', 'Contact'],
            'Security': ['Password', '2FA', 'Sessions'],
            'Notifications': ['Email', 'Push', 'SMS'],
            'Preferences': ['Language', 'Theme', 'Accessibility']
        }
    },
    'Creator Studio': {
        tabs: ['Designer', 'Video', 'Coder', 'Office'],
        subnav: {
            'Designer': ['Templates', 'Elements', 'Uploads', 'Text', 'Media', 'AI Tools', 'Brand', 'Collab'],
            'Video': ['Timeline', 'Effects', 'Transitions', 'Audio', 'Titles', 'AI Tools', 'Export'],
            'Coder': ['Editor', 'Files', 'AI Assistant', 'Debug', 'Extensions', 'Terminal', 'Collab'],
            'Office': ['Word', 'Excel', 'PowerPoint']
        }
    },
    'Settings': {
        tabs: ['Platform', 'Backend', 'Integrations'],
        subnav: {
            'Platform': ['Theme', 'Content', 'Assets', 'Permissions', 'API Keys', 'Versions'],
            'Backend': ['Marketplace', 'Calendar', 'Studio', 'Messaging', 'Media', 'Hobbies', 'Religion', 'Sport', 'Events', 'Services', 'Gamification', 'Help'],
            'Integrations': ['Available', 'Installed', 'Webhooks']
        }
    },
    'Messaging': {
        tabs: ['Main'],
        subnav: {
            'Main': ['Inbox', 'Channels', 'Direct', 'Archived']
        }
    },
    'Hobbies': {
        tabs: ['Creative', 'Collecting', 'Gaming'],
        subnav: {
            'Creative': ['Painting', 'Writing'],
            'Collecting': ['Stamps', 'Coins'],
            'Gaming': ['Solo', 'Multiplayer']
        }
    },
    'Religion': {
        tabs: ['Dashboard', 'Quran', 'Hadith', 'Prayer', 'Knowledge', 'Community', 'Ramadan'],
        subnav: {
            'Dashboard': ['Overview', 'Daily', 'Settings'],
            'Quran': ['Read', 'Tafsir', 'Memorization', 'Audio'],
            'Hadith': ['Collections', 'Seerah', 'Fiqh'],
            'Prayer': ['Times', 'Qibla', 'Tracker', 'Duas'],
            'Knowledge': ['History', 'Scholars', 'Inheritance'],
            'Community': ['Mosques', 'Groups', 'Events'],
            'Ramadan': ['Tracker', 'Hajj Guide', 'Zakat']
        }
    },
    'Sport': {
        tabs: ['Dashboard', 'Team Sports', 'Individual', 'Training', 'Esports', 'Outdoor', 'News', 'Fantasy', 'Venues', 'Coaching', 'Community'],
        subnav: {
            'Dashboard': ['Activity', 'Schedule', 'Goals', 'Analytics'],
            'Team Sports': ['Football', 'Basketball', 'Baseball', 'Hockey', 'Rugby', 'Cricket'],
            'Individual': ['Running', 'Swimming', 'Tennis', 'Golf', 'Combat', 'F1'],
            'Training': ['Specific', 'Conditioning', 'Agility', 'Skills'],
            'Esports': ['LoL', 'CS:GO', 'Dota 2', 'Valorant'],
            'Outdoor': ['Hiking', 'Climbing', 'Water Sports'],
            'News': ['Breaking', 'Scores', 'Transfers'],
            'Fantasy': ['Football', 'Basketball', 'Baseball', 'Soccer'],
            'Venues': ['Facilities', 'Gyms', 'Courts', 'Pools'],
            'Coaching': ['Find Coach', 'Virtual', 'Nutrition'],
            'Community': ['Groups', 'Partners', 'Challenges']
        }
    },
    'Events': {
        tabs: ['Discover', 'My Events', 'Planning'],
        subnav: {
            'Discover': ['Browse', 'Featured', 'Near Me'],
            'My Events': ['Upcoming', 'Past'],
            'Planning': ['Create Event', 'Drafts']
        }
    },
    'Services': {
        tabs: ['Home', 'Personal', 'Professional', 'Creative', 'Education', 'Transport', 'Marketplace', 'Provider'],
        subnav: {
            'Home': ['Cleaning', 'Repairs', 'Landscaping', 'Moving'],
            'Personal': ['Beauty', 'Health', 'Fitness', 'Pet Care'],
            'Professional': ['Consulting', 'Legal', 'Financial', 'IT'],
            'Creative': ['Photo', 'Video', 'Design', 'Writing'],
            'Education': ['Tutoring', 'Languages', 'Skills'],
            'Transport': ['Rides', 'Delivery'],
            'Marketplace': ['Search', 'Providers', 'Bookings', 'Reviews'],
            'Provider': ['Profile', 'Schedule', 'Earnings']
        }
    },
    'Market': {
        tabs: ['Shop', 'Categories', 'Orders', 'Sell', 'Account', 'Prime', 'Social'],
        subnav: {
            'Shop': ['All', 'Deals', 'Best Sellers', 'New', 'Trending', 'For You'],
            'Categories': ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Books', 'Toys', 'Auto'],
            'Orders': ['History', 'Buy Again', 'Track', 'Returns', 'Subscribe'],
            'Sell': ['Dashboard', 'Add Product', 'Inventory', 'Orders', 'Ads'],
            'Account': ['Profile', 'Payments', 'Addresses', 'Lists'],
            'Prime': ['Benefits', 'Video', 'Music', 'Reading', 'Gaming'],
            'Social': ['Live', 'Community', 'Influencers', 'Gift Center']
        }
    },
    'Media': {
        tabs: ['Home', 'Movies', 'Series', 'Docs', 'Anime', 'Live TV', 'Search', 'Account'],
        subnav: {
            'Home': ['Continue', 'My List', 'Trending', 'New', 'For You'],
            'Movies': ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'],
            'Series': ['Drama', 'Comedy', 'Crime', 'Reality', 'Kids'],
            'Docs': ['Nature', 'History', 'Science', 'True Crime'],
            'Anime': ['Action', 'Romance', 'Fantasy', 'Movies'],
            'Live TV': ['News', 'Sports', 'Entertainment', 'Kids'],
            'Search': ['Genres', 'Year', 'Country', 'Top Rated'],
            'Account': ['History', 'Downloads', 'Profiles', 'Billing']
        }
    },
    'Activities': {
        tabs: ['Local', 'Social', 'Planning', 'Neighborhood', 'Interests', 'Family'],
        subnav: {
            'Local': ['Community', 'Workshops', 'Meetups', 'Volunteer'],
            'Social': ['Interest Groups', 'Age-Based', 'Professional'],
            'Planning': ['Create', 'My Activities', 'Calendar', 'RSVP'],
            'Neighborhood': ['Directory', 'Board', 'Safety', 'Market'],
            'Interests': ['Books', 'Photo', 'Cooking', 'Art', 'Music'],
            'Family': ['Kids', 'Parents', 'School', 'Youth', 'Seniors']
        }
    },
    'Travel & Transport': {
        tabs: ['Planning', 'Booking', 'Maps', 'Local', 'Management', 'Stay', 'Community'],
        subnav: {
            'Planning': ['Destinations', 'Itinerary', 'Budget', 'Calendar'],
            'Booking': ['Flights', 'Hotels', 'Cars', 'Trains', 'Tours'],
            'Maps': ['GPS', 'Public Transport', 'Traffic', 'Offline'],
            'Local': ['Ride Share', 'Taxi', 'Metro', 'Bike'],
            'Management': ['My Trips', 'Docs', 'Expenses'],
            'Stay': ['Hotels', 'Rentals', 'Hostels', 'Resorts'],
            'Community': ['Groups', 'Guides', 'Forums', 'Blogs']
        }
    },
    'Gamification': {
        tabs: ['Achievements', 'Leaderboards', 'Rewards'],
        subnav: {
            'Achievements': ['Badges', 'Milestones'],
            'Leaderboards': ['Global', 'Friends'],
            'Rewards': ['Store', 'My Items']
        }
    },
    'Help Center': { tabs: ['Home', 'Tickets', 'FAQ'], subnav: { 'Home': ['Search'], 'Tickets': ['My Tickets', 'New'], 'FAQ': ['Browse'] } },
    'Overlay Setting': { tabs: ['General', 'Display'], subnav: { 'General': ['Preferences'], 'Display': ['Resolution'] } },
    'EduMultiverse': {
        tabs: ['Map', 'Fusion Lab', 'Glitches', 'Quiz', 'Time Loop', 'Leaderboard'],
        subnav: {
            'Map': ['Universes', 'Anomalies'],
            'Fusion Lab': ['Workbench', 'Recipes', 'Inventory'],
            'Glitches': ['Active', 'Resolved'],
            'Quiz': ['Daily', 'Challenge'],
            'Time Loop': ['Current', 'History'],
            'Leaderboard': ['Global', 'Friends']
        }
    },
};
