import { useEffect } from 'react';
import { X, ChevronRight, Cog, AlertTriangle } from 'lucide-react';
import type { ShopVisitRecord } from '../types';

interface EngineDetailPanelProps {
    record: ShopVisitRecord | null;
    isOpen: boolean;
    onClose: () => void;
}

// Field groupings matching the Lessor_SV_Tracker_v2 structure
const FIELD_GROUPS = [
    {
        title: 'Asset Identity',
        color: '#3B6FB5',
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
        color: '#7C3AED',
        fields: [
            { key: 'leaseExpiry', label: 'Lease Expiry' },
            { key: 'transitionDate', label: 'Transition Date' },
            { key: 'transitionProbability', label: 'Transition Probability' },
            { key: 'wingStatus', label: 'Wing Status' },
            { key: 'removalDate', label: 'Removal Date' },
            { key: 'fcsRemaining', label: 'FCs Remaining' },
        ],
    },
    {
        title: 'Shop Visit Planning',
        color: '#B5723B',
        fields: [
            { key: 'svProbability', label: 'SV Probability' },
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
        color: '#6B6B6B',
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
            { key: 'mfaInductionDate2', label: 'MfA Date 2' },
        ],
    },
    {
        title: 'Financial',
        color: '#9E8530',
        fields: [
            { key: 'svPrice', label: 'SV Price ($)' },
            { key: 'totalSvContribution', label: 'Total SV Contribution' },
            { key: 'profit', label: 'Profit ($)' },
            { key: 'cashOutEligible', label: 'Cash Out Eligible' },
            { key: 'cashOutProbability', label: 'Cash Out Prob.' },
        ],
    },
    {
        title: "CRC's",
        color: '#3B8EB5',
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

function formatValue(val: unknown): string {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'number') {
        if (val <= 1 && val > 0) return `${(val * 100).toFixed(0)}%`;
        return val.toLocaleString();
    }
    return String(val);
}

function getWingStatusColor(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('on')) return 'text-rr-success';
    if (s.includes('off')) return 'text-rr-warning';
    return 'text-rr-text-dim';
}

export default function EngineDetailPanel({ record, isOpen, onClose }: EngineDetailPanelProps) {
    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen || !record) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-rr-bg border-l border-rr-border
        shadow-[-8px_0_40px_rgba(0,0,0,0.1)] overflow-y-auto
        animate-[slideInRight_0.3s_ease-out_forwards]"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-rr-bg border-b border-rr-border px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rr-gold/10 border border-rr-gold/20">
                                <Cog size={20} className="text-rr-gold" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold font-[family-name:var(--font-heading)] text-rr-text">
                                    {record.esn || 'Unknown ESN'}
                                </h2>
                                <p className="text-xs text-rr-text-dim mt-0.5">
                                    {record.engineType || 'Unknown Type'} · {record.operator || record.lessor || 'Unknown'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-rr-text-muted hover:text-rr-text transition-colors p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Quick status badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {record.wingStatus && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                bg-rr-bg-secondary border border-rr-border ${getWingStatusColor(record.wingStatus)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${record.wingStatus.toLowerCase().includes('on') ? 'bg-rr-success' : 'bg-rr-warning'
                                    }`} />
                                {record.wingStatus}
                            </span>
                        )}
                        {record.status && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                bg-rr-bg-secondary border border-rr-border text-rr-info">
                                {record.status}
                            </span>
                        )}
                        {record.shop && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
                bg-rr-bg-secondary border border-rr-border text-rr-gold-dim">
                                {record.shop}
                            </span>
                        )}
                    </div>
                </div>

                {/* Field groups */}
                <div className="px-6 py-4 space-y-4">
                    {FIELD_GROUPS.map(group => (
                        <div key={group.title} className="rr-card overflow-hidden">
                            {/* Group header */}
                            <div
                                className="flex items-center gap-2 px-4 py-2.5 border-b border-rr-border"
                                style={{ backgroundColor: `${group.color}10` }}
                            >
                                <ChevronRight size={13} style={{ color: group.color }} />
                                <span
                                    className="text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: group.color }}
                                >
                                    {group.title}
                                </span>
                            </div>

                            {/* Fields */}
                            <div className="divide-y divide-rr-border/50">
                                {group.fields.map(field => {
                                    const val = (record as any)[field.key];
                                    const display = formatValue(val);
                                    const isEmpty = display === '—';
                                    return (
                                        <div key={field.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-rr-bg-tertiary transition-colors">
                                            <span className="text-[11px] text-rr-text-muted font-medium uppercase tracking-wide">
                                                {field.label}
                                            </span>
                                            <span className={`text-sm text-right max-w-[55%] truncate ${isEmpty ? 'text-rr-text-muted/40' : 'text-rr-text'}`}>
                                                {display}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Compliance section (scaffold for future) */}
                    <div className="rr-card overflow-hidden opacity-60">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-rr-border bg-rr-bg-tertiary">
                            <AlertTriangle size={13} className="text-rr-text-muted" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-rr-text-muted">
                                Compliance Readiness
                            </span>
                            <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-rr-bg-tertiary text-rr-text-muted uppercase tracking-wider">
                                Coming Soon
                            </span>
                        </div>
                        <div className="px-4 py-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-rr-bg-secondary border border-rr-border mx-auto mb-3 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-rr-text-muted/40" />
                            </div>
                            <p className="text-xs text-rr-text-muted">
                                Compliance data will be available once additional<br />
                                columns are configured in the Excel sheet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
