import React from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const presetColors = ['#1d2a78', '#3041c7', '#f5a623', '#ef4444', '#22c55e', '#000000', '#ffffff'];

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{label}</label>}
      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-300 shadow-inner shrink-0">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => onChange(e.target.value)}
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
              />
          </div>
          <div className="flex-1 flex gap-1.5 flex-wrap">
              {presetColors.map(c => (
                  <button 
                    type="button"
                    key={c}
                    className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{backgroundColor: c}}
                    onClick={() => onChange(c)}
                  />
              ))}
          </div>
          <div className="text-xs font-mono text-gray-500 uppercase border-l border-gray-200 pl-3">
              {color}
          </div>
      </div>
    </div>
  );
};