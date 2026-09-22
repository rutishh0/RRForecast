import React from 'react';

interface StatBarProps {
  label: string;
  value: number; // 0 to 100
  color?: 'cyan' | 'amber' | 'emerald' | 'rose' | 'blue';
  subText?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  color = 'cyan',
  subText,
}) => {
  const colorMap = {
    cyan: 'bg-[#00e5ff]',
    amber: 'bg-[#ff9100]',
    emerald: 'bg-[#00e676]',
    rose: 'bg-[#ff1744]',
    blue: 'bg-[#0066ff]',
  };

  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex items-center justify-between text-[#829ab1]">
        <span className="font-bold tracking-wider uppercase">{label}</span>
        <span className="text-[#f0f4f8] font-telemetry font-bold">{Math.round(value)}%</span>
      </div>
      <div className="h-2 w-full bg-[#06090e] rounded-full overflow-hidden border border-[#1e314f] p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {subText && <div className="text-[10px] text-[#829ab1] italic">{subText}</div>}
    </div>
  );
};
