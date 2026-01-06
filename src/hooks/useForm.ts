import { useState, ChangeEvent } from 'react';

export function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetForm = () => setValues(initialValues);

  const setFieldValue = (key: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  return { values, handleChange, resetForm, setFieldValue };
}