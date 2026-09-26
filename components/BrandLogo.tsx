import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeMap = {
    sm: { dimension: 32, textClass: 'text-sm' },
    md: { dimension: 44, textClass: 'text-base' },
    lg: { dimension: 64, textClass: 'text-xl' },
    xl: { dimension: 88, textClass: 'text-2xl' }
  };

  const { dimension, textClass } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Red Circular Logo Badge */}
      <div 
        className="relative shrink-0 flex items-center justify-center rounded-full bg-[#E50914] shadow-md shadow-red-900/20 text-white font-bold transition-transform hover:scale-105"
        style={{ width: dimension, height: dimension }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[78%] h-[78%] text-white fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized VA / Vasthusilpy emblem matching the official badge */}
          {/* Left sweeping curve */}
          <path
            d="M 22 28 C 26 48, 38 68, 54 62 C 60 59, 62 48, 64 36 C 60 46, 52 54, 44 54 C 34 54, 28 42, 22 28 Z"
            fill="#FFFFFF"
          />
          {/* Right arch curve */}
          <path
            d="M 52 64 C 58 48, 70 28, 84 28 C 90 42, 94 56, 96 66 C 88 46, 78 38, 70 38 C 64 38, 58 48, 52 64 Z"
            fill="#FFFFFF"
          />
          {/* Center Vasthu bindu/dot */}
          <circle cx="73" cy="52" r="7" fill="#FFFFFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white font-sans ${textClass}`}>
            VASTHUSILPY
          </span>
          <span className="text-[10px] tracking-widest font-semibold text-red-600 dark:text-red-400 uppercase">
            KERALASSERY
          </span>
        </div>
      )}
    </div>
  );
};
