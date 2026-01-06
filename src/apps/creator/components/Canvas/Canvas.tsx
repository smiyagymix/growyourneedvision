import React, { useRef } from 'react';
import { useEditor } from '../../store/editorStore';
import { CanvasGrid } from './CanvasGrid';
import { LayerRenderer } from '../Layers/LayerRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { useCanvasEvents } from '../../hooks/useCanvasEvents';

export const Canvas: React.FC = () => {
    const { state, dispatch } = useEditor();
    const canvasRef = useRef<HTMLDivElement>(null);
    const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel } = useCanvasEvents();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            try {
                const asset = JSON.parse(data);
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const x = (e.clientX - rect.left) / state.zoom;
                    const y = (e.clientY - rect.top) / state.zoom;

                    dispatch({
                        type: 'ADD_LAYER',
                        payload: {
                            id: crypto.randomUUID(),
                            type: 'image',
                            name: asset.label,
                            x: x - 50, // Center the 100x100 image
                            y: y - 50,
                            width: 100,
                            height: 100,
                            rotation: 0,
                            opacity: 1,
                            visible: true,
                            locked: false,
                            src: asset.src,
                            index: state.layers.length
                        }
                    });
                }
            } catch (err) {
                console.error('Failed to parse dropped asset', err);
            }
        }
    };

    // Calculate selection bounding box
    const selectedLayers = state.layers.filter(l => state.selectedIds.includes(l.id));
    let selectionBox = null;

    if (selectedLayers.length > 0) {
        const minX = Math.min(...selectedLayers.map(l => l.x));
        const minY = Math.min(...selectedLayers.map(l => l.y));
        const maxX = Math.max(...selectedLayers.map(l => l.x + l.width));
        const maxY = Math.max(...selectedLayers.map(l => l.y + l.height));

        selectionBox = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    return (
        <div
            className="flex-1 bg-[#121214] relative overflow-hidden flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div
                ref={canvasRef}
                className="relative bg-white shadow-2xl transition-transform duration-200 ease-out"
                style={{
                    width: state.canvasSize.width,
                    height: state.canvasSize.height,
                    transform: `scale(${state.zoom})`
                }}
            >
                <CanvasGrid />

                <div className="absolute inset-0">
                    {state.layers.map(layer => (
                        <LayerRenderer key={layer.id} layer={layer} />
                    ))}
                </div>

                {selectionBox && <SelectionOverlay {...selectionBox} />}
            </div>

            {/* Zoom Controls Overlay */}
            <div className="absolute bottom-6 right-6 bg-[#1f1f22] border border-[#27272a] rounded-lg p-2 flex items-center gap-2 shadow-xl">
                <span className="text-xs text-gray-400 font-mono w-12 text-center">{Math.round(state.zoom * 100)}%</span>
            </div>
        </div>
    );
};
