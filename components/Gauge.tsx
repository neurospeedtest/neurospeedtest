import React from 'react';

interface GaugeProps {
  value: number;
  label: string;
  max?: number;
  color?: string;
  isActive?: boolean;
}

export const Gauge: React.FC<GaugeProps> = ({ 
  value, 
  label, 
  max = 100, 
  color = "text-cyan-400",
  isActive = false
}) => {
  // Normalize value for display
  const displayValue = Math.min(value, max);
  const percent = displayValue / max;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference - (percent * circumference * 0.75); // 75% circle arc

  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-500 ${isActive ? 'opacity-100 scale-100 sm:scale-105' : 'opacity-60 scale-95 sm:scale-100'}`}>
      <div className="relative w-40 h-40 xs:w-48 xs:h-48 sm:w-64 sm:h-64">
        {/* Background Track */}
        <svg className="w-full h-full transform rotate-[135deg]" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25} // Leave 25% gap
            strokeLinecap="round"
            className="text-slate-800"
          />
          {/* Active Progress */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={Math.max(offset, circumference * 0.25)}
            strokeLinecap="round"
            className={`${color} transition-all duration-300 ease-out`}
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tighter ${color} tabular-nums`}>
            {value.toFixed(1)}
          </span>
          <span className="text-slate-400 text-xs sm:text-sm uppercase tracking-widest mt-1">Mbps</span>
        </div>
      </div>
      <h3 className="mt-2 sm:mt-4 text-lg sm:text-xl font-medium text-slate-200">{label}</h3>
    </div>
  );
};