/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { ThemeSelector } from '../components/ThemeSelector';
import { PortfolioTheme } from '../types';
import { Check, Palette, ArrowUpRight, Loader2 } from 'lucide-react';

// ==========================================================
// MAIN
// ==========================================================
export default function PortfolioThemePage() {
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState<PortfolioTheme>(
    () => (user?.profile_theme as PortfolioTheme) || 'modern'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ✅ FIX: Sync selected theme when user loads/changes
  // (was stuck on 'modern' if user object arrived after mount)
  useEffect(() => {
    if (user?.profile_theme) {
      setSelected(user.profile_theme as PortfolioTheme);
    }
  }, [user?.profile_theme]);

  const handleSaveTheme = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await databaseService.updateProfile(user.id, {
        profile_theme: selected,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save theme failed:', err);
      setError('Could not save theme. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, selected, refreshUser]);

  const handleThemeChange = useCallback((theme: PortfolioTheme) => {
    setSelected(theme);
    setSaved(false);
    setError('');
  }, []);

  if (!user) return null;

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

        {/* ============================================
            HEADER
            ============================================ */}
        <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
            <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Portfolio theme
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Choose how your public profile looks to visitors
            </p>
          </div>
        </div>

        {/* ============================================
            SUCCESS / ERROR MESSAGES
            ============================================ */}
        {saved && (
          <div className="mx-4 md:mx-0 mb-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Theme saved</span>
          </div>
        )}

        {error && (
          <div className="mx-4 md:mx-0 mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* ============================================
            THEME SELECTOR
            ============================================ */}
        <section className="mx-4 md:mx-0 mb-6 bg-white dark:bg-zinc-950 md:rounded-2xl p-4 md:p-5">
          <ThemeSelector
            id="theme-selector-panel"
            selectedTheme={selected}
            onChange={handleThemeChange}
          />
        </section>

        {/* ============================================
            ACTIONS
            ============================================ */}
        <section className="mx-4 md:mx-0 pt-5 border-t border-slate-100 dark:border-zinc-900">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">

            <Link
              to={`/nurse/${user.username}`}
              className="inline-flex items-center justify-center gap-1.5 py-3 sm:py-0 text-sm font-semibold text-teal-600 dark:text-teal-400 active:opacity-70 transition"
            >
              <span>Preview live page</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleSaveTheme}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving
                </>
              ) : (
                'Save theme'
              )}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}