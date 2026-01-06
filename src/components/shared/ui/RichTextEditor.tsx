import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

export const RichTextEditor: React.FC = () => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
            {['bold', 'italic', 'underline', 'strike'].map(action => (
                <button type="button" key={action} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors" title={action}>
                    <div className="w-4 h-4 bg-gray-400 mask-icon"></div> {/* Placeholder for icons */}
                </button>
            ))}
            <div className="w-px h-4 bg-gray-300 mx-2"></div>
            <button type="button" className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"><OwnerIcon name="List" className="w-4 h-4" /></button>
            <button type="button" className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"><OwnerIcon name="PhotoIcon" className="w-4 h-4" /></button>
        </div>
        
        {/* Editor Area */}
        <div className="p-4 min-h-[150px] text-sm text-gray-700 focus:outline-none" contentEditable suppressContentEditableWarning>
            <p>Start typing your rich content here...</p>
        </div>
    </div>
  );
};