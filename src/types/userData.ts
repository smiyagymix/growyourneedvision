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
        collections: string[];
        format: string;
        exportedAt: string;
    };
}
