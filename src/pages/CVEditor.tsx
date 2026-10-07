/**
 * CVEditor.tsx
 *
 * Extra CV content that isn't covered by the main profile.
 * Summary, strengths, interests, availability, awards, leadership, referees.
 *
 * Design notes:
 * - Each block saves on blur. No explicit save button per section.
 * - One toast at the bottom confirms success/failure, visible from anywhere.
 * - No motion/react. Pure CSS for the two animations we need.
 * - Field-level SaveIndicator only appears on the block being edited.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Check, AlertCircle, Loader2, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cvExtrasService, emptyCVExtras } from '../services/cvExtrasService';
import type {
    CVExtras, CVAward, CVLeadership, CVReferee,
} from '../lib/phraseEngine';

// ==========================================================
// SHARED STYLES
// ==========================================================
const inputClass =
    'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition';

const labelClass =
    'block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5';

// ==========================================================
// SAVE STATE
// ==========================================================
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatus {
    state: SaveState;
    block: string | null;
    error: string | null;
}

const IDLE: SaveStatus = { state: 'idle', block: null, error: null };

// ==========================================================
// MAIN
// ==========================================================
export default function CVEditor() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [extras, setExtras] = useState<CVExtras>(() => emptyCVExtras());
    const [save, setSave] = useState<SaveStatus>(IDLE);

    // Timer refs so rapid saves don't stack.
    const savedTimerRef = useRef<number | null>(null);

    // Toast
    const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const toastTimerRef = useRef<number | null>(null);

    // ----------------------------------------------------------
    // Load
    // ----------------------------------------------------------
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const id = data.session?.user.id ?? null;
                if (cancelled) return;
                setUserId(id);
                if (!id) return;

                const loaded = await cvExtrasService.load(id);
                if (!cancelled) setExtras(loaded);
            } catch (err) {
                console.error('Failed to load CV extras:', err);
                if (!cancelled) setToast({ kind: 'err', text: 'Could not load your CV data.' });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        };
    }, []);

    // ----------------------------------------------------------
    // Toast helper
    // ----------------------------------------------------------
    const showToast = useCallback((kind: 'ok' | 'err', text: string) => {
        setToast({ kind, text });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
    }, []);

    // ----------------------------------------------------------
    // Persist
    // ----------------------------------------------------------
    // The caller has already computed `next` — we don't use a setState
    // updater here, which avoids the Strict-Mode double-write problem.
    const persist = useCallback(async (next: CVExtras, blockId: string) => {
        if (!userId) return;

        setSave({ state: 'saving', block: blockId, error: null });
        const result = await cvExtrasService.save(userId, next);

        if (result.ok) {
            setSave({ state: 'saved', block: blockId, error: null });
            showToast('ok', 'Saved');

            if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
            savedTimerRef.current = window.setTimeout(() => {
                setSave(prev => (prev.block === blockId ? IDLE : prev));
            }, 1500);
        } else {
            setSave({ state: 'error', block: blockId, error: result.error });
            showToast('err', result.error || 'Save failed');
        }
    }, [userId, showToast]);

    const update = useCallback((patch: Partial<CVExtras>, blockId: string) => {
        setExtras(prev => {
            const next = { ...prev, ...patch };
            // Fire-and-forget persistence. State is already updated optimistically.
            void persist(next, blockId);
            return next;
        });
    }, [persist]);

    // ----------------------------------------------------------
    // GUARDS
    // ----------------------------------------------------------
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-teal-600 dark:text-teal-400 animate-spin" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-6">
                <div className="max-w-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h1 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                        Sign in to edit your CV
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Your CV editor is only available when you're signed in.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-teal-600 active:bg-teal-700 text-white text-sm font-bold transition min-h-[48px]"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================================
    // RENDER
    // ==========================================================
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto md:px-6 md:py-8 pb-24">

                {/* ============================================
            HEADER
            ============================================ */}
                <div className="px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-6 flex items-start gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition flex-shrink-0"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Edit CV content
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Everything saves automatically as you type
                        </p>
                    </div>
                    {/* Header save status — only shows during save/error */}
                    <HeaderSaveStatus status={save} />
                </div>

                {/* ============================================
            INTRO
            ============================================ */}
                <div className="mx-4 md:mx-0 mb-5 bg-slate-100 dark:bg-zinc-900 rounded-2xl px-4 py-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Everything here builds your CV. Nothing is shared publicly —
                        recruiters only see this on the CV you download or send.
                    </p>
                </div>

                {/* ============================================
            BLOCKS
            ============================================ */}

                <Block
                    title="Professional summary"
                    hint="The opening paragraph of your CV."
                    blockId="summary"
                    save={save}
                >
                    <DraftTextarea
                        value={extras.summary ?? ''}
                        onCommit={v => update({ summary: v.trim() || null }, 'summary')}
                        placeholder="Registered Nurse actively licensed by the Nursing Council of Kenya (NCK), with a Diploma in Kenya Registered Community Health Nursing (KRCHN)..."
                        rows={6}
                        blockId="summary"
                    />
                </Block>

                <Block
                    title="Strengths"
                    hint="Values and qualities you bring. Short phrases only."
                    blockId="strengths"
                    save={save}
                >
                    <StringListEditor
                        items={extras.strengths ?? []}
                        onChange={items => update({ strengths: items.length ? items : null }, 'strengths')}
                        placeholder="Add a strength"
                        max={12}
                    />
                </Block>

                <Block
                    title="Interests"
                    hint="Professional interests and clinical focus areas."
                    blockId="interests"
                    save={save}
                >
                    <StringListEditor
                        items={extras.interests ?? []}
                        onChange={items => update({ interests: items.length ? items : null }, 'interests')}
                        placeholder="Add an interest"
                        max={12}
                    />
                </Block>

                <Block
                    title="Availability"
                    hint="One line at the bottom of your CV. Signals when you're open to work."
                    blockId="availability"
                    save={save}
                >
                    <DraftTextarea
                        value={extras.availability ?? ''}
                        onCommit={v => update({ availability: v.trim() || null }, 'availability')}
                        placeholder="Available for immediate employment and flexible to work rotational shifts, including weekends and public holidays."
                        rows={3}
                        blockId="availability"
                    />
                </Block>

                <Block
                    title="Awards & honors"
                    hint="Recognitions from schools, employers, or professional bodies."
                    blockId="awards"
                    save={save}
                >
                    <EntryList<CVAward>
                        items={extras.awards ?? []}
                        onChange={items => update({ awards: items.length ? items : null }, 'awards')}
                        newItem={() => ({
                            id: crypto.randomUUID(),
                            title: '',
                            issuer: null,
                            date: null,
                            description: null,
                        })}
                        renderItem={(item, patch) => (
                            <>
                                <Field label="Title">
                                    <input
                                        value={item.title}
                                        onChange={e => patch({ title: e.target.value })}
                                        placeholder="Leadership certificate"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field label="Issuer">
                                        <input
                                            value={item.issuer ?? ''}
                                            onChange={e => patch({ issuer: e.target.value || null })}
                                            placeholder="Fidenza School of Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Year">
                                        <input
                                            type="number"
                                            value={item.date ? item.date.slice(0, 4) : ''}
                                            onChange={e => {
                                                const y = e.target.value;
                                                patch({ date: y ? `${y}-01-01` : null });
                                            }}
                                            placeholder="2025"
                                            min={1960}
                                            max={2100}
                                            inputMode="numeric"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <Field label="Description" optional className="mt-3">
                                    <textarea
                                        value={item.description ?? ''}
                                        onChange={e => patch({ description: e.target.value || null })}
                                        placeholder="Awarded in recognition of..."
                                        rows={2}
                                        className={`${inputClass} resize-none`}
                                    />
                                </Field>
                            </>
                        )}
                        itemTitle={item => item.title || 'Untitled award'}
                    />
                </Block>

                <Block
                    title="Leadership & development"
                    hint="Roles you've held outside paid work — study groups, committees, mentorships."
                    blockId="leadership"
                    save={save}
                >
                    <EntryList<CVLeadership>
                        items={extras.leadership ?? []}
                        onChange={items => update({ leadership: items.length ? items : null }, 'leadership')}
                        newItem={() => ({
                            id: crypto.randomUUID(),
                            role: '',
                            organization: '',
                            start_date: null,
                            end_date: null,
                            description: null,
                        })}
                        renderItem={(item, patch) => (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Role">
                                        <input
                                            value={item.role}
                                            onChange={e => patch({ role: e.target.value })}
                                            placeholder="Founder"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Organization">
                                        <input
                                            value={item.organization}
                                            onChange={e => patch({ organization: e.target.value })}
                                            placeholder="Medrae Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field label="Start year">
                                        <input
                                            type="number"
                                            value={item.start_date ? item.start_date.slice(0, 4) : ''}
                                            onChange={e => {
                                                const y = e.target.value;
                                                patch({ start_date: y ? `${y}-01-01` : null });
                                            }}
                                            placeholder="2023"
                                            min={1960}
                                            max={2100}
                                            inputMode="numeric"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="End year" optional>
                                        <input
                                            type="number"
                                            value={item.end_date ? item.end_date.slice(0, 4) : ''}
                                            onChange={e => {
                                                const y = e.target.value;
                                                patch({ end_date: y ? `${y}-01-01` : null });
                                            }}
                                            placeholder="Leave blank if current"
                                            min={1960}
                                            max={2100}
                                            inputMode="numeric"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <Field label="Description" optional className="mt-3">
                                    <textarea
                                        value={item.description ?? ''}
                                        onChange={e => patch({ description: e.target.value || null })}
                                        placeholder="Founded Medrae Nursing, an educational platform..."
                                        rows={3}
                                        className={`${inputClass} resize-none`}
                                    />
                                </Field>
                            </>
                        )}
                        itemTitle={item => item.role || 'Untitled role'}
                    />
                </Block>

                <Block
                    title="Referees"
                    hint="Up to three. Phone is what HR actually calls — email is optional."
                    blockId="referees"
                    save={save}
                >
                    <EntryList<CVReferee>
                        items={extras.referees ?? []}
                        onChange={items =>
                            update(
                                { referees: items.slice(0, 3).length ? items.slice(0, 3) : null },
                                'referees'
                            )
                        }
                        newItem={() => ({
                            id: crypto.randomUUID(),
                            name: '',
                            title: null,
                            organization: null,
                            phone: null,
                            email: null,
                            relationship: null,
                        })}
                        renderItem={(item, patch) => (
                            <>
                                <Field label="Name">
                                    <input
                                        value={item.name}
                                        onChange={e => patch({ name: e.target.value })}
                                        placeholder="Sr. Jessie Brian"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field label="Title">
                                        <input
                                            value={item.title ?? ''}
                                            onChange={e => patch({ title: e.target.value || null })}
                                            placeholder="Head of Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Organization">
                                        <input
                                            value={item.organization ?? ''}
                                            onChange={e => patch({ organization: e.target.value || null })}
                                            placeholder="Fidenza School of Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <Field label="Phone">
                                        <input
                                            value={item.phone ?? ''}
                                            onChange={e => patch({ phone: e.target.value || null })}
                                            placeholder="+254 790 822 695"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Email" optional>
                                        <input
                                            value={item.email ?? ''}
                                            onChange={e => patch({ email: e.target.value || null })}
                                            placeholder=""
                                            inputMode="email"
                                            autoComplete="email"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </>
                        )}
                        itemTitle={item => item.name || 'Untitled referee'}
                        maxItems={3}
                    />
                </Block>

            </div>

            {/* Toast */}
            {toast && (
                <Toast kind={toast.kind} text={toast.text} onDismiss={() => setToast(null)} />
            )}
        </div>
    );
}

