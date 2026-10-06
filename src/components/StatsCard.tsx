/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
type Tone = 'teal' | 'blue' | 'indigo' | 'amber' | 'rose' | 'purple' | 'slate';

interface StatsCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  tone?: Tone;
}

// ==========================================================
// TONE MAP — hoisted to module scope
// ==========================================================
const TONES: Record<Tone, { icon: string; value: string }> = {
  teal: { icon: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400', value: 'text-slate-900 dark:text-white' },
  blue: { icon: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400', value: 'text-slate-900 dark:text-white' },
  indigo: { icon: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400', value: 'text-slate-900 dark:text-white' },
  amber: { icon: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400', value: 'text-slate-900 dark:text-white' },
  rose: { icon: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400', value: 'text-slate-900 dark:text-white' },
  purple: { icon: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400', value: 'text-slate-900 dark:text-white' },
  slate: { icon: 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400', value: 'text-slate-900 dark:text-white' },
};

// ==========================================================
// MAIN
// ==========================================================
export const StatsCard: React.FC<StatsCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  description,
  trend,
  tone = 'teal',
}) => {
  const scheme = TONES[tone] || TONES.teal;

  return (
    <div
      id={id}
      className="bg-slate-100 dark:bg-zinc-900 rounded-3xl p-5"
    >
      {/* Header row: title + icon */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${scheme.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Value */}
      <p className={`text-3xl font-display font-extrabold tracking-tight tabular-nums leading-none ${scheme.value}`}>
        {value}
      </p>

      {/* Description + trend */}
      {(description || trend) && (
        <div className="flex items-baseline justify-between gap-2 mt-3">
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          )}
          {trend && (
            <p className={`text-[11px] font-bold flex-shrink-0 ${trend.positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
              }`}>
              {trend.value}
            </p>
          )}
        </div>
      )}
    </div>
  );
};