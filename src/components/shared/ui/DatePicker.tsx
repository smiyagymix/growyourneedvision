
import React, { useEffect, useState } from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface DatePickerProps {
  label?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
}

// Lightweight, accessible date picker built on the native date input
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  id,
  name,
  min,
  max,
  placeholder,
  disabled,
  required,
  onBlur,
  onFocus,
}) => {
  const [internalDate, setInternalDate] = useState(value || '');

  // Keep internal state in sync when parent changes value
  useEffect(() => {
    setInternalDate(value || '');
  }, [value]);

  const clampToRange = (nextValue: string) => {
    if (!nextValue) return '';

    const next = new Date(nextValue);
    if (Number.isNaN(next.getTime())) return '';

    if (min && next < new Date(min)) return min;
    if (max && next > new Date(max)) return max;
    return nextValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = clampToRange(e.target.value);
    setInternalDate(next);
    onChange(next);
  };

  const displayDate = value !== undefined ? value : internalDate;

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5" htmlFor={id}>{label}</label>}
      <div className="relative">
        <input
          id={id}
          name={name}
          type="date"
          value={displayDate}
          min={min}
          max={max}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          aria-label={label || placeholder || 'Select date'}
          className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gyn-blue-medium/20 focus:border-gyn-blue-medium transition-all shadow-inner cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <OwnerIcon name="CalendarIcon" className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
      </div>
    </div>
  );
};
