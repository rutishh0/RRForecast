import { X, Pin } from 'lucide-react';
import type { PostitNote as PostItNoteType } from '../types';

interface PostItNoteProps {
    note: PostItNoteType;
    canDelete: boolean;
    onDelete: (id: number) => void;
    onMarkRead: (id: number) => void;
    rotation?: number;
}

// Light theme adjusted vibrant pastel colors with subtle borders
const NOTE_COLORS: Record<string, { bg: string; border: string; text: string; pin: string; accent: string }> = {
    '#FBBF24': { bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]', text: 'text-[#92400E]', pin: 'text-[#F59E0B]', accent: 'bg-[#F59E0B]' }, // Amber
    '#34D399': { bg: 'bg-[#D1FAE5]', border: 'border-[#A7F3D0]', text: 'text-[#065F46]', pin: 'text-[#10B981]', accent: 'bg-[#10B981]' }, // Emerald
    '#60A5FA': { bg: 'bg-[#DBEAFE]', border: 'border-[#BFDBFE]', text: 'text-[#1E40AF]', pin: 'text-[#3B82F6]', accent: 'bg-[#3B82F6]' }, // Blue
    '#F472B6': { bg: 'bg-[#FCE7F3]', border: 'border-[#FBCFE8]', text: 'text-[#9D174D]', pin: 'text-[#EC4899]', accent: 'bg-[#EC4899]' }, // Pink
    '#A78BFA': { bg: 'bg-[#EDE9FE]', border: 'border-[#DDD6FE]', text: 'text-[#5B21B6]', pin: 'text-[#8B5CF6]', accent: 'bg-[#8B5CF6]' }, // Violet
};

export default function PostItNote({ note, canDelete, onDelete, onMarkRead, rotation = 0 }: PostItNoteProps) {
    const colors = NOTE_COLORS[note.color || ''] || NOTE_COLORS['#FBBF24'];
    const isUnread = !note.isRead;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const handleClick = () => {
        if (isUnread) onMarkRead(note.id);
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative p-5 rounded-sm ${colors.bg} border ${colors.border}
        cursor-default transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:z-30
        shadow-[0_4px_12px_rgba(0,0,0,0.06)] 
        before:content-[""] before:absolute before:bottom-0 before:right-0 before:border-[16px] before:border-transparent before:border-r-black/5 before:border-b-black/5 before:rounded-bl-sm
        ${isUnread ? `ring-2 ring-offset-2 ring-offset-[#F6F5F2] ring-[${colors.pin}]` : ''}`}
            style={{
                transform: `rotate(${rotation}deg)`,
                // Realistic sticky note curling effect via box-shadow
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -10px rgba(0,0,0,0.1)'
            }}
        >
            {/* Decorative Pin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-sm z-10 pointer-events-none">
                <Pin size={18} fill="currentColor" className={`${colors.pin} rotate-[-20deg] opacity-90`} />
            </div>

            {/* Unread indicator */}
            {isUnread && (
                <div className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full ${colors.accent} animate-pulse shadow-sm`} />
            )}

            {/* Delete button */}
            {canDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full
            bg-white/50 text-[#475467] hover:text-[#DC2626] hover:bg-white shadow-sm transition-all"
                >
                    <X size={12} strokeWidth={2.5} />
                </button>
            )}

            {/* Content */}
            <p className={`text-[14px] font-medium leading-[1.6] ${colors.text} mb-6 mt-2 whitespace-pre-wrap font-sans`}>
                {note.content}
            </p>

            {/* Author/Footer */}
            <div className={`flex items-center gap-2.5 pt-3 border-t border-black/5`}>
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm border border-white/40"
                    style={{ backgroundColor: note.author?.avatarColor || '#1E40AF' }}
                >
                    {getInitials(note.author?.displayName || 'Unknown')}
                </div>
                <div className="flex flex-col">
                    <span className={`text-[11px] font-bold ${colors.text} opacity-90 leading-tight`}>
                        {note.author?.displayName || 'Unknown'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.5px] ${colors.text} opacity-60 leading-tight`}>
                        {new Date(note.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                </div>
            </div>
        </div>
    );
}
