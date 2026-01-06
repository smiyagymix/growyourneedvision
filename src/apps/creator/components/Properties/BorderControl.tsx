import React from 'react';
import { ColorPicker } from './ColorPicker';

interface BorderControlProps {
  width: number;
  color: string;
  onChange: (key: string, value: any) => void;
}

export const BorderControl: React.FC<BorderControlProps> = ({ width, color, onChange }) => {
  return (
    <div className="mb-4 border-t border-gray-700 pt-4">
      <label className="block text-xs font-bold text-gray-300 mb-2">Border</label>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-gray-400">Width</label>
          <input
            type="number"
            min="0"
            value={width}
            onChange={(e) => onChange('strokeWidth', Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
      </div>
      <ColorPicker
        label="Color"
        value={color}
        onChange={(val) => onChange('stroke', val)}
      />
    </div>
  );
};
