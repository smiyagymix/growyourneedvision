/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas using Zod for all business entities.
 * Use these schemas to validate API inputs, form submissions, and data consistency.
 * 
 * @example
 * import { userSchema, courseSchema } from '@/validation/schemas';
 * 
 * const result = userSchema.safeParse(userData);
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 */

import { z } from 'zod';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const emailSchema = z.string().email('Invalid email address');
export const urlSchema = z.string().url('Invalid URL');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number');
export const dateSchema = z.string().datetime('Invalid ISO 8601 date');
export const colorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color');

// =============================================================================
// USER & AUTHENTICATION
// =============================================================================

export const userRoleSchema = z.enum(['Owner', 'SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Individual']);

export const userSchema = z.object({
  id: z.string().optional(),
  email: emailSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: userRoleSchema,
  tenantId: z.string().optional(),
  avatar: urlSchema.optional(),
  verified: z.boolean().default(false),
  active: z.boolean().default(true),
  lastLogin: dateSchema.optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: userRoleSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const passwordResetSchema = z.object({
  email: emailSchema
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&#]/, 'Must contain special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// =============================================================================
// TENANT & SUBSCRIPTION
// =============================================================================

export const planTierSchema = z.enum(['Free', 'Starter', 'Professional', 'Premium', 'Enterprise']);

// Tenant settings schema
export const tenantSettingsSchema = z.object({
  theme: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    logo: urlSchema.optional()
  }).optional(),
  features: z.object({
    enableAI: z.boolean().optional(),
    enablePayments: z.boolean().optional(),
    enableCommunication: z.boolean().optional(),
    enableAnalytics: z.boolean().optional()
  }).optional(),
  limits: z.object({
    maxUsers: z.number().positive().optional(),
    maxStorage: z.number().positive().optional(),
    maxAPICallsPerMonth: z.number().positive().optional()
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional()
  }).optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().length(3).optional()
}).optional();

export const tenantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Tenant name must be at least 2 characters').max(100),
  domain: z.string().regex(/^[a-z0-9-]+$/, 'Domain must be lowercase alphanumeric with hyphens'),
  plan: planTierSchema,
  status: z.enum(['active', 'suspended', 'trial', 'canceled']),
  ownerId: z.string(),
  settings: tenantSettingsSchema,
  created: dateSchema.optional(),
  updated: dateSchema.optional()
});

export const subscriptionPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  tier: planTierSchema,
  price: z.number().nonnegative('Price must be non-negative'),
  currency: z.string().length(3, 'Currency must be ISO 4217 code'),
  interval: z.enum(['month', 'year']),
  features: z.array(z.string()),
  limits: z.object({
    users: z.number().positive(),
    storage: z.number().positive(),
    apiCalls: z.number().positive()
  })
});

// =============================================================================
// SCHOOL DOMAIN
// =============================================================================

export const studentSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  tenantId: z.string(),
  studentId: z.string().regex(/^[A-Z0-9-]+$/, 'Student ID must be uppercase alphanumeric'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: emailSchema.optional(),
  grade: z.string().optional(),
  classId: z.string().optional(),
  enrollmentDate: dateSchema,
  status: z.enum(['active', 'inactive', 'graduated']),
  parentIds: z.array(z.string()).optional()
});

export const teacherSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  tenantId: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  department: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  hireDate: dateSchema,
  status: z.enum(['active', 'inactive'])
});

export const classSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(1, 'Class name is required').max(100),
  code: z.string().regex(/^[A-Z0-9-]+$/, 'Class code must be uppercase alphanumeric'),
  teacherId: z.string(),
  subject: z.string().min(1),
  grade: z.string().optional(),
  schedule: z.string().optional(),
  room: z.string().optional(),
  studentCount: z.number().nonnegative().default(0)
});

// =============================================================================
// ACADEMIC CONTENT
// =============================================================================

export const courseSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  code: z.string().regex(/^[A-Z0-9-]+$/, 'Course code must be uppercase alphanumeric'),
  description: z.string().max(1000).optional(),
  teacherId: z.string(),
  credits: z.number().positive('Credits must be positive'),
  term: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  thumbnail: urlSchema.optional(),
  syllabus: z.string().optional(),
  enrollmentCount: z.number().nonnegative().default(0)
});

export const assignmentSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  courseId: z.string(),
  teacherId: z.string(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  dueDate: dateSchema,
  maxPoints: z.number().positive('Max points must be positive').max(1000),
  type: z.enum(['homework', 'quiz', 'exam', 'project']),
  status: z.enum(['draft', 'published', 'graded']),
  attachments: z.array(z.string()).optional()
}).refine((data) => new Date(data.dueDate) > new Date(), {
  message: "Due date must be in the future",
  path: ["dueDate"]
});

export const submissionSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  assignmentId: z.string(),
  studentId: z.string(),
  submittedAt: dateSchema,
  content: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  grade: z.number().min(0).optional(),
  feedback: z.string().optional(),
  status: z.enum(['pending', 'submitted', 'graded', 'late'])
});

export const gradeSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  assignmentId: z.string().optional(),
  value: z.number().min(0, 'Grade must be non-negative'),
  maxValue: z.number().positive('Max value must be positive'),
  letterGrade: z.string().regex(/^[A-F][+-]?$/, 'Invalid letter grade').optional(),
  gradedBy: z.string(),
  gradedAt: dateSchema,
  comments: z.string().max(500).optional()
}).refine((data) => data.value <= data.maxValue, {
  message: "Grade cannot exceed max value",
  path: ["value"]
});

// =============================================================================
// ATTENDANCE & SCHEDULE
// =============================================================================

