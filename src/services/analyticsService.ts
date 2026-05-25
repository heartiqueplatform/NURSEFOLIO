import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const analyticsService = {

  // =========================
  // PROFILE VIEW TRACKING
  // =========================
  async recordProfileView(profileId: string, metadata: any = {}): Promise<void> {
    try {
      if (!isSupabaseConfigured || !profileId) return;

      const {
        data: { user },
      } = await supabase!.auth.getUser();

      await supabase!
        .from('profile_views')
        .insert({
          profile_id: profileId,
          viewer_id: user?.id || null, // 👈 THIS FIXES "Anonymous"
        });

      await supabase!
        .from('analytics')
        .insert({
          profile_id: profileId,
          event_type: 'profile_view',
          metadata,
        });

    } catch (err) {
      console.warn('recordProfileView failed:', err);
    }
  },

  // =========================
  // CV DOWNLOAD TRACKING
  // =========================
  async recordCvDownload(profileId: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !profileId) return;

      const { error } = await supabase!
        .from('analytics')
        .insert({
          profile_id: profileId,
          event_type: 'cv_download',
          metadata: {
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.warn('recordCvDownload failed:', error.message);
      }

    } catch (err) {
      console.warn('recordCvDownload failed:', err);
    }
  },

  // =========================
  // SEARCH TRACKING
  // =========================
  async recordSearch(profileId: string, keyword: string): Promise<void> {
    try {
      if (!isSupabaseConfigured || !profileId) return;

      const { error } = await supabase!
        .from('analytics')
        .insert({
          profile_id: profileId,
          event_type: 'search',
          metadata: {
            keyword,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.warn('recordSearch failed:', error.message);
      }

    } catch (err) {
      console.warn('recordSearch failed:', err);
    }
  }

};