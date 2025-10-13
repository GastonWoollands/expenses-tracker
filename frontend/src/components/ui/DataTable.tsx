/**
 * DataTable: Responsive, sortable table with mobile-first design
 */

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => ReactNode;
  className?: string;
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: keyof T, direction: SortDirection) => void;
  sortKey?: keyof T;
  sortDirection?: SortDirection;
  className?: string;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  className = '',
  emptyMessage = 'No data available',
  title,
  subtitle
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const visibleColumns = columns.filter(col => !col.mobileHidden);
  const hiddenColumns = columns.filter(col => col.mobileHidden);

  if (data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''
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
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${column.className || ''}`}
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

      {/* Mobile Cards */}
      <div className="md:hidden">
        {data.map((item, index) => (
          <div key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div 
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleRowExpansion(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {visibleColumns.slice(0, 2).map((column, colIndex) => (
                    <div key={String(column.key)} className={colIndex === 0 ? 'mb-1' : ''}>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {column.label}
                      </span>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {column.render 
                          ? column.render(item[column.key], item)
                          : String(item[column.key] || '-')
                        }
                      </div>
                    </div>
                  ))}
                </div>
                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${
                  expandedRows.has(index) ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
            
            {expandedRows.has(index) && (
              <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-800">
                <div className="space-y-2">
                  {visibleColumns.slice(2).concat(hiddenColumns).map((column) => (
                    <div key={String(column.key)}>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {column.label}
                      </span>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {column.render 
                          ? column.render(item[column.key], item)
                          : String(item[column.key] || '-')
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataTable;
