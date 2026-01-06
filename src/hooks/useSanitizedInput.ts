/**
 * useSanitizedInput Hook
 * Provides automatic input sanitization for form fields
 */

import { useState, useCallback, ChangeEvent } from 'react';
import { sanitizeText, sanitizeHtml } from '../utils/sanitization';

export type SanitizeMode = 'text' | 'basic' | 'rich' | 'none';

interface UseSanitizedInputOptions {
  initialValue?: string;
  mode?: SanitizeMode;
  onChange?: (value: string) => void;
}

interface UseSanitizedInputReturn {
  value: string;
  sanitizedValue: string;
  setValue: (value: string) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  reset: () => void;
}

/**
 * Hook for handling sanitized user input
 * Automatically sanitizes values based on specified mode
 * 
 * @example
 * const { value, sanitizedValue, handleChange } = useSanitizedInput({ mode: 'text' });
 * <input value={value} onChange={handleChange} />
 */
export function useSanitizedInput(options: UseSanitizedInputOptions = {}): UseSanitizedInputReturn {
  const {
    initialValue = '',
    mode = 'text',
    onChange,
  } = options;

  const [value, setValue] = useState<string>(initialValue);

  const sanitize = useCallback((input: string): string => {
    if (!input || mode === 'none') return input;
    
    switch (mode) {
      case 'text':
        return sanitizeText(input);
      case 'basic':
        return sanitizeHtml(input, 'BASIC');
      case 'rich':
        return sanitizeHtml(input, 'RICH');
      default:
        return input;
    }
  }, [mode]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (onChange) {
      const sanitized = sanitize(newValue);
      onChange(sanitized);
    }
  }, [onChange, sanitize]);

  const setValueWrapper = useCallback((newValue: string) => {
    setValue(newValue);
    
    if (onChange) {
      const sanitized = sanitize(newValue);
      onChange(sanitized);
    }
  }, [onChange, sanitize]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  const sanitizedValue = sanitize(value);

  return {
    value,
    sanitizedValue,
    setValue: setValueWrapper,
    handleChange,
    reset,
  };
}

/**
 * Hook for handling multiple form fields with sanitization
 * 
 * @example
 * const { values, handleChange, setField } = useSanitizedForm({
 *   name: { value: '', mode: 'text' },
 *   description: { value: '', mode: 'rich' }
 * });
 */
export function useSanitizedForm<T extends Record<string, any>>(
  initialValues: Record<keyof T, { value: any; mode?: SanitizeMode }>
) {
  const [values, setValues] = useState<T>(() => {
    const initial = {} as T;
    Object.keys(initialValues).forEach((key) => {
      initial[key as keyof T] = initialValues[key].value;
    });
    return initial;
  });

  const sanitize = useCallback((value: any, mode: SanitizeMode = 'text'): any => {
    if (typeof value !== 'string' || mode === 'none') return value;
    
    switch (mode) {
      case 'text':
        return sanitizeText(value);
      case 'basic':
        return sanitizeHtml(value, 'BASIC');
      case 'rich':
        return sanitizeHtml(value, 'RICH');
      default:
        return value;
    }
  }, []);

  const handleChange = useCallback((
    field: keyof T,
    value: any,
    mode?: SanitizeMode
  ) => {
    const fieldMode = mode || initialValues[field]?.mode || 'text';
    const sanitized = sanitize(value, fieldMode);
    
    setValues(prev => ({
      ...prev,
      [field]: sanitized,
    }));
  }, [initialValues, sanitize]);

  const setField = useCallback((field: keyof T, value: any) => {
    const fieldMode = initialValues[field]?.mode || 'text';
    const sanitized = sanitize(value, fieldMode);
    
    setValues(prev => ({
      ...prev,
      [field]: sanitized,
    }));
  }, [initialValues, sanitize]);

  const reset = useCallback(() => {
    const initial = {} as T;
    Object.keys(initialValues).forEach((key) => {
      initial[key as keyof T] = initialValues[key].value;
    });
    setValues(initial);
  }, [initialValues]);

  const getSanitizedValues = useCallback((): T => {
    const sanitized = {} as T;
    Object.keys(values).forEach((key) => {
      const fieldMode = initialValues[key as keyof T]?.mode || 'text';
      sanitized[key as keyof T] = sanitize(values[key as keyof T], fieldMode);
    });
    return sanitized;
  }, [values, initialValues, sanitize]);

  return {
    values,
    handleChange,
    setField,
    reset,
    getSanitizedValues,
  };
}
