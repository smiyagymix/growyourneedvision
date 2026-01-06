/**
 * Premium Features Hook
 * Provides utilities for checking premium feature access across the platform
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { featureFlagService } from '../services/featureFlagService';

export type PlanTier = 'free' | 'basic' | 'premium' | 'enterprise';

export interface PremiumFeature {
    key: string;
    name: string;
    description: string;
    requiredPlan: PlanTier;
    category: string;
}

// Define all premium features in the platform
export const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
    // Teacher Features
    AI_LESSON_PLANNING: {
        key: 'ai_lesson_planning',
        name: 'AI Lesson Planning',
        description: 'Generate lesson plans automatically with AI',
        requiredPlan: 'premium',
        category: 'teacher'
    },
    ADVANCED_GRADING: {
        key: 'advanced_grading',
        name: 'Advanced Grading Analytics',
        description: 'Detailed insights and predictive analytics for student performance',
        requiredPlan: 'premium',
        category: 'teacher'
    },
    BULK_ASSIGNMENT_CREATION: {
        key: 'bulk_assignment_creation',
        name: 'Bulk Assignment Creation',
        description: 'Create multiple assignments at once',
        requiredPlan: 'basic',
        category: 'teacher'
    },
    CUSTOM_RUBRICS: {
        key: 'custom_rubrics',
        name: 'Custom Rubrics',
        description: 'Create and save custom grading rubrics',
        requiredPlan: 'premium',
        category: 'teacher'
    },
    
    // Student Features
    AI_TUTOR: {
        key: 'ai_tutor',
        name: 'AI Tutor Assistant',
        description: 'Get personalized help from AI on assignments',
        requiredPlan: 'premium',
        category: 'student'
    },
    STUDY_PLANNER: {
        key: 'study_planner',
        name: 'Smart Study Planner',
        description: 'AI-powered study schedule optimization',
        requiredPlan: 'basic',
        category: 'student'
    },
    PLAGIARISM_CHECK: {
        key: 'plagiarism_check',
        name: 'Plagiarism Checker',
        description: 'Check your work for originality before submission',
        requiredPlan: 'premium',
        category: 'student'
    },
    PEER_COLLABORATION: {
        key: 'peer_collaboration',
        name: 'Peer Collaboration Tools',
        description: 'Real-time collaboration with classmates',
        requiredPlan: 'basic',
        category: 'student'
    },
    
    // School Admin Features
    ADVANCED_ANALYTICS: {
        key: 'advanced_analytics',
        name: 'Advanced Analytics Dashboard',
        description: 'Comprehensive school-wide analytics and reporting',
        requiredPlan: 'premium',
        category: 'admin'
    },
    BULK_OPERATIONS: {
        key: 'bulk_operations',
        name: 'Bulk User Operations',
        description: 'Manage multiple users, classes, and resources at once',
        requiredPlan: 'basic',
        category: 'admin'
    },
    WHITE_LABEL: {
        key: 'white_label',
        name: 'White Label Branding',
        description: 'Customize platform with your school branding',
        requiredPlan: 'enterprise',
        category: 'admin'
    },
    API_ACCESS: {
        key: 'api_access',
        name: 'API Access',
        description: 'Integrate with external systems via API',
        requiredPlan: 'enterprise',
        category: 'admin'
    },
    CUSTOM_REPORTS: {
        key: 'custom_reports',
        name: 'Custom Report Builder',
        description: 'Create custom reports with advanced filters',
        requiredPlan: 'premium',
        category: 'admin'
    },
    
    // Communication Features
    VIDEO_CONFERENCING: {
        key: 'video_conferencing',
        name: 'Video Conferencing',
        description: 'Built-in video calls and virtual classrooms',
        requiredPlan: 'premium',
        category: 'communication'
    },
    SMS_NOTIFICATIONS: {
        key: 'sms_notifications',
        name: 'SMS Notifications',
        description: 'Send important updates via SMS',
        requiredPlan: 'premium',
        category: 'communication'
    },
    BROADCAST_MESSAGING: {
        key: 'broadcast_messaging',
        name: 'Broadcast Messaging',
        description: 'Send messages to large groups instantly',
        requiredPlan: 'basic',
        category: 'communication'
    },
    
    // Creator Studio Features
    ADVANCED_VIDEO_EDITING: {
        key: 'advanced_video_editing',
        name: 'Advanced Video Editing',
        description: 'Professional video editing tools with effects',
        requiredPlan: 'premium',
        category: 'creator'
    },
    HD_EXPORT: {
        key: 'hd_export',
        name: 'HD Video Export',
        description: 'Export videos in 1080p and 4K quality',
        requiredPlan: 'premium',
        category: 'creator'
    },
    AI_CONTENT_GENERATION: {
        key: 'ai_content_generation',
        name: 'AI Content Generation',
        description: 'Generate content with AI assistance',
        requiredPlan: 'basic',
        category: 'creator'
    },
    STOCK_ASSETS: {
        key: 'stock_assets',
        name: 'Premium Stock Assets',
        description: 'Access to premium images, videos, and audio',
        requiredPlan: 'premium',
        category: 'creator'
    },
    
    // Marketplace Features
    PRIORITY_LISTING: {
        key: 'priority_listing',
        name: 'Priority Marketplace Listing',
        description: 'Your products appear first in search results',
        requiredPlan: 'premium',
        category: 'marketplace'
    },
    REDUCED_FEES: {
        key: 'reduced_fees',
        name: 'Reduced Transaction Fees',
        description: 'Lower fees on marketplace transactions',
        requiredPlan: 'basic',
        category: 'marketplace'
    },
    
    // Parent Features
    DETAILED_REPORTS: {
        key: 'detailed_reports',
        name: 'Detailed Progress Reports',
        description: 'In-depth analysis of your child\'s academic progress',
        requiredPlan: 'basic',
        category: 'parent'
    },
    MULTI_CHILD_DASHBOARD: {
        key: 'multi_child_dashboard',
        name: 'Multi-Child Dashboard',
        description: 'Manage multiple children from one account',
        requiredPlan: 'premium',
        category: 'parent'
    },
    
    // Individual/Personal Features
    AI_PROJECT_IDEAS: {
        key: 'ai_project_ideas',
        name: 'AI Project Ideas Generator',
        description: 'Get creative project suggestions powered by AI',
        requiredPlan: 'basic',
        category: 'individual'
    },
    ADVANCED_PROJECT_ANALYTICS: {
        key: 'advanced_project_analytics',
        name: 'Advanced Project Analytics',
        description: 'Detailed insights into project progress and productivity',
        requiredPlan: 'premium',
        category: 'individual'
    },
    UNLIMITED_PROJECTS: {
        key: 'unlimited_projects',
        name: 'Unlimited Projects',
        description: 'Create unlimited projects without restrictions',
        requiredPlan: 'premium',
        category: 'individual'
    },
    
    // Wellness Features
    AI_MEAL_PLANNER: {
        key: 'ai_meal_planner',
        name: 'AI Meal Planner',
        description: 'Personalized meal plans generated by AI',
        requiredPlan: 'premium',
        category: 'wellness'
    },
    ADVANCED_WELLNESS_REPORTS: {
        key: 'advanced_wellness_reports',
        name: 'Advanced Wellness Reports',
        description: 'Comprehensive health and wellness analytics',
        requiredPlan: 'premium',
        category: 'wellness'
    },
    WELLNESS_COACH: {
        key: 'wellness_coach',
        name: 'AI Wellness Coach',
        description: '24/7 AI-powered wellness coaching and guidance',
        requiredPlan: 'basic',
        category: 'wellness'
    },
    
    // Media Features
    HD_STREAMING: {
        key: 'hd_streaming',
        name: 'HD Streaming',
        description: 'Stream content in 1080p HD quality',
        requiredPlan: 'premium',
        category: 'media'
    },
    OFFLINE_DOWNLOADS: {
        key: 'offline_downloads',
        name: 'Offline Downloads',
        description: 'Download content for offline viewing',
        requiredPlan: 'premium',
        category: 'media'
    },
    EXCLUSIVE_CONTENT: {
        key: 'exclusive_content',
        name: 'Exclusive Premium Content',
        description: 'Access to premium-only media library',
        requiredPlan: 'premium',
        category: 'media'
    },
    MULTIPLE_PROFILES: {
        key: 'multiple_profiles',
        name: 'Multiple User Profiles',
        description: 'Create separate profiles for family members',
        requiredPlan: 'basic',
        category: 'media'
    },
    
    // Religion Features
    ADVANCED_DHIKR_TRACKER: {
        key: 'advanced_dhikr_tracker',
        name: 'Advanced Dhikr Tracker',
        description: 'Track your dhikr history with analytics and streaks',
        requiredPlan: 'basic',
        category: 'religion'
    },
    AI_SPIRITUAL_GUIDANCE: {
        key: 'ai_spiritual_guidance',
        name: 'AI Spiritual Guidance',
        description: 'Personalized Islamic guidance powered by AI',
        requiredPlan: 'premium',
        category: 'religion'
    },
    OFFLINE_QURAN: {
        key: 'offline_quran',
        name: 'Offline Quran Access',
        description: 'Download Quran recitations and translations',
        requiredPlan: 'premium',
        category: 'religion'
    },
    ISLAMIC_COURSES: {
        key: 'islamic_courses',
        name: 'Premium Islamic Courses',
        description: 'Access to exclusive Islamic learning courses',
        requiredPlan: 'premium',
        category: 'religion'
    },
    
    // Sport Features
    ADVANCED_SPORTS_ANALYTICS: {
        key: 'advanced_sports_analytics',
        name: 'Advanced Sports Analytics',
        description: 'Detailed performance metrics and predictions',
        requiredPlan: 'premium',
        category: 'sport'
    },
    LIVE_SPORTS_STREAMING: {
        key: 'live_sports_streaming',
        name: 'Live Sports Streaming',
        description: 'Watch live matches with HD streaming',
        requiredPlan: 'premium',
        category: 'sport'
    },
    BETTING_FEATURES: {
        key: 'betting_features',
        name: 'Sports Betting Integration',
        description: 'Responsible sports betting with analytics',
        requiredPlan: 'enterprise',
        category: 'sport'
    },
    
    // Travel Features
    AI_TRAVEL_PLANNER: {
        key: 'ai_travel_planner',
        name: 'AI Travel Planner',
        description: 'AI-powered personalized itinerary generation',
        requiredPlan: 'premium',
        category: 'travel'
    },
    TRAVEL_CONCIERGE: {
        key: 'travel_concierge',
        name: '24/7 Travel Concierge',
        description: 'Personal travel assistant for bookings and support',
        requiredPlan: 'enterprise',
        category: 'travel'
    },
    PRICE_ALERTS: {
        key: 'price_alerts',
        name: 'Price Drop Alerts',
        description: 'Get notified when prices drop for your trips',
        requiredPlan: 'basic',
        category: 'travel'
    },
    
    // Tools Platform Features
    ADVANCED_AUTOMATION: {
        key: 'advanced_automation',
        name: 'Advanced Workflow Automation',
        description: 'Complex multi-step automation workflows',
        requiredPlan: 'premium',
        category: 'tools'
    },
    CUSTOM_INTEGRATIONS: {
        key: 'custom_integrations',
        name: 'Custom API Integrations',
        description: 'Connect any external service with custom API',
        requiredPlan: 'enterprise',
        category: 'tools'
    },
    PRIORITY_SUPPORT: {
        key: 'priority_support',
        name: 'Priority Support',
        description: '24/7 priority customer support with dedicated agent',
        requiredPlan: 'premium',
        category: 'tools'
    },
    
    // Activities & Events Features
    PRIORITY_EVENT_LISTINGS: {
        key: 'priority_event_listings',
        name: 'Priority Event Listings',
        description: 'Your events appear at the top of search results',
        requiredPlan: 'premium',
        category: 'events'
    },
    VIP_EVENT_ACCESS: {
        key: 'vip_event_access',
        name: 'VIP Event Access',
        description: 'Early bird tickets and exclusive event access',
        requiredPlan: 'enterprise',
        category: 'events'
    },
    EVENT_ANALYTICS: {
        key: 'event_analytics',
        name: 'Event Analytics Dashboard',
        description: 'Track attendance, engagement, and ROI',
        requiredPlan: 'premium',
        category: 'events'
    },
    
    // Help Center Features
    PRIORITY_TICKET_ROUTING: {
        key: 'priority_ticket_routing',
        name: 'Priority Ticket Routing',
        description: 'Your support tickets get immediate attention',
        requiredPlan: 'premium',
        category: 'support'
    },
    DEDICATED_SUPPORT_AGENT: {
        key: 'dedicated_support_agent',
        name: 'Dedicated Support Agent',
        description: 'Personal support agent who knows your history',
        requiredPlan: 'enterprise',
        category: 'support'
    },
    VIDEO_SUPPORT_CALLS: {
        key: 'video_support_calls',
        name: 'Video Support Calls',
        description: 'Screen sharing and video call support',
        requiredPlan: 'premium',
        category: 'support'
    },
    
    // Communication Features (Enhanced)
    BULK_EMAIL_CAMPAIGNS: {
        key: 'bulk_email_campaigns',
        name: 'Bulk Email Campaigns',
        description: 'Send newsletters and campaigns to unlimited recipients',
        requiredPlan: 'premium',
        category: 'communication'
    },
    EMAIL_TEMPLATES: {
        key: 'email_templates',
        name: 'Email Templates Library',
        description: 'Access 100+ professional email templates',
        requiredPlan: 'basic',
        category: 'communication'
    },
    ANALYTICS_DASHBOARD: {
        key: 'analytics_dashboard',
        name: 'Communication Analytics',
        description: 'Track open rates, click rates, and engagement',
        requiredPlan: 'premium',
        category: 'communication'
    },
    
    // Calendar & Scheduling Features
    SMART_SCHEDULING: {
        key: 'smart_scheduling',
        name: 'AI Smart Scheduling',
        description: 'Automatically find optimal meeting times',
        requiredPlan: 'premium',
        category: 'calendar'
    },
    CALENDAR_SYNC: {
        key: 'calendar_sync',
        name: 'Multi-Calendar Sync',
        description: 'Sync with Google, Outlook, Apple Calendar',
        requiredPlan: 'basic',
        category: 'calendar'
    },
    MEETING_ANALYTICS: {
        key: 'meeting_analytics',
        name: 'Meeting Analytics',
        description: 'Track meeting time, productivity, and patterns',
        requiredPlan: 'premium',
        category: 'calendar'
    },
    
    // Goals & Habits Features
    AI_GOAL_COACHING: {
        key: 'ai_goal_coaching',
        name: 'AI Goal Coaching',
        description: 'Personalized coaching and accountability',
        requiredPlan: 'premium',
        category: 'goals'
    },
    HABIT_STREAKS: {
        key: 'habit_streaks',
        name: 'Advanced Habit Tracking',
        description: 'Streak analytics and habit formation insights',
        requiredPlan: 'basic',
        category: 'goals'
    },
    GOAL_SHARING: {
        key: 'goal_sharing',
        name: 'Goal Sharing & Accountability',
        description: 'Share goals with friends for accountability',
        requiredPlan: 'premium',
        category: 'goals'
    },
    
    // Files & Documents Features
    UNLIMITED_STORAGE: {
        key: 'unlimited_storage',
        name: 'Unlimited Cloud Storage',
        description: '1TB+ storage for all your files',
        requiredPlan: 'premium',
        category: 'files'
    },
    VERSION_HISTORY: {
        key: 'version_history',
        name: 'Version History',
        description: '30-day file version history and recovery',
        requiredPlan: 'basic',
        category: 'files'
    },
    ADVANCED_SHARING: {
        key: 'advanced_sharing',
        name: 'Advanced File Sharing',
        description: 'Password protection, expiry dates, analytics',
        requiredPlan: 'premium',
        category: 'files'
    },
    
    // Social & Community Features
    VERIFIED_BADGE: {
        key: 'verified_badge',
        name: 'Verified Badge',
        description: 'Stand out with a verified checkmark',
        requiredPlan: 'premium',
        category: 'social'
    },
    PROMOTED_POSTS: {
        key: 'promoted_posts',
        name: 'Promoted Posts',
        description: 'Boost your posts to reach more people',
        requiredPlan: 'premium',
        category: 'social'
    },
    COMMUNITY_ANALYTICS: {
        key: 'community_analytics',
        name: 'Community Analytics',
        description: 'Track engagement, reach, and influence',
        requiredPlan: 'premium',
        category: 'social'
    },
    
    // Finance & Budget Features
    AI_BUDGET_ADVISOR: {
        key: 'ai_budget_advisor',
        name: 'AI Budget Advisor',
        description: 'Smart spending insights and recommendations',
        requiredPlan: 'premium',
        category: 'finance'
    },
    INVESTMENT_TRACKING: {
        key: 'investment_tracking',
        name: 'Investment Portfolio Tracking',
        description: 'Track stocks, crypto, and investments',
        requiredPlan: 'premium',
        category: 'finance'
    },
    TAX_OPTIMIZATION: {
        key: 'tax_optimization',
        name: 'Tax Optimization Tools',
        description: 'Maximize deductions and tax savings',
        requiredPlan: 'enterprise',
        category: 'finance'
    },

    // === PHASE 6 FEATURES (15 new features) ===

    // Wellness & Health Features
    AI_HEALTH_COACH: {
        key: 'ai_health_coach',
        name: 'AI Health & Fitness Coach',
        description: 'Personalized workout plans and nutrition guidance',
        requiredPlan: 'premium',
        category: 'wellness'
    },
    ADVANCED_HEALTH_ANALYTICS: {
        key: 'advanced_health_analytics',
        name: 'Advanced Health Analytics',
        description: 'Detailed health metrics, trends, and insights',
        requiredPlan: 'basic',
        category: 'wellness'
    },
    MEAL_PLAN_GENERATOR: {
        key: 'meal_plan_generator',
        name: 'AI Meal Plan Generator',
        description: 'Custom meal plans based on dietary needs and goals',
        requiredPlan: 'premium',
        category: 'wellness'
    },

    // Learning & Skills Features
    UNLIMITED_COURSES: {
        key: 'unlimited_courses',
        name: 'Unlimited Course Access',
        description: 'Access all premium courses and learning materials',
        requiredPlan: 'premium',
        category: 'learning'
    },
    CERTIFICATION_TRACKING: {
        key: 'certification_tracking',
        name: 'Certification & Badge System',
        description: 'Earn and showcase verified certifications',
        requiredPlan: 'basic',
        category: 'learning'
    },
    PERSONALIZED_LEARNING_PATH: {
        key: 'personalized_learning_path',
        name: 'AI Learning Path Planner',
        description: 'Custom learning roadmaps based on your goals',
        requiredPlan: 'premium',
        category: 'learning'
    },

    // Project Management Features
    ADVANCED_PROJECT_TOOLS: {
        key: 'advanced_project_tools',
        name: 'Advanced Project Management',
        description: 'Gantt charts, dependencies, resource allocation',
        requiredPlan: 'premium',
        category: 'projects'
    },
    TEAM_COLLABORATION: {
        key: 'team_collaboration',
        name: 'Team Collaboration Suite',
        description: 'Real-time collaboration, comments, file sharing',
        requiredPlan: 'basic',
        category: 'projects'
    },
    PROJECT_TEMPLATES: {
        key: 'project_templates',
        name: 'Premium Project Templates',
        description: 'Access 100+ professional project templates',
        requiredPlan: 'premium',
        category: 'projects'
    },

    // Communication Features - MESSAGE_SCHEDULING only (VIDEO_CONFERENCING and PRIORITY_SUPPORT already defined earlier)
    MESSAGE_SCHEDULING: {
        key: 'message_scheduling',
        name: 'Message Scheduling',
        description: 'Schedule messages for later delivery',
        requiredPlan: 'basic',
        category: 'communication'
    },

    // Analytics & Reporting Features
    CROSS_PLATFORM_ANALYTICS: {
        key: 'cross_platform_analytics',
        name: 'Cross-Platform Analytics',
        description: 'Unified analytics across all modules',
        requiredPlan: 'premium',
        category: 'analytics'
    },
    CUSTOM_DASHBOARDS: {
        key: 'custom_dashboards',
        name: 'Custom Dashboard Builder',
        description: 'Create personalized analytics dashboards',
        requiredPlan: 'basic',
        category: 'analytics'
    },
    DATA_EXPORT: {
        key: 'data_export',
        name: 'Advanced Data Export',
        description: 'Export all data in multiple formats (CSV, JSON, PDF)',
        requiredPlan: 'enterprise',
        category: 'analytics'
    },

    // === PHASE 7: Creator & Content Features ===
    
    // Creator Studio Features (3)
    PROFESSIONAL_VIDEO_EXPORT: {
        key: 'professional_video_export',
        name: 'Professional Video Export',
        description: '4K video export, advanced codecs, and no watermark',
        requiredPlan: 'premium',
        category: 'creator'
    },
    DESIGN_TEMPLATES_PRO: {
        key: 'design_templates_pro',
        name: 'Pro Design Templates',
        description: 'Access 1000+ premium design templates',
        requiredPlan: 'basic',
        category: 'creator'
    },
    // Note: AI_CONTENT_GENERATION already defined in earlier phase

    // Media & Entertainment Features (3) - OFFLINE_DOWNLOADS already defined, only adding new ones - OFFLINE_DOWNLOADS already defined, only adding new ones
    HD_4K_STREAMING: {
        key: 'hd_4k_streaming',
        name: 'HD & 4K Streaming',
        description: 'Stream content in up to 4K resolution',
        requiredPlan: 'premium',
        category: 'media'
    },
    MULTI_DEVICE_STREAMING: {
        key: 'multi_device_streaming',
        name: 'Multi-Device Streaming',
        description: 'Stream on up to 5 devices simultaneously',
        requiredPlan: 'enterprise',
        category: 'media'
    },

    // Travel & Planning Features (3)
    SMART_ITINERARY_PLANNER: {
        key: 'smart_itinerary_planner',
        name: 'AI Itinerary Planner',
        description: 'AI-powered trip planning with personalized recommendations',
        requiredPlan: 'premium',
        category: 'travel'
    },
    TRAVEL_INSURANCE_INTEGRATION: {
        key: 'travel_insurance_integration',
        name: 'Travel Insurance',
        description: 'Integrated travel insurance quotes and booking',
        requiredPlan: 'basic',
        category: 'travel'
    },
    PRICE_ALERTS_BOOKING: {
        key: 'price_alerts_booking',
        name: 'Price Alerts & Auto-Booking',
        description: 'Real-time price alerts and automatic booking',
        requiredPlan: 'premium',
        category: 'travel'
    },

    // Security & Privacy Features (2 - TWO_FACTOR_AUTH moved to Phase 10 with enhanced features)
    ENCRYPTED_STORAGE: {
        key: 'encrypted_storage',
        name: 'Encrypted File Storage',
        description: 'End-to-end encrypted file and data storage',
        requiredPlan: 'premium',
        category: 'security'
    },
    AUDIT_LOGS: {
        key: 'audit_logs',
        name: 'Security Audit Logs',
        description: 'Complete activity logs and security monitoring',
        requiredPlan: 'enterprise',
        category: 'security'
    },

    // Automation & Integration Features (3)
    WORKFLOW_AUTOMATION: {
        key: 'workflow_automation',
        name: 'Workflow Automation',
        description: 'Create automated workflows and triggers',
        requiredPlan: 'premium',
        category: 'automation'
    },
    // Note: API_ACCESS already defined in earlier phase
    WEBHOOKS: {
        key: 'webhooks',
        name: 'Webhooks & Integrations',
        description: 'Real-time webhooks for third-party integrations',
        requiredPlan: 'basic',
        category: 'automation'
    },

    // === PHASE 8: Collaboration, Analytics, Marketplace, Performance, Enterprise ===
    
    // Collaboration & Teams Features (3)
    REAL_TIME_COLLABORATION: {
        key: 'real_time_collaboration',
        name: 'Real-Time Collaboration',
        description: 'Simultaneous editing with team members in real-time',
        requiredPlan: 'premium',
        category: 'collaboration'
    },
    TEAM_WORKSPACES: {
        key: 'team_workspaces',
        name: 'Team Workspaces',
        description: 'Dedicated workspaces for team collaboration',
        requiredPlan: 'basic',
        category: 'collaboration'
    },
    ADVANCED_PERMISSIONS: {
        key: 'advanced_permissions',
        name: 'Advanced Permissions',
        description: 'Granular role-based access controls',
        requiredPlan: 'enterprise',
        category: 'collaboration'
    },

    // Advanced Analytics & Reporting Features (3) - CUSTOM_REPORTS already defined earlier
    PREDICTIVE_ANALYTICS: {
        key: 'predictive_analytics',
        name: 'Predictive Analytics',
        description: 'AI-powered predictions and trend forecasting',
        requiredPlan: 'enterprise',
        category: 'analytics'
    },
    REAL_TIME_ANALYTICS: {
        key: 'real_time_analytics',
        name: 'Real-Time Analytics',
        description: 'Live data updates and real-time dashboards',
        requiredPlan: 'premium',
        category: 'analytics'
    },

    // Marketplace & Extensions Features (3)
    TEMPLATE_MARKETPLACE: {
        key: 'template_marketplace',
        name: 'Template Marketplace',
        description: 'Buy and sell premium templates',
        requiredPlan: 'basic',
        category: 'marketplace'
    },
    PLUGIN_ECOSYSTEM: {
        key: 'plugin_ecosystem',
        name: 'Plugin Ecosystem',
        description: 'Install and develop custom plugins',
        requiredPlan: 'premium',
        category: 'marketplace'
    },
    DEVELOPER_API_SANDBOX: {
        key: 'developer_api_sandbox',
        name: 'Developer API Sandbox',
        description: 'Test environment for plugin development',
        requiredPlan: 'enterprise',
        category: 'marketplace'
    },

    // Performance & Infrastructure Features (3)
    PRIORITY_PROCESSING: {
        key: 'priority_processing',
        name: 'Priority Processing',
        description: 'Faster processing and rendering with dedicated resources',
        requiredPlan: 'premium',
        category: 'performance'
    },
    DEDICATED_CDN: {
        key: 'dedicated_cdn',
        name: 'Dedicated CDN',
        description: 'Premium CDN for faster global content delivery',
        requiredPlan: 'enterprise',
        category: 'performance'
    },
    // Note: UNLIMITED_STORAGE already defined in earlier phase

    // Enterprise Administration Features (3)
    SSO_INTEGRATION: {
        key: 'sso_integration',
        name: 'Single Sign-On (SSO)',
        description: 'SAML/OAuth SSO integration for enterprise login',
        requiredPlan: 'enterprise',
        category: 'enterprise'
    },
    // Note: WHITE_LABEL already defined in earlier phase
    DEDICATED_ACCOUNT_MANAGER: {
        key: 'dedicated_account_manager',
        name: 'Dedicated Account Manager',
        description: '1-on-1 support with dedicated account manager',
        requiredPlan: 'enterprise',
        category: 'enterprise'
    },

    // ============================================
    // PHASE 9: Communication, HR, Compliance, Advanced Finance & Support (14 features)
    // Note: VIDEO_CONFERENCING already exists in earlier phase
    // ============================================

    // Advanced Communication Features (2)
    TEAM_CHANNELS: {
        key: 'team_channels',
        name: 'Team Channels',
        description: 'Organized team communication with channels and threads',
        requiredPlan: 'basic',
        category: 'communication'
    },
    MESSAGE_TRANSLATION: {
        key: 'message_translation',
        name: 'Message Translation',
        description: 'Real-time translation of messages to 100+ languages',
        requiredPlan: 'premium',
        category: 'communication'
    },

    // HR & Recruitment Features (3)
    APPLICANT_TRACKING: {
        key: 'applicant_tracking',
        name: 'Applicant Tracking System (ATS)',
        description: 'Full recruitment pipeline with candidate management',
        requiredPlan: 'premium',
        category: 'hr'
    },
    EMPLOYEE_ONBOARDING: {
        key: 'employee_onboarding',
        name: 'Employee Onboarding',
        description: 'Automated onboarding workflows and checklists',
        requiredPlan: 'basic',
        category: 'hr'
    },
    PERFORMANCE_REVIEWS: {
        key: 'performance_reviews',
        name: 'Performance Reviews',
        description: '360-degree reviews with goal tracking',
        requiredPlan: 'premium',
        category: 'hr'
    },

    // Compliance & Legal Features (3)
    E_SIGNATURES: {
        key: 'e_signatures',
        name: 'E-Signatures',
        description: 'Legally binding electronic signatures for documents',
        requiredPlan: 'premium',
        category: 'compliance'
    },
    AUDIT_TRAILS: {
        key: 'audit_trails',
        name: 'Audit Trails',
        description: 'Complete audit logs for compliance and security',
        requiredPlan: 'enterprise',
        category: 'compliance'
    },
    GDPR_TOOLS: {
        key: 'gdpr_tools',
        name: 'GDPR Compliance Tools',
        description: 'Data export, deletion, and consent management',
        requiredPlan: 'premium',
        category: 'compliance'
    },

    // Advanced Finance Features (3)
    RECURRING_BILLING: {
        key: 'recurring_billing',
        name: 'Recurring Billing',
        description: 'Automated subscription and recurring invoice management',
        requiredPlan: 'premium',
        category: 'finance'
    },
    MULTI_CURRENCY: {
        key: 'multi_currency',
        name: 'Multi-Currency Support',
        description: 'Handle invoices and payments in 150+ currencies',
        requiredPlan: 'premium',
        category: 'finance'
    },
    EXPENSE_APPROVALS: {
        key: 'expense_approvals',
        name: 'Expense Approval Workflow',
        description: 'Multi-level approval workflows for expenses',
        requiredPlan: 'basic',
        category: 'finance'
    },

    // Enhanced Customer Support Features (3)
    LIVE_CHAT_WIDGET: {
        key: 'live_chat_widget',
        name: 'Live Chat Widget',
        description: 'Embeddable live chat for customer support',
        requiredPlan: 'premium',
        category: 'support'
    },
    TICKET_AUTOMATION: {
        key: 'ticket_automation',
        name: 'Ticket Automation',
        description: 'Auto-routing, escalation, and SLA management',
        requiredPlan: 'premium',
        category: 'support'
    },
    KNOWLEDGE_BASE: {
        key: 'knowledge_base',
        name: 'Knowledge Base',
        description: 'Self-service help center with articles and FAQs',
        requiredPlan: 'basic',
        category: 'support'
    },

    // ============================================
    // PHASE 10: Mobile, AI, Integrations, Security & Platform (15 features)
    // ============================================

    // Mobile & Offline Features (3)
    OFFLINE_MODE: {
        key: 'offline_mode',
        name: 'Offline Mode',
        description: 'Work offline with automatic sync when reconnected',
        requiredPlan: 'premium',
        category: 'mobile'
    },
    MOBILE_APP: {
        key: 'mobile_app',
        name: 'Native Mobile Apps',
        description: 'iOS and Android apps with push notifications',
        requiredPlan: 'basic',
        category: 'mobile'
    },
    BIOMETRIC_LOGIN: {
        key: 'biometric_login',
        name: 'Biometric Login',
        description: 'Face ID and fingerprint authentication on mobile',
        requiredPlan: 'premium',
        category: 'mobile'
    },

    // Advanced AI Features (3)
    AI_AUTO_GRADING: {
        key: 'ai_auto_grading',
        name: 'AI Auto-Grading',
        description: 'Automated grading for essays and assignments with AI',
        requiredPlan: 'premium',
        category: 'ai'
    },
    AI_CONTENT_MODERATION: {
        key: 'ai_content_moderation',
        name: 'AI Content Moderation',
        description: 'Automatic detection of inappropriate content',
        requiredPlan: 'enterprise',
        category: 'ai'
    },
    AI_PREDICTIVE_INSIGHTS: {
        key: 'ai_predictive_insights',
        name: 'AI Predictive Insights',
        description: 'Predict student outcomes and identify at-risk students',
        requiredPlan: 'enterprise',
        category: 'ai'
    },

    // Integration & API Features (3)
    ZAPIER_INTEGRATION: {
        key: 'zapier_integration',
        name: 'Zapier Integration',
        description: 'Connect with 5,000+ apps via Zapier',
        requiredPlan: 'premium',
        category: 'integrations'
    },
    WEBHOOK_AUTOMATION: {
        key: 'webhook_automation',
        name: 'Webhook Automation',
        description: 'Custom webhooks for real-time event notifications',
        requiredPlan: 'premium',
        category: 'integrations'
    },
    OAUTH_PROVIDERS: {
        key: 'oauth_providers',
        name: 'OAuth Providers',
        description: 'Login with Google, Microsoft, Apple, and more',
        requiredPlan: 'basic',
        category: 'integrations'
    },

    // Advanced Security Features (3)
    TWO_FACTOR_AUTH: {
        key: 'two_factor_auth',
        name: 'Two-Factor Authentication (2FA)',
        description: 'SMS and authenticator app 2FA for enhanced security',
        requiredPlan: 'premium',
        category: 'security'
    },
    IP_WHITELISTING: {
        key: 'ip_whitelisting',
        name: 'IP Whitelisting',
        description: 'Restrict access to specific IP addresses',
        requiredPlan: 'enterprise',
        category: 'security'
    },
    SESSION_MANAGEMENT: {
        key: 'session_management',
        name: 'Advanced Session Management',
        description: 'Force logout, view active sessions, session timeout control',
        requiredPlan: 'premium',
        category: 'security'
    },

    // Platform Administration Features (3)
    CUSTOM_DOMAINS: {
        key: 'custom_domains',
        name: 'Custom Domains',
        description: 'Host platform on your own domain (e.g., school.edu)',
        requiredPlan: 'enterprise',
        category: 'platform'
    },
    MULTI_REGION: {
        key: 'multi_region',
        name: 'Multi-Region Deployment',
        description: 'Deploy in multiple regions for compliance and performance',
        requiredPlan: 'enterprise',
        category: 'platform'
    },
    DATA_RESIDENCY: {
        key: 'data_residency',
        name: 'Data Residency Controls',
        description: 'Choose where your data is stored (US, EU, APAC)',
        requiredPlan: 'enterprise',
        category: 'platform'
    },

    // ============================================
    // PHASE 11: Gamification, Blockchain, Accessibility, IoT & AR/VR (15 features)
    // ============================================

    // Gamification & Engagement Features (3)
    ACHIEVEMENT_SYSTEM: {
        key: 'achievement_system',
        name: 'Achievement & Badge System',
        description: 'Unlock badges, trophies, and achievements for completing tasks',
        requiredPlan: 'basic',
        category: 'gamification'
    },
    LEADERBOARDS: {
        key: 'leaderboards',
        name: 'Global Leaderboards',
        description: 'Compete with peers on class, school, and global leaderboards',
        requiredPlan: 'premium',
        category: 'gamification'
    },
    XP_LEVEL_SYSTEM: {
        key: 'xp_level_system',
        name: 'XP & Level Progression',
        description: 'Earn XP points and level up by completing activities',
        requiredPlan: 'basic',
        category: 'gamification'
    },

    // Blockchain & Web3 Features (3)
    NFT_CERTIFICATES: {
        key: 'nft_certificates',
        name: 'NFT Certificates',
        description: 'Blockchain-verified certificates and credentials as NFTs',
        requiredPlan: 'enterprise',
        category: 'blockchain'
    },
    CRYPTO_PAYMENTS: {
        key: 'crypto_payments',
        name: 'Cryptocurrency Payments',
        description: 'Accept Bitcoin, Ethereum, and other cryptocurrencies',
        requiredPlan: 'premium',
        category: 'blockchain'
    },
    DECENTRALIZED_STORAGE: {
        key: 'decentralized_storage',
        name: 'Decentralized File Storage',
        description: 'Store files on IPFS for permanent, censorship-resistant storage',
        requiredPlan: 'enterprise',
        category: 'blockchain'
    },

    // Advanced Accessibility Features (3)
    SCREEN_READER_OPTIMIZATION: {
        key: 'screen_reader_optimization',
        name: 'Screen Reader Optimization',
        description: 'WCAG AAA compliant with advanced screen reader support',
        requiredPlan: 'premium',
        category: 'accessibility'
    },
    DYSLEXIA_FRIENDLY_MODE: {
        key: 'dyslexia_friendly_mode',
        name: 'Dyslexia-Friendly Mode',
        description: 'OpenDyslexic font, spacing adjustments, and reading aids',
        requiredPlan: 'basic',
        category: 'accessibility'
    },
    VOICE_CONTROL: {
        key: 'voice_control',
        name: 'Voice Control Navigation',
        description: 'Navigate platform entirely with voice commands',
        requiredPlan: 'premium',
        category: 'accessibility'
    },

    // IoT & Smart Campus Features (3)
    SMART_ATTENDANCE: {
        key: 'smart_attendance',
        name: 'Smart Attendance (IoT)',
        description: 'Automatic attendance with RFID/NFC badges or geofencing',
        requiredPlan: 'enterprise',
        category: 'iot'
    },
    CLASSROOM_SENSORS: {
        key: 'classroom_sensors',
        name: 'Classroom Environmental Sensors',
        description: 'Monitor temperature, air quality, occupancy with IoT sensors',
        requiredPlan: 'enterprise',
        category: 'iot'
    },
    SMART_NOTIFICATIONS: {
        key: 'smart_notifications',
        name: 'Context-Aware Smart Notifications',
        description: 'AI-powered notifications based on location, time, and activity',
        requiredPlan: 'premium',
        category: 'iot'
    },

    // AR/VR Learning Features (3)
    VR_CLASSROOMS: {
        key: 'vr_classrooms',
        name: 'Virtual Reality Classrooms',
        description: 'Attend classes in immersive VR environments',
        requiredPlan: 'enterprise',
        category: 'ar_vr'
    },
    AR_LABS: {
        key: 'ar_labs',
        name: 'Augmented Reality Labs',
        description: 'Interactive AR experiences for science, math, and engineering',
        requiredPlan: 'premium',
        category: 'ar_vr'
    },
    VIRTUAL_FIELD_TRIPS: {
        key: 'virtual_field_trips',
        name: 'Virtual Field Trips',
        description: '360° immersive field trips to museums, landmarks, and more',
        requiredPlan: 'basic',
        category: 'ar_vr'
    },

    // ============================================
    // PHASE 12: Developer Platform, Global, Advanced Learning, Industry & Next-Gen AI (15 features)
    // ============================================

    // Developer Platform & Extensibility (3)
    PUBLIC_API_ACCESS: {
        key: 'public_api_access',
        name: 'Public API Access',
        description: 'RESTful API with rate limits for third-party integrations',
        requiredPlan: 'premium',
        category: 'developer'
    },
    PLUGIN_MARKETPLACE_ACCESS: {
        key: 'plugin_marketplace_access',
        name: 'Plugin Marketplace',
        description: 'Install, develop, and monetize custom plugins',
        requiredPlan: 'basic',
        category: 'developer'
    },
    GRAPHQL_API: {
        key: 'graphql_api',
        name: 'GraphQL API',
        description: 'Advanced GraphQL endpoint for flexible data queries',
        requiredPlan: 'enterprise',
        category: 'developer'
    },

    // Global Expansion & Localization (3)
    MULTI_LANGUAGE_SUPPORT: {
        key: 'multi_language_support',
        name: 'Multi-Language Interface',
        description: 'Platform available in 50+ languages with auto-translation',
        requiredPlan: 'premium',
        category: 'global'
    },
    REGIONAL_COMPLIANCE: {
        key: 'regional_compliance',
        name: 'Regional Compliance Packs',
        description: 'Pre-configured compliance for EU, China, India, Brazil',
        requiredPlan: 'enterprise',
        category: 'global'
    },
    CURRENCY_LOCALIZATION: {
        key: 'currency_localization',
        name: 'Currency & Tax Localization',
        description: 'Auto-convert pricing, handle local tax regulations',
        requiredPlan: 'premium',
        category: 'global'
    },

    // Advanced Learning & Personalization (3)
    ADAPTIVE_LEARNING_AI: {
        key: 'adaptive_learning_ai',
        name: 'Adaptive Learning AI',
        description: 'AI adjusts difficulty and content based on student performance',
        requiredPlan: 'premium',
        category: 'learning'
    },
    LEARNING_ANALYTICS_360: {
        key: 'learning_analytics_360',
        name: 'Learning Analytics 360',
        description: 'Comprehensive learning analytics with skill gap analysis',
        requiredPlan: 'enterprise',
        category: 'learning'
    },
    MICRO_CREDENTIALS: {
        key: 'micro_credentials',
        name: 'Micro-Credentials System',
        description: 'Issue stackable micro-credentials and digital badges',
        requiredPlan: 'basic',
        category: 'learning'
    },

    // Industry-Specific Verticals (3)
    HEALTHCARE_TRAINING_MODE: {
        key: 'healthcare_training_mode',
        name: 'Healthcare Training Mode',
        description: 'HIPAA-compliant medical training with patient simulations',
        requiredPlan: 'enterprise',
        category: 'industry'
    },
    CORPORATE_LMS_MODE: {
        key: 'corporate_lms_mode',
        name: 'Corporate LMS Mode',
        description: 'Enterprise training with compliance tracking and certifications',
        requiredPlan: 'enterprise',
        category: 'industry'
    },
    K12_SPECIALIZED_MODE: {
        key: 'k12_specialized_mode',
        name: 'K-12 Specialized Mode',
        description: 'Age-appropriate content filters, parent controls, COPPA compliance',
        requiredPlan: 'premium',
        category: 'industry'
    },

    // Next-Generation AI Features (3)
    MULTIMODAL_AI_ASSISTANT: {
        key: 'multimodal_ai_assistant',
        name: 'Multimodal AI Assistant',
        description: 'AI that understands images, voice, and video for comprehensive help',
        requiredPlan: 'enterprise',
        category: 'ai'
    },
    AI_CAREER_PATHFINDER: {
        key: 'ai_career_pathfinder',
        name: 'AI Career Pathfinder',
        description: 'Personalized career recommendations based on skills and interests',
        requiredPlan: 'premium',
        category: 'ai'
    },
    AI_STUDY_GROUP_MATCHING: {
        key: 'ai_study_group_matching',
        name: 'AI Study Group Matching',
        description: 'Automatically match students with compatible study partners',
        requiredPlan: 'basic',
        category: 'ai'
    }
};

export const usePremiumFeatures = () => {
    const { user } = useAuth();
    const [userPlan, setUserPlan] = useState<PlanTier>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserPlan = async () => {
            if (!user) {
                setUserPlan('free');
                setLoading(false);
                return;
            }

            try {
                // Get user's plan from their tenant or profile
                // This would typically come from user.tenant.subscription_plan or similar
                const plan = (user as any).subscription_plan || 'free';
                setUserPlan(plan as PlanTier);
            } catch (error) {
                console.error('Failed to load user plan:', error);
                setUserPlan('free');
            } finally {
                setLoading(false);
            }
        };

        loadUserPlan();
    }, [user]);

    /**
     * Check if user has access to a specific feature
     */
    const hasFeatureAccess = useCallback((featureKey: string): boolean => {
        const feature = PREMIUM_FEATURES[featureKey];
        if (!feature) return true; // If feature not defined, allow access

        const planHierarchy: PlanTier[] = ['free', 'basic', 'premium', 'enterprise'];
        const requiredLevel = planHierarchy.indexOf(feature.requiredPlan);
        const userLevel = planHierarchy.indexOf(userPlan);

        return userLevel >= requiredLevel;
    }, [userPlan]);

    /**
     * Get required plan for a feature
     */
    const getRequiredPlan = useCallback((featureKey: string): PlanTier | null => {
        const feature = PREMIUM_FEATURES[featureKey];
        return feature ? feature.requiredPlan : null;
    }, []);

    /**
     * Check if user plan allows a certain minimum tier
     */
    const hasPlanTier = useCallback((requiredPlan: PlanTier): boolean => {
        const planHierarchy: PlanTier[] = ['free', 'basic', 'premium', 'enterprise'];
        const requiredLevel = planHierarchy.indexOf(requiredPlan);
        const userLevel = planHierarchy.indexOf(userPlan);

        return userLevel >= requiredLevel;
    }, [userPlan]);

    /**
     * Get all features available for a category
     */
    const getFeaturesByCategory = useCallback((category: string) => {
        return Object.entries(PREMIUM_FEATURES)
            .filter(([_, feature]) => feature.category === category)
            .map(([featureKey, feature]) => ({
                ...feature,
                hasAccess: hasFeatureAccess(featureKey)
            }));
    }, [hasFeatureAccess]);

    /**
     * Get upgrade message for a feature
     */
    const getUpgradeMessage = useCallback((featureKey: string): string => {
        const feature = PREMIUM_FEATURES[featureKey];
        if (!feature) return '';

        const planNames: Record<PlanTier, string> = {
            free: 'Free',
            basic: 'Basic',
            premium: 'Premium',
            enterprise: 'Enterprise'
        };

        return `Upgrade to ${planNames[feature.requiredPlan]} to unlock ${feature.name}`;
    }, []);

    /**
     * Upgrade to a specific plan
     */
    const upgradeToPlan = useCallback((targetPlan: PlanTier) => {
        // In a real app, this would redirect to billing/upgrade page
        window.location.href = `/billing/upgrade?plan=${targetPlan}`;
    }, []);

    return {
        userPlan,
        loading,
        hasFeatureAccess,
        getRequiredPlan,
        hasPlanTier,
        getFeaturesByCategory,
        getUpgradeMessage,
        upgradeToPlan,
        isPremium: userPlan === 'premium' || userPlan === 'enterprise',
        isEnterprise: userPlan === 'enterprise',
        isBasicOrHigher: hasPlanTier('basic'),
        isPremiumOrHigher: hasPlanTier('premium')
    };
};
