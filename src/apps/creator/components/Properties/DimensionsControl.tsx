import React from 'react';

interface DimensionsControlProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  onChange: (key: string, value: number) => void;
}

export const DimensionsControl: React.FC<DimensionsControlProps> = ({
  x, y, width, height, rotation, onChange
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div>
        <label className="text-xs text-gray-400">X</label>
        <input
          type="number"
          value={Math.round(x)}
          onChange={(e) => onChange('x', Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">Y</label>
        <input
          type="number"
          value={Math.round(y)}
          onChange={(e) => onChange('y', Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">W</label>
        <input
          type="number"
          value={Math.round(width)}
          onChange={(e) => onChange('width', Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">H</label>
        <input
          type="number"
          value={Math.round(height)}
          onChange={(e) => onChange('height', Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-gray-400">Rotation</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => onChange('rotation', Number(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            value={Math.round(rotation)}
            onChange={(e) => onChange('rotation', Number(e.target.value))}
            className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
          />
        </div>
      </div>
    </div>
  );
};
