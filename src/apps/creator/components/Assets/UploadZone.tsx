import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (files: FileList) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-gray-800/50 transition-colors cursor-pointer"
    >
      <Upload className="mx-auto mb-2 text-gray-400" size={24} />
      <p className="text-xs text-gray-400">
        Drag & drop files here or click to upload
      </p>
      <input
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />
    </div>
  );
};
