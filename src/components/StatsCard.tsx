/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  id: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'teal' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'indigo'
}) => {
  const colorMaps = {
    indigo: {
      bg: 'bg-indigo-50/30',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100/20',
      border: 'border-indigo-100/25',
    },
    teal: {
      bg: 'bg-teal-50/50',
      iconBg: 'bg-teal-100 text-teal-700',
      border: 'border-teal-100/40',
    },
    blue: {
      bg: 'bg-blue-50/50',
      iconBg: 'bg-blue-100 text-blue-700',
      border: 'border-blue-100/40',
    },
    purple: {
      bg: 'bg-purple-50/50',
      iconBg: 'bg-purple-100 text-purple-700',
      border: 'border-purple-100/40',
    },
    amber: {
      bg: 'bg-amber-50/50',
      iconBg: 'bg-amber-100 text-amber-700',
      border: 'border-amber-100/40',
    },
    rose: {
      bg: 'bg-rose-50/50',
      iconBg: 'bg-rose-100 text-rose-700',
      border: 'border-rose-100/40',
    }
  };

  const scheme = colorMaps[color] || colorMaps.indigo;

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <h4 className="mt-2 text-3xl font-display font-bold tracking-tight text-slate-900">{value}</h4>
        </div>
        <div className={`rounded-2xl p-3 ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium font-sans">{description}</span>
        {trend && (
          <span className={`font-mono font-bold rounded-lg px-2 py-0.5 ${trend.positive ? 'text-indigo-700 bg-indigo-50/60' : 'text-slate-600 bg-slate-100'}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
