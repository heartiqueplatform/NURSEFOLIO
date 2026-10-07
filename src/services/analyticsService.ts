/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ==========================================================
// SESSION HELPERS
// ==========================================================
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

function getSessionKey(profileId: string, event: string): string {
  return `analytics_${event}_${profileId}`;
}

function wasRecordedThisSession(profileId: string, event: string): boolean {
  try {
    const key = getSessionKey(profileId, event);
    const last = sessionStorage.getItem(key);
    if (!last) return false;
    const elapsed = Date.now() - parseInt(last, 10);
    return elapsed < VIEW_DEDUP_WINDOW_MS;
  } catch {
    // sessionStorage unavailable — allow the write
    return false;
  }
}

function markRecordedThisSession(profileId: string, event: string) {
  try {
    const key = getSessionKey(profileId, event);
    sessionStorage.setItem(key, Date.now().toString());
  } catch {
    // sessionStorage unavailable — the write already happened
  }
}

// ==========================================================
// SERVICE
// ==========================================================
export const analyticsService = {
  // ----------------------------------------------------------
  // PROFILE VIEWS
  // ----------------------------------------------------------
  /**
   * Records a profile view. Only writes to `profile_views`
   * (which is what the analytics dashboard reads from).
   *
   * Deduplicates within a 30-minute window per viewer+profile,
   * so refreshing the page 10 times doesn't inflate the count.
   */
  async recordProfileView(profileId: string, _metadata: any = {}): Promise<void> {
    if (!isSupabaseConfigured || !profileId) return;

    try {
      const { data: { user } } = await supabase!.auth.getUser();
      const viewerId = user?.id || null;

      // Owner viewing their own profile doesn't count
      if (viewerId === profileId) return;

      // Dedup — don't re-count the same viewer within 30 minutes
      const dedupKey = `${viewerId || 'anon'}_${profileId}`;
      if (wasRecordedThisSession(dedupKey, 'view')) return;

      const { error } = await supabase!
        .from('profile_views')
        .insert({
          profile_id: profileId,
          viewer_id: viewerId,
        });

      if (error) {
        // Duplicate key (same viewer + profile already recorded) is fine
        if (!error.message.includes('duplicate')) {
          console.warn('[analyticsService.recordProfileView] failed:', error.message);
        }
        return;
      }

      markRecordedThisSession(dedupKey, 'view');
    } catch (err) {
      console.warn('[analyticsService.recordProfileView] error:', err);
    }
  },

  // ----------------------------------------------------------
  // CV DOWNLOADS
  // ----------------------------------------------------------
  /**
   * Records a CV download. Writes to the `cv_downloads` table,
   * which is what PublicProfile and the analytics dashboard read from.
   *
   * The `fileUrl` is required — it's stored so the profile owner can
   * see which version of their CV was downloaded.
   */
  async recordCvDownload(profileId: string, fileUrl: string): Promise<void> {
    if (!isSupabaseConfigured || !profileId) return;

    try {
      const { data: { user } } = await supabase!.auth.getUser();
      const viewerId = user?.id || null;

      // Owner checking their own file doesn't count
      if (viewerId === profileId) return;

      const { error } = await supabase!
        .from('cv_downloads')
        .insert({
          profile_id: profileId,
          viewer_id: viewerId,
          file_url: fileUrl,
        });

      if (error) {
        console.warn('[analyticsService.recordCvDownload] failed:', error.message);
      }
    } catch (err) {
      console.warn('[analyticsService.recordCvDownload] error:', err);
    }
  },

  // ----------------------------------------------------------
  // SEARCH APPEARANCES
  // ----------------------------------------------------------
  /**
   * Records that a profile appeared in search results.
   *
   * Bumps the denormalized `search_appearances` counter on the
   * profile row — this is what the analytics dashboard reads.
   * Fire-and-forget; failures are silent.
   */
  async recordSearchAppearance(profileId: string, keyword?: string): Promise<void> {
    if (!isSupabaseConfigured || !profileId) return;

    try {
      // Increment the counter in the profiles table
      const { error } = await supabase!.rpc('increment_search_appearances', {
        profile_id: profileId,
      });

      if (error) {
        // RPC doesn't exist yet — fall back to a manual read + update.
        // This is slower but works without a DB function.
        const { data: row } = await supabase!
          .from('profiles')
          .select('search_appearances')
          .eq('id', profileId)
          .single();

        if (row) {
          await supabase!
            .from('profiles')
            .update({ search_appearances: (row.search_appearances || 0) + 1 })
            .eq('id', profileId);
        }
      }
    } catch (err) {
      // Silent — search appearances are not critical
      console.debug('[analyticsService.recordSearchAppearance] skipped:', err);
    }
  },

  // ----------------------------------------------------------
  // AGGREGATE QUERIES — used by the analytics dashboard
  // ----------------------------------------------------------
  /**
   * Fetches the totals a profile owner sees on their analytics page:
   * total views, total downloads, and recent activity.
   */
  async getProfileAnalytics(profileId: string): Promise<{
    totalViews: number;
    totalDownloads: number;
    views7d: number;
    downloads7d: number;
  }> {
    const empty = { totalViews: 0, totalDownloads: 0, views7d: 0, downloads7d: 0 };
    if (!isSupabaseConfigured || !profileId) return empty;

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        totalViewsRes,
        totalDownloadsRes,
        views7dRes,
        downloads7dRes,
      ] = await Promise.all([
        supabase!
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        supabase!
          .from('cv_downloads')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        supabase!
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profileId)
          .gte('viewed_at', sevenDaysAgo),
        supabase!
          .from('cv_downloads')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', profileId)
          .gte('downloaded_at', sevenDaysAgo),
      ]);

      return {
        totalViews: totalViewsRes.count || 0,
        totalDownloads: totalDownloadsRes.count || 0,
        views7d: views7dRes.count || 0,
        downloads7d: downloads7dRes.count || 0,
      };
    } catch (err) {
      console.warn('[analyticsService.getProfileAnalytics] failed:', err);
      return empty;
    }
  },

  /**
   * Fetches recent viewers and downloaders for a profile.
   * Returns joined profile info so the caller can display names.
   */
  async getRecentActivity(profileId: string, limit = 10): Promise<{
    viewers: Array<{ name: string; avatar: string | null; at: string }>;
    downloaders: Array<{ name: string; avatar: string | null; at: string }>;
  }> {
    const empty = { viewers: [], downloaders: [] };
    if (!isSupabaseConfigured || !profileId) return empty;

    try {
      const [viewsRes, downloadsRes] = await Promise.all([
        supabase!
          .from('profile_views')
          .select(`
            viewed_at,
            viewer_id,
            viewer:profiles!viewer_id (first_name, last_name, avatar_url)
          `)
          .eq('profile_id', profileId)
          .order('viewed_at', { ascending: false })
          .limit(limit),
        supabase!
          .from('cv_downloads')
          .select(`
            downloaded_at,
            viewer_id,
            viewer:profiles!viewer_id (first_name, last_name, avatar_url)
          `)
          .eq('profile_id', profileId)
          .order('downloaded_at', { ascending: false })
          .limit(limit),
      ]);

      const viewers = (viewsRes.data || []).map((v: any) => ({
        name: formatName(v.viewer) || 'Anonymous visitor',
        avatar: v.viewer?.avatar_url || null,
        at: v.viewed_at,
      }));

      const downloaders = (downloadsRes.data || []).map((d: any) => ({
        name: formatName(d.viewer) || 'Anonymous recruiter',
        avatar: d.viewer?.avatar_url || null,
        at: d.downloaded_at,
      }));

      return { viewers, downloaders };
    } catch (err) {
      console.warn('[analyticsService.getRecentActivity] failed:', err);
      return empty;
    }
  },
};

// ==========================================================
// HELPERS
// ==========================================================
function formatName(profile: any): string {
  if (!profile) return '';
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`.trim();
  }
  if (profile.first_name) return profile.first_name;
  return '';
}