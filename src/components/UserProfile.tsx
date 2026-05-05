import { useState, useEffect, useCallback } from 'react';
import { User as UserIcon, Save, Key, Star, Clock, Loader2, Plus } from 'lucide-react';
import type { User, FeatureRequest } from '../types';
import { usersAPI, authAPI, featureRequestsAPI } from '../services/api';

interface UserProfileProps {
    currentUser: User;
    onUserUpdate: (user: User) => void;
}

const AVATAR_COLORS = ['#C5A44E', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#F59E0B', '#EF4444', '#10B981'];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
    submitted: { bg: 'bg-rr-info/15 border-rr-info/25', text: 'text-rr-info' },
    under_review: { bg: 'bg-rr-warning/15 border-rr-warning/25', text: 'text-rr-warning' },
    in_progress: { bg: 'bg-rr-gold/15 border-rr-gold/25', text: 'text-rr-gold' },
    completed: { bg: 'bg-rr-success/15 border-rr-success/25', text: 'text-rr-success' },
    declined: { bg: 'bg-rr-danger/15 border-rr-danger/25', text: 'text-rr-danger' },
};

export default function UserProfile({ currentUser, onUserUpdate }: UserProfileProps) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        displayName: currentUser.displayName,
        email: currentUser.email || '',
        jobTitle: currentUser.jobTitle || '',
        avatarColor: currentUser.avatarColor || '#C5A44E',
    });
    const [saving, setSaving] = useState(false);

    // Password change
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', newPw: '', confirm: '' });
    const [passwordMsg, setPasswordMsg] = useState('');

    // Feature request form
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestTitle, setRequestTitle] = useState('');
    const [requestDescription, setRequestDescription] = useState('');
    const [requests, setRequests] = useState<FeatureRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            const data = await featureRequestsAPI.list();
            setRequests(data.requests || []);
        } catch { setRequests([]); }
        finally { setLoadingRequests(false); }
    }, []);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await usersAPI.update(currentUser.id, form);
            onUserUpdate({ ...currentUser, ...form } as User);
            setEditing(false);
        } catch { /* handle error */ }
        finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPw !== passwordForm.confirm) {
            setPasswordMsg('Passwords do not match');
            return;
        }
        try {
            await authAPI.changePassword(passwordForm.current, passwordForm.newPw);
            setPasswordMsg('Password changed successfully');
            setPasswordForm({ current: '', newPw: '', confirm: '' });
            setTimeout(() => { setShowPasswordForm(false); setPasswordMsg(''); }, 2000);
        } catch (err) {
            setPasswordMsg(err instanceof Error ? err.message : 'Failed to change password');
        }
    };

    const handleSubmitRequest = async () => {
        if (!requestTitle.trim() || !requestDescription.trim()) return;
        try {
            await featureRequestsAPI.create({ title: requestTitle, description: requestDescription });
            setRequestTitle('');
            setRequestDescription('');
            setShowRequestForm(false);
            fetchRequests();
        } catch { /* handle error */ }
    };

    const initials = (currentUser.displayName || '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ maxWidth: 768, margin: "0 auto" }} className="animate-fade-in">
            {/* Profile Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: 14, padding: 28, marginBottom: 24 }}>
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-rr-navy"
                            style={{ backgroundColor: form.avatarColor }}
                        >
                            {initials}
                        </div>
                        {editing && (
                            <div className="flex gap-1 mt-3">
                                {AVATAR_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setForm(prev => ({ ...prev, avatarColor: c }))}
                                        className={`w-5 h-5 rounded-full transition-all ${form.avatarColor === c ? 'ring-2 ring-rr-gold scale-110' : 'opacity-50 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        {editing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={form.displayName}
                                    onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text focus:outline-none focus:border-rr-gold/50"
                                    placeholder="Display Name"
                                />
                                <input
                                    type="text"
                                    value={form.jobTitle}
                                    onChange={e => setForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text focus:outline-none focus:border-rr-gold/50"
                                    placeholder="Job Title"
                                />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text focus:outline-none focus:border-rr-gold/50"
                                    placeholder="Email"
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-rr-gold/15 text-rr-gold border border-rr-gold/25 hover:bg-rr-gold/25 disabled:opacity-40 transition-all">
                                        <Save size={12} />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-md text-xs text-rr-text-dim hover:text-rr-text transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold text-rr-text font-[family-name:var(--font-heading)]">
                                    {currentUser.displayName}
                                </h3>
                                <p className="text-sm text-rr-text-dim mt-0.5">{currentUser.jobTitle || 'No job title set'}</p>
                                <p className="text-xs text-rr-text-muted mt-1">{currentUser.email || 'No email set'}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-rr-gold/15 text-rr-gold border border-rr-gold/25">
                                        {currentUser.role}
                                    </span>
                                    <span className="text-[10px] text-rr-text-muted">@{currentUser.username}</span>
                                </div>
                                <button onClick={() => setEditing(true)} className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-rr-text-dim hover:text-rr-text border border-rr-border hover:border-rr-gold/30 transition-all">
                                    <UserIcon size={12} />
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: 14, padding: 28, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div className="flex items-center gap-2">
                        <Key size={14} style={{ color: "#C5A44E" }} />
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#0F1923" }}>Change Password</h4>
                    </div>
                    {!showPasswordForm && (
                        <button onClick={() => setShowPasswordForm(true)} className="text-xs text-rr-text-dim hover:text-rr-gold transition-colors">
                            Change
                        </button>
                    )}
                </div>
                {showPasswordForm && (
                    <div className="space-y-3">
                        <input type="password" placeholder="Current password" value={passwordForm.current} onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                            className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50" />
                        <input type="password" placeholder="New password" value={passwordForm.newPw} onChange={e => setPasswordForm(prev => ({ ...prev, newPw: e.target.value }))}
                            className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50" />
                        <input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                            className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50" />
                        {passwordMsg && <p className={`text-xs ${passwordMsg.includes('success') ? 'text-rr-success' : 'text-rr-danger'}`}>{passwordMsg}</p>}
                        <div className="flex gap-2">
                            <button onClick={handleChangePassword} className="px-4 py-1.5 rounded-md text-xs font-medium bg-rr-gold/15 text-rr-gold border border-rr-gold/25 hover:bg-rr-gold/25 transition-all">
                                Update Password
                            </button>
                            <button onClick={() => { setShowPasswordForm(false); setPasswordMsg(''); }} className="px-3 py-1.5 rounded-md text-xs text-rr-text-dim hover:text-rr-text transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Feature Requests */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: 14, padding: 28, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div className="flex items-center gap-2">
                        <Star size={14} style={{ color: "#C5A44E" }} />
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#0F1923" }}>My Feature Requests</h4>
                    </div>
                    <button
                        onClick={() => setShowRequestForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              bg-rr-gold/10 text-rr-gold border border-rr-gold/20 hover:bg-rr-gold/20 transition-all"
                    >
                        <Plus size={12} />
                        New Request
                    </button>
                </div>

                {/* Submit Form */}
                {showRequestForm && (
                    <div className="mb-4 p-4 rounded-lg bg-rr-bg-tertiary border border-rr-border animate-fade-in">
                        <input type="text" placeholder="Request title *" value={requestTitle} onChange={e => setRequestTitle(e.target.value)}
                            className="w-full px-3 py-2 mb-3 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50" />
                        <textarea placeholder="Describe the feature... *" value={requestDescription} onChange={e => setRequestDescription(e.target.value)}
                            className="w-full px-3 py-2 mb-3 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50 resize-none h-24" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowRequestForm(false)} className="px-3 py-1.5 rounded-md text-xs text-rr-text-dim hover:text-rr-text transition-colors">Cancel</button>
                            <button onClick={handleSubmitRequest} disabled={!requestTitle.trim() || !requestDescription.trim()} className="px-4 py-1.5 rounded-md text-xs font-medium bg-rr-gold/15 text-rr-gold border border-rr-gold/25 hover:bg-rr-gold/25 disabled:opacity-40 transition-all">
                                Submit Request
                            </button>
                        </div>
                    </div>
                )}

                {/* Request History */}
                {loadingRequests ? (
                    <div className="flex items-center justify-center h-20"><Loader2 size={16} className="text-rr-gold animate-spin" /></div>
                ) : requests.length === 0 ? (
                    <p className="text-xs text-rr-text-muted text-center py-6">No feature requests yet</p>
                ) : (
                    <div className="space-y-2">
                        {requests.map(req => {
                            const statusStyle = STATUS_BADGE[req.status] || STATUS_BADGE.submitted;
                            return (
                                <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg bg-rr-bg-tertiary border border-rr-border/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-rr-text">{req.title}</p>
                                        <p className="text-xs text-rr-text-muted mt-0.5 truncate">{req.description}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${statusStyle.bg} ${statusStyle.text}`}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-rr-text-muted flex items-center gap-1">
                                                <Clock size={9} />
                                                {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        {req.adminNotes && (
                                            <p className="text-xs text-rr-text-dim mt-2 p-2 rounded bg-rr-bg-tertiary border-l-2 border-rr-gold/40">
                                                <span className="font-semibold text-rr-gold">Admin:</span> {req.adminNotes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
