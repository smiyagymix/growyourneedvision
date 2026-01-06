
import React, { useRef, useState } from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  label?: string;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, accept, label = "Upload File", multiple = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    if (!multiple) {
        setFileNames([files[0].name]);
        onFileSelect([files[0]]);
    } else {
        setFileNames(files.map(f => f.name));
        onFileSelect(files);
    }
  };

  return (
    <div 
        className={`relative w-full h-32 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center text-center cursor-pointer ${dragActive ? 'border-gyn-blue-medium bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
    >
        <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
        />
        
        {fileNames.length > 0 ? (
            <div className="flex flex-col items-center text-green-600">
                <OwnerIcon name="CheckCircleIcon" className="w-8 h-8 mb-2" />
                <span className="text-sm font-bold">{fileNames.length} file(s) selected</span>
                <span className="text-xs text-gray-500 max-w-[200px] truncate">{fileNames.join(', ')}</span>
            </div>
        ) : (
            <div className="flex flex-col items-center text-gray-500">
                <OwnerIcon name="ArrowDownTrayIcon" className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-bold">{label}</span>
                <span className="text-xs mt-1 opacity-70">Drag & drop or click to browse</span>
            </div>
        )}
    </div>
  );
};
