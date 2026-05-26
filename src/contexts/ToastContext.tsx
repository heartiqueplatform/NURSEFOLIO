/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}

      {/* Toast Render Area */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[999999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let bgClass = 'bg-white dark:bg-zinc-950 border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-100';
            let Icon = Info;
            let iconColor = 'text-blue-500';

            if (toast.type === 'success') {
              bgClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/55 text-emerald-900 dark:text-emerald-100';
              Icon = CheckCircle;
              iconColor = 'text-emerald-500';
            } else if (toast.type === 'error') {
              bgClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-150 dark:border-rose-900/55 text-rose-900 dark:text-rose-100';
              Icon = AlertCircle;
              iconColor = 'text-rose-500';
            } else if (toast.type === 'warning') {
              bgClass = 'bg-amber-50 dark:bg-amber-950/20 border-amber-150 dark:border-amber-900/55 text-amber-905 dark:text-amber-100';
              Icon = AlertTriangle;
              iconColor = 'text-amber-500';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${bgClass} transition-all duration-200`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor} mt-0.5`} />
                <div className="flex-1 text-xs md:text-sm font-semibold pr-2 leading-tight">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
