import { ValidationError, ZodIssue } from '../types/common';

export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

// Extract validation errors from Zod error
export const extractZodErrors = (error: ZodIssue[] | { issues: ZodIssue[] } | unknown): ValidationError => {
  const errors: ValidationError = {};
  
  const issues = Array.isArray(error) ? error : 
                (error && typeof error === 'object' && 'issues' in error) ? (error as { issues: ZodIssue[] }).issues :
                [];
  
  issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return errors;
};

export const isStrongPassword = (password: string): boolean => {
  // Min 8 chars, 1 upper, 1 lower, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && value !== null && Object.keys(value as Record<string, unknown>).length === 0) return true;
  return false;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Additional validators
export const isValidPhone = (phone: string): boolean => {
  // Basic phone validation (can be enhanced for specific formats)
  const re = /^[\d\s\-\+\(\)]{10,}$/;
  return re.test(phone);
};

export const isValidDate = (date: string): boolean => {
  const parsed = Date.parse(date);
  return !isNaN(parsed);
};

export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const hasMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const hasMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

// Form-specific validators
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

interface AssignmentInput {
  title?: string;
  description?: string;
  due_date?: string;
  points?: number | string;
}

export const validateAssignment = (data: AssignmentInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.title)) {
    errors.title = 'Title is required';
  } else if (data.title && !hasMinLength(data.title, 3)) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (isEmpty(data.description)) {
    errors.description = 'Description is required';
  }

  if (isEmpty(data.due_date)) {
    errors.due_date = 'Due date is required';
  } else if (data.due_date && !isValidDate(data.due_date)) {
    errors.due_date = 'Invalid date format';
  }

  if (data.points !== undefined && data.points !== null) {
      const points = Number(data.points);
      if (isNaN(points) || !isInRange(points, 0, 1000)) {
        errors.points = 'Points must be between 0 and 1000';
      }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

interface EnrollmentInput {
  student_id?: string;
  course_id?: string;
  enrollment_date?: string;
}

export const validateEnrollment = (data: EnrollmentInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.student_id)) {
    errors.student_id = 'Student is required';
  }

  if (isEmpty(data.course_id)) {
    errors.course_id = 'Course is required';
  }

  if (isEmpty(data.enrollment_date)) {
    errors.enrollment_date = 'Enrollment date is required';
  } else if (data.enrollment_date && !isValidDate(data.enrollment_date)) {
    errors.enrollment_date = 'Invalid date format';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

interface GradeInput {
  student_id?: string;
  score?: number | string;
}

export const validateGrade = (data: GradeInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.student_id)) {
    errors.student_id = 'Student is required';
  }

  if (data.score === undefined || data.score === null) {
    errors.score = 'Score is required';
  } else {
      const score = Number(data.score);
      if (isNaN(score) || !isInRange(score, 0, 100)) {
        errors.score = 'Score must be between 0 and 100';
      }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

interface ClassInput {
  name?: string;
  code?: string;
  teacher?: string;
}

export const validateClass = (data: ClassInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Class name is required';
  }

  if (isEmpty(data.code)) {
    errors.code = 'Class code is required';
  }

  if (isEmpty(data.teacher)) {
    errors.teacher = 'Teacher is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

interface StudentInput {
  name?: string;
  email?: string;
  grade?: number | string;
}

export const validateStudent = (data: StudentInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Name is required';
  }

  if (isEmpty(data.email)) {
    errors.email = 'Email is required';
  } else if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (data.grade !== undefined && data.grade !== null) {
      const grade = Number(data.grade);
      if (isNaN(grade) || !isInRange(grade, 1, 12)) {
        errors.grade = 'Grade must be between 1 and 12';
      }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

interface ValidationRule {
    required?: boolean;
    type?: 'email' | 'url' | 'string' | 'number';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: unknown) => boolean | string;
}

// Generic schema validator
export const validateSchema = (input: unknown, schema: Record<string, ValidationRule>): ValidationResult => {
  const data = input as Record<string, unknown>;
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && isEmpty(value)) {
      errors[field] = `${field} is required`;
      continue;
    }

    if (value && rules.type === 'email' && typeof value === 'string' && !isValidEmail(value)) {
      errors[field] = 'Invalid email format';
    }

    if (value && rules.type === 'url' && typeof value === 'string' && !isValidUrl(value)) {
      errors[field] = 'Invalid URL format';
    }

    if (value && rules.minLength && typeof value === 'string' && !hasMinLength(value, rules.minLength)) {
      errors[field] = `Minimum length is ${rules.minLength}`;
    }

    if (value && rules.maxLength && typeof value === 'string' && !hasMaxLength(value, rules.maxLength)) {
      errors[field] = `Maximum length is ${rules.maxLength}`;
    }

    if (value !== undefined && rules.min !== undefined) {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue < rules.min) {
             errors[field] = `Minimum value is ${rules.min}`;
        }
    }

    if (value !== undefined && rules.max !== undefined) {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > rules.max) {
            errors[field] = `Maximum value is ${rules.max}`;
        }
    }

    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors[field] = typeof customResult === 'string' ? customResult : 'Validation failed';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== CRM Validators ==================

