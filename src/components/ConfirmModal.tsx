/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ==========================================================
// TONE CONFIG
// ==========================================================
const TONES = {
  danger: {
    Icon: Trash2,
    iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    buttonBg: 'bg-rose-600 active:bg-rose-700 text-white',
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    buttonBg: 'bg-amber-600 active:bg-amber-700 text-white',
  },
  info: {
    Icon: HelpCircle,
    iconBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    buttonBg: 'bg-teal-600 active:bg-teal-700 text-white',
  },
} as const;

// ==========================================================
// MAIN
// ==========================================================
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { Icon, iconBg, buttonBg } = TONES[type];

  // Escape closes modal
  useEffect(() => {
    if (!isOpen || loading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onCancel]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999999] flex items-end md:items-center justify-center md:p-4 bg-black/60"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="bg-white dark:bg-zinc-950 rounded-t-3xl md:rounded-3xl w-full md:max-w-sm p-6 pb-8 md:pb-6 animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center -mt-2 mb-4">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4 md:justify-start">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>

        {/* Title + Message */}
        <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white text-center md:text-left">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2 text-center md:text-left">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full md:flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition disabled:opacity-50 min-h-[48px]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full md:flex-1 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] ${buttonBg}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {confirmText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};