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

  // --- DATA BOXES ---
  const [views, setViews] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isSupabaseConfigured || !user?.id) return;

      // 1. Fetch Views
      const { data: viewData } = await supabase!
        .from('profile_views')
        .select(`
          viewed_at,
          viewer_id,
          profiles:viewer_id (full_name)
        `)
        .eq('profile_id', user.id)
        .order('viewed_at', { ascending: false });

      // 2. Fetch Downloads
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
  const totalDownloads = downloads.length;
  const searchImpressions = user.search_appearances || 0;

  return (
    <div className="space-y-0 md:space-y-6 font-sans text-xs -mx-3 md:mx-0">

      {/* HEADER - full width on mobile */}
      <div className="bg-white dark:bg-zinc-950 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 p-4 md:p-6 md:shadow-sm border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
        <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 md:gap-2">
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400" />
          My Portfolio Analytics
        </h2>
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">
          Live tracking for views and CV downloads is now active.
        </p>
      </div>

      {/* STATS CARDS - horizontal scroll on mobile, grid on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-0 md:gap-6 px-3 md:px-0">
        {/* Views Card */}
        <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-3 md:p-5 md:rounded-2xl md:shadow-sm flex flex-col items-center md:flex-row md:justify-between border-r border-slate-100 dark:border-zinc-800 md:border-r md:border-slate-100">
          <div className="text-center md:text-left">
            <div className="text-[8px] md:text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">Views</div>
            <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalViews}</div>
          </div>
          <Users className="w-4 h-4 md:w-5 md:h-5 text-teal-600 dark:text-teal-400 mt-1 md:mt-0" />
        </div>

        {/* Downloads Card */}
        <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-3 md:p-5 md:rounded-2xl md:shadow-sm flex flex-col items-center md:flex-row md:justify-between border-r border-slate-100 dark:border-zinc-800 md:border-r md:border-slate-100">
          <div className="text-center md:text-left">
            <div className="text-[8px] md:text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">Downloads</div>
            <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalDownloads}</div>
          </div>
          <DownloadIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 mt-1 md:mt-0" />
        </div>

        {/* Search Card */}
        <div className="bg-white dark:bg-zinc-950 md:border md:border-slate-100 md:dark:border-slate-800 p-3 md:p-5 md:rounded-2xl md:shadow-sm flex flex-col items-center md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <div className="text-[8px] md:text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">Search</div>
            <div className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{searchImpressions}</div>
          </div>
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400 mt-1 md:mt-0" />
        </div>
      </div>

      {/* TWO COLUMN LISTS - stacked on mobile, grid on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">

        {/* RECENT VIEWERS - feed style on mobile */}
        <div className="bg-white dark:bg-zinc-950 md:p-6 md:rounded-2xl md:border md:border-slate-100 md:dark:border-slate-800 md:shadow-sm border-b border-slate-100 dark:border-zinc-800 md:border-b md:border-slate-100">
          <div className="px-3 md:px-0 pt-4 md:pt-0 pb-3 md:pb-0 md:mb-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 dark:text-slate-500" />
              Recent Profile Viewers
            </h3>
          </div>

          <div className="md:space-y-3 md:mt-3">
            {loading ? (
              <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs px-3 md:px-0 py-4 md:py-0">Loading...</p>
            ) : views.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-[11px] md:text-sm italic px-3 md:px-0 py-4 md:py-0">No viewers yet</p>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {views.slice(0, 5).map((v, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 md:py-3 px-3 md:px-0">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold text-[11px] md:text-xs truncate">{v.profiles?.full_name || 'Anonymous'}</span>
                      <span className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Viewed Profile</span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] flex-shrink-0 ml-2">
                      {new Date(v.viewed_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RECENT DOWNLOADS - feed style on mobile */}
        <div className="bg-white dark:bg-zinc-950 md:p-6 md:rounded-2xl md:border md:border-blue-50 md:dark:border-blue-900/30 md:shadow-sm">
          <div className="px-3 md:px-0 pt-4 md:pt-0 pb-3 md:pb-0 md:mb-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <DownloadIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 dark:text-blue-400" />
              Recent CV Downloads
            </h3>
          </div>

          <div className="md:space-y-3 md:mt-3">
            {loading ? (
              <p className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs px-3 md:px-0 py-4 md:py-0">Loading...</p>
            ) : downloads.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-[11px] md:text-sm italic px-3 md:px-0 py-4 md:py-0">No downloads yet</p>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {downloads.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 md:py-3 px-3 md:px-0">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-blue-900 dark:text-blue-400 font-bold text-[11px] md:text-xs truncate">{d.profiles?.full_name || 'Anonymous Recruiter'}</span>
                      <span className="text-[8px] md:text-[9px] text-blue-400 dark:text-blue-500 truncate max-w-[100px] md:max-w-[120px]">
                        {d.file_url ? '📄 Paper Downloaded' : 'CV Summary'}
                      </span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] flex-shrink-0 ml-2">
                      {new Date(d.downloaded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}