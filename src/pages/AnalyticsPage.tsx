/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BarChart3, TrendingUp, Users, Download as DownloadIcon } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();

  // --- MAMA'S DATA BOXES ---
  const [views, setViews] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]); // New box for downloads!
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isSupabaseConfigured || !user?.id) return;

      // 1. Fetch Views (Same as before)
      const { data: viewData } = await supabase!
        .from('profile_views')
        .select(`
          viewed_at,
          viewer_id,
          profiles:viewer_id (full_name)
        `)
        .eq('profile_id', user.id)
        .order('viewed_at', { ascending: false });

      // 2. Fetch Downloads (New Magic!)
      const { data: downloadData } = await supabase!
        .from('cv_downloads')
        .select(`
          downloaded_at,
          viewer_id,
          file_url,
          profiles:viewer_id (full_name)
        `)
        .eq('profile_id', user.id)
        .order('downloaded_at', { ascending: false });

      if (viewData) setViews(viewData);
      if (downloadData) setDownloads(downloadData);

      setLoading(false);
    };

    fetchAnalytics();
  }, [user?.id]);

  if (!user) return null;

  // =========================
  // REAL-TIME STATS
  // =========================
  const totalViews = views.length;
  const totalDownloads = downloads.length; // Now this counts real rows!
  const searchImpressions = user.search_appearances || 0; // We will fix this one later!

  return (
    <div className="space-y-6 font-sans text-xs">

      {/* HEADER */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          My Portfolio Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Live tracking for views and CV downloads is now active.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex justify-between">
          <div>
            <div className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">Views</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalViews}</div>
          </div>
          <Users className="text-teal-600 dark:text-teal-400" />
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex justify-between">
          <div>
            <div className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">CV Downloads</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalDownloads}</div>
          </div>
          <DownloadIcon className="text-blue-600 dark:text-blue-400" />
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex justify-between">
          <div>
            <div className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">Search</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{searchImpressions}</div>
          </div>
          <TrendingUp className="text-purple-600 dark:text-purple-400" />
        </div>
      </div>

      {/* TWO COLUMN LISTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* RECENT VIEWERS */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Recent Profile Viewers
          </h3>

          {loading ? (
            <p className="text-slate-400 dark:text-slate-500 text-[10px]">Loading...</p>
          ) : views.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">No viewers yet</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {views.slice(0, 5).map((v, i) => (
                <div key={i} className="flex justify-between items-center py-3">
                  <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{v.profiles?.full_name || 'Anonymous'}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Viewed Profile</span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                    {new Date(v.viewed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT DOWNLOADS */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-blue-50 dark:border-blue-900/30 space-y-3 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <DownloadIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            Recent CV Downloads
          </h3>

          {loading ? (
            <p className="text-slate-400 dark:text-slate-500 text-[10px]">Loading...</p>
          ) : downloads.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">No downloads yet</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {downloads.slice(0, 5).map((d, i) => (
                <div key={i} className="flex justify-between items-center py-3">
                  <div className="flex flex-col">
                    <span className="text-blue-900 dark:text-blue-400 font-bold">{d.profiles?.full_name || 'Anonymous Recruiter'}</span>
                    <span className="text-[9px] text-blue-400 dark:text-blue-500 truncate max-w-[120px]">
                      {d.file_url ? '📄 Paper Downloaded' : 'CV Summary'}
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                    {new Date(d.downloaded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}