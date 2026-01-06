import React from 'react';
import { ModuleDefinition } from './types';

// Lazy load all application modules
const OwnerDashboard = React.lazy(() => import('../apps/dashboards/OwnerDashboard'));
const TenantMgt = React.lazy(() => import('../apps/TenantMgt'));
const PlatformCRM = React.lazy(() => import('../apps/PlatformCRM'));
const ToolPlatform = React.lazy(() => import('../apps/ToolPlatform'));
const Communication = React.lazy(() => import('../apps/Communication'));
const ActivitiesApp = React.lazy(() => import('../apps/ActivitiesApp'));
const ConciergeAI = React.lazy(() => import('../apps/ConciergeAI'));
const Wellness = React.lazy(() => import('../apps/Wellness'));
const Tools = React.lazy(() => import('../apps/Tools'));
const PlatformSettings = React.lazy(() => import('../apps/PlatformSettings'));
const OverlaySettings = React.lazy(() => import('../apps/OverlaySettings'));
const UserManagement = React.lazy(() => import('../apps/owner/UserManagement'));
const BusinessIntelligence = React.lazy(() => import('../apps/BusinessIntelligence'));

export const MODULE_REGISTRY: ModuleDefinition[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Home',
        component: OwnerDashboard,
        tabs: ['Overview', 'Analytics', 'Market', 'System'],
        subnav: {}
    },
    {
        id: 'school',
        label: 'Tenant Mgt',
        icon: 'GraduationCap',
        component: TenantMgt,
        tabs: ['Tenants', 'Platform Billing'],
        subnav: {
            'Tenants': ['Schools', 'Individuals'],
            'Platform Billing': ['Plans', 'Invoices', 'Gateways']
        }
    },
    {
        id: 'crm',
        label: 'Platform CRM',
        icon: 'Calculator',
        component: PlatformCRM,
        tabs: ['Sales Pipeline', 'Tenant Accounts'],
        subnav: {
            'Sales Pipeline': ['Deals', 'Contacts', 'Forecast'],
            'Tenant Accounts': ['Active', 'Onboarding']
        }
    },
    {
        id: 'tool_platform',
        label: 'Tool-Platform',
        icon: 'Briefcase',
        component: ToolPlatform,
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
    {
        id: 'communication',
        label: 'Communication',
        icon: 'ChatBubbleLeftRight',
        component: Communication,
        tabs: ['Email', 'Social-Media', 'Community', 'Templates', 'Management'],
        subnav: {
            'Email': ['Inbox', 'Compose', 'Sent', 'Drafts', 'Archive', 'Spam'],
            'Social-Media': ['Posts', 'Scheduler', 'Analytics', 'Accounts'],
            'Community': ['Forums', 'Members', 'Moderation', 'Announcements'],
            'Templates': ['Email', 'Social', 'Notifications', 'SMS'],
            'Management': ['Settings', 'Permissions', 'Channels']
        }
    },
    {
        id: 'activities',
        label: 'Activities',
        icon: 'ActivitiesIcon3D',
        component: ActivitiesApp,
        tabs: ['Local', 'Social', 'Planning'],
        subnav: {
            'Local': ['Community', 'Workshops'],
            'Social': ['Groups', 'Meetups'],
            'Planning': ['My Calendar']
        }
    },
    {
        id: 'concierge_ai',
        label: 'Concierge AI',
        icon: 'Sparkles',
        component: ConciergeAI,
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
    {
        id: 'wellness',
        label: 'Wellness',
        icon: 'Heart',
        component: Wellness,
        tabs: ['Dashboard', 'Physical Health', 'Mental Wellness', 'Nutrition'],
        subnav: {
            'Dashboard': ['Overview', 'Goals', 'AI Coach'],
            'Physical Health': ['Activity', 'Sleep', 'Workouts'],
            'Mental Wellness': ['Meditation', 'Mood Log'],
            'Nutrition': ['Planner', 'Intake']
        }
    },
    {
        id: 'tools',
        label: 'Tools',
        icon: 'WrenchScrewdriver',
        component: Tools,
        tabs: ['Dev Essentials', 'Design & Media', 'Utilities', 'Resources'],
        subnav: {
            'Dev Essentials': ['JSON Formatter', 'Regex Tester', 'Markdown', 'UUID Gen', 'URL Encoder', 'Diff Viewer'],
            'Design & Media': ['Converter', 'Palette', 'QR Gen', 'Blob Maker', 'Glassmorphism'],
            'Utilities': ['PDF Tools', 'Units', 'Password', 'Speed Test', 'Time Zones', 'Stopwatch', 'Pomodoro', 'IP Lookup'],
            'Resources': ['Docs', 'Feature Grid']
        }
    },
    {
        id: 'users',
        label: 'User Management',
        icon: 'Users',
        component: UserManagement,
        tabs: ['Users', 'Roles', 'Permissions'],
        subnav: {}
    },
    {
        id: 'overlay_setting',
        label: 'Overlay-Setting',
        icon: 'SquaresPlus',
        component: OverlaySettings,
        tabs: ['Overview', 'Content', 'Apps', 'Versions'],
        subnav: {
            'Apps': ['Studio', 'Media', 'Messaging', 'Help', 'Hobbies', 'Religion', 'Sport', 'Events', 'Services', 'Gamification', 'Calendar', 'Marketplace'],
            'Content': ['Templates', 'Global Assets', 'Themes']
        }
    },
    {
        id: 'business_intelligence',
        label: 'Business Intelligence',
        icon: 'ChartBar',
        component: BusinessIntelligence,
        tabs: ['Operations', 'Analytics', 'Reports', 'Automation', 'Compliance'],
        subnav: {
            'Operations': ['Trial Management', 'Subscription Lifecycle', 'Automated Tasks'],
            'Analytics': ['Churn Prediction', 'Revenue Analysis', 'Customer Health', 'Advanced Analytics', 'Anomaly Detection'],
            'Reports': ['Report Builder', 'Export Center', 'Scheduled Reports'],
            'Automation': ['Trial Automation', 'Email Workflows', 'IP Rate Limiting'],
            'Compliance': ['GDPR Tools', 'Data Retention', 'Audit Logs', 'Compliance Reports']
        }
    },
    {
        id: 'settings',
        label: 'Platform Settings',
        icon: 'Cog6Tooth',
        component: PlatformSettings,
        tabs: ['General', 'Integrations', 'Security', 'Legal', 'Appearance'],
        subnav: {
            'General': ['Branding', 'Localization'],
            'Integrations': ['Email', 'Analytics', 'Payment'],
            'Security': ['Access Control', 'Audit Logs'],
            'Legal': ['Terms', 'Privacy'],
            'Appearance': ['Themes']
        }
    }
];

export const getModuleConfig = () => {
    const config: Record<string, any> = {};
    MODULE_REGISTRY.forEach(module => {
        config[module.id] = {
            label: module.label,
            icon: module.icon,
            tabs: module.tabs,
            subnav: module.subnav || {}
        };
    });
    return config;
};
