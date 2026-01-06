/**
 * Error Messages Dictionary
 * 
 * Centralized error messages for consistent user-facing error communication.
 * Maps error codes to user-friendly messages in multiple languages.
 * 
 * @example
 * import { getErrorMessage, ErrorCode } from '@/constants/errorMessages';
 * 
 * const message = getErrorMessage(ErrorCode.AUTH_INVALID_CREDENTIALS);
 * // => "Invalid email or password. Please try again."
 */

// =============================================================================
// ERROR CODES
// =============================================================================

export enum ErrorCode {
  // Authentication & Authorization (1000-1999)
  AUTH_INVALID_CREDENTIALS = 'AUTH_1001',
  AUTH_USER_NOT_FOUND = 'AUTH_1002',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_1003',
  AUTH_WEAK_PASSWORD = 'AUTH_1004',
  AUTH_SESSION_EXPIRED = 'AUTH_1005',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_1006',
  AUTH_TOKEN_INVALID = 'AUTH_1007',
  AUTH_TOKEN_EXPIRED = 'AUTH_1008',
  AUTH_2FA_REQUIRED = 'AUTH_1009',
  AUTH_2FA_INVALID = 'AUTH_1010',
  AUTH_ACCOUNT_LOCKED = 'AUTH_1011',
  AUTH_ACCOUNT_DISABLED = 'AUTH_1012',

  // Validation Errors (2000-2999)
  VALIDATION_REQUIRED_FIELD = 'VAL_2001',
  VALIDATION_INVALID_EMAIL = 'VAL_2002',
  VALIDATION_INVALID_PHONE = 'VAL_2003',
  VALIDATION_INVALID_DATE = 'VAL_2004',
  VALIDATION_MIN_LENGTH = 'VAL_2005',
  VALIDATION_MAX_LENGTH = 'VAL_2006',
  VALIDATION_INVALID_FORMAT = 'VAL_2007',
  VALIDATION_OUT_OF_RANGE = 'VAL_2008',
  VALIDATION_INVALID_CHOICE = 'VAL_2009',

  // Resource Errors (3000-3999)
  RESOURCE_NOT_FOUND = 'RES_3001',
  RESOURCE_ALREADY_EXISTS = 'RES_3002',
  RESOURCE_DELETED = 'RES_3003',
  RESOURCE_LOCKED = 'RES_3004',
  RESOURCE_EXPIRED = 'RES_3005',

  // Payment & Billing (4000-4999)
  PAYMENT_FAILED = 'PAY_4001',
  PAYMENT_DECLINED = 'PAY_4002',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAY_4003',
  PAYMENT_INVALID_CARD = 'PAY_4004',
  PAYMENT_EXPIRED_CARD = 'PAY_4005',
  PAYMENT_PROCESSING_ERROR = 'PAY_4006',
  SUBSCRIPTION_EXPIRED = 'PAY_4007',
  SUBSCRIPTION_CANCELED = 'PAY_4008',
  INVOICE_OVERDUE = 'PAY_4009',

  // File Operations (5000-5999)
  FILE_UPLOAD_FAILED = 'FILE_5001',
  FILE_TOO_LARGE = 'FILE_5002',
  FILE_INVALID_TYPE = 'FILE_5003',
  FILE_NOT_FOUND = 'FILE_5004',
  FILE_CORRUPTED = 'FILE_5005',
  FILE_SCAN_FAILED = 'FILE_5006',

  // Network & API (6000-6999)
  NETWORK_ERROR = 'NET_6001',
  NETWORK_TIMEOUT = 'NET_6002',
  API_RATE_LIMIT = 'NET_6003',
  API_MAINTENANCE = 'NET_6004',
  API_DEPRECATED = 'NET_6005',

  // Database Errors (7000-7999)
  DB_CONNECTION_FAILED = 'DB_7001',
  DB_QUERY_FAILED = 'DB_7002',
  DB_CONSTRAINT_VIOLATION = 'DB_7003',
  DB_DUPLICATE_KEY = 'DB_7004',
  DB_TRANSACTION_FAILED = 'DB_7005',

  // Business Logic (8000-8999)
  ENROLLMENT_FULL = 'BIZ_8001',
  ENROLLMENT_DEADLINE_PASSED = 'BIZ_8002',
  ASSIGNMENT_LATE = 'BIZ_8003',
  ASSIGNMENT_ALREADY_SUBMITTED = 'BIZ_8004',
  GRADE_ALREADY_PUBLISHED = 'BIZ_8005',
  CLASS_SCHEDULE_CONFLICT = 'BIZ_8006',
  ATTENDANCE_ALREADY_MARKED = 'BIZ_8007',
  DUPLICATE_SUBMISSION = 'BIZ_8008',

