import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded border border-gray-600 cursor-pointer"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 opacity-0 absolute cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
        />
      </div>
    </div>
  );
};
