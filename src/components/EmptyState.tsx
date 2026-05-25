/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  title,
  description,
  icon: Icon,
  actionText,
  onAction
}) => {
  return (
    <div id={id} className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
      <div className="rounded-2xl bg-white p-4 shadow-sm text-slate-400 mb-4 border border-slate-100">
        <Icon className="w-8 h-8 text-teal-600/80" />
      </div>
      <h5 className="font-semibold text-slate-800 text-lg">{title}</h5>
      <p className="mt-1 text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          id={`${id}-btn`}
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
