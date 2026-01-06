import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'jpg' | 'svg' | 'pdf', scale: number) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, onExport }) => {
  const [format, setFormat] = useState<'png' | 'jpg' | 'svg' | 'pdf'>('png');
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1f1f22] border border-[#27272a] rounded-lg w-96 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
          <h3 className="text-sm font-bold text-white">Export Design</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Format</label>
            <select 
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="svg">SVG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Scale ({scale}x)</label>
            <input 
              type="range" 
              min="0.5" 
              max="4" 
              step="0.5" 
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[#27272a] flex justify-end gap-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => onExport(format, scale)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center gap-2"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