interface ContactInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
}

export const validateContact = (data: ContactInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Name is required';
  } else if (data.name && !hasMinLength(data.name, 2)) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (isEmpty(data.email)) {
    errors.email = 'Email is required';
  } else if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Invalid phone number';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

interface DealInput {
  title?: string;
  value?: number | string;
  contact?: string;
  stage?: string;
  probability?: number | string;
}

export const validateDeal = (data: DealInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.title)) {
    errors.title = 'Deal title is required';
  } else if (data.title && !hasMinLength(data.title, 3)) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (data.value !== undefined && data.value !== null) {
    const value = Number(data.value);
    if (isNaN(value) || value < 0) {
      errors.value = 'Deal value must be a positive number';
    }
  }

  if (isEmpty(data.contact)) {
    errors.contact = 'Contact is required';
  }

  if (isEmpty(data.stage)) {
    errors.stage = 'Stage is required';
  }

  if (data.probability !== undefined && data.probability !== null) {
    const prob = Number(data.probability);
    if (isNaN(prob) || !isInRange(prob, 0, 100)) {
      errors.probability = 'Probability must be between 0 and 100';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== Tenant Validators ==================

interface TenantInput {
  name?: string;
  type?: string;
  email?: string;
  plan?: string;
  domain?: string;
}

export const validateTenant = (data: TenantInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Organization name is required';
  } else if (data.name && !hasMinLength(data.name, 2)) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name && !hasMaxLength(data.name, 100)) {
    errors.name = 'Name must be less than 100 characters';
  }

  if (isEmpty(data.type)) {
    errors.type = 'Organization type is required';
  }

  if (isEmpty(data.email)) {
    errors.email = 'Admin email is required';
  } else if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (data.domain && !isValidDomain(data.domain)) {
    errors.domain = 'Invalid domain format';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== User Validators ==================

interface UserInput {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

export const validateUser = (data: UserInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Name is required';
  } else if (data.name && !hasMinLength(data.name, 2)) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (isEmpty(data.email)) {
    errors.email = 'Email is required';
  } else if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (data.password !== undefined) {
    if (isEmpty(data.password)) {
      errors.password = 'Password is required';
    } else if (!isStrongPassword(data.password)) {
      errors.password = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
    }
  }

  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (isEmpty(data.role)) {
    errors.role = 'Role is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== Webhook Validators ==================

interface WebhookInput {
  name?: string;
  url?: string;
  events?: string[];
}

export const validateWebhook = (data: WebhookInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Webhook name is required';
  } else if (data.name && !hasMinLength(data.name, 3)) {
    errors.name = 'Name must be at least 3 characters';
  }

  if (isEmpty(data.url)) {
    errors.url = 'URL is required';
  } else if (data.url && !isValidUrl(data.url)) {
    errors.url = 'Invalid URL format';
  } else if (data.url && !data.url.startsWith('https://')) {
    errors.url = 'URL must use HTTPS';
  }

  if (!data.events || data.events.length === 0) {
    errors.events = 'At least one event must be selected';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== Broadcast Validators ==================

interface BroadcastInput {
  subject?: string;
  message?: string;
  target_audience?: string;
  channels?: { email?: boolean; inApp?: boolean; sms?: boolean };
}

export const validateBroadcast = (data: BroadcastInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.subject)) {
    errors.subject = 'Subject is required';
  } else if (data.subject && !hasMinLength(data.subject, 5)) {
    errors.subject = 'Subject must be at least 5 characters';
  } else if (data.subject && !hasMaxLength(data.subject, 200)) {
    errors.subject = 'Subject must be less than 200 characters';
  }

  if (isEmpty(data.message)) {
    errors.message = 'Message is required';
  } else if (data.message && !hasMinLength(data.message, 10)) {
    errors.message = 'Message must be at least 10 characters';
  }

  if (isEmpty(data.target_audience)) {
    errors.target_audience = 'Target audience is required';
  }

  if (data.channels) {
    const hasChannel = data.channels.email || data.channels.inApp || data.channels.sms;
    if (!hasChannel) {
      errors.channels = 'At least one channel must be selected';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== Course Validators ==================

interface CourseInput {
  name?: string;
  code?: string;
  description?: string;
  teacher?: string;
  credits?: number | string;
}

export const validateCourse = (data: CourseInput): ValidationResult => {
  const errors: Record<string, string> = {};

  if (isEmpty(data.name)) {
    errors.name = 'Course name is required';
  } else if (data.name && !hasMinLength(data.name, 3)) {
    errors.name = 'Name must be at least 3 characters';
  }

  if (isEmpty(data.code)) {
    errors.code = 'Course code is required';
  } else if (data.code && !/^[A-Z]{2,4}\d{3,4}$/.test(data.code)) {
    errors.code = 'Code must be in format like MATH101 or CS1001';
  }

  if (data.description && !hasMaxLength(data.description, 2000)) {
    errors.description = 'Description must be less than 2000 characters';
  }

  if (isEmpty(data.teacher)) {
    errors.teacher = 'Instructor is required';
  }

  if (data.credits !== undefined && data.credits !== null) {
    const credits = Number(data.credits);
    if (isNaN(credits) || !isInRange(credits, 0, 12)) {
      errors.credits = 'Credits must be between 0 and 12';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ================== Utility Validators ==================

export const isValidDomain = (domain: string): boolean => {
  const re = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return re.test(domain);
};

export const isValidCreditCard = (cardNumber: string): boolean => {
  // Basic Luhn algorithm check
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const isValidZipCode = (zip: string, country = 'US'): boolean => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
  };
  return patterns[country]?.test(zip) ?? true;
};

export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validator builder for custom forms
export class ValidatorBuilder<T extends Record<string, unknown>> {
  private rules: Record<string, ValidationRule> = {};

  field(name: keyof T, rule: ValidationRule): this {
    this.rules[name as string] = rule;
    return this;
  }

  required(name: keyof T): this {
    this.rules[name as string] = { ...this.rules[name as string], required: true };
    return this;
  }

  email(name: keyof T): this {
    this.rules[name as string] = { ...this.rules[name as string], type: 'email' };
    return this;
  }

  url(name: keyof T): this {
    this.rules[name as string] = { ...this.rules[name as string], type: 'url' };
    return this;
  }

  minLength(name: keyof T, min: number): this {
    this.rules[name as string] = { ...this.rules[name as string], minLength: min };
    return this;
  }

  maxLength(name: keyof T, max: number): this {
    this.rules[name as string] = { ...this.rules[name as string], maxLength: max };
    return this;
  }

  range(name: keyof T, min: number, max: number): this {
    this.rules[name as string] = { ...this.rules[name as string], min, max };
    return this;
  }

  custom(name: keyof T, validator: (value: unknown) => boolean | string): this {
    this.rules[name as string] = { ...this.rules[name as string], custom: validator };
    return this;
  }

  build(): (data: T) => ValidationResult {
    const rules = { ...this.rules };
    return (data: T) => validateSchema(data, rules);
  }
}