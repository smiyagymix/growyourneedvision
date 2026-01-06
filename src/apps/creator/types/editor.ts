export type EditorMode = 'design' | 'prototype' | 'code';

export type ActiveTool = 'select' | 'text' | 'image' | 'rect' | 'circle' | 'triangle' | 'star' | 'polygon' | 'arrow' | 'line' | 'ellipse' | 'pen' | 'eraser' | 'hand' | 'shape' | 'gradient' | 'eyedropper';

export type CursorType = 'default' | 'pointer' | 'grab' | 'grabbing' | 'text' | 'crosshair' | 'move' | 'resize' | 'pen' | 'eraser' | 'eyedropper';

export interface Layer {
    id: string;
    name: string;
    type: 'text' | 'image' | 'rect' | 'circle' | 'triangle' | 'star' | 'polygon' | 'arrow' | 'line' | 'ellipse' | 'group';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    locked: boolean;
    index: number;

    // Style props
    fill?: string;
    gradient?: {
        type: 'linear' | 'radial';
        angle?: number;
        stops: Array<{ offset: number; color: string }>;
    }
    stroke?: string;
    strokeWidth?: number;
    strokeDashArray?: string;
    strokeLineCap?: 'butt' | 'round' | 'square';
    borderRadius?: number;

    // Shape-specific props
    points?: number; // For star
    sides?: number; // For polygon
    innerRadius?: number; // For star
    arrowType?: 'single' | 'double'; // For arrows
    lineType?: 'straight' | 'curved'; // For lines

    // Text props
    letterSpacing?: number;
    lineHeight?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textDecoration?: string;
    textTransform?: string;

    // Image props
    src?: string;

    // Effects
    shadowEnabled?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    blur?: number;
    grayscale?: number;

    children?: Layer[];
}

export interface EditorState {
    projectId: string | null;
    mode: EditorMode;
    cursor: CursorType;
    activeTool: ActiveTool;
    zoom: number;
    selectedIds: string[];
    layers: Layer[];
    isDragging: boolean;
    canvasSize: { width: number; height: number };
    history: {
        past: Layer[][];
        future: Layer[][];
    };
}
