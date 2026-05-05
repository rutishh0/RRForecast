import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckSquare, Zap, Mail, Plus, Trash2, Clock, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import type { User, DashboardItem, DashboardSummary, DashboardPriority, ActiveView } from '../types';
import { dashboardAPI, messagesAPI } from '../services/api';

interface PersonalDashboardProps {
    currentUser: User;
    onViewChange: (view: ActiveView) => void;
}

type ItemType = 'deadline' | 'todo' | 'action_item' | 'meeting';

const TYPE_CONFIG = {
    deadline: { label: 'Approaching Deadlines', short: 'Deadlines', button: 'Add Deadline' },
    todo: { label: 'Open To-Dos', short: 'To-Dos', button: 'Add To-Do' },
    action_item: { label: 'Action Items', short: 'Action Items', button: 'Add Action' },
    meeting: { label: 'Upcoming Meetings', short: 'Meetings', button: 'Add Meeting' },
};

const PRIORITY_CONFIG = {
    critical: { label: "Critical", bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
    high: { label: "High", bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    medium: { label: "Medium", bg: "#E0E7FF", text: "#3730A3", dot: "#6366F1" },
    low: { label: "Low", bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    overdue: { label: "Overdue", bg: "#FEE2E2", text: "#991B1B" },
    pending: { label: "Pending", bg: "#FEF9C3", text: "#854D0E" },
    in_progress: { label: "In Progress", bg: "#DBEAFE", text: "#1E40AF" },
    completed: { label: "Completed", bg: "#DCFCE7", text: "#166534" },
};

export default function PersonalDashboard({ currentUser, onViewChange: _onViewChange }: PersonalDashboardProps) {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [items, setItems] = useState<Record<ItemType, DashboardItem[]>>({
        deadline: [], todo: [], action_item: [], meeting: [],
    });
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [activeTab, setActiveTab] = useState<ItemType>('deadline');
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<{ title: string; description: string; dueDate: string; priority: DashboardPriority }>({ title: '', description: '', dueDate: '', priority: 'medium' });
    const [loading, setLoading] = useState(true);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [loaded, setLoaded] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [summaryData, deadlines, todos, actionItems, meetings, msgCount] = await Promise.all([
                dashboardAPI.summary(),
                dashboardAPI.list('deadline'),
                dashboardAPI.list('todo'),
                dashboardAPI.list('action_item'),
                dashboardAPI.list('meeting'),
                messagesAPI.unreadCount(),
            ]);
            setSummary(summaryData);
            setItems({
                deadline: deadlines.items || [],
                todo: todos.items || [],
                action_item: actionItems.items || [],
                meeting: meetings.items || [],
            });
            setUnreadMessages(msgCount.count || 0);
        } catch {
            // Ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setLoaded(true), 100);
        fetchData();
        return () => clearTimeout(t);
    }, [fetchData]);

    const handleCreate = async () => {
        if (!formData.title.trim()) return;
        try {
            await dashboardAPI.create({
                itemType: activeTab,
                title: formData.title,
                description: formData.description || undefined,
                dueDate: formData.dueDate || undefined,
                priority: formData.priority,
            });
            setFormData({ title: '', description: '', dueDate: '', priority: 'medium' });
            setShowAddForm(false);
            fetchData();
        } catch { /* ignore */ }
    };

    const handleDelete = async (id: number) => {
        try {
            await dashboardAPI.delete(id);
            fetchData();
        } catch { /* ignore */ }
    };

    const handleToggleComplete = async (item: DashboardItem) => {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        try {
            await dashboardAPI.update(item.id, { status: newStatus });
            fetchData();
        } catch { /* ignore */ }
    };

    const kpis = [
        { label: "Approaching Deadlines", value: summary?.deadlinesApproaching ?? 0, icon: AlertTriangle, color: "#D4793C", bg: "rgba(212,121,60,0.08)", border: "rgba(212,121,60,0.2)" },
        { label: "Open To-Dos", value: summary?.todosPending ?? 0, icon: CheckSquare, color: "#3B82A0", bg: "rgba(59,130,160,0.08)", border: "rgba(59,130,160,0.2)" },
        { label: "Action Items", value: summary?.actionItemsPending ?? 0, icon: Zap, color: "#C5A44E", bg: "rgba(197,164,78,0.08)", border: "rgba(197,164,78,0.2)" },
        { label: "Upcoming Meetings", value: summary?.meetingsUpcoming ?? 0, icon: Calendar, color: "#6B7F5E", bg: "rgba(107,127,94,0.08)", border: "rgba(107,127,94,0.2)" },
        { label: "Unread Messages", value: unreadMessages, icon: Mail, color: "#7C6DAF", bg: "rgba(124,109,175,0.08)", border: "rgba(124,109,175,0.2)" },
    ];

    const currentItems = items[activeTab] || [];

    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease both' }}>
                    <Clock size={24} color="#C5A44E" style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 13, color: '#8B9AB5' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

            {/* Welcome Section */}
            <div style={{
                marginBottom: 32,
                animation: loaded ? "fadeUp 0.5s ease both" : "none",
            }}>
                <h2 style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 30,
                    fontWeight: 500,
                    color: "#0F1923",
                    lineHeight: 1.2,
                    marginBottom: 4,
                }}>
                    Welcome back, <span style={{ fontWeight: 700, fontStyle: "italic" }}>{currentUser.displayName.split(' ')[0]}</span>
                </h2>
                <p style={{
                    fontSize: 13.5,
                    color: "#8B9AB5",
                    fontWeight: 400,
                }}>Here's your operational overview for today</p>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 16,
                marginBottom: 36,
            }}>
                {kpis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.label}
                            style={{
                                background: "#FFFFFF",
                                borderRadius: 12,
                                padding: "22px 20px 20px",
                                border: `1px solid ${kpi.border}`,
                                position: "relative",
                                overflow: "hidden",
                                animation: loaded ? `fadeUp 0.4s ease ${0.1 + i * 0.08}s both` : "none",
                                cursor: "default",
                                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = `0 8px 24px ${kpi.border}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <div style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${kpi.color}, transparent)`,
                                borderRadius: "12px 12px 0 0",
                            }} />

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 14,
                            }}>
                                <div style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 8,
                                    background: kpi.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: kpi.color,
                                }}>
                                    <Icon size={16} strokeWidth={1.8} />
                                </div>
                                <ChevronRight size={16} strokeWidth={2} color="#CBD5E0" />
                            </div>

                            <div style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: "#0F1923",
                                lineHeight: 1,
                                marginBottom: 6,
                                fontFeatureSettings: "'tnum'",
                            }}>{kpi.value}</div>

                            <div style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#8B9AB5",
                                letterSpacing: "0.3px",
                                lineHeight: 1.3,
                            }}>{kpi.label}</div>
                        </div>
                    );
                })}
            </div >

            {/* Main Content Card - Tabs and Data */}
            < div style={{
                background: "#FFFFFF",
                borderRadius: 14,
                border: "1px solid #E8E5DF",
                overflow: "hidden",
                animation: loaded ? "fadeUp 0.5s ease 0.5s both" : "none",
            }
            }>

                {/* Tab Bar Container */}
                < div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px",
                    borderBottom: "1px solid #F0EDE8",
                }}>

                    <div style={{ display: "flex", gap: 0 }}>
                        {(Object.keys(TYPE_CONFIG) as ItemType[]).map((type) => {
                            const isActive = activeTab === type;
                            const count = items[type]?.length ?? 0;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setActiveTab(type)}
                                    style={{
                                        padding: "16px 20px",
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 450,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        color: isActive ? "#0F1923" : "#8B9AB5",
                                        position: "relative",
                                        transition: "color 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    {TYPE_CONFIG[type].short}
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        padding: "2px 7px",
                                        borderRadius: 8,
                                        background: isActive ? "rgba(15,25,35,0.06)" : "rgba(139,154,181,0.1)",
                                        color: isActive ? "#0F1923" : "#8B9AB5",
                                    }}>{count}</span>
                                    {isActive && (
                                        <div style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 20,
                                            right: 20,
                                            height: 2,
                                            background: "#C5A44E",
                                            borderRadius: "2px 2px 0 0",
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => { setShowAddForm(true); setFormData({ title: '', description: '', dueDate: '', priority: 'medium' }); }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 18px",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: 600,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: "#0F1923",
                            background: "linear-gradient(135deg, #C5A44E, #D4B96A)",
                            boxShadow: "0 2px 8px rgba(197,164,78,0.25)",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        {TYPE_CONFIG[activeTab].button}
                    </button>
                </div >

                {/* Action Form */}
                {
                    showAddForm && (
                        <div style={{
                            padding: "24px",
                            background: "#FAFAF8",
                            borderBottom: "1px solid #F0EDE8",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                        }}>
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                maxWidth: 800,
                            }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0F1923", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                    Add New {TYPE_CONFIG[activeTab].short}
                                </h4>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 16,
                                }}>
                                    <input
                                        type="text"
                                        placeholder="Title *"
                                        value={formData.title}
                                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                        style={{ gridColumn: "span 2", padding: "10px 16px", borderRadius: 8, fontSize: 13, background: "#FFFFFF", border: "1px solid #E8E5DF", color: "#0F1923", outline: "none" }}
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description (optional)"
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        style={{ gridColumn: "span 2", padding: "10px 16px", borderRadius: 8, fontSize: 13, background: "#FFFFFF", border: "1px solid #E8E5DF", color: "#0F1923", outline: "none" }}
                                    />
                                    <input
                                        type="datetime-local"
                                        value={formData.dueDate}
                                        onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                                        style={{ padding: "10px 16px", borderRadius: 8, fontSize: 13, background: "#FFFFFF", border: "1px solid #E8E5DF", color: "#0F1923", outline: "none" }}
                                    />
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData(p => ({ ...p, priority: e.target.value as DashboardPriority }))}
                                        style={{ padding: "10px 16px", borderRadius: 8, fontSize: 13, background: "#FFFFFF", border: "1px solid #E8E5DF", color: "#0F1923", cursor: "pointer", outline: "none" }}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!formData.title.trim()}
                                        style={{ padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#0F1923", color: "#FFFFFF", border: "none", cursor: formData.title.trim() ? "pointer" : "not-allowed", opacity: formData.title.trim() ? 1 : 0.5 }}
                                    >
                                        Save Item
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        style={{ padding: "10px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475467", background: "transparent", border: "none", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Table Header Row */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 110px 120px 100px 110px 36px",
                    padding: "12px 24px",
                    background: "#FAFAF8",
                    borderBottom: "1px solid #F0EDE8",
                }}>
                    {[TYPE_CONFIG[activeTab].short, "Type", "Due Date", "Priority", "Status", ""].map(h => (
                        <div key={h} style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#8B9AB5",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}>{h}</div>
                    ))}
                </div>

                {/* List Content */}
                <div style={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
                    {currentItems.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, textAlign: "center", background: "#FFFFFF", animation: loaded ? "fadeIn 0.5s ease both" : "none" }}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                                <CheckSquare size={20} color="#D0D5DD" strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F1923", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No items found</p>
                            <p style={{ fontSize: 13, color: "#667085", marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>You don't have any {TYPE_CONFIG[activeTab].label.toLowerCase()} right now.</p>
                        </div>
                    ) : (
                        currentItems.map((item, idx) => {
                            const pConfig = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
                            const sConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                            const isHovered = hoveredRow === item.id;

                            return (
                                <div
                                    key={item.id}
                                    onMouseEnter={() => setHoveredRow(item.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    onClick={() => handleToggleComplete(item)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 110px 120px 100px 110px 36px",
                                        padding: "16px 24px",
                                        borderBottom: "1px solid #F7F5F2",
                                        background: isHovered ? "#FDFCFA" : "transparent",
                                        cursor: "pointer",
                                        transition: "background 0.15s ease",
                                        animation: loaded ? `fadeUp 0.35s ease ${0.6 + idx * 0.06}s both` : "none",
                                        alignItems: "center",
                                    }}
                                >
                                    <div style={{ paddingRight: 16 }}>
                                        <div style={{
                                            fontSize: 13.5,
                                            fontWeight: 500,
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            color: item.status === 'completed' ? "#8B9AB5" : "#0F1923",
                                            lineHeight: 1.4,
                                            marginBottom: 3,
                                            textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                                        }}>{item.title}</div>
                                        <div style={{
                                            fontSize: 11,
                                            color: "#8B9AB5",
                                            fontFamily: "monospace",
                                            letterSpacing: "0.3px",
                                        }}>{item.description || 'ESN-Pending'}</div>
                                    </div>

                                    <div style={{
                                        fontSize: 12.5,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        fontWeight: 500,
                                        color: "#5A6474",
                                    }}>
                                        {activeTab === 'meeting' ? 'Meeting' : item.description?.includes('Trent') ? item.description.split('-')[0] : 'General'}
                                    </div>

                                    <div style={{
                                        fontSize: 12.5,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        fontWeight: 500,
                                        color: item.status === "overdue" ? "#DC2626" : "#5A6474",
                                    }}>{formatDate(item.dueDate)}</div>

                                    <div>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            gap: 5,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            borderRadius: 6,
                                            background: pConfig.bg,
                                            color: pConfig.text,
                                        }}>
                                            <span style={{
                                                width: 5,
                                                height: 5,
                                                borderRadius: "50%",
                                                background: pConfig.dot,
                                            }} />
                                            {pConfig.label}
                                        </span>
                                    </div>

                                    <div>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            gap: 4,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "4px 10px",
                                            borderRadius: 6,
                                            background: sConfig.bg,
                                            color: sConfig.text,
                                        }}>
                                            {item.status === 'completed' && <Check size={10} color={sConfig.text} strokeWidth={3} />}
                                            {sConfig.label}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        opacity: isHovered ? 1 : 0,
                                        transition: "opacity 0.15s ease",
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#DC2626" }}
                                            title="Delete Item"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div >
            </div >
        </>
    );
}
