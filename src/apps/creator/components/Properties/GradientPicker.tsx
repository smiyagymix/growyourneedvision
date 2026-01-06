import React from 'react';

interface GradientPickerProps {
  value: string; // CSS gradient string
  onChange: (value: string) => void;
}

export const GradientPicker: React.FC<GradientPickerProps> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="text-xs text-gray-400 mb-2 block">Gradient</label>
      <div className="flex gap-2 mb-2">
        <button 
          type="button"
          className="flex-1 bg-gray-700 text-xs py-1 rounded hover:bg-gray-600"
          onClick={() => onChange('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)')}
        >
          Linear
        </button>
        <button 
          type="button"
          className="flex-1 bg-gray-700 text-xs py-1 rounded hover:bg-gray-600"
          onClick={() => onChange('radial-gradient(circle, #ff0000 0%, #0000ff 100%)')}
        >
          Radial
        </button>
      </div>
      {/* Simplified gradient preview */}
      <div 
        className="h-8 w-full rounded border border-gray-600"
        style={{ background: value }}
      />
    </div>
  );
};
