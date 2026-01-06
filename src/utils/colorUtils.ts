
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    let chars = hex.substring(1).split('');
    if (chars.length === 3) {
      chars = [chars[0], chars[0], chars[1], chars[1], chars[2], chars[2]];
    }
    const hexValue = parseInt(chars.join(''), 16);
    return 'rgba(' + [(hexValue >> 16) & 255, (hexValue >> 8) & 255, hexValue & 255].join(',') + ',' + alpha + ')';
  }
  return `rgba(0,0,0,${alpha})`; // Fallback
};

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const lightenDarkenColor = (col: string, amt: number): string => {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  const num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
};
