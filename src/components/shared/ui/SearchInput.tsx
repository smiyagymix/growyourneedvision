
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const SearchInput: React.FC<SearchInputProps> = ({ className = '', ...props }) => {
  return (
    <div className={`relative group w-full ${className}`}>
        <div className="absolute inset-0 bg-gyn-blue-medium/5 rounded-xl blur-sm group-hover:bg-gyn-blue-medium/10 transition-colors"></div>
              <input 
        type="text" 
        className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-gyn-blue-medium/20 shadow-sm relative z-10" 
        {...props}
      />
        <OwnerIcon name="SearchIcon" className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 z-20" />
    </div>
  );
};
