import React from 'react';

interface BlendModeControlProps {
  value: string;
  onChange: (value: string) => void;
}

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity'
];

export const BlendModeControl: React.FC<BlendModeControlProps> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-400 mb-1">Blend Mode</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
      >
        {BLEND_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
          </option>
        ))}
      </select>
    </div>
  );
};
