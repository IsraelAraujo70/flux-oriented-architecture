/**
 * Validation utilities for FOA applications
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ValidationException extends Error {
  public errors: ValidationError[];
  public statusCode: number;

  constructor(errors: ValidationError[], message = 'Validation failed') {
    super(message);
    this.name = 'ValidationException';
    this.errors = errors;
    this.statusCode = 400;
  }
}

/**
 * Validate required fields in an object
 */
export function validateRequired(data: Record<string, any>, fields: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        field,
        message: `${field} is required`,
        value
      });
    }
  }

  return errors;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate email field in data
 */
export function validateEmailField(data: Record<string, any>, field: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const value = data[field];

  if (value && !validateEmail(value)) {
    errors.push({
      field,
      message: `${field} must be a valid email address`,
      value
    });
  }

  return errors;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): { valid: boolean; message?: string } {
  if (min !== undefined && value.length < min) {
    return { valid: false, message: `Must be at least ${min} characters` };
  }

  if (max !== undefined && value.length > max) {
    return { valid: false, message: `Must be at most ${max} characters` };
  }

  return { valid: true };
}

/**
 * Validate numeric range
 */
export function validateRange(
  value: number,
  min?: number,
  max?: number
): { valid: boolean; message?: string } {
  if (min !== undefined && value < min) {
    return { valid: false, message: `Must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { valid: false, message: `Must be at most ${max}` };
  }

  return { valid: true };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate against a schema
 */
export interface ValidationSchema {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

export function validate(data: Record<string, any>, schema: ValidationSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value
      });
      continue;
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type check
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({
              field,
              message: `${field} must be a string`,
              value
            });
          }
          break;

        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push({
              field,
              message: `${field} must be a number`,
              value
            });
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({
              field,
              message: `${field} must be a boolean`,
              value
            });
          }
          break;

        case 'email':
          if (!validateEmail(value)) {
            errors.push({
              field,
              message: `${field} must be a valid email address`,
              value
            });
          }
          break;

        case 'url':
          if (!validateUrl(value)) {
            errors.push({
              field,
              message: `${field} must be a valid URL`,
              value
            });
          }
          break;
      }
    }

    // String length check
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters`,
          value
        });
      }

      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rules.maxLength} characters`,
          value
        });
      }
    }

    // Number range check
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`,
          value
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rules.max}`,
          value
        });
      }
    }

    // Pattern check
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} has invalid format`,
          value
        });
      }
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value);
      if (result !== true) {
        errors.push({
          field,
          message: typeof result === 'string' ? result : `${field} is invalid`,
          value
        });
      }
    }
  }

  return errors;
}

/**
 * Validate and throw if errors exist
 */
export function validateOrThrow(data: Record<string, any>, schema: ValidationSchema): void {
  const errors = validate(data, schema);

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
}

/**
 * Sanitize string (remove HTML tags)
 */
export function sanitizeString(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize object (remove undefined and null values)
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result;
}
