/**
 * useCVBundle.ts
 *
 * Loads the CV bundle for the current user and exposes a refresh() so the
 * page can rebuild after the user edits their profile elsewhere.
 *
 * WHY a dedicated hook rather than inline useEffect in the page:
 * - The CV Generator page will grow (section toggles, reorder, export state).
 *   Keeping data loading isolated means the page stays a layout concern.
 * - We'll reuse this exact hook inside the future "Share CV" flow and the
 *   WhatsApp export path. One source of truth for the bundle.
 *
 * The hook does NOT subscribe to realtime. Realtime on 7 tables would burn
 * battery and connections. Instead the page calls refresh() when it regains
 * focus and after any in-page edit. Cheap, predictable, phone-friendly.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildCV, CVBuilderError, type CVBundle } from '../services/cvBuilder';
import { supabase } from '../lib/supabase';

interface UseCVBundleResult {
    data: CVBundle | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useCVBundle(): UseCVBundleResult {
    const [data, setData] = useState<CVBundle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Guard against setState after unmount — cheap insurance, real bugs otherwise
    // on phones where users switch apps mid-load.
    const mountedRef = useRef(true);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: session } = await supabase.auth.getSession();
            const userId = session.session?.user.id;
            if (!userId) {
                // Not an auth error — user simply isn't signed in. Page handles this.
                if (mountedRef.current) {
                    setData(null);
                    setError('not-authenticated');
                    setLoading(false);
                }
                return;
            }
            const bundle = await buildCV(userId);
            if (mountedRef.current) {
                setData(bundle);
                setError(null);
            }
        } catch (e) {
            const message =
                e instanceof CVBuilderError
                    ? e.message
                    : e instanceof Error
                        ? e.message
                        : 'Failed to build CV';
            if (mountedRef.current) setError(message);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        void load();
        return () => {
            mountedRef.current = false;
        };
    }, [load]);

    // Refresh on tab focus — covers the case where the user edits their profile
    // in another tab, or comes back from the Supabase auth email flow.
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible' && data) {
                void load();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [data, load]);

    return { data, loading, error, refresh: load };
}