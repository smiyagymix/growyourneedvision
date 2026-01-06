import React from 'react';

interface CardStackProps {
  children: React.ReactNode[];
  offset?: number;
  scale?: number;
}

export const CardStack: React.FC<CardStackProps> = ({ children, offset = 10, scale = 0.05 }) => {
  return (
    <div className="relative h-full w-full">
      {React.Children.map(children, (child, index) => (
        <div
          className="absolute w-full transition-all duration-300 ease-in-out"
          style={{
            top: index * offset,
            zIndex: children.length - index,
            transform: `scale(${1 - index * scale})`,
            opacity: 1 - index * 0.2,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
