/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Eye, TrendingUp, TrendingDown, Download as DownloadIcon,
  Users, ArrowRight, BarChart3, Share2, Sparkles, Target,
  ChevronRight
} from 'lucide-react';

// ==========================================================
// TYPES
// ==========================================================
interface ViewRow {
  viewed_at: string;
  viewer_id: string | null;
  profiles: { full_name: string | null; avatar_url?: string | null } | null;
}

interface DownloadRow {
  downloaded_at: string;
  viewer_id: string | null;
  file_url: string | null;
  profiles: { full_name: string | null; avatar_url?: string | null } | null;
}

interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  views7d: number;
  views30d: number;
  downloads7d: number;
  downloads30d: number;
  viewsPrev7d: number;
  downloadsPrev7d: number;
}

// ==========================================================
// HELPERS
// ==========================================================
const DAY_MS = 86400000;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function trendLabel(current: number, previous: number): {
  direction: 'up' | 'down' | 'flat';
  text: string;
} {
  if (previous === 0 && current === 0) return { direction: 'flat', text: 'No activity' };
  if (previous === 0) return { direction: 'up', text: `+${current} new` };
  const delta = current - previous;
  const pct = Math.round((delta / previous) * 100);
  if (delta === 0) return { direction: 'flat', text: 'No change' };
  if (delta > 0) return { direction: 'up', text: `+${pct}% vs last week` };
  return { direction: 'down', text: `${pct}% vs last week` };
}

