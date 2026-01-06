import { Layer } from '../types/editor';

export const copyToClipboard = async (layers: Layer[]) => {
  try {
    const json = JSON.stringify(layers);
    await navigator.clipboard.writeText(json);
  } catch (err) {
    console.error('Failed to copy layers:', err);
  }
};

export const pasteFromClipboard = async (): Promise<Layer[] | null> => {
  try {
    const text = await navigator.clipboard.readText();
    const layers = JSON.parse(text);
    // Validate structure roughly
    if (Array.isArray(layers) && layers.every(l => l.id && l.type)) {
      return layers;
    }
  } catch (err) {
    console.error('Failed to paste layers:', err);
  }
  return null;
};
