import { useState, useEffect, useCallback } from 'react';
import { X, Save, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { ShopVisitRecord, ForecastRecord } from '../types';

type RecordType = ShopVisitRecord | ForecastRecord;

interface RecordFormProps {
    record: RecordType | null;
    mode: 'shop' | 'forecast';
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: RecordType) => void;
    onDelete: () => void;
    isNew?: boolean;
}

// ---- Field group definitions ----

interface FieldDef {
    key: string;
    label: string;
    type?: 'text' | 'number';
}

interface FieldGroup {
    title: string;
    color: string;
    bgHex: string;
    fields: FieldDef[];
}

const SHOP_FIELD_GROUPS: FieldGroup[] = [
    {
        title: 'Asset Identity',
        color: '#1E40AF',
        bgHex: '#EFF6FF',
        fields: [
            { key: 'lessor', label: 'Lessor' },
            { key: 'lessorCarePlus', label: 'TCA / LessorCare+' },
            { key: 'operator', label: 'Operator' },
            { key: 'msn', label: 'MSN' },
            { key: 'aircraftType', label: 'Aircraft Type' },
            { key: 'esn', label: 'ESN' },
            { key: 'engineType', label: 'Engine Type' },
            { key: 'registration', label: 'Registration' },
        ],
    },
    {
        title: 'Lease & Transition',
        color: '#6B21A8',
        bgHex: '#FAF5FF',
        fields: [
            { key: 'leaseExpiry', label: 'Lease Expiry' },
            { key: 'transitionDate', label: 'Transition Date' },
            { key: 'transitionProbability', label: 'Transition Probability', type: 'number' },
            { key: 'wingStatus', label: 'On-Wing / Off-Wing' },
            { key: 'removalDate', label: 'Removal Date' },
            { key: 'fcsRemaining', label: 'FCs Remaining' },
        ],
    },
    {
        title: 'Shop Visit Planning',
        color: '#92400E',
        bgHex: '#FEF3C7',
        fields: [
            { key: 'svProbability', label: 'SV Probability', type: 'number' },
            { key: 'svType', label: 'SV Type' },
            { key: 'svReason', label: 'SV Reason' },
            { key: 'inductionGate', label: 'Induction Gate' },
            { key: 'dateSvRequested', label: 'Date SV Requested' },
            { key: 'requiredOutputDate', label: 'Reqd Engine Output' },
            { key: 'mfaOperatorRef', label: 'MfA Ref' },
            { key: 'mfaInductionDate', label: 'MfA Induction Date' },
            { key: 'inductionStatus', label: 'Induction Status' },
        ],
    },
    {
        title: 'SV Progress',
        color: '#92400E',
        bgHex: '#FFFBEB',
        fields: [
            { key: 'offlogStatus', label: 'Offlog Status' },
            { key: 'workscopeAgreed', label: 'Workscope Agreed' },
            { key: 'plannedToTest', label: 'Planned to Test' },
            { key: 'plannedToArc', label: 'Planned to ARC' },
            { key: 'shop', label: 'Overhaul Base' },
            { key: 'status', label: 'Status' },
            { key: 'riskToCustomer', label: 'Risk to Customer' },
        ],
    },
    {
        title: 'Commercial & Contract',
        color: '#374151',
        bgHex: '#F3F4F6',
        fields: [
            { key: 'contractInPlace', label: 'Contract in Place' },
            { key: 'contractType', label: 'Contract Type' },
            { key: 'contractRef', label: 'Contract Ref / DEG' },
            { key: 'paymentTerms', label: 'Payment Terms' },
            { key: 'fullyFunded', label: 'Fully Funded' },
            { key: 'poRequested', label: 'PO Status & Amt' },
            { key: 'customerPoRef', label: 'Customer PO Ref' },
            { key: 'networkPaying', label: 'Network (Payer)' },
            { key: 'networkInMfa', label: 'Network in MfA' },
            { key: 'mfaInductionDate2', label: 'MfA Induction Date 2' },
        ],
    },
    {
        title: 'Financial',
        color: '#065F46',
        bgHex: '#ECFDF5',
        fields: [
            { key: 'svPrice', label: 'SV Price ($)' },
            { key: 'totalSvContribution', label: 'Total SV Contribution', type: 'number' },
            { key: 'profit', label: 'Profit ($)' },
            { key: 'cashOutEligible', label: 'Cash Out Eligible' },
            { key: 'cashOutProbability', label: 'Cash Out Prob.', type: 'number' },
        ],
    },
    {
        title: "CRC's",
        color: '#1E40AF',
        bgHex: '#EFF6FF',
        fields: [
            { key: 'crcsApplicable', label: 'CRCs Applicable' },
            { key: 'backingDataReceived', label: 'Backing Data Received' },
            { key: 'backingDataSent', label: 'Backing Data Sent' },
            { key: 'invoicePayment', label: 'Invoice & Payment' },
            { key: 'customerMaster', label: 'Customer Master' },
            { key: 'addressForCrc', label: 'Address for CRC' },
            { key: 'crcContact', label: 'CRC Contact' },
        ],
    },
    {
        title: 'Ownership & Actions',
        color: '#9F1239',
        bgHex: '#FFF1F2',
        fields: [
            { key: 'amContact', label: 'AM Responsible' },
            { key: 'taskOwner', label: 'Task Owner' },
            { key: 'priority', label: 'Priority' },
            { key: 'openActions', label: 'Open Actions / Issues' },
            { key: 'lastUpdated', label: 'Last Updated' },
            { key: 'nextSteps', label: 'Next Steps' },
            { key: 'comments', label: 'Comments' },
        ],
    },
];

