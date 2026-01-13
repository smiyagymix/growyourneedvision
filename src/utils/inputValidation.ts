/**
 * Comprehensive Input Validation Utilities
 * Type-safe validation with detailed error messages
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: string[];
}

/**
 * Email validation with comprehensive checks
 */
export function validateEmail(email: string): ValidationResult {
  const errors: Record<string, string[]> = {};

  if (!email) {
    errors.email = ['Email is required'];
  } else {
    email = email.trim();

    // Length check
    if (email.length < 3) {
      errors.email = [...(errors.email || []), 'Email must be at least 3 characters'];
    }
    if (email.length > 254) {
      errors.email = [...(errors.email || []), 'Email must not exceed 254 characters'];
    }

    // Format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = [...(errors.email || []), 'Invalid email format'];
    }

    // Additional checks
    if (email.includes('..')) {
      errors.email = [...(errors.email || []), 'Email cannot contain consecutive dots'];
    }
    if (email.startsWith('.') || email.endsWith('.')) {
      errors.email = [...(errors.email || []), 'Email cannot start or end with a dot'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Password validation with security requirements
 */
export function validatePassword(password: string): ValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: string[] = [];

  if (!password) {
    errors.password = ['Password is required'];
  } else {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&#]/.test(password),
    };

    const failed = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([check]) => {
        switch (check) {
          case 'length':
            return 'at least 8 characters';
          case 'uppercase':
            return 'at least one uppercase letter';
          case 'lowercase':
            return 'at least one lowercase letter';
          case 'number':
            return 'at least one number';
          case 'special':
            return 'at least one special character (@$!%*?&#)';
          default:
            return check;
        }
      });

    if (failed.length > 0) {
      errors.password = [`Password must contain: ${failed.join(', ')}`];
    }

    // Common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty', 'admin', '123456'];
    if (weakPasswords.includes(password.toLowerCase())) {
      warnings.push('This password is very common. Consider using a more unique password.');
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Phone number validation
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: Record<string, string[]> = {};

  if (!phone) {
    errors.phone = ['Phone number is required'];
  } else {
    // Remove common formatting
    const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');

    if (cleaned.length < 10) {
      errors.phone = ['Phone number must be at least 10 digits'];
    }
    if (cleaned.length > 15) {
      errors.phone = ['Phone number must not exceed 15 digits'];
    }
    if (!/^\d+$/.test(cleaned)) {
      errors.phone = ['Phone number must contain only digits and standard formatting'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * URL validation
 */
export function validateURL(url: string): ValidationResult {
  const errors: Record<string, string[]> = {};

  if (!url) {
    errors.url = ['URL is required'];
  } else {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.url = ['URL must use HTTP or HTTPS protocol'];
      }

      // Check hostname
      if (!urlObj.hostname) {
        errors.url = ['URL must have a valid hostname'];
      }
    } catch {
      errors.url = ['Invalid URL format'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Name validation
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const errors: Record<string, string[]> = {};

  if (!name || !name.trim()) {
    errors[fieldName.toLowerCase()] = [`${fieldName} is required`];
  } else {
    name = name.trim();

    if (name.length < 2) {
      errors[fieldName.toLowerCase()] = [`${fieldName} must be at least 2 characters`];
    }
    if (name.length > 100) {
      errors[fieldName.toLowerCase()] = [`${fieldName} must not exceed 100 characters`];
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      errors[fieldName.toLowerCase()] = [`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Number validation
 */
export function validateNumber(
  value: unknown,
  fieldName: string = 'Number',
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const field = fieldName.toLowerCase();

  if (value === null || value === undefined || value === '') {
    errors[field] = [`${fieldName} is required`];
  } else {
    const num = typeof value === 'string' ? parseFloat(value) : (value as number);

    if (isNaN(num)) {
      errors[field] = [`${fieldName} must be a valid number`];
    } else {
      if (options?.integer && !Number.isInteger(num)) {
        errors[field] = [`${fieldName} must be an integer`];
      }
      if (options?.min !== undefined && num < options.min) {
        errors[field] = [...(errors[field] || []), `${fieldName} must be at least ${options.min}`];
      }
      if (options?.max !== undefined && num > options.max) {
        errors[field] = [...(errors[field] || []), `${fieldName} must not exceed ${options.max}`];
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Date validation
 */
export function validateDate(
  date: string | Date,
  fieldName: string = 'Date',
  options?: {
    minDate?: Date;
    maxDate?: Date;
    allowPast?: boolean;
    allowFuture?: boolean;
  }
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const field = fieldName.toLowerCase();

  if (!date) {
    errors[field] = [`${fieldName} is required`];
    return { isValid: false, errors };
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      errors[field] = [`${fieldName} must be a valid date`];
    } else {
      const now = new Date();

      if (options?.minDate && dateObj < options.minDate) {
        errors[field] = [...(errors[field] || []), `${fieldName} must be after ${options.minDate.toDateString()}`];
      }
      if (options?.maxDate && dateObj > options.maxDate) {
        errors[field] = [...(errors[field] || []), `${fieldName} must be before ${options.maxDate.toDateString()}`];
      }
      if (options?.allowPast === false && dateObj < now) {
        errors[field] = [...(errors[field] || []), `${fieldName} must be in the future`];
      }
      if (options?.allowFuture === false && dateObj > now) {
        errors[field] = [...(errors[field] || []), `${fieldName} must be in the past`];
      }
    }
  } catch {
    errors[field] = [`${fieldName} must be a valid date`];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Array validation
 */
export function validateArray<T = unknown>(
  array: unknown,
  fieldName: string = 'Array',
  options?: {
    minItems?: number;
    maxItems?: number;
    itemValidator?: (item: T, index: number) => ValidationResult;
  }
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const field = fieldName.toLowerCase();

  if (!Array.isArray(array)) {
    errors[field] = [`${fieldName} must be an array`];
  } else {
    if (options?.minItems !== undefined && array.length < options.minItems) {
      errors[field] = [`${fieldName} must have at least ${options.minItems} items`];
    }
    if (options?.maxItems !== undefined && array.length > options.maxItems) {
      errors[field] = [`${fieldName} must not exceed ${options.maxItems} items`];
    }

    if (options?.itemValidator) {
      for (let i = 0; i < array.length; i++) {
        const result = options.itemValidator(array[i] as T, i);
        if (!result.isValid) {
          errors[`${field}[${i}]`] = Object.values(result.errors).flat();
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...validations: ValidationResult[]): ValidationResult {
  const combined: Record<string, string[]> = {};
  const warnings: string[] = [];

  for (const validation of validations) {
    // Combine errors
    for (const [key, value] of Object.entries(validation.errors)) {
      combined[key] = [...(combined[key] || []), ...value];
    }
    // Combine warnings
    if (validation.warnings) {
      warnings.push(...validation.warnings);
    }
  }

  return {
    isValid: Object.keys(combined).length === 0,
    errors: combined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Create a custom validator
 */
export function createValidator(
  rules: Record<string, (value: unknown) => string | null>
) {
  return (data: Record<string, unknown>): ValidationResult => {
    const errors: Record<string, string[]> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const error = rule(data[field]);
      if (error) {
        errors[field] = [error];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize multiple fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  stringFields: (keyof T)[] = []
): T {
  const sanitized = { ...obj };

  for (const field of stringFields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field] as string) as never;
    }
  }

  return sanitized;
}

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateName,
  validateNumber,
  validateDate,
  validateArray,
  combineValidations,
  createValidator,
  sanitizeInput,
  sanitizeObject,
};
