import React from 'react';

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
    label?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, min, max, step = 1, onChange, label }) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{label}</span>
                    <span>{value}</span>
                </div>
            )}
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#3f3f46] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>
    );
};
