/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PortfolioTheme } from '../types';

export interface ThemeStyles {
  bodyBg: string; // Background class for the profile container
  cardBg: string; // Background class for cards
  textPrimary: string; // Main text color
  textSecondary: string; // Secondary text color
  accentText: string; // Accent color for headings
  accentBg: string; // Accent color for badges and highlights
  buttonPrimary: string; // Button style
  fontDisplay: string; // Font family for titles
  borderStyle: string; // Custom border styling
  iconColor: string; // icon colors
  bannerGradient: string; // default fallback cover image
}

export const THEME_MAPS: Record<PortfolioTheme, ThemeStyles> = {
  modern: {
    bodyBg: 'bg-slate-50/70',
    cardBg: 'bg-white/80 backdrop-blur-md',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    accentText: 'text-teal-600',
    accentBg: 'bg-teal-50 border border-teal-100 text-teal-700',
    buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
    fontDisplay: 'font-sans tracking-tight',
    borderStyle: 'border border-slate-100',
    iconColor: 'text-teal-600',
    bannerGradient: 'from-teal-600 via-emerald-500 to-cyan-500'
  },
  minimal: {
    bodyBg: 'bg-stone-50',
    cardBg: 'bg-white',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-600',
    accentText: 'text-stone-800',
    accentBg: 'bg-stone-100 text-stone-800 border border-stone-200',
    buttonPrimary: 'bg-stone-900 hover:bg-stone-800 text-white',
    fontDisplay: 'font-mono tracking-tight',
    borderStyle: 'border border-stone-200',
    iconColor: 'text-stone-700',
    bannerGradient: 'from-stone-400 via-stone-500 to-stone-600'
  },
  clinical: {
    bodyBg: 'bg-cyan-50/30',
    cardBg: 'bg-white',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-500',
    accentText: 'text-sky-600',
    accentBg: 'bg-sky-50 text-sky-700 border border-sky-100',
    buttonPrimary: 'bg-sky-600 hover:bg-sky-700 text-white',
    fontDisplay: 'font-sans tracking-tight',
    borderStyle: 'border border-sky-50',
    iconColor: 'text-sky-600',
    bannerGradient: 'from-blue-600 via-sky-500 to-cyan-400'
  },
  dark: {
    bodyBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90 border border-slate-800/80',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accentText: 'text-teal-400',
    accentBg: 'bg-teal-500/10 text-teal-300 border border-teal-500/20',
    buttonPrimary: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold',
    fontDisplay: 'font-sans tracking-tight',
    borderStyle: 'border border-slate-800',
    iconColor: 'text-teal-400',
    bannerGradient: 'from-slate-950 via-teal-950 to-emerald-950'
  },
  academic: {
    bodyBg: 'bg-indigo-50/20',
    cardBg: 'bg-white border-t-4 border-indigo-900 shadow-sm',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    accentText: 'text-indigo-950',
    accentBg: 'bg-indigo-50 text-indigo-900 border border-indigo-100',
    buttonPrimary: 'bg-indigo-900 hover:bg-indigo-950 text-white',
    fontDisplay: 'font-serif tracking-normal font-semibold',
    borderStyle: 'border border-slate-100 shadow-sm',
    iconColor: 'text-indigo-900',
    bannerGradient: 'from-indigo-900 via-indigo-700 to-indigo-800'
  }
};
