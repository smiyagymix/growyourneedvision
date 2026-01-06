
import React from 'react';

interface ChipProps {
  label: string;
  onDelete?: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, onDelete }) => {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
      {label}
      {onDelete && (
        <button type="button" onClick={onDelete} className="ml-2 hover:text-red-500 focus:outline-none">
          &times;
        </button>
      )}
    </div>
  );
};
