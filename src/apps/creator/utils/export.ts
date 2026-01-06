import { EditorState } from '../types/editor';

export const exportToJSON = (state: EditorState) => {
    const data = {
        version: '1.0.0',
        canvas: state.canvasSize,
        layers: [] // Would map layers here
    };
    return JSON.stringify(data, null, 2);
};

export const exportToImage = async (canvasRef: HTMLDivElement) => {
    // Implementation for html2canvas or similar
    console.log("Exporting to image...");
};
