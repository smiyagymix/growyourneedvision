import React from 'react';

interface FilterControlsProps {
  brightness: number;
  contrast: number;
  saturation: number;
  onChange: (key: string, value: number) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ brightness, contrast, saturation, onChange }) => {
  return (
    <div className="mb-4 border-t border-gray-700 pt-4">
      <label className="block text-xs font-bold text-gray-300 mb-2">Filters</label>
      
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Brightness</span>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={brightness}
            onChange={(e) => onChange('brightness', Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Contrast</span>
            <span>{contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={contrast}
            onChange={(e) => onChange('contrast', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Saturation</span>
            <span>{saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => onChange('saturation', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
