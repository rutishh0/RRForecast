import React from 'react';

interface HudTimerProps {
  seconds: number;
  totalSeconds: number;
  size?: number;
}

export const HudTimer: React.FC<HudTimerProps> = ({
  seconds,
  totalSeconds = 15,
  size = 72,
}) => {
  const isUrgent = seconds <= 5 && seconds > 0;
  const isZero = seconds === 0;
  const radius = size * 0.42;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;

  // Fraction remaining
  const fraction = totalSeconds > 0 ? Math.max(0, Math.min(1, seconds / totalSeconds)) : 0;
  const strokeDashoffset = circumference - fraction * circumference;

  const strokeColor = isZero
    ? '#ff1744'
    : isUrgent
    ? '#ff9100'
    : '#00e5ff';

  const glowClass = isZero
    ? 'glow-rose'
    : isUrgent
    ? 'glow-amber animate-pulse'
    : 'glow-cyan';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#0d1522]/90 border border-[#1e314f] ${glowClass}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e314f"
          strokeWidth={strokeWidth}
          opacity="0.6"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-linear"
        />
      </svg>

      {/* Central Numeric Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        <span
          className={`font-telemetry font-black leading-none ${
            size > 60 ? 'text-2xl' : 'text-base'
          } ${
            isZero
              ? 'text-[#ff1744]'
              : isUrgent
              ? 'text-[#ff9100]'
              : 'text-[#f0f4f8]'
          }`}
        >
          {seconds}
        </span>
        {size >= 64 && (
          <span className="text-[9px] uppercase tracking-widest text-[#829ab1] font-mono mt-0.5">
            SEC
          </span>
        )}
      </div>
    </div>
  );
};
