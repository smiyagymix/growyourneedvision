/**
 * Enhanced Validation System
 * Provides comprehensive form and data validation with async support
 */

export type ValidationRule<T = any> = (value: T) => string | null;
export type AsyncValidationRule<T = any> = (value: T) => Promise<string | null>;

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string[]>;
}

/**
 * Validation schema definition
 */
export interface ValidationSchema {
  [field: string]: ValidationRule[] | AsyncValidationRule[];
}

/**
 * Built-in validation rules
 */
export const ValidationRules = {
  // String validators
  required: (value: string): string | null => {
    return value && value.trim().length > 0 ? null : 'This field is required';
  },

  minLength: (min: number) => (value: string): string | null => {
    return value && value.length >= min ? null : `Minimum length is ${min} characters`;
  },

  maxLength: (max: number) => (value: string): string | null => {
    return value && value.length <= max ? null : `Maximum length is ${max} characters`;
  },

  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email address';
  },

  url: (value: string): string | null => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL';
    }
  },

  pattern: (regex: RegExp, message?: string) => (value: string): string | null => {
    return regex.test(value) ? null : message || 'Invalid format';
  },

  // Number validators
  minValue: (min: number) => (value: number): string | null => {
    return value >= min ? null : `Minimum value is ${min}`;
  },

  maxValue: (max: number) => (value: number): string | null => {
    return value <= max ? null : `Maximum value is ${max}`;
  },

  integer: (value: number): string | null => {
    return Number.isInteger(value) ? null : 'Must be a whole number';
  },

  // Array validators
  minItems: (min: number) => (value: any[]): string | null => {
    return Array.isArray(value) && value.length >= min
      ? null
      : `At least ${min} items are required`;
  },

  maxItems: (max: number) => (value: any[]): string | null => {
    return Array.isArray(value) && value.length <= max
      ? null
      : `Maximum ${max} items allowed`;
  },

  // Password validators
  strongPassword: (value: string): string | null => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);
    const isLongEnough = value.length >= 8;

    if (!hasUppercase) return 'Password must contain uppercase letters';
    if (!hasLowercase) return 'Password must contain lowercase letters';
    if (!hasNumbers) return 'Password must contain numbers';
    if (!hasSpecialChar) return 'Password must contain special characters (!@#$%^&*)';
    if (!isLongEnough) return 'Password must be at least 8 characters long';

    return null;
  },

  // Custom validator
  custom: (fn: (value: any) => boolean, message: string) => (value: any): string | null => {
    return fn(value) ? null : message;
  },
};

/**
 * Async validation rules
 */
export const AsyncValidationRules = {
  // Check if email exists
  emailExists: (checkFn: (email: string) => Promise<boolean>) =>
    async (value: string): Promise<string | null> => {
      const exists = await checkFn(value);
      return exists ? 'Email already registered' : null;
    },

  // Check if username exists
  usernameExists: (checkFn: (username: string) => Promise<boolean>) =>
    async (value: string): Promise<string | null> => {
      const exists = await checkFn(value);
      return exists ? 'Username already taken' : null;
    },

  // Custom async validator
  customAsync: (fn: (value: any) => Promise<boolean>, message: string) =>
    async (value: any): Promise<string | null> => {
      const isValid = await fn(value);
      return isValid ? null : message;
    },
};

/**
 * Validator class for validating forms and objects
 */
export class Validator {
  private schema: ValidationSchema = {};
  private logger: any = { warn: console.warn };

  constructor(schema?: ValidationSchema) {
    if (schema) {
      this.schema = schema;
    }
  }

  /**
   * Add validation rule for a field
   */
  addRule(field: string, rule: ValidationRule | AsyncValidationRule): this {
    if (!this.schema[field]) {
      this.schema[field] = [];
    }
    (this.schema[field] as any[]).push(rule);
    return this;
  }

