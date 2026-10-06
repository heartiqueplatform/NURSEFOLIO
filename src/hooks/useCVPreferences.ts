/**
 * useCVPreferences.ts
 *
 * Per-user CV preferences: section visibility, section order, photo flag.
 *
 * WHY localStorage and not Supabase (for now):
 * - Preferences are cosmetic and belong on the device, not in the cloud.
 *   Syncing them to Supabase means an extra round trip on every page load
 *   for data that only matters to this user on this device.
 * - It's a privacy win: the CV Generator's state never leaves the browser.
 * - Keyed by user id so shared phones (common in Kenya) don't cross
 *   preferences between users.
 *
 * If we later want cross-device sync, we add a Supabase table and merge:
 * remote wins on conflict, local is the cache. This hook's public API stays
 * identical — the storage backend is an implementation detail.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CV_SECTIONS,
    defaultSectionOrder,
    REQUIRED_SECTIONS,
    type CVSectionId,
} from '../lib/cvSections';

export interface CVPreferences {
    /** Order of sections, split into left and right columns internally. */
    order: CVSectionId[];
    /** Section id -> visible. Required sections default true and stay true. */
    visibility: Record<CVSectionId, boolean>;
    /** Whether to render the photo in the header. */
    showPhoto: boolean;
}

const STORAGE_VERSION = 1;

function storageKey(userId: string): string {
    return `nursefolio:cv-prefs:v${STORAGE_VERSION}:${userId}`;
}

function defaultPreferences(): CVPreferences {
    const visibility = Object.fromEntries(
        CV_SECTIONS.map((s) => [s.id, true])
    ) as Record<CVSectionId, boolean>;
    return {
        order: defaultSectionOrder(),
        visibility,
        showPhoto: true,
    };
}

/** Merge stored prefs with defaults so new sections get sensible state. */
function mergeWithDefaults(stored: Partial<CVPreferences> | null): CVPreferences {
    const base = defaultPreferences();
    if (!stored) return base;

    // Rebuild order: keep any section ids we still recognize, in the stored
    // order, then append any new sections at the end of their column's group.
    const known = new Set(CV_SECTIONS.map((s) => s.id));
    const storedOrder = (stored.order ?? []).filter((id): id is CVSectionId =>
        known.has(id as CVSectionId)
    );
    const missing = base.order.filter((id) => !storedOrder.includes(id));
    const order = [...storedOrder, ...missing];

    const visibility = { ...base.visibility, ...(stored.visibility ?? {}) };
    // Enforce required sections are visible regardless of stored state.
    for (const id of REQUIRED_SECTIONS) visibility[id] = true;

    return {
        order,
        visibility,
        showPhoto: stored.showPhoto ?? true,
    };
}

export interface UseCVPreferencesResult {
    prefs: CVPreferences;
    /** Toggle a section on/off. No-op for required sections. */
    setSectionVisible: (id: CVSectionId, visible: boolean) => void;
    /** Replace the order with a full new sequence. */
    setOrder: (order: CVSectionId[]) => void;
    setShowPhoto: (show: boolean) => void;
    /** Reset everything to defaults. */
    reset: () => void;
}

export function useCVPreferences(userId: string | null): UseCVPreferencesResult {
    const [prefs, setPrefs] = useState<CVPreferences>(() => defaultPreferences());

    // Load when the user id becomes available (post-auth).
    useEffect(() => {
        if (!userId) {
            setPrefs(defaultPreferences());
            return;
        }
        try {
            const raw = localStorage.getItem(storageKey(userId));
            const parsed = raw ? (JSON.parse(raw) as Partial<CVPreferences>) : null;
            setPrefs(mergeWithDefaults(parsed));
        } catch {
            // Corrupt storage (user cleared a key, wrong version, bad JSON) —
            // fall back to defaults rather than crashing the page.
            setPrefs(defaultPreferences());
        }
    }, [userId]);

    // Persist on every change. Cheap enough at this size.
    useEffect(() => {
        if (!userId) return;
        try {
            localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
        } catch {
            // Quota exceeded or private mode blocking writes — non-fatal.
            // The page still works for this session.
        }
    }, [userId, prefs]);

    const setSectionVisible = useCallback((id: CVSectionId, visible: boolean) => {
        if (REQUIRED_SECTIONS.includes(id)) return;
        setPrefs((p) => ({
            ...p,
            visibility: { ...p.visibility, [id]: visible },
        }));
    }, []);

    const setOrder = useCallback((order: CVSectionId[]) => {
        setPrefs((p) => ({ ...p, order }));
    }, []);

    const setShowPhoto = useCallback((show: boolean) => {
        setPrefs((p) => ({ ...p, showPhoto: show }));
    }, []);

    const reset = useCallback(() => {
        setPrefs(defaultPreferences());
    }, []);

    return useMemo(
        () => ({ prefs, setSectionVisible, setOrder, setShowPhoto, reset }),
        [prefs, setSectionVisible, setOrder, setShowPhoto, reset]
    );
}

/** Helper: order sections of a given column, respecting prefs, dropping hidden. */
export function orderedVisibleSections(
    prefs: CVPreferences,
    column: 'left' | 'right'
): CVSectionId[] {
    const inColumn = new Set(
        CV_SECTIONS.filter((s) => s.column === column).map((s) => s.id)
    );
    return prefs.order.filter((id) => inColumn.has(id) && prefs.visibility[id]);
}