const FORECAST_FIELD_GROUPS: FieldGroup[] = [
    {
        title: 'Engine Information',
        color: '#1E40AF',
        bgHex: '#EFF6FF',
        fields: [
            { key: 'lessor', label: 'Lessor' },
            { key: 'lessorCarePlus', label: 'LessorCare+' },
            { key: 'operator', label: 'Operator' },
            { key: 'esn', label: 'ESN / MSN' },
            { key: 'engineType', label: 'Engine Type' },
            { key: 'wingStatus', label: 'On-Wing / Off-Wing' },
            { key: 'removalDate', label: 'Removal Date' },
        ],
    },
    {
        title: 'Forecast Details',
        color: '#92400E',
        bgHex: '#FEF3C7',
        fields: [
            { key: 'comment', label: 'Comment' },
            { key: 'svTypeNeeded', label: 'SV Type Needed' },
            { key: 'svPrice', label: 'SV Price' },
            { key: 'cashOutEligible', label: 'Cash Out Eligible' },
            { key: 'profitMillion', label: 'Profit $M' },
            { key: 'priority', label: 'Priority' },
            { key: 'notes', label: 'Notes' },
        ],
    },
];

export default function RecordForm({ record, mode, isOpen, onClose, onSave, onDelete, isNew }: RecordFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const groups = mode === 'shop' ? SHOP_FIELD_GROUPS : FORECAST_FIELD_GROUPS;

    // Initialize form data when record changes
    useEffect(() => {
        if (record) {
            setFormData({ ...record });
            setChangedKeys(new Set());
        }
    }, [record]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const handleChange = useCallback((key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setChangedKeys(prev => new Set(prev).add(key));
    }, []);

    const toggleGroup = useCallback((title: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    }, []);

    const handleSave = () => {
        onSave(formData as RecordType);
        onClose();
    };

    if (!isOpen || !record) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100] bg-rr-navy/10 backdrop-blur-[4px] transition-all"
                onClick={onClose}
            />

            {/* Slide-out Panel */}
            <div className="fixed top-0 right-0 z-[110] h-full w-full max-w-[560px] bg-white border-l border-rr-border
        shadow-[-20px_0_60px_rgba(0,0,0,0.06)] flex flex-col
        animate-fade-in translate-x-0"
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-start justify-between px-8 py-6 border-b border-rr-border bg-[#FAFAF8]">
                    <div>
                        <h3 className="text-[22px] font-semibold font-[family-name:var(--font-heading)] text-rr-navy leading-tight">
                            {isNew ? 'Add New Record' : 'Edit Record'}
                        </h3>
                        <p className="text-[13px] font-medium text-rr-text-dim mt-1">
                            {formData.esn ? `ESN: ${formData.esn}` : mode === 'shop' ? 'Shop Visit Record' : 'Forecast Record'}
                            {changedKeys.size > 0 && (
                                <span className="text-rr-gold font-bold ml-2">· {changedKeys.size} field{changedKeys.size !== 1 ? 's' : ''} changed</span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-rr-border text-rr-text-muted hover:text-rr-navy hover:border-rr-border-strong hover:bg-[#F2F4F7] shadow-sm transition-all"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-white custom-scrollbar">
                    {groups.map(group => {
                        const isCollapsed = collapsedGroups.has(group.title);
                        return (
                            <div key={group.title} className="rounded-xl border border-rr-border overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md">
                                {/* Group header (clickable to collapse) */}
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className="w-full flex items-center justify-between px-5 py-3.5 border-b border-rr-border text-left transition-colors cursor-pointer group/header"
                                    style={{ backgroundColor: group.bgHex }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }} />
                                        <span
                                            className="text-[12px] font-bold uppercase tracking-[1px] pt-[1px]"
                                            style={{ color: group.color }}
                                        >
                                            {group.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-medium text-[#667085]">
                                            {group.fields.length} fields
                                        </span>
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-white/50 border border-black/5 group-hover/header:bg-white group-hover/header:border-black/10 transition-colors">
                                            {isCollapsed
                                                ? <ChevronRight size={14} style={{ color: group.color }} />
                                                : <ChevronDown size={14} style={{ color: group.color }} />
                                            }
                                        </div>
                                    </div>
                                </button>

                                {/* Fields List */}
                                {!isCollapsed && (
                                    <div className="p-5 flex flex-col gap-4">
                                        {group.fields.map(field => {
                                            const isChanged = changedKeys.has(field.key);
                                            return (
                                                <div key={field.key} className="flex flex-col gap-1.5">
                                                    <label className={`block text-[11px] font-bold uppercase tracking-[0.5px] pl-1 transition-colors
                            ${isChanged ? 'text-rr-gold' : 'text-[#475467]'}`}>
                                                        {field.label}
                                                        {isChanged && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-rr-gold align-middle" />}
                                                    </label>
                                                    <input
                                                        type={field.type === 'number' ? 'number' : 'text'}
                                                        value={formData[field.key] ?? ''}
                                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                                        className={`w-full px-4 py-2.5 rounded-lg text-[13px] font-medium text-rr-navy
                              bg-white border transition-all duration-200 outline-none
                              ${isChanged
                                                                ? 'border-rr-gold shadow-[0_0_0_1px_rgba(197,164,78,0.2)]'
                                                                : 'border-[#EAECF0] hover:border-rr-border-strong focus:border-[#D0D5DD] focus:shadow-[0_0_0_2px_rgba(234,236,240,1)]'
                                                            }
                              placeholder:text-[#98A2B3] placeholder:font-normal`}
                                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer actions */}
                <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-t border-rr-border bg-[#FAFAF8] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
                    {!isNew ? (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold
                bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]
                hover:bg-[#FEE2E2] hover:border-[#FCA5A5] transition-all duration-200 shadow-sm"
                        >
                            <Trash2 size={15} />
                            Delete Record
                        </button>
                    ) : <div />} {/* Empty div to align Save buttons to the right */}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-[#475467]
                bg-white border border-[#D0D5DD] hover:bg-[#F9FAFB] hover:text-rr-navy transition-all duration-200 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-bold
                bg-rr-gold text-white border border-[#B39345]
                hover:bg-[#B39345] hover:border-[#A0833B] hover:shadow-[0_2px_12px_rgba(197,164,78,0.3)]
                transition-all duration-200 shadow-sm"
                        >
                            <Save size={15} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
