export const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
  const rad = (Math.PI / 180) * angle;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
  const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
  return { x: nx, y: ny };
};

export const getBounds = (layers: any[]) => {
  if (layers.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layers.forEach(layer => {
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + layer.width);
    maxY = Math.max(maxY, layer.y + layer.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export const snapToGrid = (value: number, gridSize: number = 10) => {
  return Math.round(value / gridSize) * gridSize;
};
