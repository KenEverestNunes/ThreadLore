import React from "react";

interface ThreadLoreIconProps {
  className?: string;
  size?: number;
}

export const ThreadLoreIcon: React.FC<ThreadLoreIconProps> = ({
  className = "h-8 w-8",
  size = 32,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
    >
      {/* Outer rounded container */}
      <rect width="64" height="64" rx="16" fill="#09090B" />

      {/* Subtle background loom harness lines */}
      <path
        d="M16 12v40M28 12v40M40 12v40M52 12v40"
        stroke="#27272A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 16h40M12 28h40M12 40h40M12 52h40"
        stroke="#27272A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Vertical Warp Threads (Indigo) */}
      <rect x="22" y="16" width="6" height="32" rx="3" fill="#6366F1" />
      <rect x="36" y="16" width="6" height="32" rx="3" fill="#4F46E5" />

      {/* Horizontal Weft Crossing Ribbons (Amber) */}
      <path d="M14 24h36" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 38h36" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />

      {/* Front interlacing crowns for 3D woven texture */}
      <rect x="22" y="21.5" width="6" height="5" rx="1.5" fill="#818CF8" />
      <rect x="36" y="35.5" width="6" height="5" rx="1.5" fill="#818CF8" />

      {/* Central Loom Shuttle Core */}
      <circle cx="32" cy="31" r="2.5" fill="#FBBF24" />
    </svg>
  );
};
