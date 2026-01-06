
import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  min: number;
  max: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, min, max, value, onChange, ...props }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {label && <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>}
        <span className="text-xs font-bold text-gyn-blue-dark bg-blue-50 px-2 py-0.5 rounded">{value}</span>
      </div>
      <div className="relative w-full h-2 bg-gray-200 rounded-full">
        <div 
            className="absolute h-full bg-gyn-blue-medium rounded-full" 
            style={{ width: `${percentage}%` }}
        ></div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={onChange}
            className="absolute w-full h-full opacity-0 cursor-pointer"
            {...props}
        />
        <div 
            className="absolute h-4 w-4 bg-white border-2 border-gyn-blue-medium rounded-full shadow-md pointer-events-none top-1/2 -translate-y-1/2 -ml-2"
            style={{ left: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
