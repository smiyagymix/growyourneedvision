import { useState, useCallback } from 'react';
import { useEditor } from '../store/editorStore';
import { useHistory } from './useHistory';

export const useRotate = () => {
    const { state, dispatch } = useEditor();
    const { pushState } = useHistory();
    const [isRotating, setIsRotating] = useState(false);
    const [startAngle, setStartAngle] = useState(0);
    const [hasRotated, setHasRotated] = useState(false);

    const startRotate = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (state.selectedIds.length === 0) return;

        setIsRotating(true);
        setHasRotated(false);

        const layerId = state.selectedIds[0];
        const layer = state.layers.find(l => l.id === layerId);
        if (!layer) return;

        // Calculate initial angle from center of layer to mouse
        const rect = document.querySelector(`[data-layer-id="${layerId}"]`)?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setStartAngle(angle - (layer.rotation || 0));
    }, [state.selectedIds, state.layers]);

    const onRotate = useCallback((e: React.MouseEvent) => {
        if (!isRotating || state.selectedIds.length === 0) return;

        const layerId = state.selectedIds[0];
        const layer = state.layers.find(l => l.id === layerId);
        if (!layer) return;

        const rect = document.querySelector(`[data-layer-id="${layerId}"]`)?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        let newRotation = angle - startAngle;

        // Snap to 15 degree intervals if shift is held
        if (e.shiftKey) {
            newRotation = Math.round(newRotation / 15) * 15;
        }

        if (Math.abs(newRotation - (layer.rotation || 0)) > 0.1) {
            setHasRotated(true);
            dispatch({
                type: 'UPDATE_LAYER',
                payload: {
                    id: layerId,
                    updates: { rotation: newRotation }
                }
            });
        }
    }, [isRotating, startAngle, state.selectedIds, state.layers, dispatch]);

    const endRotate = useCallback(() => {
        if (isRotating && hasRotated) {
            pushState();
        }
        setIsRotating(false);
        setHasRotated(false);
    }, [isRotating, hasRotated, pushState]);

    return {
        isRotating,
        startRotate,
        onRotate,
        endRotate
    };
};
