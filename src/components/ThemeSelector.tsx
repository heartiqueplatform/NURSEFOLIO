/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import { PortfolioTheme } from '../types';

interface ThemeSelectorProps {
  id: string;
  selectedTheme: PortfolioTheme;
  onChange: (theme: PortfolioTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ id, selectedTheme, onChange }) => {
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    setSystemTheme(isDark ? 'dark' : 'light');

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = document.documentElement.classList.contains('dark');
          setSystemTheme(isDarkNow ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const toggleAppTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const options: { value: PortfolioTheme; label: string; desc: string; previewLight: string; previewDark: string }[] = [
    {
      value: 'modern',
      label: 'Modern Premium',
      desc: 'Teal gradients, transparent glass card style, startup feel.',
      previewLight: 'bg-gradient-to-r from-teal-500 to-emerald-400',
      previewDark: 'bg-gradient-to-r from-teal-600 to-emerald-500'
    },
    {
      value: 'minimal',
      label: 'Sleek Minimal',
      desc: 'Warm stone canvas, charcoal outlines, perfect high-contrast.',
      previewLight: 'bg-gradient-to-r from-stone-400 to-stone-600',
      previewDark: 'bg-gradient-to-r from-stone-500 to-stone-700'
    },
    {
      value: 'clinical',
      label: 'Clinical Clean',
      desc: 'Clean medical blue accents with structured details.',
      previewLight: 'bg-gradient-to-r from-blue-500 to-sky-400',
      previewDark: 'bg-gradient-to-r from-blue-600 to-sky-500'
    },
    {
      value: 'academic',
      label: 'Academic Navy',
      desc: 'Serif headings and indigo accent border, perfect for research.',
      previewLight: 'bg-gradient-to-r from-indigo-600 to-indigo-800',
      previewDark: 'bg-gradient-to-r from-indigo-700 to-indigo-900'
    },
    {
      value: 'dark',
      label: 'Obsidian Night',
      desc: 'Deep cosmic slate background with glowing accents.',
      previewLight: 'bg-gradient-to-r from-slate-800 to-slate-900',
      previewDark: 'bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-700'
    }
  ];

  return (
    <div id={id} className="space-y-4">
      {/* Header with App Theme Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-base">
          <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h6>Select Portfolio Display Theme</h6>
        </div>

        {/* App Theme Toggle Button */}
        <button
          onClick={toggleAppTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm font-medium"
          title={systemTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {systemTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Choose a premium visual theme for your public profile link. Changes apply instantly across desktop and mobile.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt) => {
          const isSelected = selectedTheme === opt.value;
          const previewClass = systemTheme === 'dark' ? opt.previewDark : opt.previewLight;

          return (
            <button
              key={opt.value}
              id={`theme-select-${opt.value}`}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-start text-left p-4 rounded-xl border transition-all duration-200 active:scale-[99%] cursor-pointer ${isSelected
                ? 'border-teal-600 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-600/20 dark:ring-teal-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-slate-900/50'
                }`}
            >
              <div className={`w-10 h-10 rounded-lg flex-shrink-0 mr-4 flex items-center justify-center text-white font-bold text-xs shadow-sm ${previewClass}`}>
                {isSelected && <Check className="w-5 h-5 drop-shadow" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block font-semibold text-slate-800 dark:text-slate-200 text-sm">{opt.label}</span>
                <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{opt.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Theme Info Note */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
          💡 <span className="font-medium">Tip:</span> Your app theme (light/dark mode) works independently from your portfolio theme.
          Switch between light and dark mode to see how your portfolio will look in both environments.
        </p>
      </div>
    </div>
  );
};