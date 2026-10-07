/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ==========================================
// TYPES
// ==========================================
export type LocumUrgency = 'urgent' | 'soon' | 'planned';
export type LocumStatus = 'open' | 'filled' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface LocumRequest {
    id: string;
    requester_id: string;
    facility_name: string | null;
    facility_location: string;
    specialty: string | null;
    shift_date: string;
    shift_start: string | null;
    shift_end: string | null;
    urgency: LocumUrgency;
    notes: string | null;
    contact_phone: string | null;
    status: LocumStatus;
    accepted_offer_id: string | null;
    created_at: string;
    updated_at: string;
    requester?: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
        qualification: string | null;
        verification_status: string | null;
    };
    offer_count?: number;
}

export interface LocumOffer {
    id: string;
    request_id: string;
    applicant_id: string;
    message: string | null;
    status: OfferStatus;
    created_at: string;
    updated_at: string;
    applicant?: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
        qualification: string | null;
        nursing_level: string | null;
        verification_status: string | null;
        phone_number: string | null;
        whatsapp_number: string | null;
    };
}

/** One row of the server-generated batch */
export interface LocumBatchItem {
    request_id: string;
    match_score: number;
    is_matched: boolean;
}

// ==========================================
// SHARED HELPER — hydrate request IDs
// ==========================================
/**
 * Takes an array of request IDs and returns fully hydrated
 * LocumRequest objects (with requester profile + offer counts),
 * preserving the original order of the IDs.
 *
 * Uses the `locum_requests_active` view when available (which
 * automatically hides expired shifts), but falls back to the
 * base table if the view doesn't exist yet.
 */
async function hydrateRequests(ids: string[]): Promise<LocumRequest[]> {
    if (!isSupabaseConfigured || ids.length === 0) return [];

    // 1. Fetch request rows with requester profile.
    //    Try the "active" view first — it filters expired shifts server-side.
    let data: any[] | null = null;
    let error: any = null;

    const viewResult = await supabase
        .from('locum_requests_active')
        .select(`
            *,
            requester:profiles!requester_id (
                id,
                first_name,
                last_name,
                full_name,
                username,
                avatar_url,
                qualification,
                verification_status
            )
        `)
        .in('id', ids);

    if (viewResult.error) {
        // View may not exist yet — fall back to base table
        console.warn('locum_requests_active view unavailable, falling back:', viewResult.error.message);
        const baseResult = await supabase
            .from('locum_requests')
            .select(`
                *,
                requester:profiles!requester_id (
                    id,
                    first_name,
                    last_name,
                    full_name,
                    username,
                    avatar_url,
                    qualification,
                    verification_status
                )
            `)
            .in('id', ids);
        data = baseResult.data;
        error = baseResult.error;
    } else {
        data = viewResult.data;
    }

    if (error) {
        console.error('hydrateRequests fetch error:', error);
        return [];
    }

    // 2. Fetch offer counts for these requests
    const { data: offerRows } = await supabase
        .from('locum_offers')
        .select('request_id')
        .in('request_id', ids);

    const offerCounts = new Map<string, number>();
    offerRows?.forEach((r: any) => {
        offerCounts.set(r.request_id, (offerCounts.get(r.request_id) || 0) + 1);
    });

    // 3. Preserve the original order of IDs
    return ids
        .map(id => (data || []).find((r: any) => r.id === id))
        .filter(Boolean)
        .map((r: any) => ({
            ...r,
            offer_count: offerCounts.get(r.id) || 0
        })) as LocumRequest[];
}

