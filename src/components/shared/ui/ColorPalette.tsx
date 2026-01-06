import React from 'react';

interface ColorPaletteProps {
  colors: string[];
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ colors }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        {colors.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div 
                    className="w-12 h-12 rounded-full shadow-md border border-gray-100 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                ></div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">{color}</span>
            </div>
        ))}
    </div>
  );
};