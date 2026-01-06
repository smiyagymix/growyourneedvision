import React from 'react';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
    return (
        <div className="flex items-center gap-2">
            <input 
                type="color" 
                value={color} 
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <input 
                type="text" 
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white w-20 uppercase"
            />
        </div>
    );
};
