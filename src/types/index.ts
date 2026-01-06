/**
 * Centralized TypeScript Type Definitions
 * 
 * This file exports all domain types used across the GROW YOUR NEED platform.
 * Import from here instead of individual service files.
 * 
 * @example
 * import { User, Course, Assignment, Tenant } from '@/types';
 */

import { RecordModel } from 'pocketbase';
import type { 
    TenantSettings,
    TransactionMetadata,
    PluginConfig,
    WebhookPayload,
    ComplianceMetadata,
    SettingValue,
    IntegrationConfig,
    RecommendationContext,
    AuditLogChanges
} from './settings';

// =============================================================================
// USER & AUTHENTICATION
// =============================================================================

export type UserRole = 'Owner' | 'SchoolAdmin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';

export interface User extends RecordModel {
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  avatar?: string;
  verified: boolean;
  active: boolean;
  lastLogin?: string;
}

// =============================================================================
// TENANT & SUBSCRIPTION
// =============================================================================

export type PlanTier = 'Free' | 'Starter' | 'Professional' | 'Premium' | 'Enterprise';

export interface Tenant extends RecordModel {
  name: string;
  domain: string;
  plan: PlanTier;
  status: 'active' | 'suspended' | 'trial' | 'canceled';
  ownerId: string;
  settings?: TenantSettings;
  created: string;
  updated: string;
}

export interface TenantUsage extends RecordModel {
  tenantId: string;
  storageUsed: number;
  storageLimit: number;
  apiCalls: number;
  apiLimit: number;
  userCount: number;
  userLimit: number;
  period: string;
}

export interface SubscriptionPlan extends RecordModel {
  name: string;
  tier: PlanTier;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users: number;
    storage: number;
    apiCalls: number;
  };
}

// =============================================================================
// SCHOOL DOMAIN
// =============================================================================

export interface Student extends RecordModel {
  userId: string;
  tenantId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  grade?: string;
  classId?: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  parentIds?: string[];
}

export interface Teacher extends RecordModel {
  userId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  subjects?: string[];
  hireDate: string;
  status: 'active' | 'inactive';
}

export interface TeacherClass extends RecordModel {
  tenantId: string;
  name: string;
  code: string;
  teacherId: string;
  subject: string;
  grade?: string;
  schedule?: string;
  room?: string;
  studentCount: number;
}

// =============================================================================
// ACADEMIC CONTENT
// =============================================================================

export interface Course extends RecordModel {
  tenantId: string;
  title: string;
  code: string;
  description?: string;
  teacherId: string;
  credits: number;
  term?: string;
  status: 'draft' | 'published' | 'archived';
  thumbnail?: string;
  syllabus?: string;
  enrollmentCount: number;
}

export interface Assignment extends RecordModel {
  tenantId: string;
  courseId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  type: 'homework' | 'quiz' | 'exam' | 'project';
  status: 'draft' | 'published' | 'graded';
  attachments?: string[];
}

export interface Submission extends RecordModel {
  tenantId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  content?: string;
  attachments?: string[];
  grade?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
}

export interface Grade extends RecordModel {
  tenantId: string;
  studentId: string;
  courseId: string;
  assignmentId?: string;
  value: number;
  maxValue: number;
  letterGrade?: string;
  gradedBy: string;
  gradedAt: string;
  comments?: string;
}

// =============================================================================
// ATTENDANCE & SCHEDULE
// =============================================================================

export interface AttendanceRecord extends RecordModel {
  tenantId: string;
  studentId: string;
  classId?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  markedBy: string;
}

export interface ScheduleItem extends RecordModel {
  tenantId: string;
  userId?: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'class' | 'meeting' | 'event' | 'exam';
  recurringRule?: string;
  color?: string;
}

// =============================================================================
// LEARNING & GAMIFICATION
// =============================================================================

