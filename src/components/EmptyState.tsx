/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
interface EmptyStateProps {
  id?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  /** Optional secondary action (e.g. "Ask a question") */
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

// ==========================================================
// MAIN
// ==========================================================
export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div id={id} className="text-center py-16 px-6">

      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Title */}
      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(actionText && onAction) || (secondaryActionText && onSecondaryAction) ? (
        <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2.5">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[44px]"
            >
              {actionText}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[44px]"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      ) : null}

    </div>
  );
};