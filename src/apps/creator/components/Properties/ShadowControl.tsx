import React from 'react';
import { ColorPicker } from './ColorPicker';

interface ShadowControlProps {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  onChange: (key: string, value: any) => void;
}

export const ShadowControl: React.FC<ShadowControlProps> = ({
  enabled, color, blur, offsetX, offsetY, onChange
}) => {
  if (!enabled) {
    return (
      <div className="mb-4 border-t border-gray-700 pt-4">
        <button
          type="button"
          onClick={() => onChange('shadowEnabled', true)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + Add Shadow
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 border-t border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold text-gray-300">Shadow</label>
        <button
          type="button"
          onClick={() => onChange('shadowEnabled', false)}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>
      
      <ColorPicker
        label="Color"
        value={color}
        onChange={(val) => onChange('shadowColor', val)}
      />
      
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div>
          <label className="text-xs text-gray-400">Blur</label>
          <input
            type="number"
            value={blur}
            onChange={(e) => onChange('shadowBlur', Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">X</label>
          <input
            type="number"
            value={offsetX}
            onChange={(e) => onChange('shadowOffsetX', Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400">Y</label>
          <input
            type="number"
            value={offsetY}
            onChange={(e) => onChange('shadowOffsetY', Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
      </div>
    </div>
  );
};
