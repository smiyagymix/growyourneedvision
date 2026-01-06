import React from 'react';

interface OpacityControlProps {
  value: number;
  onChange: (value: number) => void;
}

export const OpacityControl: React.FC<OpacityControlProps> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <label className="text-xs text-gray-400">Opacity</label>
        <span className="text-xs text-gray-400">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
};