export const attendanceSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  studentId: z.string(),
  classId: z.string().optional(),
  date: dateSchema,
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional(),
  markedBy: z.string()
});

export const scheduleItemSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  startTime: dateSchema,
  endTime: dateSchema,
  location: z.string().optional(),
  type: z.enum(['class', 'meeting', 'event', 'exam']),
  recurringRule: z.string().optional(),
  color: colorSchema.optional()
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"]
});

// =============================================================================
// COMMUNICATION
// =============================================================================

export const messageSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, 'Message body is required').max(10000),
  read: z.boolean().default(false),
  starred: z.boolean().default(false),
  archived: z.boolean().default(false),
  sentAt: dateSchema,
  attachments: z.array(z.string()).max(10, 'Maximum 10 attachments').optional()
});

export const announcementSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  authorId: z.string(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  type: z.enum(['general', 'urgent', 'event']),
  targetAudience: z.array(z.string()).min(1, 'At least one audience required'),
  publishedAt: dateSchema,
  expiresAt: dateSchema.optional()
});

// =============================================================================
// FINANCE & PAYMENTS
// =============================================================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative()
}).refine((data) => Math.abs(data.total - (data.quantity * data.unitPrice)) < 0.01, {
  message: "Total must equal quantity × unit price",
  path: ["total"]
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  invoiceNumber: z.string().regex(/^INV-\d{6}$/, 'Invalid invoice number format'),
  studentId: z.string(),
  parentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be ISO 4217 code'),
  dueDate: dateSchema,
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'canceled']),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  paidAt: dateSchema.optional(),
  paymentMethod: z.string().optional()
});

export const transactionMetadataSchema = z.object({
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  paymentMethodBrand: z.string().optional(),
  last4: z.string().length(4).optional(),
  receiptUrl: urlSchema.optional(),
  failureReason: z.string().optional(),
  disputeId: z.string().optional(),
  refundReason: z.string().optional(),
  invoiceId: z.string().optional()
}).optional();

export const transactionSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  invoiceId: z.string().optional(),
  amount: z.number(),
  currency: z.string().length(3),
  type: z.enum(['payment', 'refund', 'adjustment']),
  method: z.enum(['card', 'bank_transfer', 'cash', 'crypto']),
  status: z.enum(['pending', 'completed', 'failed']),
  processedAt: dateSchema,
  metadata: transactionMetadataSchema
});

export const expenseSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: z.enum(['Pending', 'Approved', 'Rejected']),
  approved_by: z.string().optional()
});

export const feeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Fee name must be at least 3 characters').max(100),
  amount: z.number().positive('Amount must be positive'),
  frequency: z.enum(['One-time', 'Monthly', 'Yearly']),
  due_day: z.number().min(1).max(31, 'Due day must be between 1 and 31')
});

export const goalSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).optional(),
  progress: z.number().min(0).max(100).optional()
});

export const noteSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  color: z.string().optional()
});

// =============================================================================
// DEVELOPER PLATFORM
// =============================================================================

export const apiKeySchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  key: z.string().optional(),
  hashedKey: z.string(),
  permissions: z.array(z.string()),
  rateLimit: z.number().positive('Rate limit must be positive'),
  expiresAt: dateSchema.optional(),
  lastUsed: dateSchema.optional(),
  status: z.enum(['active', 'revoked'])
});

export const webhookSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().min(32, 'Secret must be at least 32 characters'),
  status: z.enum(['active', 'inactive', 'failed']),
  lastTriggered: dateSchema.optional(),
  failureCount: z.number().nonnegative().default(0)
});

export const pluginSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid semver version'),
  author: z.string().min(2),
  category: z.string().min(2),
  price: z.number().nonnegative(),
  downloads: z.number().nonnegative().default(0),
  rating: z.number().min(0).max(5).default(0),
  status: z.enum(['published', 'draft', 'deprecated']),
  documentation: urlSchema.optional(),
  repository: urlSchema.optional()
});

// =============================================================================
// SETTINGS & CONFIGURATION
// =============================================================================

export const notificationSettingsSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  channels: z.object({
    assignments: z.boolean().default(true),
    grades: z.boolean().default(true),
    messages: z.boolean().default(true),
    announcements: z.boolean().default(true)
  }),
  frequency: z.enum(['realtime', 'daily', 'weekly'])
});

export const privacySettingsSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  profileVisibility: z.enum(['public', 'private', 'connections']),
  dataSharing: z.boolean().default(false),
  analyticsConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false)
});

export const schoolSettingsSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  name: z.string().min(2).max(200),
  logo: urlSchema.optional(),
  primaryColor: colorSchema,
  accentColor: colorSchema,
  address: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  timezone: z.string(),
  academicYearStart: dateSchema,
  gradingScale: z.string()
});

// =============================================================================
// FORM VALIDATION HELPERS
// =============================================================================

/**
 * Extract validation errors from Zod error
 */
export function extractValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}

/**
 * Validate with custom error handling
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: Partial<T> | Record<string, string | number | boolean | null>
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: extractValidationErrors(result.error)
  };
}

/**
 * Async validation for forms
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: Partial<T> | Record<string, string | number | boolean | null>,
  additionalValidation?: (data: T) => Promise<string | null>
): Promise<{ valid: boolean; data?: T; errors?: Record<string, string> }> {
  const result = validateWithErrors(schema, data);
  
  if (!result.success) {
    return { valid: false, errors: result.errors };
  }
  
  if (additionalValidation) {
    const error = await additionalValidation(result.data);
    if (error) {
      return { valid: false, errors: { _form: error } };
    }
  }
  
  return { valid: true, data: result.data };
}
