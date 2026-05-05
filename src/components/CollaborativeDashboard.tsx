import { useState, useEffect, useCallback } from 'react';
import { Plus, StickyNote, Eye, EyeOff, Loader2, MessageSquare, Pin } from 'lucide-react';
import type { User, PostitNote as PostItNoteType, ShopVisitRecord, ForecastRecord } from '../types';
import { postitsAPI } from '../services/api';
import PostItNote from './PostItNote';

interface CollaborativeDashboardProps {
    currentUser: User;
    shopVisits: ShopVisitRecord[];
    forecasts: ForecastRecord[];
}

const NOTE_COLORS = [
    { label: 'Amber', value: '#FBBF24', bgClass: 'bg-[#FEF3C7]' },
    { label: 'Green', value: '#34D399', bgClass: 'bg-[#D1FAE5]' },
    { label: 'Blue', value: '#60A5FA', bgClass: 'bg-[#DBEAFE]' },
    { label: 'Pink', value: '#F472B6', bgClass: 'bg-[#FCE7F3]' },
    { label: 'Violet', value: '#A78BFA', bgClass: 'bg-[#EDE9FE]' },
];

export default function CollaborativeDashboard({ currentUser, shopVisits, forecasts }: CollaborativeDashboardProps) {
    const [notes, setNotes] = useState<PostItNoteType[]>([]);
    const [showNotes, setShowNotes] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [content, setContent] = useState('');
    const [color, setColor] = useState('#FBBF24');
    const [loading, setLoading] = useState(true);

    const fetchNotes = useCallback(async () => {
        try {
            const data = await postitsAPI.listAll();
            setNotes(data.postits || []);
        } catch {
            setNotes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    const handleCreate = async () => {
        if (!content.trim()) return;
        try {
            await postitsAPI.create({
                contextType: 'general',
                content: content.trim(),
                color,
            });
            setContent('');
            setShowAddForm(false);
            fetchNotes();
        } catch { /* handle error */ }
    };

    const handleDelete = async (id: number) => {
        try {
            await postitsAPI.delete(id);
            fetchNotes();
        } catch { /* handle error */ }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await postitsAPI.markRead(id);
            fetchNotes();
        } catch { /* handle error */ }
    };

    const unreadCount = notes.filter(n => !n.isRead && n.authorId !== currentUser.id).length;

    // Generate pseudo-random rotation from note ID for visual interest
    const getRotation = (id: number) => {
        const seed = (id * 7 + 3) % 11;
        return (seed - 5) * 0.5; // Range: -2.5 to +2.5 degrees
    };

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto" }} className="animate-fade-in">
            {/* View Header */}
            <div style={{ marginBottom: '28px', display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 28,
                        fontWeight: 600,
                        color: "#0F1923",
                        lineHeight: 1.2,
                        marginBottom: 6,
                    }}>Team Dashboard</h2>
                    <p style={{
                        fontSize: 13,
                        color: "#8B9AB5",
                        fontWeight: 500,
                    }}>Collaborative space for sharing updates, notes, and metrics with the team</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center" style={{ gap: '20px', marginBottom: '32px' }}>
                <div className="bg-white border border-rr-border rounded-xl shadow-sm px-6 py-4 flex flex-col gap-2 flex-1 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <StickyNote size={14} className="text-rr-gold" strokeWidth={2.5} />
                        <span className="text-[11px] text-rr-text-muted font-bold uppercase tracking-[1px]">Team Notes</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <p className="text-[28px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-none">
                            {notes.length}
                        </p>
                        {unreadCount > 0 && (
                            <span className="text-[11px] font-bold text-white bg-rr-gold px-2 py-0.5 rounded-full mb-1">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-rr-border rounded-xl shadow-sm px-6 py-4 flex flex-col gap-2 flex-1 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={14} className="text-[#059669]" strokeWidth={2.5} />
                        <span className="text-[11px] text-rr-text-muted font-bold uppercase tracking-[1px]">Shop Visits Loaded</span>
                    </div>
                    <p className="text-[28px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-none">
                        {shopVisits.length}
                    </p>
                </div>

                <div className="bg-white border border-rr-border rounded-xl shadow-sm px-6 py-4 flex flex-col gap-2 flex-1 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={14} className="text-[#2563EB]" strokeWidth={2.5} />
                        <span className="text-[11px] text-rr-text-muted font-bold uppercase tracking-[1px]">Forecasts Loaded</span>
                    </div>
                    <p className="text-[28px] font-bold font-[family-name:var(--font-heading)] text-rr-navy leading-none">
                        {forecasts.length}
                    </p>
                </div>
            </div>

            {/* Shared Notes Board Header */}
            <div className="flex items-center justify-between border-b border-rr-border" style={{ paddingBottom: '16px', marginTop: '32px' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FCF9F2] border border-rr-gold/20 flex items-center justify-center">
                        <Pin size={16} className="text-rr-gold -rotate-45" />
                    </div>
                    <h3 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#0F1923",
                    }}>Shared Noticeboard</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all
              ${showNotes
                                ? 'bg-white text-rr-navy border border-[#D0D5DD] shadow-sm hover:bg-[#F9FAFB]'
                                : 'bg-white text-rr-text-dim border border-rr-border hover:text-rr-navy shadow-sm'
                            }`}
                    >
                        {showNotes ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showNotes ? 'Hide Board' : 'Show Board'}
                    </button>

                    <button
                        onClick={() => {
                            setShowAddForm(true);
                            setShowNotes(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold
              bg-rr-navy text-white hover:bg-rr-navy-600 shadow-sm transition-all"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        Post Note
                    </button>
                </div>
            </div>

            {/* Add Note Form */}
            {showAddForm && (
                <div className="bg-white border border-rr-border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6 animate-fade-in relative z-20">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[13px] font-bold text-rr-navy uppercase tracking-[1px]">Post to Noticeboard</h4>
                    </div>

                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Write your note for the team..."
                        className={`w-full px-5 py-4 rounded-lg text-[14px] font-medium text-rr-navy border outline-none
              resize-none min-h-[120px] mb-5 transition-colors shadow-inner
              ${NOTE_COLORS.find(c => c.value === color)?.bgClass || 'bg-[#FAFAF8]'}
              border-[#EAECF0] focus:border-rr-gold/50 focus:ring-2 focus:ring-rr-gold/20`}
                        autoFocus
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-[0.5px]">Note Color</span>
                            <div className="flex items-center gap-2">
                                {NOTE_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setColor(c.value)}
                                        className={`w-7 h-7 rounded-full transition-all border-2 
                            ${color === c.value ? 'border-rr-navy scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-[#475467] hover:bg-[#F9FAFB] hover:text-rr-navy border border-transparent hover:border-[#D0D5DD] transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!content.trim()}
                                className="px-6 py-2.5 rounded-lg text-[13px] font-bold bg-rr-gold text-white shadow-sm hover:shadow-md hover:bg-[#B39345] disabled:opacity-50 disabled:cursor-not-allowed border border-[#B39345] transition-all"
                            >
                                Post Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Grid Display Area */}
            {showNotes && (
                <div className="bg-[#F6F5F2] border border-rr-border rounded-xl relative overflow-hidden shadow-inner" style={{ padding: '32px', minHeight: '400px' }}>
                    {/* Subtle corkboard grid pattern effect */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0F1923 1px, transparent 0)', backgroundSize: '24px 24px' }}
                    />

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full absolute inset-0 text-center">
                            <Loader2 size={24} className="text-rr-gold animate-spin mb-3" />
                            <p className="text-[13px] font-bold text-rr-text-muted">Loading noticeboard...</p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full absolute inset-0 text-center px-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-rr-border">
                                <StickyNote size={28} className="text-[#D0D5DD]" strokeWidth={1.5} />
                            </div>
                            <p className="text-[16px] font-bold text-rr-navy mb-1">Noticeboard is empty</p>
                            <p className="text-[13px] text-[#667085]">Post the first note for your team to see.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
                            {notes.map(note => (
                                <PostItNote
                                    key={note.id}
                                    note={note}
                                    canDelete={note.authorId === currentUser.id || currentUser.role === 'admin'}
                                    onDelete={handleDelete}
                                    onMarkRead={handleMarkRead}
                                    rotation={getRotation(note.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
