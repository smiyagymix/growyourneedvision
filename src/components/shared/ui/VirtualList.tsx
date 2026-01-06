import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualList = <T,>({ items, height, itemHeight, renderItem, className = '' }: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleItemCount = Math.ceil(height / itemHeight);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight)
  );

  // Buffer items
  const bufferedStartIndex = Math.max(0, startIndex - 2);
  const bufferedEndIndex = Math.min(items.length - 1, endIndex + 2);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = bufferedStartIndex; i <= bufferedEndIndex; i++) {
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${itemHeight}px`,
          transform: `translateY(${i * itemHeight}px)`,
        } as React.CSSProperties
      });
    }
    return result;
  }, [items, itemHeight, bufferedStartIndex, bufferedEndIndex]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div 
        ref={containerRef}
        className={`overflow-y-auto relative ${className}`}
        style={{ height }}
        onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};
