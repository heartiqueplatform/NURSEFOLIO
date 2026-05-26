/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Clock, ShieldAlert, Shield } from 'lucide-react';
import { VerificationStatus } from '../types';

interface VerificationBadgeProps {
  status: VerificationStatus;
  showText?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, showText = true }) => {
  if (status === 'verified') {
    return (
      <div id="badge-verified" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-medium text-xs transition-colors">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
        {showText && <span>Verified Professional</span>}
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div id="badge-pending" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 font-medium text-xs transition-colors">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 animate-pulse" />
        {showText && <span>Verification Pending</span>}
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div id="badge-rejected" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 font-medium text-xs transition-colors">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500" />
        {showText && <span>Verification Declined</span>}
      </div>
    );
  }

  return (
    <div id="badge-unverified" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium text-xs transition-colors">
      <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
      {showText && <span>Unverified Profile</span>}
    </div>
  );
};