
import React, { useState, KeyboardEvent } from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = 'Add tag...' }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (trimmedInput && !tags.includes(trimmedInput)) {
        onChange([...tags, trimmedInput]);
        setInput('');
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-gyn-blue-medium/20 focus-within:border-gyn-blue-medium transition-all shadow-inner min-h-[46px]">
      {tags.map((tag, index) => (
        <div key={index} className="flex items-center gap-1 bg-gyn-blue-light/50 text-gyn-blue-dark px-2 py-1 rounded-lg text-xs font-bold border border-gyn-blue-medium/20">
          <span>{tag}</span>
          <button 
            type="button"
            onClick={() => removeTag(index)}
            className="hover:text-red-500 focus:outline-none"
          >
            <OwnerIcon name="X" className="w-3 h-3" />
          </button>
        </div>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 outline-none bg-transparent text-sm min-w-[80px] text-gray-700 placeholder-gray-400"
      />
    </div>
  );
};
