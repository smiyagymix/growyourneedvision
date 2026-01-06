
import { useState, useMemo } from 'react';

interface Config {
  key: string;
  direction: 'ascending' | 'descending';
}

export const useSortableData = <T extends Record<string, unknown>>(items: T[], config: Config | null = null) => {
  const [sortConfig, setSortConfig] = useState<Config | null>(config);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a: T, b: T) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === typeof bValue && (typeof aValue === 'string' || typeof aValue === 'number') && (typeof bValue === 'string' || typeof bValue === 'number')) {
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