  // Tenant & Limits (9000-9999)
  TENANT_NOT_FOUND = 'TEN_9001',
  TENANT_SUSPENDED = 'TEN_9002',
  TENANT_LIMIT_EXCEEDED = 'TEN_9003',
  STORAGE_LIMIT_EXCEEDED = 'TEN_9004',
  USER_LIMIT_EXCEEDED = 'TEN_9005',
  API_LIMIT_EXCEEDED = 'TEN_9006',

  // Unknown/Generic
  UNKNOWN_ERROR = 'ERR_0000',
  INTERNAL_SERVER_ERROR = 'ERR_5000'
}

// =============================================================================
// ERROR MESSAGES (English)
// =============================================================================

export const ERROR_MESSAGES_EN: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'User account not found. Please check your email or sign up.',
  [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: 'An account with this email already exists. Please log in.',
  [ErrorCode.AUTH_WEAK_PASSWORD]: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid authentication token. Please log in again.',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired. Please log in again.',
  [ErrorCode.AUTH_2FA_REQUIRED]: 'Two-factor authentication is required for your account.',
  [ErrorCode.AUTH_2FA_INVALID]: 'Invalid two-factor authentication code.',
  [ErrorCode.AUTH_ACCOUNT_LOCKED]: 'Your account has been locked due to multiple failed login attempts. Please contact support.',
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support.',

  // Validation Errors
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'This field is required.',
  [ErrorCode.VALIDATION_INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCode.VALIDATION_INVALID_PHONE]: 'Please enter a valid phone number.',
  [ErrorCode.VALIDATION_INVALID_DATE]: 'Please enter a valid date.',
  [ErrorCode.VALIDATION_MIN_LENGTH]: 'This field must be at least {min} characters long.',
  [ErrorCode.VALIDATION_MAX_LENGTH]: 'This field must not exceed {max} characters.',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid format. Please check your input.',
  [ErrorCode.VALIDATION_OUT_OF_RANGE]: 'Value must be between {min} and {max}.',
  [ErrorCode.VALIDATION_INVALID_CHOICE]: 'Please select a valid option.',

  // Resource Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'This resource already exists.',
  [ErrorCode.RESOURCE_DELETED]: 'This resource has been deleted.',
  [ErrorCode.RESOURCE_LOCKED]: 'This resource is currently locked by another user.',
  [ErrorCode.RESOURCE_EXPIRED]: 'This resource has expired.',

  // Payment & Billing
  [ErrorCode.PAYMENT_FAILED]: 'Payment failed. Please try again or use a different payment method.',
  [ErrorCode.PAYMENT_DECLINED]: 'Your payment was declined. Please contact your bank.',
  [ErrorCode.PAYMENT_INSUFFICIENT_FUNDS]: 'Insufficient funds. Please use a different payment method.',
  [ErrorCode.PAYMENT_INVALID_CARD]: 'Invalid card number. Please check and try again.',
  [ErrorCode.PAYMENT_EXPIRED_CARD]: 'Your card has expired. Please use a different card.',
  [ErrorCode.PAYMENT_PROCESSING_ERROR]: 'Error processing payment. Please try again later.',
  [ErrorCode.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired. Please renew to continue.',
  [ErrorCode.SUBSCRIPTION_CANCELED]: 'Your subscription has been canceled.',
  [ErrorCode.INVOICE_OVERDUE]: 'You have overdue invoices. Please pay to continue using the service.',

  // File Operations
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed. Please try again.',
  [ErrorCode.FILE_TOO_LARGE]: 'File is too large. Maximum size is {maxSize}.',
  [ErrorCode.FILE_INVALID_TYPE]: 'Invalid file type. Accepted types: {types}.',
  [ErrorCode.FILE_NOT_FOUND]: 'File not found.',
  [ErrorCode.FILE_CORRUPTED]: 'File is corrupted and cannot be processed.',
  [ErrorCode.FILE_SCAN_FAILED]: 'File security scan failed. Please contact support.',

  // Network & API
  [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your internet connection and try again.',
  [ErrorCode.NETWORK_TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorCode.API_RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
  [ErrorCode.API_MAINTENANCE]: 'System is under maintenance. Please try again later.',
  [ErrorCode.API_DEPRECATED]: 'This feature is no longer supported.',

  // Database Errors
  [ErrorCode.DB_CONNECTION_FAILED]: 'Database connection failed. Please try again later.',
  [ErrorCode.DB_QUERY_FAILED]: 'Database query failed. Please try again.',
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: 'Data constraint violation. Please check your input.',
  [ErrorCode.DB_DUPLICATE_KEY]: 'Duplicate record detected.',
  [ErrorCode.DB_TRANSACTION_FAILED]: 'Transaction failed. Please try again.',

  // Business Logic
  [ErrorCode.ENROLLMENT_FULL]: 'This class is full. No more enrollments accepted.',
  [ErrorCode.ENROLLMENT_DEADLINE_PASSED]: 'Enrollment deadline has passed.',
  [ErrorCode.ASSIGNMENT_LATE]: 'This assignment is past due. Late submissions may not be accepted.',
  [ErrorCode.ASSIGNMENT_ALREADY_SUBMITTED]: 'You have already submitted this assignment.',
  [ErrorCode.GRADE_ALREADY_PUBLISHED]: 'Grades have been published and cannot be modified.',
  [ErrorCode.CLASS_SCHEDULE_CONFLICT]: 'Schedule conflict detected. Please choose a different time.',
  [ErrorCode.ATTENDANCE_ALREADY_MARKED]: 'Attendance has already been marked for this session.',
  [ErrorCode.DUPLICATE_SUBMISSION]: 'Duplicate submission detected.',

  // Tenant & Limits
  [ErrorCode.TENANT_NOT_FOUND]: 'Organization not found.',
  [ErrorCode.TENANT_SUSPENDED]: 'Your organization account has been suspended. Please contact support.',
  [ErrorCode.TENANT_LIMIT_EXCEEDED]: 'Organization limit exceeded. Please upgrade your plan.',
  [ErrorCode.STORAGE_LIMIT_EXCEEDED]: 'Storage limit exceeded. Please upgrade your plan or delete files.',
  [ErrorCode.USER_LIMIT_EXCEEDED]: 'User limit exceeded. Please upgrade your plan to add more users.',
  [ErrorCode.API_LIMIT_EXCEEDED]: 'API call limit exceeded. Please upgrade your plan.',

  // Unknown/Generic
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error. Our team has been notified.'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get user-friendly error message for an error code
 * @param code - Error code
 * @param replacements - Optional values to replace placeholders in message
 * @param language - Language code (default: 'en')
 * @returns User-friendly error message
 */
export function getErrorMessage(
  code: ErrorCode,
  replacements?: Record<string, string | number>,
  language: string = 'en'
): string {
  // Currently only English, but structure supports i18n
  const messages = ERROR_MESSAGES_EN;
  let message = messages[code] || messages[ErrorCode.UNKNOWN_ERROR];

  // Replace placeholders
  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
  }

  return message;
}

/**
 * Map HTTP status code to error code
 */
export function mapHttpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_INVALID_FORMAT;
    case 401:
      return ErrorCode.AUTH_SESSION_EXPIRED;
    case 403:
      return ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      return ErrorCode.RESOURCE_ALREADY_EXISTS;
    case 413:
      return ErrorCode.FILE_TOO_LARGE;
    case 429:
      return ErrorCode.API_RATE_LIMIT;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return ErrorCode.API_MAINTENANCE;
    case 504:
      return ErrorCode.NETWORK_TIMEOUT;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Create standardized error response object
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export function createErrorResponse(
  code: ErrorCode,
  details?: unknown,
  requestId?: string
): ErrorResponse {
  return {
    code,
    message: getErrorMessage(code),
    details,
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context: {
    code?: ErrorCode;
    userId?: string;
    tenantId?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  console.error(JSON.stringify({
    level: 'error',
    message: error.message,
    code: context.code || ErrorCode.UNKNOWN_ERROR,
    stack: error.stack,
    userId: context.userId,
    tenantId: context.tenantId,
    action: context.action,
    metadata: context.metadata,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Extract error code from error object
 */
export function extractErrorCode(error: unknown): ErrorCode {
  if (error && typeof error === 'object') {
    if ('code' in error && typeof error.code === 'string' && Object.values(ErrorCode).includes(error.code as ErrorCode)) {
      return error.code as ErrorCode;
    }
    if ('status' in error && typeof error.status === 'number') {
      return mapHttpStatusToErrorCode(error.status);
    }
  }
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(code: ErrorCode): boolean {
  const recoverableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.NETWORK_TIMEOUT,
    ErrorCode.FILE_UPLOAD_FAILED,
    ErrorCode.PAYMENT_FAILED,
    ErrorCode.DB_CONNECTION_FAILED,
    ErrorCode.DB_QUERY_FAILED,
    ErrorCode.DB_TRANSACTION_FAILED
  ];
  return recoverableCodes.includes(code);
}

/**
 * Check if error requires user action
 */
export function requiresUserAction(code: ErrorCode): boolean {
  const actionRequiredCodes = [
    ErrorCode.AUTH_SESSION_EXPIRED,
    ErrorCode.AUTH_WEAK_PASSWORD,
    ErrorCode.PAYMENT_DECLINED,
    ErrorCode.PAYMENT_INSUFFICIENT_FUNDS,
    ErrorCode.SUBSCRIPTION_EXPIRED,
    ErrorCode.INVOICE_OVERDUE,
    ErrorCode.STORAGE_LIMIT_EXCEEDED,
    ErrorCode.USER_LIMIT_EXCEEDED
  ];
  return actionRequiredCodes.includes(code);
}
