export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export const snapToGrid = (val: number, gridSize: number) => Math.round(val / gridSize) * gridSize;

export const degreesToRadians = (deg: number) => (deg * Math.PI) / 180;

export const radiansToDegrees = (rad: number) => (rad * 180) / Math.PI;
