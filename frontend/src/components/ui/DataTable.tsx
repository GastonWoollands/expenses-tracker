/**
 * DataTable: Responsive, sortable table with mobile-first design
 */

import { useState } from 'react';
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
  renderMobileActions?: (item: T, index: number) => ReactNode;
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
  subtitle,
  renderMobileActions
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
      <div className={className}>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-light mb-6">{subtitle}</p>
        )}
        <div className="py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-light">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-500 font-light mb-6">{subtitle}</p>
      )}
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-0 py-3 text-left text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 ${
                    column.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors' : ''
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
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-0 py-4 text-sm font-light text-slate-900 dark:text-slate-100 ${column.className || ''}`}
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
          <div key={index} className="border-b border-slate-100 dark:border-slate-800/50 last:border-b-0">
            <div 
              className="px-0 py-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
              onClick={() => toggleRowExpansion(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {visibleColumns.slice(0, 2).map((column, colIndex) => (
                    <div key={String(column.key)} className={colIndex === 0 ? 'mb-1' : ''}>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {column.label}
                      </span>
                      <div className="text-sm font-light text-slate-900 dark:text-slate-100 truncate">
                        {column.render 
                          ? column.render(item[column.key], item)
                          : String(item[column.key] || '-')
                        }
                      </div>
                    </div>
                  ))}
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${
                  expandedRows.has(index) ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
            
            {expandedRows.has(index) && (
              <div className="px-0 pb-3 bg-slate-50/30 dark:bg-slate-900/20">
                <div className="space-y-2">
                  {visibleColumns.slice(2).concat(hiddenColumns)
                    .filter(column => column.label !== 'Actions')
                    .map((column) => (
                      <div key={String(column.key)}>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {column.label}
                        </span>
                        <div className="text-sm font-light text-slate-900 dark:text-slate-100">
                          {column.render 
                            ? column.render(item[column.key], item)
                            : String(item[column.key] || '-')
                          }
                        </div>
                      </div>
                    ))}
                  {renderMobileActions && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex gap-2 justify-end">
                        {renderMobileActions(item, index)}
                      </div>
                    </div>
                  )}
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
