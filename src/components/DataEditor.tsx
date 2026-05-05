import { useState, useMemo, useCallback } from 'react';
import {
    Search, Plus, Trash2, Download, Wrench, BarChart3,
    ChevronUp, ChevronDown, CheckSquare, Square, Filter, X,
} from 'lucide-react';
import type { ShopVisitRecord, ForecastRecord } from '../types';
import RecordForm from './RecordForm';
import { exportWorkbook } from '../utils/exportExcel';
import { sortRecords } from '../utils/dataTransforms';

type EditorSheet = 'shop' | 'forecast';

interface DataEditorProps {
    shopVisits: ShopVisitRecord[];
    forecasts: ForecastRecord[];
    onShopVisitsChange: (data: ShopVisitRecord[]) => void;
    onForecastsChange: (data: ForecastRecord[]) => void;
}

// ---- Column definitions for the editor tables ----

interface EditorColumn {
    key: string;
    label: string;
    width: number;
    group?: string;
}

const SHOP_COLUMNS: EditorColumn[] = [
    { key: 'lessor', label: 'Lessor', width: 130, group: 'customer' },
    { key: 'operator', label: 'Operator', width: 150, group: 'customer' },
    { key: 'esn', label: 'ESN/MSN', width: 90, group: 'customer' },
    { key: 'engineType', label: 'Engine Type', width: 100, group: 'customer' },
    { key: 'wingStatus', label: 'Wing Status', width: 90, group: 'customer' },
    { key: 'removalDate', label: 'Removal Date', width: 100, group: 'customer' },
    { key: 'status', label: 'Status', width: 120, group: 'sv' },
    { key: 'shop', label: 'Shop', width: 100, group: 'sv' },
    { key: 'svType', label: 'SV Type', width: 80, group: 'sv' },
    { key: 'contractInPlace', label: 'Contract', width: 90, group: 'contract' },
    { key: 'comments', label: 'Comments', width: 200, group: 'crc' },
];

const FORECAST_COLUMNS: EditorColumn[] = [
    { key: 'lessor', label: 'Lessor', width: 130 },
    { key: 'operator', label: 'Operator', width: 150 },
    { key: 'esn', label: 'ESN/MSN', width: 90 },
    { key: 'engineType', label: 'Engine Type', width: 100 },
    { key: 'wingStatus', label: 'Wing Status', width: 90 },
    { key: 'removalDate', label: 'Removal Date', width: 100 },
    { key: 'svTypeNeeded', label: 'SV Type', width: 100 },
    { key: 'svPrice', label: 'SV Price', width: 90 },
    { key: 'priority', label: 'Priority', width: 70 },
    { key: 'notes', label: 'Notes', width: 200 },
];

// ---- Blank record factories ----

function blankShopVisit(): ShopVisitRecord {
    return {
        lessor: '', lessorCarePlus: '', operator: '', esn: '', msn: '',
        aircraftType: '', registration: '', engineType: '', wingStatus: '',
        leaseExpiry: '', transitionDate: '', removalDate: '',
        transitionProbability: null, svProbability: null, totalSvContribution: null,
        fcsRemaining: '', amContact: '', inductionGate: '', svType: '', svReason: '',
        dateSvRequested: '', requiredOutputDate: '', status: '',
        mfaOperatorRef: '', mfaInductionDate: '', inductionStatus: '', shop: '', offlogStatus: '',
        workscopeAgreed: '', plannedToTest: '', plannedToArc: '', riskToCustomer: '',
        contractInPlace: '', contractType: '', contractRef: '', paymentTerms: '', fullyFunded: '',
        mfaInductionDate2: '', poRequested: '', customerPoRef: '', networkPaying: '',
        networkInMfa: '', svPrice: '', profit: '', cashOutEligible: '', cashOutProbability: null,
        crcsApplicable: '', backingDataReceived: '', backingDataSent: '',
        invoicePayment: '', customerMaster: '', addressForCrc: '', crcContact: '',
        taskOwner: '', priority: '', openActions: '', lastUpdated: '', nextSteps: '',
        comments: '', _rowIndex: -1,
    };
}

