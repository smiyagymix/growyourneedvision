import { useState, useCallback } from 'react';
import { ValidationResult } from '../utils/validators';

/**
 * Custom hook for form validation
 * Provides validation state and methods for any form
 */

export interface UseValidationOptions {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
}

export const useValidation = <T extends Record<string, any>>(
    validatorFn: (data: T) => ValidationResult,
    options: UseValidationOptions = {}
) => {
    const { validateOnChange = false, validateOnBlur = false } = options;

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isValidating, setIsValidating] = useState(false);

    /**
     * Validate the entire form
     */
    const validate = useCallback((data: T): boolean => {
        setIsValidating(true);
        const result = validatorFn(data);
        setErrors(result.errors);
        setIsValidating(false);
        return result.valid;
    }, [validatorFn]);

    /**
     * Validate a single field
     */
    const validateField = useCallback((fieldName: string, value: any, allData: T): boolean => {
        const result = validatorFn({ ...allData, [fieldName]: value } as T);

        setErrors(prev => ({
            ...prev,
            [fieldName]: result.errors[fieldName] || ''
        }));

        return !result.errors[fieldName];
    }, [validatorFn]);

    /**
     * Clear all errors
     */
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * Clear error for a specific field
     */
    const clearFieldError = useCallback((fieldName: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    /**
     * Mark field as touched
     */
    const touchField = useCallback((fieldName: string) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    /**
     * Mark all fields as touched
     */
    const touchAll = useCallback((data: T) => {
        const allTouched = Object.keys(data).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setTouched(allTouched);
    }, []);

    /**
     * Reset validation state
     */
    const reset = useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);

    /**
     * Get error for a field (only if touched or validateOnChange)
     */
    const getFieldError = useCallback((fieldName: string): string | undefined => {
        if (validateOnChange || touched[fieldName]) {
            return errors[fieldName];
        }
        return undefined;
    }, [errors, touched, validateOnChange]);

    /**
     * Check if form is valid
     */
    const isValid = Object.keys(errors).length === 0;

    /**
     * Check if field has error
     */
    const hasError = (fieldName: string): boolean => {
        return !!errors[fieldName];
    };

    return {
        errors,
        touched,
        isValidating,
        isValid,
        validate,
        validateField,
        clearErrors,
        clearFieldError,
        touchField,
        touchAll,
        reset,
        getFieldError,
        hasError
    };
};
