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
      <div id="badge-verified" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium text-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        {showText && <span>Verified Professional</span>}
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div id="badge-pending" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 font-medium text-xs">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        {showText && <span>Verification Pending</span>}
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div id="badge-rejected" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-medium text-xs">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        {showText && <span>Verification Declined</span>}
      </div>
    );
  }

  return (
    <div id="badge-unverified" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-medium text-xs">
      <Shield className="w-3.5 h-3.5 text-slate-400" />
      {showText && <span>Unverified Profile</span>}
    </div>
  );
};
