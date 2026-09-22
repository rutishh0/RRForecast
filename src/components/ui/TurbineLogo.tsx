import React from 'react';

interface TurbineLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const TurbineLogo: React.FC<TurbineLogoProps> = ({
  className = '',
  size = 36,
  animate = true,
}) => {
  const bladeCount = 18;
  const blades = Array.from({ length: bladeCount }, (_, i) => i);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full ${animate ? 'animate-[spin_12s_linear_infinite]' : ''}`}
      >
        {/* Outer Casing Ring */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="#1e314f"
          strokeWidth="3"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.6"
        />

        {/* 18 Titanium Wide-Chord Swept Fan Blades */}
        <g transform="translate(50, 50)">
          {blades.map((i) => {
            const angle = (i * 360) / bladeCount;
            return (
              <path
                key={i}
                d="M 0 0 C 4 -12, 10 -26, 7 -43 C 3 -44, -3 -42, -5 -38 C -4 -25, -2 -12, 0 0 Z"
                fill="url(#titaniumBladeGrad)"
                stroke="#00e5ff"
                strokeWidth="0.5"
                transform={`rotate(${angle})`}
                opacity="0.9"
              />
            );
          })}
        </g>

        {/* Aerodynamic Spinner Cone with Spiral Swirl */}
        <circle cx="50" cy="50" r="14" fill="#0d1522" stroke="#1e314f" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="7" fill="#0066ff" opacity="0.8" />
        <path
          d="M 50 50 Q 56 46, 52 40 Q 44 42, 47 48 Q 50 52, 50 50 Z"
          fill="#f0f4f8"
          opacity="0.9"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="titaniumBladeGrad" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#1e314f" />
            <stop offset="60%" stopColor="#829ab1" />
            <stop offset="100%" stopColor="#f0f4f8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
