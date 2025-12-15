import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

/**
 * Generic table component with custom rendering
 * 
 * @param columns - Column definitions
 * @param data - Array of data items
 * @param keyExtractor - Function to extract unique key from item
 * @param emptyMessage - Message to show when no data
 */
export function Table<T>({ 
  columns, 
  data, 
  keyExtractor,
  emptyMessage = 'No data available' 
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map(col => (
              <th 
                key={col.key} 
                className={`
                  px-4 py-3 text-sm font-semibold text-slate-700
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-4 py-8 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(item => (
              <tr 
                key={keyExtractor(item)} 
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {columns.map(col => (
                  <td 
                    key={col.key} 
                    className={`
                      px-4 py-3 text-sm text-slate-600
                      ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    `}
                  >
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
