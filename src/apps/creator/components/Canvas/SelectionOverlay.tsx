import React from 'react';
import { useResize } from '../../hooks/useResize';
import { useRotate } from '../../hooks/useRotate';

interface SelectionOverlayProps {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ x, y, width, height }) => {
    const { startResize } = useResize();
    const { startRotate } = useRotate();

    const handles = [
        { id: 'nw', cursor: 'nw-resize', class: '-top-1 -left-1' },
        { id: 'n', cursor: 'n-resize', class: '-top-1 left-1/2 -translate-x-1/2' },
        { id: 'ne', cursor: 'ne-resize', class: '-top-1 -right-1' },
        { id: 'e', cursor: 'e-resize', class: 'top-1/2 -right-1 -translate-y-1/2' },
        { id: 'se', cursor: 'se-resize', class: '-bottom-1 -right-1' },
        { id: 's', cursor: 's-resize', class: '-bottom-1 left-1/2 -translate-x-1/2' },
        { id: 'sw', cursor: 'sw-resize', class: '-bottom-1 -left-1' },
        { id: 'w', cursor: 'w-resize', class: 'top-1/2 -left-1 -translate-y-1/2' },
    ];

    return (
        <div
            className="absolute border-2 border-purple-500 bg-purple-500/10 pointer-events-none"
            style={{
                left: x,
                top: y,
                width,
                height
            }}
        >
            {/* Rotation Handle */}
            <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-purple-500 pointer-events-auto cursor-alias flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors"
                onMouseDown={startRotate}
                title="Rotate"
            >
                <div className="w-1 h-1 bg-purple-500 rounded-full" />
            </div>

            {/* Rotation Line */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-purple-500" />

            {/* Resize Handles */}
            {handles.map(handle => (
                <div
                    key={handle.id}
                    onMouseDown={(e) => startResize(e, handle.id)}
                    className={`absolute w-2 h-2 bg-white border border-purple-500 pointer-events-auto ${handle.class}`}
                    style={{ cursor: handle.cursor }}
                />
            ))}
        </div>
    );
};