// ==========================================================
// BLOCK
// ==========================================================
const Block = React.memo<{
    title: string;
    hint?: string;
    blockId: string;
    save: SaveStatus;
    children: React.ReactNode;
}>(({ title, hint, blockId, save, children }) => {
    const saving = save.state === 'saving' && save.block === blockId;
    const saved = save.state === 'saved' && save.block === blockId;
    const errored = save.state === 'error' && save.block === blockId;

    return (
        <section className="mx-4 md:mx-0 mb-4 bg-white dark:bg-zinc-950 md:rounded-2xl p-4 md:p-5">
            <div className="flex items-baseline justify-between gap-3 mb-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {title}
                </h2>
                {saving && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving
                    </span>
                )}
                {saved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" />
                        Saved
                    </span>
                )}
                {errored && (
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400"
                        title={save.error ?? undefined}
                    >
                        <AlertCircle className="w-3 h-3" />
                        Not saved
                    </span>
                )}
            </div>
            {hint && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    {hint}
                </p>
            )}
            {children}
        </section>
    );
});
Block.displayName = 'Block';

// ==========================================================
// FIELD
// ==========================================================
const Field = React.memo<{
    label: string;
    optional?: boolean;
    className?: string;
    children: React.ReactNode;
}>(({ label, optional, className = '', children }) => (
    <div className={className}>
        <label className={labelClass}>
            {label}
            {optional && (
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                    (optional)
                </span>
            )}
        </label>
        {children}
    </div>
));
Field.displayName = 'Field';

