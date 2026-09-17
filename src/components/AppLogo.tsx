import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
}

export function AppLogo({
  className = 'w-6 h-6',
  size,
}: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      aria-label="List Flow Logo"
    >
      <defs>
        <linearGradient id="app-logo-short-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#28baa7" />
          <stop offset="60%" stopColor="#1ea696" />
          <stop offset="100%" stopColor="#148578" />
        </linearGradient>

        <linearGradient id="app-logo-long-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0a544c" />
          <stop offset="25%" stopColor="#116e64" />
          <stop offset="65%" stopColor="#199083" />
          <stop offset="100%" stopColor="#25ad9b" />
        </linearGradient>
      </defs>

      <g transform="translate(252, 265) rotate(-45)">
        {/* Short Arm (Left Piece) */}
        <rect
          x="-94"
          y="-179.5"
          width="104"
          height="120"
          rx="32"
          ry="32"
          fill="url(#app-logo-short-grad)"
        />

        {/* Long Arm + Vertex (Right Piece) */}
        <rect
          x="-94"
          y="-52"
          width="296"
          height="104"
          rx="32"
          ry="32"
          fill="url(#app-logo-long-grad)"
        />
      </g>
    </svg>
  );
};
