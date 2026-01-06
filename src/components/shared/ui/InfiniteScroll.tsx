
import React, { useEffect, useRef } from 'react';
import { Spinner } from './Spinner';

interface InfiniteScrollProps {
  children: React.ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({ children, loadMore, hasMore, loading }) => {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, { threshold: 1.0 });

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [loadMore, hasMore, loading]);

  return (
    <div className="w-full">
      {children}
      <div ref={loaderRef} className="h-20 flex items-center justify-center w-full">
        {loading && <Spinner size="md" />}
        {!hasMore && !loading && <span className="text-xs text-gray-400">End of list</span>}
      </div>
    </div>
  );
};
