import React from 'react';
import { useEditor } from '../../store/editorStore';
import { ToolButton } from './ToolButton';
import { OwnerIcon } from '../../../../components/shared/OwnerIcons';
import { jsPDF } from 'jspdf';

export const Toolbar: React.FC = () => {
    const { state, dispatch } = useEditor();
    const [showShapes, setShowShapes] = React.useState(false);

    const tools = [
        { id: 'select', icon: 'CursorArrowRays', label: 'Select (V)', cursor: 'default' },
        { id: 'hand', icon: 'HandRaised', label: 'Pan (H)', cursor: 'grab' },
        { id: 'text', icon: 'Type', label: 'Text (T)', cursor: 'text' },
        { id: 'rect', icon: 'Square2Stack', label: 'Rectangle (R)', cursor: 'crosshair' },
        { id: 'circle', icon: 'CircleIcon', label: 'Circle (C)', cursor: 'crosshair' },
        { id: 'triangle', icon: 'PlayIcon', label: 'Triangle', cursor: 'crosshair' },
        { id: 'star', icon: 'StarIcon', label: 'Star', cursor: 'crosshair' },
        { id: 'polygon', icon: 'StopIcon', label: 'Polygon', cursor: 'crosshair' },
        { id: 'line', icon: 'MinusIcon', label: 'Line (L)', cursor: 'crosshair' },
        { id: 'arrow', icon: 'ArrowRightIcon', label: 'Arrow', cursor: 'crosshair' },
        { id: 'pen', icon: 'Pencil', label: 'Pen (P)', cursor: 'pen' },
        { id: 'eraser', icon: 'TrashIcon', label: 'Eraser (E)', cursor: 'eraser' },
        { id: 'eyedropper', icon: 'EyeDropperIcon', label: 'Eyedropper (I)', cursor: 'eyedropper' },
        { id: 'gradient', icon: 'SwatchIcon', label: 'Gradient (G)', cursor: 'crosshair' },
        { id: 'image', icon: 'Photo', label: 'Image', cursor: 'crosshair' },
    ] as const;

    const shapeTools = tools.filter(t => ['rect', 'circle', 'triangle', 'star', 'polygon', 'line', 'arrow'].includes(t.id));

    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: state.canvasSize.width > state.canvasSize.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [state.canvasSize.width, state.canvasSize.height]
        });

        // Add background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, state.canvasSize.width, state.canvasSize.height, 'F');

        // Render layers (very basic implementation)
        state.layers.forEach(layer => {
            if (!layer.visible) return;

            if (layer.type === 'rect' || layer.type === 'circle') {
                doc.setFillColor(layer.fill || '#cccccc');
                if (layer.type === 'circle') {
                    doc.circle(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, 'F');
                } else {
                    doc.rect(layer.x, layer.y, layer.width, layer.height, 'F');
                }
            } else if (layer.type === 'text') {
                doc.setTextColor(layer.fill || '#000000');
                doc.setFontSize(layer.fontSize || 16);
                doc.text(layer.text || '', layer.x, layer.y + (layer.fontSize || 16));
            }
        });

        doc.save(`${state.projectId || 'design'}.pdf`);
    };

    return (
        <div className="w-16 bg-[#1f1f22] border-r border-[#27272a] flex flex-col items-center py-4 gap-2 z-10 shadow-xl relative">
            {tools.map((tool) => (
                <ToolButton
                    key={tool.id}
                    icon={tool.icon}
                    label={tool.label}
                    isActive={state.activeTool === tool.id}
                    onClick={() => {
                        dispatch({ type: 'SET_TOOL', payload: tool.id });
                        dispatch({ type: 'SET_CURSOR', payload: tool.cursor || 'default' });
                    }}
                />
            ))}

            <div className="flex-1" />

            {/* Divider */}
            <div className="w-8 h-[1px] bg-[#27272a] my-2" />

            <ToolButton
                icon="Squares2x2Icon"
                label="Shapes Menu"
                isActive={showShapes}
                onClick={() => setShowShapes(!showShapes)}
            />

            <ToolButton
                icon="CogIcon"
                label="Settings"
                isActive={false}
                onClick={() => { }}
            />

            {/* Divider */}
            <div className="w-8 h-[1px] bg-[#27272a] my-2" />

            <button
                onClick={exportToPDF}
                className="p-3 rounded hover:bg-[#27272a] text-purple-400 transition-colors"
                title="Export as PDF"
            >
                <OwnerIcon name="ArrowDownTrayIcon" className="w-6 h-6" />
            </button>

            {/* Floating Shapes Menu */}
            {showShapes && (
                <div className="absolute left-16 top-0 bg-[#1f1f22] border border-[#27272a] rounded-lg shadow-2xl p-2 grid grid-cols-2 gap-2 w-32 z-50">
                    <div className="col-span-2 text-xs text-gray-400 font-bold uppercase px-2 py-1">Shapes</div>
                    {shapeTools.map((tool) => (
                        <button
                            key={tool.id}
                            type="button"
                            className={`p-2 rounded hover:bg-[#27272a] transition-colors ${state.activeTool === tool.id ? 'bg-[#3f3f46] text-purple-400' : 'text-gray-400'}`}
                            onClick={() => {
                                dispatch({ type: 'SET_TOOL', payload: tool.id });
                                dispatch({ type: 'SET_CURSOR', payload: 'crosshair' });
                                setShowShapes(false);
                            }}
                            title={tool.label}
                        >
                            <OwnerIcon name={tool.icon} className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
