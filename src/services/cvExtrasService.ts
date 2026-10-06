/**
 * cvExtrasService.ts
 *
 * Loads and saves the profiles.cv_extras JSONB column.
 *
 * WHY a dedicated service:
 * - The CV Generator reads it. The CV Editor writes it. Both should go
 *   through the same shape validation and defaulting logic.
 * - When we promote fields out of JSONB into real tables in v2, only this
 *   file changes. Callers don't care where the data physically lives.
 *
 * Turn E changes:
 * - save() now verifies the write with .select() — Supabase silently
 *   no-ops on RLS denial or missing row, and we need to distinguish
 *   "nothing to save" from "saved but then not" from "rejected."
 * - save() no longer normalizes on the way in. If the user typed a referee
 *   with a 2-char name, we store it. The phrase engine decides what's
 *   renderable. Stripping on save loses user data silently.
 * - load() still normalizes — protects the UI from malformed blobs.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
    CVExtras,
    CVAward,
    CVLeadership,
    CVReferee,
} from '../lib/phraseEngine';

/** The canonical empty shape. Every field is explicitly null, not undefined. */
export function emptyCVExtras(): CVExtras {
    return {
        strengths: null,
        interests: null,
        availability: null,
        awards: null,
        leadership: null,
        referees: null,
        summary: null,
    };
}

/**
 * Defensively coerce a persisted blob into a valid CVExtras.
 *
 * WHY this runs on load but not on save:
 * On load, we can't trust that the blob wasn't corrupted by an older
 * version, a manual SQL edit, or an interrupted write. Coercing keeps the
 * editor from crashing on `.map()` of a non-array.
 *
 * On save, we trust the editor — it produces valid shapes by construction.
 * Normalizing on save would strip fields the user typed (e.g. a 2-char
 * referee name) with no feedback. Better to store exactly what they wrote
 * and let the phrase engine filter at render time.
 */
export function normalizeCVExtras(raw: unknown): CVExtras {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return emptyCVExtras();
    }
    const r = raw as Record<string, unknown>;

    return {
        strengths: asStringArray(r.strengths),
        interests: asStringArray(r.interests),
        availability: typeof r.availability === 'string' && r.availability.trim()
            ? r.availability.trim()
            : null,
        awards: asArray<CVAward>(r.awards, normalizeAward),
        leadership: asArray<CVLeadership>(r.leadership, normalizeLeadership),
        referees: asArray<CVReferee>(r.referees, normalizeReferee),
        summary: typeof r.summary === 'string' && r.summary.trim()
            ? r.summary.trim()
            : null,
    };
}

function asStringArray(v: unknown): string[] | null {
    if (!Array.isArray(v)) return null;
    const out = v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    return out.length ? out.map((s) => s.trim()) : null;
}

function asArray<T>(
    v: unknown,
    item: (x: unknown) => T | null,
): T[] | null {
    if (!Array.isArray(v)) return null;
    const out = v.map(item).filter((x): x is T => x !== null);
    return out.length ? out : null;
}

function normalizeAward(v: unknown): CVAward | null {
    if (!v || typeof v !== 'object') return null;
    const r = v as Record<string, unknown>;
    if (typeof r.title !== 'string') return null;
    return {
        id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
        title: r.title,
        issuer: typeof r.issuer === 'string' ? r.issuer : null,
        date: typeof r.date === 'string' && r.date ? r.date : null,
        description: typeof r.description === 'string' ? r.description : null,
    };
}

function normalizeLeadership(v: unknown): CVLeadership | null {
    if (!v || typeof v !== 'object') return null;
    const r = v as Record<string, unknown>;
    if (typeof r.role !== 'string') return null;
    return {
        id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
        role: r.role,
        organization: typeof r.organization === 'string' ? r.organization : '',
        start_date: typeof r.start_date === 'string' && r.start_date ? r.start_date : null,
        end_date: typeof r.end_date === 'string' && r.end_date ? r.end_date : null,
        description: typeof r.description === 'string' ? r.description : null,
    };
}

function normalizeReferee(v: unknown): CVReferee | null {
    if (!v || typeof v !== 'object') return null;
    const r = v as Record<string, unknown>;
    if (typeof r.name !== 'string') return null;
    return {
        id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
        name: r.name,
        title: typeof r.title === 'string' ? r.title : null,
        organization: typeof r.organization === 'string' ? r.organization : null,
        phone: typeof r.phone === 'string' ? r.phone : null,
        email: typeof r.email === 'string' ? r.email : null,
        relationship: typeof r.relationship === 'string' ? r.relationship : null,
    };
}

export type SaveResult =
    | { ok: true; savedAt: Date }
    | { ok: false; error: string; reason: 'network' | 'auth' | 'rls' | 'unknown' };

export const cvExtrasService = {
    async load(userId: string): Promise<CVExtras> {
        if (!isSupabaseConfigured || !userId) return emptyCVExtras();
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('cv_extras')
                .eq('id', userId)
                .maybeSingle();
            if (error) {
                console.warn('[cvExtrasService] load failed:', error.message);
                return emptyCVExtras();
            }
            if (!data) return emptyCVExtras();
            return normalizeCVExtras(data.cv_extras);
        } catch (err) {
            console.warn('[cvExtrasService] load failed:', err);
            return emptyCVExtras();
        }
    },

    /**
     * Save cv_extras.
     *
     * WHY .select() after .update():
     * Supabase's update builder silently returns zero rows on RLS denial or
     * when the target row doesn't exist. Without a select, the caller can't
     * tell "saved successfully" from "did nothing." Adding .select() forces
     * the write to return the updated row so we can verify it landed.
     *
     * We store exactly what the editor hands us. No normalization on save.
     */
    async save(userId: string, extras: CVExtras): Promise<SaveResult> {
        if (!isSupabaseConfigured) {
            return { ok: false, error: 'Supabase not configured', reason: 'network' };
        }
        if (!userId) {
            return { ok: false, error: 'Not signed in', reason: 'auth' };
        }

        try {
            const { data, error, status } = await supabase
                .from('profiles')
                .update({ cv_extras: extras })
                .eq('id', userId)
                .select('id, cv_extras')
                .maybeSingle();

            if (error) {
                // RLS denial typically surfaces as a 403 with a "row-level security"
                // message. Distinguish it so the user sees "permission" rather than
                // a generic network error.
                const isRls =
                    status === 403 ||
                    error.message.toLowerCase().includes('row-level security') ||
                    error.message.toLowerCase().includes('permission');
                return {
                    ok: false,
                    error: isRls
                        ? 'Save blocked — please sign out and back in.'
                        : error.message,
                    reason: isRls ? 'rls' : 'unknown',
                };
            }

            if (!data) {
                // Update ran without error but no row came back. Almost always
                // means the profile row doesn't exist for this user, or RLS hid it.
                return {
                    ok: false,
                    error: 'Profile not found — please complete your profile first.',
                    reason: 'rls',
                };
            }

            return { ok: true, savedAt: new Date() };
        } catch (err) {
            return {
                ok: false,
                error: err instanceof Error ? err.message : 'Save failed',
                reason: 'network',
            };
        }
    },
};