function blankForecast(): ForecastRecord {
    return {
        lessor: '', lessorCarePlus: '', operator: '', esn: '', engineType: '',
        wingStatus: '', removalDate: '', comment: '', svTypeNeeded: '', svPrice: '',
        cashOutEligible: '', profitMillion: '', priority: '', notes: '', _rowIndex: -1,
    };
}

// ---- Search keys for filtering ----
const SHOP_SEARCH_KEYS = ['lessor', 'operator', 'esn', 'msn', 'shop', 'status', 'comments', 'engineType', 'aircraftType', 'registration'];
const FORECAST_SEARCH_KEYS = ['lessor', 'operator', 'esn', 'notes', 'engineType'];

export default function DataEditor({
    shopVisits, forecasts, onShopVisitsChange, onForecastsChange,
}: DataEditorProps) {
    const [activeSheet, setActiveSheet] = useState<EditorSheet>('shop');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const [, setEditingIndex] = useState<number>(-1);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const data = activeSheet === 'shop' ? shopVisits : forecasts;
    const columns = activeSheet === 'shop' ? SHOP_COLUMNS : FORECAST_COLUMNS;
    const searchKeys = activeSheet === 'shop' ? SHOP_SEARCH_KEYS : FORECAST_SEARCH_KEYS;

    // Filter options for key columns
    const filterableCols = useMemo(() => {
        if (activeSheet === 'shop') {
            return [
                { key: 'engineType', label: 'Engine Type' },
                { key: 'status', label: 'Status' },
                { key: 'shop', label: 'Shop' },
                { key: 'lessor', label: 'Lessor' },
                { key: 'operator', label: 'Operator' },
                { key: 'wingStatus', label: 'Wing Status' },
                { key: 'svType', label: 'SV Type' },
                { key: 'inductionGate', label: 'Induction Gate' },
                { key: 'contractInPlace', label: 'Contract' },
                { key: 'lessorCarePlus', label: 'LessorCare+' },
                { key: 'workscopeAgreed', label: 'Workscope' },
                { key: 'crcsApplicable', label: 'CRCs' },
            ];
        }
        return [
            { key: 'engineType', label: 'Engine Type' },
            { key: 'lessor', label: 'Lessor' },
            { key: 'operator', label: 'Operator' },
            { key: 'wingStatus', label: 'Wing Status' },
            { key: 'priority', label: 'Priority' },
            { key: 'svTypeNeeded', label: 'SV Type' },
            { key: 'cashOutEligible', label: 'Cash Out' },
        ];
    }, [activeSheet]);

    const filterOptions = useMemo(() => {
        const opts: Record<string, string[]> = {};
        for (const f of filterableCols) {
            const vals = [...new Set(data.map((r: any) => String(r[f.key]).trim()).filter(Boolean))].sort();
            opts[f.key] = vals;
        }
        return opts;
    }, [data, filterableCols]);

    // Search + filter + sort
    const processedData = useMemo(() => {
        let result = [...data] as any[];

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter((r: any) =>
                searchKeys.some(k => String(r[k] || '').toLowerCase().includes(term))
            );
        }

        // Filters
        for (const [key, val] of Object.entries(activeFilters)) {
            if (val) result = result.filter((r: any) => String(r[key]).trim() === val);
        }

        // Sort
        if (sortKey) {
            result = sortRecords(result, sortKey, sortDir);
        }

        return result;
    }, [data, searchTerm, searchKeys, activeFilters, sortKey, sortDir]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc');
            else { setSortKey(null); setSortDir('asc'); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    // ---- Row selection ----
    const toggleRow = useCallback((idx: number) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedRows.size === processedData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(processedData.map((_: any, i: number) => i)));
        }
    }, [selectedRows.size, processedData]);

    // ---- CRUD operations ----
    const handleEdit = useCallback((record: any, dataIndex: number) => {
        setEditingRecord(record);
        setEditingIndex(dataIndex);
        setIsNewRecord(false);
    }, []);

    const handleAddNew = useCallback(() => {
        const blank = activeSheet === 'shop' ? blankShopVisit() : blankForecast();
        setEditingRecord(blank);
        setEditingIndex(-1);
        setIsNewRecord(true);
    }, [activeSheet]);

    const handleSave = useCallback((updated: any) => {
        if (activeSheet === 'shop') {
            if (isNewRecord) {
                onShopVisitsChange([...shopVisits, { ...updated, _rowIndex: shopVisits.length }]);
            } else {
                // Find the original record by _rowIndex
                const newData = shopVisits.map(r =>
                    r._rowIndex === updated._rowIndex ? updated : r
                );
                onShopVisitsChange(newData);
            }
        } else {
            if (isNewRecord) {
                onForecastsChange([...forecasts, { ...updated, _rowIndex: forecasts.length }]);
            } else {
                const newData = forecasts.map(r =>
                    r._rowIndex === updated._rowIndex ? updated : r
                );
                onForecastsChange(newData);
            }
        }
        setEditingRecord(null);
    }, [activeSheet, isNewRecord, shopVisits, forecasts, onShopVisitsChange, onForecastsChange]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedRows.size === 0) return;
        const toDelete = new Set(
            Array.from(selectedRows).map(i => (processedData[i] as any)?._rowIndex)
        );
        if (activeSheet === 'shop') {
            onShopVisitsChange(shopVisits.filter(r => !toDelete.has(r._rowIndex)));
        } else {
            onForecastsChange(forecasts.filter(r => !toDelete.has(r._rowIndex)));
        }
        setSelectedRows(new Set());
    }, [selectedRows, processedData, activeSheet, shopVisits, forecasts, onShopVisitsChange, onForecastsChange]);

    const handleDeleteCurrent = useCallback(() => {
        if (!editingRecord) return;
        const rowIdx = editingRecord._rowIndex;
        if (activeSheet === 'shop') {
            onShopVisitsChange(shopVisits.filter(r => r._rowIndex !== rowIdx));
        } else {
            onForecastsChange(forecasts.filter(r => r._rowIndex !== rowIdx));
        }
        setEditingRecord(null);
    }, [editingRecord, activeSheet, shopVisits, forecasts, onShopVisitsChange, onForecastsChange]);

    const handleExport = useCallback(() => {
        exportWorkbook(shopVisits, forecasts);
    }, [shopVisits, forecasts]);

    const clearFilters = () => {
        setActiveFilters({});
        setSearchTerm('');
    };
    const hasActiveFilters = searchTerm || Object.values(activeFilters).some(Boolean);

    // ---- Switch sheet → reset state ----
    const switchSheet = (sheet: EditorSheet) => {
        setActiveSheet(sheet);
        setSelectedRows(new Set());
        setSearchTerm('');
        setActiveFilters({});
        setSortKey(null);
        setEditingRecord(null);
    };

    if (data.length === 0 && (activeSheet === 'shop' ? forecasts.length > 0 : shopVisits.length > 0)) {
        // If current sheet has no data but other does, show empty state
    }

    return (
        <div className="animate-fade-in flex flex-col max-w-[1600px] mx-auto min-h-[calc(100vh-140px)]">

            {/* View Header */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 28,
                    fontWeight: 600,
                    color: "#0F1923",
                    lineHeight: 1.2,
                    marginBottom: 6,
                }}>Data Editor</h2>
                <p style={{
                    fontSize: 13,
                    color: "#8B9AB5",
                    fontWeight: 500,
                }}>View, edit, add, and export raw engine data records</p>
            </div>

            {/* ---- Top bar: sheet switcher + actions ---- */}
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                {/* Sheet tabs */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-rr-border shadow-sm">
                    <button
                        onClick={() => switchSheet('shop')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-all duration-200
              ${activeSheet === 'shop'
                                ? 'bg-rr-navy text-white shadow-md'
                                : 'text-rr-text-dim hover:text-rr-navy hover:bg-rr-bg-secondary'
                            }`}
                    >
                        <Wrench size={14} />
                        Shop Visits
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeSheet === 'shop' ? 'bg-white/20 text-white' : 'bg-rr-bg-tertiary text-rr-text-muted'
                            }`}>
                            {shopVisits.length}
                        </span>
                    </button>
                    <button
                        onClick={() => switchSheet('forecast')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-all duration-200
              ${activeSheet === 'forecast'
                                ? 'bg-rr-navy text-white shadow-md'
                                : 'text-rr-text-dim hover:text-rr-navy hover:bg-rr-bg-secondary'
                            }`}
                    >
                        <BarChart3 size={14} />
                        Engine Forecast
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeSheet === 'forecast' ? 'bg-white/20 text-white' : 'bg-rr-bg-tertiary text-rr-text-muted'
                            }`}>
                            {forecasts.length}
                        </span>
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold
              bg-white text-rr-navy border border-rr-border shadow-sm
              hover:bg-rr-bg-secondary hover:border-rr-border-strong transition-all duration-200"
                    >
                        <Plus size={16} />
                        Add Record
                    </button>

                    {selectedRows.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold
                bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]
                hover:bg-[#FEE2E2] hover:border-[#FCA5A5] transition-all duration-200 shadow-sm"
                        >
                            <Trash2 size={15} />
                            Delete ({selectedRows.size})
                        </button>
                    )}

                    <div className="w-px h-8 bg-rr-border mx-1" />

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold
              bg-rr-gold text-white border border-rr-gold-dim
              hover:bg-[#B39345] hover:border-[#A0833B] hover:shadow-[0_2px_8px_rgba(197,164,78,0.25)]
              shadow-sm transition-all duration-200"
                    >
                        <Download size={15} />
                        Export .xlsx
                    </button>
                </div>
            </div>

            {/* ---- Search + filters ---- */}
            <div className="rr-card flex-1 flex flex-col overflow-hidden bg-white shadow-sm border-rr-border border-[1px] rounded-xl">
                <div className="flex items-center gap-4 border-b border-rr-border bg-[#FAFAF8]" style={{ padding: "20px 24px" }}>
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rr-text-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search records…"
                            className="w-full pl-10 pr-4 py-2 bg-white border border-rr-border rounded-lg text-[13px] font-medium
                text-rr-navy placeholder:text-rr-text-placeholder focus:outline-none focus:border-rr-gold/50 focus:ring-1 focus:ring-rr-gold/20 box-shadow-sm transition-all"
                        />
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold border transition-colors
              ${showFilters
                                ? 'bg-[#F2F4F7] border-[#D0D5DD] text-rr-navy shadow-inner'
                                : 'bg-white border-rr-border text-rr-text-dim hover:text-rr-navy hover:bg-[#F9FAFB] shadow-sm'
                            }`}
                    >
                        <Filter size={15} />
                        Filters
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-rr-danger hover:bg-rr-danger/10 transition-colors"
                        >
                            <X size={14} />
                            Clear
                        </button>
                    )}

                    <span className="text-[12px] font-semibold text-rr-text-muted ml-auto bg-white px-3 py-1.5 rounded-md border border-rr-border shadow-sm">
                        {processedData.length} of {data.length} records
                    </span>
                </div>

                {/* Filter bar */}
                {showFilters && (
                    <div className="flex flex-wrap gap-4 px-5 py-4 border-b border-rr-border bg-[#F9FAFB]">
                        {filterableCols.map(fk => (
                            <div key={fk.key} className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[1px] text-rr-text-muted ml-0.5">{fk.label}</label>
                                <select
                                    value={activeFilters[fk.key] || ''}
                                    onChange={(e) => setActiveFilters(prev => ({ ...prev, [fk.key]: e.target.value }))}
                                    className="px-3 py-1.5 bg-white border border-rr-border rounded-md text-[13px] font-medium text-rr-navy
                    focus:outline-none focus:border-rr-gold/50 focus:ring-1 focus:ring-rr-gold/20 min-w-[140px] shadow-sm cursor-pointer"
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

                {/* ---- Editable Table ---- */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="data-table w-full">
                        <thead>
                            <tr className="bg-[#FAFAF8]">
                                {/* Checkbox column */}
                                <th
                                    className="!w-12 !min-w-[48px] text-center !cursor-pointer sticky left-0 z-20 bg-[#FAFAF8] border-r border-r-rr-border/50"
                                    onClick={toggleAll}
                                >
                                    {selectedRows.size === processedData.length && processedData.length > 0
                                        ? <CheckSquare size={16} className="text-rr-gold mx-auto" />
                                        : <Square size={16} className="text-rr-text-muted mx-auto" />
                                    }
                                </th>
                                {/* Row # */}
                                <th className="!w-12 !min-w-[48px] text-center">
                                    <span className="text-rr-text-muted">#</span>
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{ minWidth: col.width }}
                                        className="hover:bg-[#F2F4F7] transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-rr-text-dim group-hover:text-rr-navy font-bold transition-colors">{col.label}</span>
                                            {sortKey === col.key && (
                                                sortDir === 'asc'
                                                    ? <ChevronUp size={14} className="text-rr-gold" />
                                                    : <ChevronDown size={14} className="text-rr-gold" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 2} className="text-center py-20 bg-white">
                                        <div className="w-12 h-12 bg-[#F6F5F2] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search size={20} className="text-rr-text-muted" />
                                        </div>
                                        <p className="text-[14px] font-semibold text-rr-navy">
                                            {data.length === 0 ? 'No data loaded' : 'No records found'}
                                        </p>
                                        <p className="text-[12px] text-rr-text-dim mt-1">
                                            {data.length === 0 ? 'Upload an Excel file to get started.' : 'Try adjusting your search or filters.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                processedData.map((row: any, idx: number) => {
                                    const isSelected = selectedRows.has(idx);
                                    return (
                                        <tr
                                            key={row._rowIndex ?? idx}
                                            className={`
                        cursor-pointer transition-colors duration-150
                        ${isSelected ? 'bg-[#FCF9F2]' : 'bg-white hover:bg-[#FAF9F7]'}
                      `}
                                            onClick={() => handleEdit(row, idx)}
                                        >
                                            {/* Checkbox */}
                                            <td
                                                className={`text-center !w-12 sticky left-0 z-10 transition-colors duration-150 border-r border-r-rr-border/50
                           ${isSelected ? 'bg-[#FCF9F2]' : 'bg-white group-hover:bg-[#FAF9F7]'}`}
                                                onClick={(e) => { e.stopPropagation(); toggleRow(idx); }}
                                            >
                                                {isSelected
                                                    ? <CheckSquare size={16} className="text-rr-gold mx-auto" />
                                                    : <Square size={16} className="text-rr-text-muted/40 mx-auto hover:text-rr-text-muted" />
                                                }
                                            </td>
                                            {/* Row number */}
                                            <td className="text-center !w-12">
                                                <span className="text-[11px] font-medium text-rr-text-muted">{idx + 1}</span>
                                            </td>
                                            {columns.map(col => (
                                                <td key={col.key} title={String(row[col.key] ?? '')}>
                                                    <EditableCellRenderer value={row[col.key]} colKey={col.key} />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ---- Record edit form ---- */}
            <RecordForm
                record={editingRecord}
                mode={activeSheet}
                isOpen={editingRecord !== null}
                onClose={() => setEditingRecord(null)}
                onSave={handleSave}
                onDelete={handleDeleteCurrent}
                isNew={isNewRecord}
            />
        </div>
    );
}

/** Cell renderer with status/priority formatting */
function EditableCellRenderer({ value, colKey }: { value: any; colKey: string }) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-rr-text-muted/30">—</span>;
    }

    const str = String(value);

    // Status column
    if (colKey === 'status') {
        const s = str.toLowerCase();
        let colorClass = 'bg-[#F2F4F7] text-[#475467] border-[#EAECF0]';
        if (s.includes('hold')) colorClass = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
        else if (s.includes('complete') || s.includes('done')) colorClass = 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]';
        else if (s.includes('progress') || s.includes('shop') || s.includes('induct')) colorClass = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
        else if (s.includes('arc') || s.includes('test')) colorClass = 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
        return <span className={`status-badge border ${colorClass}`}>{str}</span>;
    }

    // Priority column
    if (colKey === 'priority') {
        const s = str.toLowerCase();
        let colorClass = 'text-rr-text-dim font-medium';
        if (s.includes('high') || s === '1') colorClass = 'text-[#DC2626] font-bold';
        else if (s.includes('medium') || s === '2') colorClass = 'text-[#D97706] font-bold';
        else if (s.includes('low') || s === '3') colorClass = 'text-[#059669] font-medium';
        return <span className={colorClass}>{str}</span>;
    }

    // Wing status
    if (colKey === 'wingStatus') {
        const isOn = str.toLowerCase().includes('on');
        return (
            <span className={`inline-flex items-center gap-1.5 font-medium ${isOn ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOn ? 'bg-[#059669]' : 'bg-[#D97706]'}`} />
                {str}
            </span>
        );
    }

    return <span className="text-rr-navy font-medium">{str}</span>;
}