// ==========================================================
// STAT CARD
// ==========================================================
const StatCard = React.memo<{
  icon: any;
  label: string;
  value: number;
  trend?: { direction: 'up' | 'down' | 'flat'; text: string };
  tone: 'teal' | 'blue' | 'purple';
}>(({ icon: Icon, label, value, trend, tone }) => {
  const toneClasses = {
    teal: 'text-teal-600 dark:text-teal-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  const TrendIcon =
    trend?.direction === 'up' ? TrendingUp :
      trend?.direction === 'down' ? TrendingDown :
        null;
  const trendColor =
    trend?.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
      trend?.direction === 'down' ? 'text-rose-600 dark:text-rose-400' :
        'text-slate-400 dark:text-slate-500';

  return (
    <div className="flex-1 min-w-0 px-4 py-5 text-center border-r border-slate-100 dark:border-zinc-900 last:border-r-0">
      <Icon className={`w-4 h-4 mx-auto mb-2 ${toneClasses[tone]}`} />
      <div className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 dark:text-white leading-none tabular-nums">
        {value.toLocaleString()}
      </div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5">
        {label}
      </p>
      {trend && (
        <p className={`text-[10px] font-semibold mt-1 flex items-center justify-center gap-1 ${trendColor}`}>
          {TrendIcon && <TrendIcon className="w-3 h-3" />}
          {trend.text}
        </p>
      )}
    </div>
  );
});
StatCard.displayName = 'StatCard';

// ==========================================================
// ACTIVITY ROW
// ==========================================================
const ActivityRow = React.memo<{
  name: string;
  action: string;
  when: string;
  avatar?: string | null;
  tone: 'view' | 'download';
}>(({ name, action, when, avatar, tone }) => {
  const initial = name.charAt(0).toUpperCase() || '?';
  const avatarBg =
    tone === 'view'
      ? 'bg-gradient-to-br from-teal-400 to-emerald-500'
      : 'bg-gradient-to-br from-blue-400 to-indigo-500';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-900 last:border-b-0">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-9 h-9 rounded-full object-cover bg-slate-100 dark:bg-zinc-900 flex-shrink-0"
        />
      ) : (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${avatarBg}`}>
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {action}
        </p>
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
        {when}
      </span>
    </div>
  );
});
ActivityRow.displayName = 'ActivityRow';

// ==========================================================
// EMPTY STATE
// ==========================================================
const EmptyState = React.memo<{
  icon: any;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionTo?: string;
}>(({ icon: Icon, title, subtitle, actionLabel, actionTo }) => (
  <div className="text-center py-10 px-6">
    <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
    </div>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
      {subtitle}
    </p>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 active:opacity-70"
      >
        {actionLabel}
        <ArrowRight className="w-3 h-3" />
      </Link>
    )}
  </div>
));
EmptyState.displayName = 'EmptyState';

// ==========================================================
// SKELETON
// ==========================================================
const AnalyticsSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="grid grid-cols-3 border-b border-slate-100 dark:border-zinc-900">
      {[1, 2, 3].map(i => (
        <div key={i} className="px-4 py-5 text-center border-r border-slate-100 dark:border-zinc-900 last:border-r-0">
          <div className="w-4 h-4 bg-slate-200 dark:bg-zinc-800 rounded mx-auto mb-2" />
          <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-12 mx-auto" />
          <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-16 mx-auto mt-2" />
        </div>
      ))}
    </div>
    <div className="px-4 py-4 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
));
AnalyticsSkeleton.displayName = 'AnalyticsSkeleton';

// ==========================================================
// MAIN PAGE
// ==========================================================
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentViews, setRecentViews] = useState<ViewRow[]>([]);
  const [recentDownloads, setRecentDownloads] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // FETCH — 5 targeted queries, not 2 full-table scans
  // ----------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;
    let cancelled = false;

    (async () => {
      const userId = user.id;
      const now = Date.now();
      const iso7d = new Date(now - 7 * DAY_MS).toISOString();
      const iso14d = new Date(now - 14 * DAY_MS).toISOString();
      const iso30d = new Date(now - 30 * DAY_MS).toISOString();

      try {
        const [
          totalViewsRes,
          totalDownloadsRes,
          views7dRes,
          views30dRes,
          viewsPrev7dRes,
          downloads7dRes,
          downloads30dRes,
          downloadsPrev7dRes,
          recentViewsRes,
          recentDownloadsRes,
        ] = await Promise.all([
          // Counts (head:true means no rows come back, just the count)
          supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', userId),
          supabase.from('cv_downloads').select('*', { count: 'exact', head: true }).eq('profile_id', userId),
          // Time-scoped counts
          supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', userId).gte('viewed_at', iso7d),
          supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', userId).gte('viewed_at', iso30d),
          supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', userId).gte('viewed_at', iso14d).lt('viewed_at', iso7d),
          supabase.from('cv_downloads').select('*', { count: 'exact', head: true }).eq('profile_id', userId).gte('downloaded_at', iso7d),
          supabase.from('cv_downloads').select('*', { count: 'exact', head: true }).eq('profile_id', userId).gte('downloaded_at', iso30d),
          supabase.from('cv_downloads').select('*', { count: 'exact', head: true }).eq('profile_id', userId).gte('downloaded_at', iso14d).lt('downloaded_at', iso7d),
          // Recent activity — only 10 rows each, joined to profiles in one query
          supabase
            .from('profile_views')
            .select('viewed_at, viewer_id, profiles:viewer_id (full_name, avatar_url)')
            .eq('profile_id', userId)
            .order('viewed_at', { ascending: false })
            .limit(10),
          supabase
            .from('cv_downloads')
            .select('downloaded_at, viewer_id, file_url, profiles:viewer_id (full_name, avatar_url)')
            .eq('profile_id', userId)
            .order('downloaded_at', { ascending: false })
            .limit(10),
        ]);

        if (cancelled) return;

        setSummary({
          totalViews: totalViewsRes.count || 0,
          totalDownloads: totalDownloadsRes.count || 0,
          views7d: views7dRes.count || 0,
          views30d: views30dRes.count || 0,
          downloads7d: downloads7dRes.count || 0,
          downloads30d: downloads30dRes.count || 0,
          viewsPrev7d: viewsPrev7dRes.count || 0,
          downloadsPrev7d: downloadsPrev7dRes.count || 0,
        });

        setRecentViews((recentViewsRes.data || []) as unknown as ViewRow[]);
        setRecentDownloads((recentDownloadsRes.data || []) as unknown as DownloadRow[]);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  // ----------------------------------------------------------
  // DERIVED
  // ----------------------------------------------------------
  const viewsTrend = useMemo(() => {
    if (!summary) return null;
    return trendLabel(summary.views7d, summary.viewsPrev7d);
  }, [summary]);

  const downloadsTrend = useMemo(() => {
    if (!summary) return null;
    return trendLabel(summary.downloads7d, summary.downloadsPrev7d);
  }, [summary]);

  // Which sections have no data at all?
  const hasNoActivity = !!summary && summary.totalViews === 0 && summary.totalDownloads === 0;

  if (!user) return null;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

        {/* ============================================
                    HEADER — hidden on mobile, it's just chrome
                    ============================================ */}
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl lg:text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            How colleagues and recruiters engage with your profile.
          </p>
        </div>

        {loading ? (
          <AnalyticsSkeleton />
        ) : hasNoActivity ? (
          <EmptyState
            icon={BarChart3}
            title="No activity yet"
            subtitle="Share your public profile to start collecting views and downloads. Every endorsement and share helps."
            actionLabel="View my public profile"
            actionTo={`/nurse/${user.username || ''}`}
          />
        ) : (
          <>
            {/* ============================================
                            STATS — edge-to-edge row, deltas
                            ============================================ */}
            {summary && (
              <section className="grid grid-cols-3 border-b border-slate-100 dark:border-zinc-900">
                <StatCard
                  icon={Eye}
                  label="Views"
                  value={summary.totalViews}
                  trend={viewsTrend}
                  tone="teal"
                />
                <StatCard
                  icon={DownloadIcon}
                  label="Downloads"
                  value={summary.totalDownloads}
                  trend={downloadsTrend}
                  tone="blue"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Search"
                  value={user.search_appearances || 0}
                  tone="purple"
                />
              </section>
            )}

            {/* ============================================
                            30-DAY SUMMARY — the "insight" strip
                            ============================================ */}
            {summary && (summary.views7d > 0 || summary.views30d > 0) && (
              <section className="px-4 py-5 border-b border-slate-100 dark:border-zinc-900">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    Last 30 days
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Views this month
                    </p>
                    <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                      {summary.views30d}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {summary.views7d} in last 7 days
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Downloads this month
                    </p>
                    <p className="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
                      {summary.downloads30d}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {summary.downloads7d} in last 7 days
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================
                            RECENT VIEWERS
                            ============================================ */}
            <section className="border-b border-slate-100 dark:border-zinc-900">
              <div className="px-4 py-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-500" />
                  Recent viewers
                </h2>
                {recentViews.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {summary?.views7d ?? 0} this week
                  </span>
                )}
              </div>

              {recentViews.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No viewers yet"
                  subtitle="When someone visits your profile, they'll show up here."
                />
              ) : (
                <div>
                  {recentViews.slice(0, 5).map((v, i) => (
                    <ActivityRow
                      key={i}
                      name={v.profiles?.full_name || 'Anonymous visitor'}
                      action="Viewed your profile"
                      when={relativeTime(v.viewed_at)}
                      avatar={v.profiles?.avatar_url}
                      tone="view"
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ============================================
                            RECENT DOWNLOADS
                            ============================================ */}
            <section className="border-b border-slate-100 dark:border-zinc-900">
              <div className="px-4 py-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DownloadIcon className="w-4 h-4 text-blue-500" />
                  Recent downloads
                </h2>
                {recentDownloads.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {summary?.downloads7d ?? 0} this week
                  </span>
                )}
              </div>

              {recentDownloads.length === 0 ? (
                <EmptyState
                  icon={DownloadIcon}
                  title="No downloads yet"
                  subtitle="When someone downloads your CV, they'll appear here."
                />
              ) : (
                <div>
                  {recentDownloads.slice(0, 5).map((d, i) => (
                    <ActivityRow
                      key={i}
                      name={d.profiles?.full_name || 'Anonymous recruiter'}
                      action={d.file_url ? 'Downloaded your CV' : 'Viewed your CV'}
                      when={relativeTime(d.downloaded_at)}
                      avatar={d.profiles?.avatar_url}
                      tone="download"
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ============================================
                            NEXT ACTIONS — growth
                            ============================================ */}
            <section className="px-4 py-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Grow your reach
              </h2>
              <div>
                <GrowRow
                  to={`/nurse/${user.username || ''}`}
                  icon={Share2}
                  label="Share your profile"
                  subtitle="Post the link on WhatsApp or LinkedIn"
                  external
                />
                <GrowRow
                  to="/dashboard/edit-profile"
                  icon={Target}
                  label="Polish your bio"
                  subtitle="A clear bio gets 2× more views"
                />
                <GrowRow
                  to="/dashboard/cv"
                  icon={DownloadIcon}
                  label="Refresh your CV"
                  subtitle="Newer CVs convert better"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// GROW ROW — small growth-oriented link
// ==========================================================
const GrowRow = React.memo<{
  to: string;
  icon: any;
  label: string;
  subtitle: string;
  external?: boolean;
}>(({ to, icon: Icon, label, subtitle, external }) => {
  const inner = (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-zinc-900 last:border-b-0 active:bg-slate-100 dark:active:bg-zinc-900 transition rounded-none">
      <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
    </div>
  );
  if (external) return <a href={to}>{inner}</a>;
  return <Link to={to}>{inner}</Link>;
});
GrowRow.displayName = 'GrowRow';