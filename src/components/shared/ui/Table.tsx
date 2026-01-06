
import React from 'react';

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto relative w-full">
    <table className="w-full text-left border-collapse" role="table">{children}</table>
  </div>
);

export const Thead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-gyn-blue-dark/5 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200/50">
    {children}
  </thead>
);

export const Tr: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className = '' }) => (
  <tr 
    onClick={onClick}
    className={`group hover:bg-white/60 transition-colors relative border-b border-gray-100/50 last:border-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`px-6 py-4 ${className}`}>{children}</th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`px-6 py-5 ${className}`} {...props}>{children}</td>
);
