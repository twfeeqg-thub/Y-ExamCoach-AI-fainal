'use client';

import React from 'react';

type ProgressColor = 'auto' | 'emerald' | 'amber' | 'rose' | 'blue';

interface ParentProgressBarProps {
  value: number;
  max?: number;
  color?: ProgressColor;
  className?: string;
}

/**
 * Reusable mastery progress bar. Defaults to the adaptive color rules used
 * across the app: emerald >= 80%, amber 50–79%, rose < 50%.
 */
export const ParentProgressBar: React.FC<ParentProgressBarProps> = ({
  value,
  max = 100,
  color = 'auto',
  className = '',
}) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  let fill = 'bg-blue-600';
  if (color === 'emerald') fill = 'bg-emerald-500';
  else if (color === 'amber') fill = 'bg-amber-500';
  else if (color === 'rose') fill = 'bg-rose-500';
  else if (color === 'blue') fill = 'bg-blue-600';
  else if (color === 'auto') {
    fill = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  }

  return (
    <div className={`h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${fill} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default ParentProgressBar;