import React from 'react';

interface FontSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FONTS = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Roboto',
  'Open Sans'
];

export const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-400 mb-1">Font Family</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
      >
        {FONTS.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
};