// ==========================================================
// DRAFT TEXTAREA
// ==========================================================
// Holds a local draft until blur. Prevents the parent from receiving
// onCommit on every keystroke (which would fire a DB write per character).
const DraftTextarea = React.memo<{
    value: string;
    onCommit: (v: string) => void;
    placeholder?: string;
    rows?: number;
    blockId: string;
}>(({ value, onCommit, placeholder, rows = 4 }) => {
    const [draft, setDraft] = useState(value);
    const lastCommittedRef = useRef(value);

    // Sync from parent only if the change is external (reset, server-normalized)
    useEffect(() => {
        if (value !== lastCommittedRef.current) {
            lastCommittedRef.current = value;
            setDraft(value);
        }
    }, [value]);

    const commit = useCallback(() => {
        if (draft !== lastCommittedRef.current) {
            lastCommittedRef.current = draft;
            onCommit(draft);
        }
    }, [draft, onCommit]);

    return (
        <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            placeholder={placeholder}
            rows={rows}
            className={`${inputClass} resize-none leading-relaxed`}
        />
    );
});
DraftTextarea.displayName = 'DraftTextarea';

// ==========================================================
// STRING LIST EDITOR
// ==========================================================
const StringListEditor = React.memo<{
    items: string[];
    onChange: (items: string[]) => void;
    placeholder: string;
    max: number;
}>(({ items, onChange, placeholder, max }) => {
    const [draft, setDraft] = useState('');
    const atMax = items.length >= max;

    const add = useCallback(() => {
        const v = draft.trim();
        if (!v || atMax) return;
        onChange([...items, v]);
        setDraft('');
    }, [draft, items, onChange, atMax]);

    const remove = useCallback((i: number) => {
        onChange(items.filter((_, idx) => idx !== i));
    }, [items, onChange]);

    return (
        <div className="space-y-3">
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {items.map((item, i) => (
                        <span
                            key={`${item}-${i}`}
                            className="inline-flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-sm font-semibold text-slate-700 dark:text-slate-300"
                        >
                            {item}
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                className="w-6 h-6 flex items-center justify-center rounded-full active:bg-slate-200 dark:active:bg-zinc-800 transition"
                                aria-label={`Remove ${item}`}
                            >
                                <X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {!atMax && (
                <div className="flex gap-2">
                    <input
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                add();
                            }
                        }}
                        placeholder={placeholder}
                        className={inputClass}
                    />
                    <button
                        type="button"
                        onClick={add}
                        disabled={!draft.trim()}
                        className="shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-2xl bg-teal-600 active:bg-teal-700 text-white disabled:opacity-40 transition"
                        aria-label="Add"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500">
                {items.length} of {max}
            </p>
        </div>
    );
});
StringListEditor.displayName = 'StringListEditor';

// ==========================================================
// ENTRY LIST
// ==========================================================
function EntryList<T extends { id: string }>({
    items,
    onChange,
    newItem,
    renderItem,
    itemTitle,
    maxItems,
}: {
    items: T[];
    onChange: (items: T[]) => void;
    newItem: () => T;
    renderItem: (item: T, patch: (p: Partial<T>) => void) => React.ReactNode;
    itemTitle: (item: T) => string;
    maxItems?: number;
}) {
    const atMax = maxItems !== undefined && items.length >= maxItems;

    const add = useCallback(() => {
        if (atMax) return;
        onChange([...items, newItem()]);
    }, [atMax, items, onChange, newItem]);

    const remove = useCallback((i: number) => {
        onChange(items.filter((_, idx) => idx !== i));
    }, [items, onChange]);

    const patchAt = useCallback((i: number, p: Partial<T>) => {
        onChange(items.map((item, idx) => (idx === i ? { ...item, ...p } : item)));
    }, [items, onChange]);

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div
                    key={item.id}
                    className="rounded-2xl bg-slate-100 dark:bg-zinc-900 p-3.5"
                >
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                            {itemTitle(item)}
                        </span>
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 active:bg-rose-50 dark:active:bg-rose-950/40 active:text-rose-600 dark:active:text-rose-400 transition"
                            aria-label="Remove entry"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    {renderItem(item, p => patchAt(i, p))}
                </div>
            ))}

            {!atMax && (
                <button
                    type="button"
                    onClick={add}
                    className="w-full min-h-[48px] rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 text-sm font-bold active:opacity-70 transition flex items-center justify-center gap-1.5"
                >
                    <Plus className="w-4 h-4" />
                    Add entry
                </button>
            )}

            {maxItems !== undefined && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {items.length} of {maxItems}
                </p>
            )}
        </div>
    );
}

// ==========================================================
// HEADER SAVE STATUS
// ==========================================================
const HeaderSaveStatus = React.memo<{ status: SaveStatus }>(({ status }) => {
    // Header only shows non-nominal states — the block-level pill handles
    // per-section feedback, and the toast handles global feedback.
    if (status.state === 'error') {
        return (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
                Not saved
            </span>
        );
    }
    return null;
});
HeaderSaveStatus.displayName = 'HeaderSaveStatus';

// ==========================================================
// TOAST
// ==========================================================
const Toast = React.memo<{
    kind: 'ok' | 'err';
    text: string;
    onDismiss: () => void;
}>(({ kind, text, onDismiss }) => (
    <div
        className="fixed left-1/2 -translate-x-1/2 z-50 px-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        role="status"
    >
        <div
            className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold shadow-lg ${kind === 'ok'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
                }`}
        >
            {kind === 'ok' ? (
                <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate max-w-[240px]">{text}</span>
        </div>
    </div>
));
Toast.displayName = 'Toast';