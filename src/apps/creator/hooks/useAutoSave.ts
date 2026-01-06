import { useEffect, useRef } from 'react';
import { useEditor } from '../store/editorStore';
import { creatorService } from '../../../services/creatorService';
import { useAuth } from '../../../context/AuthContext';

export const useAutoSave = () => {
    const { state, dispatch } = useEditor();
    const { user } = useAuth();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        const saveDesign = async () => {
            if (state.projectId) {
                await creatorService.updateDesignProject(state.projectId, {
                    layers: state.layers,
                    canvasSize: state.canvasSize
                });
            } else if (state.layers.length > 0) {
                // Create new project if it doesn't exist and has contents
                const newProject = await creatorService.createDesignProject({
                    user: user.id,
                    title: 'Untitled Design',
                    layers: state.layers,
                    canvasSize: state.canvasSize
                });
                dispatch({ type: 'SET_PROJECT', payload: newProject.id });
            }
        };

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            saveDesign();
        }, 3000); // 3-second debounce

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [state.layers, state.canvasSize, state.projectId, user, dispatch]);
};
