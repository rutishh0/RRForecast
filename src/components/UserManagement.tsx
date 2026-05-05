import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Shield, ShieldCheck, User as UserIcon, Loader2, AlertTriangle, Check, X } from 'lucide-react';
import type { User, Role } from '../types';
import { usersAPI, authAPI } from '../services/api';

interface UserManagementProps {
    currentUser: User;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; badge: string }> = {
    admin: { label: 'Admin', icon: ShieldCheck, color: 'text-rr-gold', badge: 'bg-rr-gold/15 text-rr-gold border-rr-gold/25' },
    manager: { label: 'Manager', icon: Shield, color: 'text-rr-info', badge: 'bg-rr-info/15 text-rr-info border-rr-info/25' },
    user: { label: 'User', icon: UserIcon, color: 'text-rr-text-dim', badge: 'bg-rr-steel text-rr-text-dim border-rr-border' },
};

export default function UserManagement({ currentUser }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Add form
    const [form, setForm] = useState<{
        username: string;
        password: string;
        displayName: string;
        role: Role;
        jobTitle: string;
        email: string;
    }>({
        username: '',
        password: '',
        displayName: '',
        role: 'user',
        jobTitle: '',
        email: '',
    });
    const [creating, setCreating] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const data = await usersAPI.list();
            setUsers(data.users || []);
        } catch { setUsers([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleCreate = async () => {
        if (!form.username.trim() || !form.password.trim() || !form.displayName.trim()) {
            setError('Username, password, and display name are required');
            return;
        }
        setCreating(true);
        setError('');
        try {
            await authAPI.register({
                username: form.username.trim(),
                password: form.password,
                displayName: form.displayName.trim(),
                role: form.role,
                jobTitle: form.jobTitle.trim() || undefined,
                email: form.email.trim() || undefined,
            });
            setSuccess(`User "${form.displayName}" created successfully`);
            setForm({ username: '', password: '', displayName: '', role: 'user', jobTitle: '', email: '' });
            setShowAddForm(false);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (user.id === currentUser.id) {
            setError('Cannot delete your own account');
            return;
        }
        setDeletingId(user.id);
        setError('');
        try {
            await usersAPI.delete(user.id);
            setSuccess(`User "${user.displayName}" has been deactivated`);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (currentUser.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center rr-card p-8">
                    <AlertTriangle size={32} className="text-rr-warning mx-auto mb-3" />
                    <p className="text-sm text-rr-text">Admin access required</p>
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
        <div style={{ maxWidth: 960, margin: "0 auto" }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: '28px' }}>
                <div>
                    <h3 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 24,
                        fontWeight: 600,
                        color: "#0F1923",
                        lineHeight: 1.2,
                        marginBottom: 4,
                    }}>User Management</h3>
                    <p style={{ fontSize: 12, color: "#8B9AB5", fontWeight: 500 }}>{users.length} active user{users.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => { setShowAddForm(true); setError(''); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium
            bg-rr-gold/10 text-rr-gold border border-rr-gold/20 hover:bg-rr-gold/20 transition-all duration-200"
                >
                    <Plus size={14} />
                    Add User
                </button>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="p-3 rr-card border-rr-danger/30 bg-rr-danger/5 flex items-center gap-2">
                    <X size={14} className="text-rr-danger flex-shrink-0" />
                    <p className="text-xs text-rr-danger">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-rr-danger hover:text-rr-text transition-colors">
                        <X size={12} />
                    </button>
                </div>
            )}
            {success && (
                <div className="p-3 rr-card border-rr-success/30 bg-rr-success/5 flex items-center gap-2">
                    <Check size={14} className="text-rr-success flex-shrink-0" />
                    <p className="text-xs text-rr-success">{success}</p>
                </div>
            )}

            {/* Add User Form */}
            {showAddForm && (
                <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: 14, padding: '24px', marginBottom: '24px' }} className="animate-fade-in">
                    <h4 className="text-sm font-semibold text-rr-text mb-4 flex items-center gap-2">
                        <Plus size={14} className="text-rr-gold" />
                        Create New User
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-[10px] text-rr-text-muted uppercase tracking-wider mb-1">Username *</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50"
                                placeholder="e.g. john"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-rr-text-muted uppercase tracking-wider mb-1">Password *</label>
                            <input
                                type="text"
                                value={form.password}
                                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50"
                                placeholder="Initial password"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-rr-text-muted uppercase tracking-wider mb-1">Display Name *</label>
                            <input
                                type="text"
                                value={form.displayName}
                                onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50"
                                placeholder="e.g. John Smith"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-rr-text-muted uppercase tracking-wider mb-1">Role *</label>
                            <select
                                value={form.role}
                                onChange={e => setForm(prev => ({ ...prev, role: e.target.value as Role }))}
                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text focus:outline-none focus:border-rr-gold/50"
                            >
                                <option value="user">User</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-rr-text-muted uppercase tracking-wider mb-1">Job Title</label>
                            <input
                                type="text"
                                value={form.jobTitle}
                                onChange={e => setForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50"
                                placeholder="e.g. Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-rr-text-muted uppercase tracking-wider mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 rounded-md text-sm bg-rr-bg-secondary border border-rr-border text-rr-text placeholder-rr-text-muted focus:outline-none focus:border-rr-gold/50"
                                placeholder="e.g. john@company.com"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowAddForm(false); setError(''); }} className="px-4 py-2 rounded-md text-xs text-rr-text-dim hover:text-rr-text transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating || !form.username.trim() || !form.password.trim() || !form.displayName.trim()}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-md text-xs font-semibold
                bg-rr-gold/15 text-rr-gold border border-rr-gold/25 hover:bg-rr-gold/25
                disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            {creating ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E5DF", borderRadius: 14, overflow: "hidden", marginBottom: '24px' }}>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-rr-border">
                            <th className="text-left px-5 py-3 text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider">User</th>
                            <th className="text-left px-5 py-3 text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider">Username</th>
                            <th className="text-left px-5 py-3 text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider">Role</th>
                            <th className="text-left px-5 py-3 text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider">Job Title</th>
                            <th className="text-right px-5 py-3 text-[10px] font-semibold text-rr-text-muted uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
                            const RoleIcon = roleConfig.icon;
                            const isCurrentUser = user.id === currentUser.id;
                            const isDeleting = deletingId === user.id;

                            return (
                                <tr key={user.id} className="border-b border-rr-border/50 hover:bg-rr-bg-tertiary transition-colors">
                                    {/* Avatar + Name */}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-rr-navy flex-shrink-0"
                                                style={{ backgroundColor: user.avatarColor || '#C5A44E' }}
                                            >
                                                {getInitials(user.displayName)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-rr-text">
                                                    {user.displayName}
                                                    {isCurrentUser && <span className="ml-1.5 text-[9px] text-rr-gold">(You)</span>}
                                                </p>
                                                {user.email && <p className="text-[10px] text-rr-text-muted">{user.email}</p>}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Username */}
                                    <td className="px-5 py-3">
                                        <span className="text-xs text-rr-text-dim font-mono">@{user.username}</span>
                                    </td>

                                    {/* Role */}
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${roleConfig.badge}`}>
                                            <RoleIcon size={10} />
                                            {roleConfig.label}
                                        </span>
                                    </td>

                                    {/* Job Title */}
                                    <td className="px-5 py-3">
                                        <span className="text-xs text-rr-text-dim">{user.jobTitle || '—'}</span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-3 text-right">
                                        {!isCurrentUser ? (
                                            <button
                                                onClick={() => handleDelete(user)}
                                                disabled={isDeleting}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium
                          text-rr-text-muted hover:text-rr-danger hover:bg-rr-danger/10 border border-transparent hover:border-rr-danger/20
                          disabled:opacity-40 transition-all"
                                            >
                                                {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                                {isDeleting ? 'Removing...' : 'Remove'}
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-rr-text-muted italic">Current user</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="py-12 text-center">
                        <Users size={24} className="text-rr-text-muted mx-auto mb-2" />
                        <p className="text-xs text-rr-text-dim">No users found</p>
                    </div>
                )}
            </div>

            {/* Help text */}
            <div className="text-center">
                <p className="text-[10px] text-rr-text-muted">
                    Removing a user deactivates their account. Their data is preserved but they can no longer log in.
                </p>
            </div>
        </div>
    );
}