  /**
   * Validate a single field
   */
  async validateField(field: string, value: any): Promise<string[]> {
    const rules = this.schema[field] || [];
    const errors: string[] = [];

    for (const rule of rules) {
      try {
        const error = await Promise.resolve(rule(value));
        if (error) {
          errors.push(error);
        }
      } catch (err) {
        this.logger.warn(`Validation rule failed for ${field}:`, err);
      }
    }

    return errors;
  }

  /**
   * Validate entire object
   */
  async validate(data: Record<string, any>): Promise<ValidationResult> {
    const fieldErrors: Record<string, string[]> = {};
    const errors: ValidationError[] = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];
      const fieldErrors_list = await this.validateField(field, value);

      if (fieldErrors_list.length > 0) {
        fieldErrors[field] = fieldErrors_list;
        fieldErrors_list.forEach((message) => {
          errors.push({ field, message, rule: 'validation' });
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors,
    };
  }

  /**
   * Validate and throw on errors
   */
  async validateOrThrow(data: Record<string, any>): Promise<void> {
    const result = await this.validate(data);
    if (!result.isValid) {
      throw new ValidationError(`Validation failed`, result.fieldErrors);
    }
  }
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }

  /**
   * Get all error messages
   */
  getAllMessages(): string[] {
    return Object.values(this.fieldErrors).flat();
  }

  /**
   * Get field-specific errors
   */
  getFieldErrors(field: string): string[] {
    return this.fieldErrors[field] || [];
  }
}

/**
 * Form validation hook data
 */
export interface FormData {
  [key: string]: any;
}

export interface FormValidationState {
  data: FormData;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isValidating: boolean;
  isValid: boolean;
}

/**
 * Quick validation for common patterns
 */
export class QuickValidate {
  static email(value: string): boolean {
    return ValidationRules.email(value) === null;
  }

  static url(value: string): boolean {
    return ValidationRules.url(value) === null;
  }

  static password(value: string): boolean {
    return ValidationRules.strongPassword(value) === null;
  }

  static minLength(value: string, min: number): boolean {
    return ValidationRules.minLength(min)(value) === null;
  }

  static maxLength(value: string, max: number): boolean {
    return ValidationRules.maxLength(max)(value) === null;
  }

  static required(value: any): boolean {
    if (typeof value === 'string') {
      return ValidationRules.required(value) === null;
    }
    return value !== null && value !== undefined && value !== '';
  }

  static minValue(value: number, min: number): boolean {
    return ValidationRules.minValue(min)(value) === null;
  }

  static maxValue(value: number, max: number): boolean {
    return ValidationRules.maxValue(max)(value) === null;
  }

  static integer(value: number): boolean {
    return ValidationRules.integer(value) === null;
  }

  static pattern(value: string, regex: RegExp): boolean {
    return ValidationRules.pattern(regex)(value) === null;
  }
}

/**
 * Batch validator for multiple objects
 */
export class BatchValidator {
  private validators: Map<string, Validator> = new Map();

  /**
   * Register validator for object type
   */
  register(type: string, validator: Validator): this {
    this.validators.set(type, validator);
    return this;
  }

  /**
   * Validate object by type
   */
  async validate(
    type: string,
    data: Record<string, any>
  ): Promise<ValidationResult> {
    const validator = this.validators.get(type);
    if (!validator) {
      throw new Error(`No validator registered for type: ${type}`);
    }
    return validator.validate(data);
  }

  /**
   * Validate multiple objects
   */
  async validateAll(
    items: Array<{ type: string; data: Record<string, any> }>
  ): Promise<Map<number, ValidationResult>> {
    const results = new Map<number, ValidationResult>();

    for (let i = 0; i < items.length; i++) {
      const { type, data } = items[i];
      results.set(i, await this.validate(type, data));
    }

    return results;
  }
}

/**
 * Create a form validator instance
 */
export function createValidator(schema?: ValidationSchema): Validator {
  return new Validator(schema);
}

/**
 * Create a batch validator
 */
export function createBatchValidator(): BatchValidator {
  return new BatchValidator();
}

export default {
  ValidationRules,
  AsyncValidationRules,
  Validator,
  ValidationError,
  QuickValidate,
  BatchValidator,
  createValidator,
  createBatchValidator,
};