// ==========================================
// SERVICE
// ==========================================
export const locumService = {
    /**
     * ⭐ NEW: Get a cached batch of locum request IDs for the user.
     *
     * The server (get_locum_batch RPC) does the heavy lifting:
     *   - scores requests by specialty / location / urgency match
     *   - excludes expired shifts (shift_date < today) and non-open requests
     *   - excludes the user's own requests
     *   - excludes requests the user already applied to
     *   - caches the result in locum_batches for 6 hours
     *
     * Pass forceFresh = true (e.g. on pull-to-refresh) to rebuild the batch.
     *
     * This is the ONLY method the browse tab needs to call.
     */
    async getLocumBatch(
        userId: string,
        limit = 20,
        forceFresh = false
    ): Promise<LocumBatchItem[]> {
        if (!isSupabaseConfigured) return [];

        const { data, error } = await supabase.rpc('get_locum_batch', {
            p_user_id: userId,
            p_limit: limit,
            p_force_fresh: forceFresh,
        });

        if (error) {
            console.error('get_locum_batch error:', error);
            return [];
        }

        return (data || []) as LocumBatchItem[];
    },

    /**
     * Convenience: get the batch, then hydrate it into full LocumRequest[]
     * in one call. Returns a flat array in batch order (matched + filler
     * interleaved as the RPC returned them).
     *
     * Most callers should use getLocumBatch directly so they can split
     * matched vs filler themselves.
     */
    async getBatchedRequests(
        userId: string,
        limit = 20,
        forceFresh = false
    ): Promise<LocumRequest[]> {
        const batch = await this.getLocumBatch(userId, limit, forceFresh);
        const ids = batch.map(b => b.request_id);
        return hydrateRequests(ids);
    },

    /**
     * LEGACY: Get personalized list of open locum requests for a user.
     * Uses SQL get_locum_matches → returns requests where
     * the user's location OR specialty matches the request.
     *
     * Prefer getLocumBatch for new code — it's cached and faster.
     */
    async getMatches(userId: string, limit = 20): Promise<LocumRequest[]> {
        if (!isSupabaseConfigured) return [];

        const { data: matches, error: matchErr } = await supabase
            .rpc('get_locum_matches', { p_user_id: userId, p_limit: limit });

        if (matchErr) {
            console.error('get_locum_matches error:', matchErr);
            return [];
        }

        const ids = (matches || []).map((r: any) => r.request_id);
        return hydrateRequests(ids);
    },

    /**
     * LEGACY: Get ALL open locum requests (not filtered by match).
     * Prefer getLocumBatch for new code.
     */
    async getAllRequests(userId: string, limit = 40): Promise<LocumRequest[]> {
        if (!isSupabaseConfigured) return [];

        const { data: matches, error: rpcErr } = await supabase
            .rpc('get_all_locum_requests', { p_user_id: userId, p_limit: limit });

        if (rpcErr) {
            console.error('get_all_locum_requests error:', rpcErr);
            return [];
        }

        const ids = (matches || []).map((r: any) => r.request_id);
        return hydrateRequests(ids);
    },

    /**
     * Get requests created by this user (for "My Requests" tab).
     */
    async getMyRequests(userId: string): Promise<LocumRequest[]> {
        if (!isSupabaseConfigured) return [];

        const { data, error } = await supabase
            .from('locum_requests')
            .select(`
                *,
                requester:profiles!requester_id (
                    id,
                    first_name,
                    last_name,
                    full_name,
                    username,
                    avatar_url,
                    qualification,
                    verification_status
                )
            `)
            .eq('requester_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getMyRequests error:', error);
            return [];
        }

        // Enrich with offer counts
        const ids = (data || []).map((r: any) => r.id);
        const offerCounts = new Map<string, number>();
        if (ids.length > 0) {
            const { data: offerRows } = await supabase
                .from('locum_offers')
                .select('request_id')
                .in('request_id', ids);
            offerRows?.forEach((r: any) => {
                offerCounts.set(r.request_id, (offerCounts.get(r.request_id) || 0) + 1);
            });
        }

        return (data || []).map((r: any) => ({
            ...r,
            offer_count: offerCounts.get(r.id) || 0
        })) as LocumRequest[];
    },

    /**
     * Create a new locum request.
     */
    async createRequest(payload: {
        requester_id: string;
        facility_name?: string | null;
        facility_location: string;
        specialty?: string | null;
        shift_date: string;
        shift_start?: string | null;
        shift_end?: string | null;
        urgency: LocumUrgency;
        notes?: string | null;
        contact_phone?: string | null;
    }): Promise<LocumRequest> {
        if (!isSupabaseConfigured) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('locum_requests')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Invalidate the user's cached batch so the new request shows up
        // next time they browse (optional, best-effort).
        supabase
            .from('locum_batches')
            .delete()
            .eq('user_id', payload.requester_id)
            .then(() => { /* ignore */ });

        return data as LocumRequest;
    },

    /**
     * Update a request's status (e.g. cancel).
     */
    async updateRequestStatus(
        requestId: string,
        userId: string,
        status: LocumStatus
    ): Promise<void> {
        if (!isSupabaseConfigured) return;

        const { error } = await supabase
            .from('locum_requests')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', requestId)
            .eq('requester_id', userId);

        if (error) throw error;
    },

    /**
     * Apply to a locum request (create or update an offer).
     */
    async applyToRequest(payload: {
        request_id: string;
        applicant_id: string;
        message?: string | null;
    }): Promise<LocumOffer> {
        if (!isSupabaseConfigured) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('locum_offers')
            .upsert(
                {
                    request_id: payload.request_id,
                    applicant_id: payload.applicant_id,
                    message: payload.message || null,
                    status: 'pending'
                },
                { onConflict: 'request_id,applicant_id' }
            )
            .select()
            .single();

        if (error) throw error;

        // Invalidate this user's cached batch — they've now applied,
        // so the request should disappear from their browse feed.
        supabase
            .from('locum_batches')
            .delete()
            .eq('user_id', payload.applicant_id)
            .then(() => { /* ignore */ });

        return data as LocumOffer;
    },

    /**
     * Withdraw an offer.
     */
    async withdrawOffer(offerId: string, userId: string): Promise<void> {
        if (!isSupabaseConfigured) return;

        const { error } = await supabase
            .from('locum_offers')
            .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
            .eq('id', offerId)
            .eq('applicant_id', userId);

        if (error) throw error;
    },

    /**
     * Get offers for a specific request (for the "applicants inbox").
     */
    async getOffersForRequest(requestId: string): Promise<LocumOffer[]> {
        if (!isSupabaseConfigured) return [];

        const { data, error } = await supabase
            .from('locum_offers')
            .select(`
                *,
                applicant:profiles!applicant_id (
                    id,
                    first_name,
                    last_name,
                    full_name,
                    username,
                    avatar_url,
                    qualification,
                    nursing_level,
                    verification_status,
                    phone_number,
                    whatsapp_number
                )
            `)
            .eq('request_id', requestId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getOffersForRequest error:', error);
            return [];
        }

        return (data || []) as LocumOffer[];
    },

    /**
     * Check whether the current user has applied to a request.
     */
    async getMyOfferForRequest(
        requestId: string,
        userId: string
    ): Promise<LocumOffer | null> {
        if (!isSupabaseConfigured) return null;

        const { data, error } = await supabase
            .from('locum_offers')
            .select('*')
            .eq('request_id', requestId)
            .eq('applicant_id', userId)
            .maybeSingle();

        if (error) return null;
        return data as LocumOffer | null;
    },

    /**
     * Accept an offer. Calls the SQL function which handles
     * rejecting other offers and closing the request atomically.
     */
    async acceptOffer(offerId: string, requesterId: string): Promise<boolean> {
        if (!isSupabaseConfigured) return false;

        const { data, error } = await supabase.rpc('accept_locum_offer', {
            p_offer_id: offerId,
            p_requester_id: requesterId
        });

        if (error) throw error;
        return !!data;
    }
};