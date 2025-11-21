/**
 * Table component for displaying data with sorting
 */

import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: keyof T, direction: SortDirection) => void;
  sortKey?: keyof T;
  sortDirection?: SortDirection;
  className?: string;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  className = '',
  emptyMessage = 'No data available'
}: TableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (!onSort) return;
    
    let newDirection: SortDirection = 'asc';
    if (sortKey === key && sortDirection === 'asc') {
      newDirection = 'desc';
    } else if (sortKey === key && sortDirection === 'desc') {
      newDirection = null;
    }
    
    onSort(key, newDirection);
  };

  const getSortIcon = (key: keyof T) => {
    if (sortKey !== key) return null;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    return null;
  };

  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${column.className || ''}`}
                  >
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
