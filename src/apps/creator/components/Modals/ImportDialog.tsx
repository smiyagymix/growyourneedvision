import React, { useRef } from 'react';
import { X, Upload } from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1f1f22] border border-[#27272a] rounded-lg w-96 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
          <h3 className="text-sm font-bold text-white">Import Asset</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-8 text-center">
          <div 
            className="border-2 border-dashed border-gray-700 rounded-lg p-8 hover:border-blue-500 hover:bg-gray-800/50 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-4 text-gray-400" size={32} />
            <p className="text-sm text-gray-300 mb-2">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">Supports JPG, PNG, SVG</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.svg"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
