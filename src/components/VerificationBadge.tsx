/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Clock, ShieldAlert, Shield } from 'lucide-react';
import { VerificationStatus } from '../types';

// ==========================================================
// TYPES
// ==========================================================
interface VerificationBadgeProps {
  status: VerificationStatus;
  /** Show the text label next to the icon. Default: true */
  showText?: boolean;
  /** Optional size variant. Default: 'md' */
  size?: 'sm' | 'md';
}

// ==========================================================
// CONFIG — hoisted to module scope
// ==========================================================
interface BadgeConfig {
  icon: typeof ShieldCheck;
  label: string;
  classes: string;
}

const BADGE_CONFIG: Record<'verified' | 'pending' | 'rejected' | 'unverified', BadgeConfig> = {
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  },
  rejected: {
    icon: ShieldAlert,
    label: 'Declined',
    classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
  },
  unverified: {
    icon: Shield,
    label: 'Unverified',
    classes: 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400',
  },
};

// ==========================================================
// MAIN
// ==========================================================
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  showText = true,
  size = 'md',
}) => {
  const key = (status === 'verified' || status === 'pending' || status === 'rejected')
    ? status
    : 'unverified';

  const { icon: Icon, label, classes } = BADGE_CONFIG[key];

  // Icon-only → just a small circle. No padding, no background ring.
  if (!showText) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full ${classes}`}
        title={label}
        aria-label={label}
      >
        <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      </span>
    );
  }

  // Text version
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${classes} ${sizeClasses}`}
      aria-label={label}
    >
      <Icon className={iconSize} />
      <span>{label}</span>
    </span>
  );
};