
import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input 
        type="checkbox" 
        className={`w-4 h-4 text-gyn-blue-medium rounded border-gray-300 focus:ring-gyn-blue-medium/20 ${className}`} 
        {...props} 
      />
      {label && <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>}
    </label>
  );
};
