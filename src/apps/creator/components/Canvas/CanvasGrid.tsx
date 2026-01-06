import React from 'react';

export const CanvasGrid: React.FC = () => {
    return (
        <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }}
        />
    );
};
