
import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ name, options, value, onChange }) => {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label 
            key={option.value} 
            className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${value === option.value ? 'border-gyn-blue-medium bg-blue-50/50 ring-1 ring-gyn-blue-medium' : 'border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="flex items-center h-5">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="w-4 h-4 text-gyn-blue-medium border-gray-300 focus:ring-gyn-blue-medium"
            />
          </div>
          <div className="ml-3 text-sm">
            <span className={`font-bold block ${value === option.value ? 'text-gyn-blue-dark' : 'text-gray-700'}`}>
                {option.label}
            </span>
            {option.description && (
                <span className="text-gray-500 text-xs mt-1 block">{option.description}</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};
