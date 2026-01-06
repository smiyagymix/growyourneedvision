import React from 'react';
import { useEditor } from '../../store/editorStore';
import { OwnerIcon } from '../../../../components/shared/OwnerIcons';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export const LayersPanel: React.FC = () => {
    const { state, dispatch } = useEditor();
    const { layers, selectedIds } = state;

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = [...layers].reverse();
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Reverse back to get original order (bottom to top)
        const newLayerOrder = items.reverse().map((l: any) => l.id);
        dispatch({ type: 'REORDER_LAYERS', payload: newLayerOrder });
    };

    const toggleVisibility = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const layer = layers.find((l: any) => l.id === id);
        if (layer) {
            dispatch({
                type: 'UPDATE_LAYER',
                payload: { id, updates: { visible: !layer.visible } }
            });
        }
    };

    const toggleLock = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const layer = layers.find((l: any) => l.id === id);
        if (layer) {
            dispatch({
                type: 'UPDATE_LAYER',
                payload: { id, updates: { locked: !layer.locked } }
            });
        }
    };

    const handleSelect = (id: string) => {
        dispatch({ type: 'SET_SELECTION', payload: [id] });
    };

    const reversedLayers = [...layers].reverse();

    return (
        <div className="flex flex-col h-full bg-[#1f1f22]">
            <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Layers</h3>
                <button type="button" className="text-gray-500 hover:text-white">
                    <OwnerIcon name="Plus" className="w-4 h-4" />
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="layers">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex-1 overflow-y-auto p-2 space-y-1"
                        >
                            {reversedLayers.map((layer, index) => (
                                <Draggable key={layer.id} draggableId={layer.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => handleSelect(layer.id)}
                                            className={`flex items-center gap-3 p-2 rounded group cursor-pointer transition-colors ${selectedIds.includes(layer.id) ? 'bg-[#3f3f46] border border-purple-500/50 shadow-lg z-50' : 'bg-[#27272a]/50 border border-transparent hover:bg-[#27272a]'} ${snapshot.isDragging ? 'bg-[#3f3f46] shadow-xl ring-1 ring-purple-500' : ''}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => toggleVisibility(e, layer.id)}
                                                className={`text-gray-500 hover:text-white transition-opacity ${!layer.visible && 'opacity-30'}`}
                                            >
                                                <OwnerIcon name={layer.visible ? 'Eye' : 'EyeSlash'} className="w-4 h-4" />
                                            </button>

                                            <div className="flex-1 flex items-center gap-2 truncate">
                                                <OwnerIcon name={layer.type === 'text' ? 'Type' : layer.type === 'image' ? 'Photo' : 'Square2Stack'} className="w-3.5 h-3.5 text-purple-400" />
                                                <span className={`text-xs truncate ${!layer.visible ? 'text-gray-600' : 'text-gray-300'}`}>
                                                    {layer.name || layer.type}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleLock(e, layer.id)}
                                                    className={`text-gray-500 hover:text-white transition-colors ${layer.locked ? 'text-yellow-500' : 'opacity-0 group-hover:opacity-100'}`}
                                                >
                                                    <OwnerIcon name={layer.locked ? 'LockClosed' : 'LockOpen'} className="w-3.5 h-3.5" />
                                                </button>
                                                <div className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <OwnerIcon name="Bars3" className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
