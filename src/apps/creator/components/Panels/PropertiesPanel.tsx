import React from 'react';
import { useEditor } from '../../store/editorStore';
import { DimensionsControl } from '../Properties/DimensionsControl';
import { ColorPicker } from '../Properties/ColorPicker';
import { FontSelector } from '../Properties/FontSelector';
import { AlignmentControls } from '../Properties/AlignmentControls';
import { OpacityControl } from '../Properties/OpacityControl';
import { BorderControl } from '../Properties/BorderControl';
import { ShadowControl } from '../Properties/ShadowControl';
import { LayerEffects } from '../Properties/LayerEffects';

export const PropertiesPanel: React.FC = () => {
    const { state, dispatch } = useEditor();
    
    // Get the first selected layer (multi-edit not supported yet)
    const selectedLayer = state.layers.find(l => state.selectedIds.includes(l.id));

    if (!selectedLayer) {
        return (
            <div className="w-72 bg-[#1f1f22] border-l border-[#27272a] flex flex-col z-10 shadow-lg h-full items-center justify-center text-gray-500 text-sm">
                No selection
            </div>
        );
    }

    const handleUpdate = (key: string, value: any) => {
        dispatch({
            type: 'UPDATE_LAYER',
            payload: {
                id: selectedLayer.id,
                updates: { [key]: value }
            }
        });
    };

    return (
        <div className="w-72 bg-[#1f1f22] border-l border-[#27272a] flex flex-col z-10 shadow-lg h-full overflow-y-auto">
            <div className="p-4 border-b border-[#27272a]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Properties</h3>
            </div>
            
            <div className="p-4 space-y-6">
                <DimensionsControl
                    x={selectedLayer.x}
                    y={selectedLayer.y}
                    width={selectedLayer.width}
                    height={selectedLayer.height}
                    rotation={selectedLayer.rotation}
                    onChange={handleUpdate}
                />

                <OpacityControl
                    value={selectedLayer.opacity}
                    onChange={(val) => handleUpdate('opacity', val)}
                />

                {selectedLayer.type === 'text' && (
                    <>
                        <div className="border-t border-gray-700 pt-4">
                            <FontSelector
                                value={selectedLayer.fontFamily || 'Inter'}
                                onChange={(val) => handleUpdate('fontFamily', val)}
                            />
                            <AlignmentControls
                                value={selectedLayer.textAlign || 'left'}
                                onChange={(val) => handleUpdate('textAlign', val)}
                            />
                            <ColorPicker
                                label="Color"
                                value={selectedLayer.fill || '#000000'}
                                onChange={(val) => handleUpdate('fill', val)}
                            />
                            <div className="mt-2">
                                <label className="text-xs text-gray-400">Size</label>
                                <input
                                    type="number"
                                    value={selectedLayer.fontSize || 16}
                                    onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                                />
                            </div>
                        </div>
                    </>
                )}

                {(selectedLayer.type === 'rect' || selectedLayer.type === 'circle') && (
                    <div className="border-t border-gray-700 pt-4">
                        <ColorPicker
                            label="Fill"
                            value={selectedLayer.fill || '#cccccc'}
                            onChange={(val) => handleUpdate('fill', val)}
                        />
                    </div>
                )}

                <BorderControl
                    width={selectedLayer.strokeWidth || 0}
                    color={selectedLayer.stroke || '#000000'}
                    onChange={handleUpdate}
                />

                <ShadowControl
                    enabled={selectedLayer.shadowEnabled || false}
                    color={selectedLayer.shadowColor || '#000000'}
                    blur={selectedLayer.shadowBlur || 0}
                    offsetX={selectedLayer.shadowOffsetX || 0}
                    offsetY={selectedLayer.shadowOffsetY || 0}
                    onChange={handleUpdate}
                />

                <LayerEffects
                    layer={selectedLayer}
                    onChange={handleUpdate}
                />
            </div>
        </div>
    );
};