export interface LessonPlan extends RecordModel {
  tenantId: string;
  teacherId: string;
  courseId?: string;
  title: string;
  date: string;
  duration: number;
  objectives: string[];
  materials?: string[];
  activities?: string[];
  assessment?: string;
  notes?: string;
  status: 'draft' | 'approved' | 'taught';
}

export interface AdaptiveLearningProfile extends RecordModel {
  tenantId: string;
  studentId: string;
  subject: string;
  difficultyLevel: number;
  abilityScore: number;
  totalQuestions: number;
  correctAnswers: number;
  lastUpdated: string;
}

export interface LearningAnalytics extends RecordModel {
  tenantId: string;
  studentId: string;
  engagementRate: number;
  studyTimeMinutes: number;
  sessionsCount: number;
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  period: string;
}

export interface MicroCredential extends RecordModel {
  tenantId: string;
  studentId: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  status: 'locked' | 'in_progress' | 'earned';
  earnedAt?: string;
  imageUrl?: string;
}

// =============================================================================
// COMMUNICATION
// =============================================================================

export interface Message extends RecordModel {
  tenantId: string;
  senderId: string;
  recipientId: string;
  subject?: string;
  body: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  sentAt: string;
  attachments?: string[];
}

export interface TeacherMessage extends RecordModel {
  tenantId: string;
  teacherId: string;
  recipientType: 'student' | 'parent' | 'class';
  recipientIds: string[];
  subject: string;
  body: string;
  sentAt: string;
  readBy?: string[];
}

export interface Announcement extends RecordModel {
  tenantId: string;
  authorId: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event';
  targetAudience: string[];
  publishedAt: string;
  expiresAt?: string;
}

// =============================================================================
// RESOURCES & CONTENT
// =============================================================================

export interface GlobalResource extends RecordModel {
  tenantId?: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'template' | 'tool';
  category: string;
  description?: string;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  visibility: 'public' | 'private' | 'tenant';
  downloads: number;
  rating?: number;
  tags?: string[];
}

export interface CourseResource extends RecordModel {
  tenantId: string;
  courseId: string;
  title: string;
  type: 'lecture' | 'reading' | 'video' | 'assignment';
  fileUrl?: string;
  externalUrl?: string;
  description?: string;
  order: number;
}

// =============================================================================
// FINANCE & PAYMENTS
// =============================================================================

