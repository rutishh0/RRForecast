import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';
import type { User, FeatureRequest } from '../types';
import { featureRequestsAPI } from '../services/api';

interface FeatureRequestAdminProps {
    currentUser: User;
}

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
    { value: 'submitted', label: 'Submitted', color: 'text-rr-info' },
    { value: 'under_review', label: 'Under Review', color: 'text-rr-warning' },
    { value: 'in_progress', label: 'In Progress', color: 'text-rr-gold' },
    { value: 'completed', label: 'Completed', color: 'text-rr-success' },
    { value: 'declined', label: 'Declined', color: 'text-rr-danger' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
    submitted: { bg: 'bg-rr-info/15 border-rr-info/25', text: 'text-rr-info' },
    under_review: { bg: 'bg-rr-warning/15 border-rr-warning/25', text: 'text-rr-warning' },
    in_progress: { bg: 'bg-rr-gold/15 border-rr-gold/25', text: 'text-rr-gold' },
    completed: { bg: 'bg-rr-success/15 border-rr-success/25', text: 'text-rr-success' },
    declined: { bg: 'bg-rr-danger/15 border-rr-danger/25', text: 'text-rr-danger' },
};

export default function FeatureRequestAdmin({ currentUser }: FeatureRequestAdminProps) {
    const [requests, setRequests] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

    const fetchRequests = useCallback(async () => {
        try {
            const data = await featureRequestsAPI.list();
            setRequests(data.requests || []);
        } catch {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleStatusChange = async (id: number, status: string) => {
        try {
            const notes = adminNotes[id];
            await featureRequestsAPI.updateStatus(id, {
                status,
                ...(notes ? { adminNotes: notes } : {}),
            });
            fetchRequests();
        } catch { /* handle error */ }
    };

    const handleDelete = async (id: number) => {
        try {
            await featureRequestsAPI.delete(id);
            fetchRequests();
        } catch { /* handle error */ }
    };

    const toggleExpand = async (id: number) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        try {
            const data = await featureRequestsAPI.view(id);
            const req = data.request;
            setRequests(prev => prev.map(r => r.id === id ? { ...r, ...req } : r));
            setAdminNotes(prev => ({ ...prev, [id]: req.adminNotes || '' }));
            setExpandedId(id);
        } catch { /* handle error */ }
    };

    const filteredRequests = filterStatus === 'all'
        ? requests
        : requests.filter(r => r.status === filterStatus);

    const statusCounts = requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (currentUser.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center rr-card p-8">
                    <AlertTriangle size={32} className="text-rr-warning mx-auto mb-3" />
                    <p className="text-sm text-rr-text">Admin access required</p>
                    <p className="text-xs text-rr-text-muted mt-1">This page is only accessible to administrators</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="text-rr-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Summary Stats */}
            <div className="grid grid-cols-5" style={{ gap: '12px', marginBottom: '24px' }}>
                {STATUS_OPTIONS.map(s => (
                    <button
                        key={s.value}
                        onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
                        className={`rr-card p-4 text-left transition-all duration-200 hover:border-rr-gold/30
              ${filterStatus === s.value ? 'border-rr-gold/40 bg-rr-gold/5' : ''}`}
                    >
                        <p className={`text-[10px] uppercase tracking-wider ${s.color}`}>{s.label}</p>
                        <p className="text-2xl font-bold text-rr-text font-[family-name:var(--font-heading)] mt-1">
                            {statusCounts[s.value] || 0}
                        </p>
                    </button>
                ))}
            </div>

            {filterStatus !== 'all' && (
                <button onClick={() => setFilterStatus('all')} className="text-xs text-rr-text-dim hover:text-rr-gold transition-colors">
                    ← Show all requests
                </button>
            )}

            {/* Request List */}
            {filteredRequests.length === 0 ? (
                <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: 14, padding: '48px', textAlign: "center" }}>
                    <Star size={32} className="text-rr-text-muted mx-auto mb-3" />
                    <p className="text-sm text-rr-text-dim">No feature requests {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'yet'}</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: '8px' }}>
                    {filteredRequests.map(req => {
                        const isExpanded = expandedId === req.id;
                        const statusStyle = STATUS_BADGE[req.status] || STATUS_BADGE.submitted;
                        const requesterName = req.requester?.displayName || 'Unknown';
                        const requesterColor = req.requester?.avatarColor || '#C5A44E';

                        return (
                            <div key={req.id} className="rr-card overflow-hidden">
                                {/* Row header */}
                                <button
                                    onClick={() => toggleExpand(req.id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-rr-bg-tertiary transition-all"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div
                                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-rr-navy"
                                            style={{ backgroundColor: requesterColor }}
                                        >
                                            {requesterName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-rr-text truncate">{req.title}</p>
                                            <p className="text-[10px] text-rr-text-muted">
                                                {requesterName} · {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${statusStyle.bg} ${statusStyle.text}`}>
                                            {req.status.replace('_', ' ')}
                                        </span>
                                        {isExpanded ? <ChevronUp size={14} className="text-rr-text-muted" /> : <ChevronDown size={14} className="text-rr-text-muted" />}
                                    </div>
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-rr-border/50 pt-4 animate-fade-in">
                                        {/* Description */}
                                        <div className="mb-4">
                                            <h5 className="text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider mb-1">Description</h5>
                                            <p className="text-sm text-rr-text-dim leading-relaxed whitespace-pre-wrap">{req.description}</p>
                                        </div>

                                        {/* Admin notes */}
                                        <div className="mb-4">
                                            <h5 className="text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider mb-1">Admin Notes</h5>
                                            <textarea
                                                value={adminNotes[req.id] || ''}
                                                onChange={e => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                placeholder="Add notes for the requester..."
                                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted
                          focus:outline-none focus:border-rr-gold/50 resize-none h-20"
                                            />
                                        </div>

                                        {/* Status actions */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] text-rr-text-muted uppercase tracking-wider mr-1">Set Status:</span>
                                            {STATUS_OPTIONS.map(s => (
                                                <button
                                                    key={s.value}
                                                    onClick={() => handleStatusChange(req.id, s.value)}
                                                    disabled={req.status === s.value}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-medium uppercase transition-all
                            ${req.status === s.value
                                                            ? 'bg-rr-gold/15 text-rr-gold border border-rr-gold/25'
                                                            : 'text-rr-text-dim border border-rr-border hover:text-rr-text hover:bg-rr-bg-tertiary'
                                                        } disabled:cursor-default`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                            <div className="flex-1" />
                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                className="px-3 py-1.5 rounded-md text-[10px] text-rr-text-muted hover:text-rr-danger hover:bg-rr-danger/10 border border-transparent hover:border-rr-danger/20 transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
