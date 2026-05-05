import {
  Database, Activity, Clock, PauseCircle, CheckCircle,
  TrendingUp, Calendar, Cog, Plane, AlertTriangle
} from 'lucide-react';
import type { KPIData } from '../types';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  database: Database,
  activity: Activity,
  clock: Clock,
  'pause-circle': PauseCircle,
  'check-circle': CheckCircle,
  'trending-up': TrendingUp,
  calendar: Calendar,
  cog: Cog,
  plane: Plane,
  'alert-triangle': AlertTriangle,
};

const COLOR_MAP: Record<string, { accent: string; iconBg: string; text: string }> = {
  gold: { accent: '#C5A44E', iconBg: 'bg-rr-gold/10', text: 'text-rr-gold' },
  success: { accent: '#166534', iconBg: 'bg-rr-success/10', text: 'text-rr-success' },
  warning: { accent: '#D97706', iconBg: 'bg-rr-warning/10', text: 'text-rr-warning' },
  danger: { accent: '#DC2626', iconBg: 'bg-rr-danger/10', text: 'text-rr-danger' },
  info: { accent: '#1E40AF', iconBg: 'bg-rr-info/10', text: 'text-rr-info' },
  default: { accent: '#8B9AB5', iconBg: 'bg-rr-bg-tertiary', text: 'text-rr-text-dim' },
};

export default function KPICard({ label, value, subtitle, color = 'default', icon }: KPIData) {
  const colors = COLOR_MAP[color] || COLOR_MAP.default;
  const IconComp = icon ? ICONS[icon] : null;

  return (
    <div className="rr-card relative p-[17px] transition-all duration-300 overflow-hidden cursor-default group"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      {/* Top Gradient Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
        style={{ background: `linear-gradient(90deg, ${colors.accent}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[9.5px] uppercase tracking-wider text-rr-text-muted font-bold mb-1.5">
            {label}
          </p>
          <p className={`text-[24px] font-semibold font-[family-name:var(--font-heading)] leading-none text-rr-navy mb-1.5 group-hover:scale-[1.02] origin-left transition-transform duration-300`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10.5px] text-rr-text-muted font-medium">{subtitle}</p>
          )}
        </div>

        {IconComp && (
          <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-xl ${colors.iconBg} shrink-0 ml-4`}>
            <IconComp size={17} strokeWidth={1.5} className={colors.text} />
          </div>
        )}
      </div>
    </div>
  );
}
