import React from 'react';
import { Table } from './ui/Table'; // Assuming Table exists and exports Table component
import { Spinner } from './ui/Spinner';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
}

export function DataGrid<T extends { id: string | number }>({ data, columns, isLoading, onRowClick }: DataGridProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-100 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 font-semibold text-gray-900" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick?.(item)}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col, i) => (
                <td key={i} className="px-6 py-4 text-gray-600">
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
