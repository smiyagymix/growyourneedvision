import React, { useMemo } from 'react';

interface MasonryProps {
  children: React.ReactNode[];
  columns?: number;
  gap?: number;
}

export const Masonry: React.FC<MasonryProps> = ({ children, columns = 3, gap = 24 }) => {
  const columnWrapper = useMemo(() => {
    const cols = new Array(columns).fill([]).map(() => [] as React.ReactNode[]);
    
    React.Children.forEach(children, (child, index) => {
      cols[index % columns].push(child);
    });

    return cols;
  }, [children, columns]);

  return (
    <div 
        className="flex" 
        style={{ gap: `${gap}px` }}
    >
      {columnWrapper.map((col, i) => (
        <div 
            key={i} 
            className="flex flex-col flex-1"
            style={{ gap: `${gap}px` }}
        >
          {col.map((item, idx) => (
            <div key={idx}>{item}</div>
          ))}
        </div>
      ))}
    </div>
  );
};
