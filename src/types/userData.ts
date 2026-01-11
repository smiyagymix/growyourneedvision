/**
 * User Data Export Types
 * Proper types for user data exports and GDPR compliance
 */

export interface UserProfileData {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
    tenantId?: string;
}

export interface Tenant {
    id: string;
    name: string;
    domain?: string;
    status: 'active' | 'inactive' | 'suspended';
    created: string;
    updated: string;
    [key: string]: any;
}

export type UserRole = 'Owner' | 'SchoolAdmin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';

export interface User extends UserProfileData {
    role: UserRole | string;
}

export interface UserActivityData {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: {
        resourceId?: string;
        resourceType?: string;
        [key: string]: string | number | boolean | undefined;
    };
}

export interface UserMessageData {
    id: string;
    senderId: string;
    recipientId: string;
    subject?: string;
    body: string;
    sentAt: string;
    read: boolean;
}

export interface UserDocumentData {
    id: string;
    title: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: string;
}

export interface UserExportData {
    profile: UserProfileData;
    activities: UserActivityData[];
    messages: UserMessageData[];
    documents: UserDocumentData[];
    grades?: Array<{
        id: string;
        courseId: string;
        assignmentId?: string;
        value: number;
        maxValue: number;
        gradedAt: string;
    }>;
    courses?: Array<{
        id: string;
        title: string;
        code: string;
        enrolledAt: string;
    }>;
    wellness?: Array<{
        id: string;
        type: string;
        date: string;
        value?: number;
    }>;
    metadata: {
        totalRecords: number;
        collectionCount: number;
        collections: string[];
        format: string;
        exportedAt: string;
    };
    collections: Record<string, unknown[]>;
    // Settings & Preferences
    account?: any;
    theme?: any;
    notifications?: any;
    privacy?: any;
}
