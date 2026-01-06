import React, { useState } from 'react';
import { Layer } from '../../types/editor';
import { OwnerIcon } from '../../../../components/shared/OwnerIcons';

interface AdvancedGradientControlProps {
    layer: Layer;
    onChange: (updates: Partial<Layer>) => void;
}

export const AdvancedGradientControl: React.FC<AdvancedGradientControlProps> = ({ layer, onChange }) => {
    const [selectedStopIndex, setSelectedStopIndex] = useState(0);

    const gradient = layer.gradient || {
        type: 'linear' as const,
        angle: 90,
        stops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#8b5cf6' }
        ]
    };

    const updateGradient = (updates: Partial<typeof gradient>) => {
        onChange({ gradient: { ...gradient, ...updates } });
    };

    const updateStop = (index: number, updates: Partial<typeof gradient.stops[0]>) => {
        const newStops = [...gradient.stops];
        newStops[index] = { ...newStops[index], ...updates };
        updateGradient({ stops: newStops });
    };

    const addStop = () => {
        const newOffset = gradient.stops.length > 0 
            ? (gradient.stops[gradient.stops.length - 1].offset + gradient.stops[0].offset) / 2 
            : 0.5;
        
        updateGradient({
            stops: [
                ...gradient.stops,
                { offset: newOffset, color: '#ffffff' }
            ].sort((a, b) => a.offset - b.offset)
        });
    };

    const removeStop = (index: number) => {
        if (gradient.stops.length <= 2) return; // Need at least 2 stops
        const newStops = gradient.stops.filter((_, i) => i !== index);
        updateGradient({ stops: newStops });
        setSelectedStopIndex(Math.min(selectedStopIndex, newStops.length - 1));
    };

    const clearGradient = () => {
        onChange({ gradient: undefined, fill: gradient.stops[0]?.color || '#cccccc' });
    };

    return (
        <div className="space-y-4">
            {/* Gradient Type */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Gradient Type</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => updateGradient({ type: 'linear' })}
                        className={`py-2 rounded text-xs transition-colors ${
                            gradient.type === 'linear'
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                        }`}
                    >
                        Linear
                    </button>
                    <button
                        type="button"
                        onClick={() => updateGradient({ type: 'radial' })}
                        className={`py-2 rounded text-xs transition-colors ${
                            gradient.type === 'radial'
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
                        }`}
                    >
                        Radial
                    </button>
                </div>
            </div>

            {/* Angle (Linear only) */}
            {gradient.type === 'linear' && (
                <div>
                    <label className="text-xs text-gray-400 mb-2 block flex justify-between">
                        <span>Angle</span>
                        <span className="text-white">{gradient.angle}°</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradient.angle || 90}
                        onChange={(e) => updateGradient({ angle: parseInt(e.target.value) })}
                        className="w-full"
                    />
                    <div className="flex gap-1 mt-2">
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                            <button
                                key={angle}
                                type="button"
                                onClick={() => updateGradient({ angle })}
                                className="flex-1 py-1 text-[10px] bg-[#27272a] hover:bg-[#3f3f46] rounded transition-colors text-gray-400"
                            >
                                {angle}°
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Gradient Preview */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Preview</label>
                <div
                    className="w-full h-16 rounded-lg border border-[#3f3f46]"
                    style={{
                        background: gradient.type === 'linear'
                            ? `linear-gradient(${gradient.angle}deg, ${gradient.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                            : `radial-gradient(circle, ${gradient.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                    }}
                />
            </div>

            {/* Color Stops */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400">Color Stops</label>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={addStop}
                            className="p-1 bg-[#27272a] hover:bg-purple-600 rounded transition-colors"
                            title="Add stop"
                        >
                            <OwnerIcon name="PlusCircleIcon" className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                        <button
                            type="button"
                            onClick={clearGradient}
                            className="p-1 bg-[#27272a] hover:bg-red-600 rounded transition-colors"
                            title="Remove gradient"
                        >
                            <OwnerIcon name="XCircleIcon" className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Stop Selector Bar */}
                <div className="relative h-8 bg-[#27272a] rounded-lg mb-3 border border-[#3f3f46]">
                    <div
                        className="absolute inset-1 rounded"
                        style={{
                            background: gradient.type === 'linear'
                                ? `linear-gradient(to right, ${gradient.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                                : `linear-gradient(to right, ${gradient.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                        }}
                    />
                    {gradient.stops.map((stop, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedStopIndex(index)}
                            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all ${
                                selectedStopIndex === index
                                    ? 'border-white scale-125 shadow-lg'
                                    : 'border-gray-600 hover:border-gray-400'
                            }`}
                            style={{
                                left: `${stop.offset * 100}%`,
                                backgroundColor: stop.color
                            }}
                        />
                    ))}
                </div>

                {/* Selected Stop Controls */}
                {gradient.stops[selectedStopIndex] && (
                    <div className="space-y-2 bg-[#1a1a1c] p-3 rounded-lg border border-[#27272a]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Stop {selectedStopIndex + 1}</span>
                            {gradient.stops.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeStop(selectedStopIndex)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">Color</label>
                                <input
                                    type="color"
                                    value={gradient.stops[selectedStopIndex].color}
                                    onChange={(e) => updateStop(selectedStopIndex, { color: e.target.value })}
                                    className="w-full h-8 bg-[#27272a] rounded border border-[#3f3f46] cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">Position</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={Math.round(gradient.stops[selectedStopIndex].offset * 100)}
                                    onChange={(e) => updateStop(selectedStopIndex, { 
                                        offset: Math.max(0, Math.min(1, parseInt(e.target.value) / 100)) 
                                    })}
                                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                        
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={gradient.stops[selectedStopIndex].offset * 100}
                            onChange={(e) => updateStop(selectedStopIndex, { offset: parseInt(e.target.value) / 100 })}
                            className="w-full"
                        />
                    </div>
                )}
            </div>

            {/* Preset Gradients */}
            <div>
                <label className="text-xs text-gray-400 mb-2 block">Presets</label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { name: 'Sunset', stops: [{ offset: 0, color: '#ff6b6b' }, { offset: 1, color: '#feca57' }] },
                        { name: 'Ocean', stops: [{ offset: 0, color: '#4facfe' }, { offset: 1, color: '#00f2fe' }] },
                        { name: 'Purple', stops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
                        { name: 'Green', stops: [{ offset: 0, color: '#56ab2f' }, { offset: 1, color: '#a8e063' }] },
                        { name: 'Fire', stops: [{ offset: 0, color: '#f12711' }, { offset: 1, color: '#f5af19' }] },
                        { name: 'Sky', stops: [{ offset: 0, color: '#2196f3' }, { offset: 0.5, color: '#21cbf3' }, { offset: 1, color: '#b2fefa' }] },
                        { name: 'Rose', stops: [{ offset: 0, color: '#ff0844' }, { offset: 1, color: '#ffb199' }] },
                        { name: 'Night', stops: [{ offset: 0, color: '#0f2027' }, { offset: 0.5, color: '#203a43' }, { offset: 1, color: '#2c5364' }] },
                    ].map((preset) => (
                        <button
                            key={preset.name}
                            type="button"
                            onClick={() => updateGradient({ stops: preset.stops })}
                            className="h-12 rounded-lg border border-[#3f3f46] hover:border-purple-500 transition-colors"
                            style={{
                                background: `linear-gradient(135deg, ${preset.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`
                            }}
                            title={preset.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
