import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const DataTable = ({
  columns,
  data,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  className,
}) => {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left font-semibold text-slate-700"
              >
                <button
                  onClick={() => onSort?.(column.key)}
                  className="flex items-center gap-2 hover:text-slate-900"
                  disabled={!column.sortable}
                >
                  {column.label}
                  {column.sortable && sortBy === column.key && (
                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-slate-200 hover:bg-slate-50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column) => (
                <td
                  key={`${idx}-${column.key}`}
                  className="px-4 py-3 text-slate-900"
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
