import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, X } from 'lucide-react';
import type { SortConfig } from '../types';
import { sortRecords } from '../utils/dataTransforms';

interface ColumnDef<T> {
  key: keyof T & string;
  label: string;
  group?: string;
  width?: number;
}

interface ColumnGroup {
  label: string;
  color: string;
  bgClass: string;
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T>[];
  columnGroups?: Record<string, ColumnGroup>;
  searchKeys?: (keyof T & string)[];
  filterKeys?: { key: keyof T & string; label: string }[];
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  columnGroups,
  searchKeys = [],
  filterKeys = [],
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    for (const fk of filterKeys) {
      const vals = [...new Set(data.map(r => String(r[fk.key]).trim()).filter(Boolean))].sort();
      opts[fk.key] = vals;
    }
    return opts;
  }, [data, filterKeys]);

  // Apply search & filters & sort
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm && searchKeys.length > 0) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        searchKeys.some(k => String(r[k]).toLowerCase().includes(term))
      );
    }

    // Filters
    for (const [key, val] of Object.entries(activeFilters)) {
      if (val) {
        result = result.filter(r => String(r[key]).trim() === val);
      }
    }

    // Sort
    if (sort) {
      result = sortRecords(result, sort.key, sort.direction);
    }

    return result;
  }, [data, searchTerm, searchKeys, activeFilters, sort]);

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || Object.values(activeFilters).some(Boolean);

  // Build grouped column header spans
  const groupSpans = useMemo(() => {
    if (!columnGroups) return null;
    const spans: { group: ColumnGroup; count: number }[] = [];
    let lastGroup = '';
    for (const col of columns) {
      const g = col.group || '';
      if (g === lastGroup && spans.length > 0) {
        spans[spans.length - 1].count++;
      } else {
        if (g && columnGroups[g]) {
          spans.push({ group: columnGroups[g], count: 1 });
        } else {
          spans.push({ group: { label: '', color: '', bgClass: 'bg-rr-bg-secondary' }, count: 1 });
        }
        lastGroup = g;
      }
    }
    return spans;
  }, [columns, columnGroups]);

  return (
    <div className="rr-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-rr-border">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rr-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-9 pr-3 py-1.5 bg-rr-bg-secondary border border-rr-border rounded-md text-sm
              text-rr-text placeholder:text-rr-text-muted focus:outline-none focus:border-rr-gold/40"
          />
        </div>

        {/* Filter toggle */}
        {filterKeys.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors
              ${showFilters
                ? 'bg-rr-gold/10 border-rr-gold/25 text-rr-gold'
                : 'bg-rr-bg-secondary border-rr-border text-rr-text-dim hover:text-rr-text'
              }`}
          >
            <Filter size={13} />
            Filters
          </button>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-rr-danger hover:bg-rr-danger/10 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}

        <span className="text-xs text-rr-text-muted ml-auto">
          {processedData.length} of {data.length} records
        </span>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-rr-border bg-rr-bg-tertiary">
          {filterKeys.map(fk => (
            <div key={fk.key} className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-rr-text-muted">{fk.label}</label>
              <select
                value={activeFilters[fk.key] || ''}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, [fk.key]: e.target.value }))}
                className="px-2 py-1 bg-rr-bg-secondary border border-rr-border rounded text-xs text-rr-text
                  focus:outline-none focus:border-rr-gold/40 min-w-[120px]"
              >
                <option value="">All</option>
                {filterOptions[fk.key]?.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            {/* Group header row */}
            {groupSpans && (
              <tr>
                {groupSpans.map((gs, i) => (
                  <th
                    key={i}
                    colSpan={gs.count}
                    className={`text-center text-[10px] py-1.5 ${gs.group.bgClass} border-b border-rr-border`}
                    style={{ color: gs.group.color || 'inherit' }}
                  >
                    {gs.group.label}
                  </th>
                ))}
              </tr>
            )}
            {/* Column headers */}
            <tr>
              {columns.map(col => {
                const bg = col.group && columnGroups?.[col.group]
                  ? columnGroups[col.group].bgClass
                  : 'bg-rr-bg-secondary';
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`${bg}`}
                    style={{ minWidth: col.width || 120 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-rr-text">{col.label}</span>
                      {sort?.key === col.key && (
                        sort.direction === 'asc'
                          ? <ChevronUp size={12} className="text-rr-gold" />
                          : <ChevronDown size={12} className="text-rr-gold" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-rr-text-muted text-sm">
                  No records match your criteria
                </td>
              </tr>
            ) : (
              processedData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key} title={String(row[col.key] ?? '')}>
                      <CellRenderer value={row[col.key]} colKey={col.key} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Render cell with special formatting for status, probabilities, dates */
function CellRenderer({ value, colKey }: { value: any; colKey: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-rr-text-muted/40">—</span>;
  }

  const str = String(value);

  // Status column
  if (colKey === 'status') {
    const s = str.toLowerCase();
    let colorClass = 'bg-rr-bg-tertiary text-rr-text-dim';
    if (s.includes('hold')) colorClass = 'bg-rr-danger/15 text-rr-danger';
    else if (s.includes('complete') || s.includes('done')) colorClass = 'bg-rr-success/15 text-rr-success';
    else if (s.includes('progress') || s.includes('shop') || s.includes('induct')) colorClass = 'bg-rr-warning/15 text-rr-warning';
    else if (s.includes('arc') || s.includes('test')) colorClass = 'bg-rr-info/15 text-rr-info';
    return <span className={`status-badge ${colorClass}`}>{str}</span>;
  }

  // Priority column
  if (colKey === 'priority') {
    const s = str.toLowerCase();
    let colorClass = 'text-rr-text-dim';
    if (s.includes('high') || s === '1') colorClass = 'text-rr-danger font-semibold';
    else if (s.includes('medium') || s === '2') colorClass = 'text-rr-warning font-semibold';
    else if (s.includes('low') || s === '3') colorClass = 'text-rr-success';
    return <span className={colorClass}>{str}</span>;
  }

  // Percentage values
  if (colKey.includes('robability') && typeof value === 'number') {
    const pct = value <= 1 ? (value * 100).toFixed(0) : value.toFixed(0);
    return <span className="text-rr-info">{pct}%</span>;
  }

  // Wing status
  if (colKey === 'wingStatus') {
    const isOn = str.toLowerCase().includes('on');
    return (
      <span className={`inline-flex items-center gap-1 ${isOn ? 'text-rr-success' : 'text-rr-warning'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-rr-success' : 'bg-rr-warning'}`} />
        {str}
      </span>
    );
  }

  return <span className="text-rr-text">{str}</span>;
}
