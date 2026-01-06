import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface AlignmentControlsProps {
  value: 'left' | 'center' | 'right' | 'justify';
  onChange: (value: 'left' | 'center' | 'right' | 'justify') => void;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({ value, onChange }) => {
  return (
    <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded border border-gray-700">
      <button
        type="button"
        onClick={() => onChange('left')}
        className={`p-1 rounded ${value === 'left' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
      >
        <AlignLeft size={14} />
      </button>
      <button
        type="button"
        onClick={() => onChange('center')}
        className={`p-1 rounded ${value === 'center' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
      >
        <AlignCenter size={14} />
      </button>
      <button
        type="button"
        onClick={() => onChange('right')}
        className={`p-1 rounded ${value === 'right' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
      >
        <AlignRight size={14} />
      </button>
      <button
        type="button"
        onClick={() => onChange('justify')}
        className={`p-1 rounded ${value === 'justify' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
      >
        <AlignJustify size={14} />
      </button>
    </div>
  );
};
