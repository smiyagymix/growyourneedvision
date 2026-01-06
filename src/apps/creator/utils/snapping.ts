export const snapValue = (value: number, snapTo: number = 10, threshold: number = 5): number => {
  const remainder = value % snapTo;
  if (remainder < threshold) {
    return value - remainder;
  } else if (remainder > snapTo - threshold) {
    return value + (snapTo - remainder);
  }
  return value;
};

export const getSnapLines = (
  activeRect: { x: number; y: number; width: number; height: number },
  otherRects: { x: number; y: number; width: number; height: number }[]
) => {
  // Logic to find alignment lines (center, edges)
  // Returns array of lines to draw
  return [];
};
