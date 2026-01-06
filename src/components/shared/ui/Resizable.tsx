import React from 'react';

// Note: Building a fully functional drag-to-resize component from scratch requires significant logic.
// This is a visual representation of a split pane often used in IDES.

interface ResizableProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplit?: number; // Percentage
}

export const Resizable: React.FC<ResizableProps> = ({ left, right, initialSplit = 50 }) => {
  return (
    <div className="flex w-full h-full overflow-hidden border border-gray-200 rounded-xl">
      <div style={{ width: `${initialSplit}%` }} className="h-full overflow-hidden">
        {left}
      </div>
      {/* Handle */}
      <div className="w-1 bg-gray-200 hover:bg-gyn-blue-medium cursor-col-resize transition-colors flex items-center justify-center">
          <div className="h-8 w-1 bg-gray-400 rounded-full"></div>
      </div>
      <div style={{ width: `${100 - initialSplit}%` }} className="h-full overflow-hidden bg-gray-50">
        {right}
      </div>
    </div>
  );
};