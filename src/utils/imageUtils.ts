export const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    // Simplified placeholder logic
    return new Promise((resolve) => resolve(file));
};