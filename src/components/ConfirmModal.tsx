/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  let Icon = HelpCircle;
  let iconBg = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-150/20';
  let primaryBtnBg = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 focus:ring-indigo-500';

  if (type === 'danger') {
    Icon = Trash2;
    iconBg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-150/20';
    primaryBtnBg = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10 focus:ring-rose-500';
  } else if (type === 'warning') {
    Icon = AlertTriangle;
    iconBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-150/20';
    primaryBtnBg = 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10 focus:ring-amber-500';
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal core container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative bg-white dark:bg-zinc-950 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-slate-900 dark:text-slate-100 flex flex-col gap-5 z-10"
        >
          {/* Close button top right */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Row */}
          <div className="flex gap-4 items-start pr-6">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-base leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {message}
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/40 cursor-pointer transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shadow-md ${primaryBtnBg}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
