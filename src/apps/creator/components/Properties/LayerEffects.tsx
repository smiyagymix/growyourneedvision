import React from 'react';

interface LayerEffectsProps {
  layer: any;
  onChange: (key: string, value: any) => void;
}

export const LayerEffects: React.FC<LayerEffectsProps> = ({ layer, onChange }) => {
  return (
    <div className="mb-4 border-t border-gray-700 pt-4">
      <label className="block text-xs font-bold text-gray-300 mb-2">Effects</label>
      
      <div className="mb-2">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={layer.blur > 0}
            onChange={(e) => onChange('blur', e.target.checked ? 5 : 0)}
          />
          Blur
        </label>
        {layer.blur > 0 && (
          <input
            type="range"
            min="0"
            max="50"
            value={layer.blur}
            onChange={(e) => onChange('blur', Number(e.target.value))}
            className="w-full mt-1"
          />
        )}
      </div>

      <div className="mb-2">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={layer.grayscale > 0}
            onChange={(e) => onChange('grayscale', e.target.checked ? 100 : 0)}
          />
          Grayscale
        </label>
      </div>
    </div>
  );
};