export interface Invoice extends RecordModel {
  tenantId: string;
  invoiceNumber: string;
  studentId: string;
  parentId?: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  items: InvoiceItem[];
  paidAt?: string;
  paymentMethod?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction extends RecordModel {
  tenantId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'adjustment';
  method: 'card' | 'bank_transfer' | 'cash' | 'crypto';
  status: 'pending' | 'completed' | 'failed';
  processedAt: string;
  metadata?: TransactionMetadata;
}

// =============================================================================
// WELLNESS & HEALTH
// =============================================================================

export interface WellnessLog extends RecordModel {
  userId: string;
  date: string;
  type: 'mood' | 'sleep' | 'exercise' | 'meal' | 'water';
  value?: number;
  mood?: string;
  notes?: string;
  tags?: string[];
}

export interface WellnessGoal extends RecordModel {
  userId: string;
  type: 'steps' | 'sleep' | 'water' | 'exercise' | 'weight';
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'abandoned';
}

// =============================================================================
// SUPPORT & TICKETS
// =============================================================================

export interface Ticket extends RecordModel {
  tenantId?: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketComment extends RecordModel {
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
}

// =============================================================================
// DEVELOPER PLATFORM
// =============================================================================

export interface APIKey extends RecordModel {
  tenantId: string;
  name: string;
  key: string;
  hashedKey: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsed?: string;
  status: 'active' | 'revoked';
}

export interface Plugin extends RecordModel {
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  price: number;
  downloads: number;
  rating: number;
  status: 'published' | 'draft' | 'deprecated';
  documentation?: string;
  repository?: string;
}

export interface PluginInstall extends RecordModel {
  tenantId: string;
  pluginId: string;
  installedAt: string;
  version: string;
  config?: PluginConfig;
  status: 'active' | 'inactive';
}

export interface Webhook extends RecordModel {
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive' | 'failed';
  lastTriggered?: string;
  failureCount: number;
}

export interface WebhookDelivery extends RecordModel {
  webhookId: string;
  event: string;
  payload: WebhookPayload;
  status: 'pending' | 'delivered' | 'failed';
  attemptCount: number;
  deliveredAt?: string;
  errorMessage?: string;
}

// =============================================================================
// GLOBAL EXPANSION
// =============================================================================

export interface Translation extends RecordModel {
  language: string;
  key: string;
  value: string;
  context?: string;
  verified: boolean;
}

export interface Currency extends RecordModel {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  baseCurrency: string;
  active: boolean;
  lastUpdated: string;
}

export interface LanguageSetting extends RecordModel {
  tenantId: string;
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  completion: number;
  isDefault: boolean;
}

export interface ComplianceLog extends RecordModel {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  regulation: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: ComplianceMetadata;
}

// =============================================================================
// SETTINGS & CONFIGURATION
// =============================================================================

export interface ThemeSettings extends RecordModel {
  userId: string;
  tenantId?: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  accentColor?: string;
  customCSS?: string;
}

export interface NotificationSettings extends RecordModel {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  channels: {
    assignments: boolean;
    grades: boolean;
    messages: boolean;
    announcements: boolean;
  };
  frequency: 'realtime' | 'daily' | 'weekly';
}

export interface PrivacySettings extends RecordModel {
  userId: string;
  profileVisibility: 'public' | 'private' | 'connections';
  dataSharing: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
}

export interface PlatformConfig extends RecordModel {
  tenantId?: string;
  key: string;
  value: SettingValue;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
}

export interface SchoolSettings extends RecordModel {
  tenantId: string;
  name: string;
  logo?: string;
  primaryColor: string;
  accentColor: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  academicYearStart: string;
  gradingScale: string;
}

// =============================================================================
// TOOLS & UTILITIES
// =============================================================================

export interface Tool extends RecordModel {
  name: string;
  category: string;
  description: string;
  icon: string;
  route?: string;
  requiredRole?: UserRole[];
  premiumFeature?: string;
}

export interface UtilityTool extends RecordModel {
  name: string;
  type: string;
  config: IntegrationConfig;
  userId?: string;
  shared: boolean;
}

export interface SystemLog extends RecordModel {
  tenantId?: string;
  userId?: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context?: RecommendationContext;
  timestamp: string;
  source: string;
}

export interface AuditLog extends RecordModel {
  tenantId?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: AuditLogChanges;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface HealthMetric extends RecordModel {
  service: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'healthy' | 'degraded' | 'down';
}

// =============================================================================
// STUDY & NOTES
// =============================================================================

export interface StudySession extends RecordModel {
  userId: string;
  courseId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  notes?: string;
}

export interface Flashcard extends RecordModel {
  deckId: string;
  userId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: string;
  reviewCount: number;
  correctCount: number;
}

export interface FlashcardDeck extends RecordModel {
  userId: string;
  title: string;
  description?: string;
  cardCount: number;
  shared: boolean;
}

export interface StudentNote extends RecordModel {
  userId: string;
  courseId?: string;
  title: string;
  content: string;
  tags?: string[];
  pinned: boolean;
}

// =============================================================================
// MARKETPLACE & APPS
// =============================================================================

export interface MarketplaceApp extends RecordModel {
  name: string;
  developer: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  version: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type ValidationError = {
  field: string;
  message: string;
};

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  allowedTiers?: PlanTier[];
};

// =============================================================================
// FORM & STATE TYPES
// =============================================================================

export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// =============================================================================
// PERMISSION & ACCESS CONTROL
// =============================================================================

export type Permission = {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  condition?: <T extends RecordModel>(user: User, resource: T) => boolean;
};

export type RolePermissions = {
  role: UserRole;
  permissions: Permission[];
  inheritsFrom?: UserRole[];
};
