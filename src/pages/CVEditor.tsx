/**
 * CVEditor.tsx
 *
 * Fill in the CV-only fields the schema doesn't cover elsewhere.
 *
 * Turn E changes:
 * - Summary and Availability are now LOCAL DRAFT textareas. Typing updates
 *   local state; the DB write happens on blur with the current draft.
 *   This fixes the stale-closure bug that was clearing the summary on
 *   every reload (the blur handler was firing with an outdated value).
 * - Per-block save indicators. The header indicator was invisible when the
 *   user was scrolled to the bottom of the page.
 * - A bottom toast announces save success and failure so any part of the
 *   page gets feedback.
 * - Specific error messages from cvExtrasService: "Sign out and back in"
 *   for RLS, "Profile not found" for a missing row, generic for network.
 */

import {
    useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Check, AlertCircle, Loader2, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { cvExtrasService, emptyCVExtras } from '../services/cvExtrasService';
import type {
    CVExtras, CVAward, CVLeadership, CVReferee,
} from '../lib/phraseEngine';

// ---------------------------------------------------------------------------
// Save state
// ---------------------------------------------------------------------------

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveContext {
    state: SaveState;
    error: string | null;
    /** Which block triggered the last save. Used to show per-block feedback. */
    block: string | null;
    /** Timestamp of the last successful save — used to throttle toasts. */
    lastSaved: number;
}

const initialSaveContext: SaveContext = {
    state: 'idle',
    error: null,
    block: null,
    lastSaved: 0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CVEditor() {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [extras, setExtras] = useState<CVExtras>(emptyCVExtras());
    const [saveCtx, setSaveCtx] = useState<SaveContext>(initialSaveContext);

    // Timer refs so rapid saves don't stack timeouts.
    const savedTimer = useRef<number | null>(null);
    const toastTimer = useRef<number | null>(null);
    const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

    // ------------------------------------------------------------------
    // Load on mount
    // ------------------------------------------------------------------
    useEffect(() => {
        void (async () => {
            const { data: session } = await supabase.auth.getSession();
            const id = session.session?.user.id ?? null;
            setUserId(id);
            if (!id) {
                setLoading(false);
                return;
            }
            const loaded = await cvExtrasService.load(id);
            setExtras(loaded);
            setLoading(false);
        })();
    }, []);

    // ------------------------------------------------------------------
    // Save path
    // ------------------------------------------------------------------

    /**
     * Persist a full extras object. The caller has ALREADY computed the next
     * value — no updater-function side effects here, so React Strict Mode
     * double-invocation can't cause double-writes.
     */
    const persist = useCallback(
        async (next: CVExtras, blockId: string) => {
            if (!userId) return;
            setSaveCtx((c) => ({ ...c, state: 'saving', error: null, block: blockId }));

            const result = await cvExtrasService.save(userId, next);

            if (result.ok) {
                setSaveCtx({
                    state: 'saved',
                    error: null,
                    block: blockId,
                    lastSaved: Date.now(),
                });
                if (savedTimer.current) window.clearTimeout(savedTimer.current);
                savedTimer.current = window.setTimeout(() => {
                    setSaveCtx((c) => ({ ...c, state: 'idle', block: null }));
                }, 1800);
                showToast('ok', 'Saved');
            } else {
                setSaveCtx({
                    state: 'error',
                    error: result.error,
                    block: blockId,
                    lastSaved: 0,
                });
                showToast('err', result.error);
            }
        },
        [userId]
    );

    /**
     * Apply a partial update and persist.
     *
     * WHY we read from a local variable instead of using a setState updater:
     * setState updaters must be pure. Calling persist() inside one would
     * cause a network write every time React re-invokes the updater, which
     * it does during Strict Mode double-render. We compose the next value
     * synchronously from the current `extras` closure and dispatch both the
     * state change and the write from the outer scope.
     */
    const update = useCallback(
        (patch: Partial<CVExtras>, blockId: string) => {
            const next = { ...extras, ...patch };
            setExtras(next);
            void persist(next, blockId);
        },
        [extras, persist]
    );

    const showToast = (kind: 'ok' | 'err', text: string) => {
        setToast({ kind, text });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 2400);
    };

    useEffect(() => {
        return () => {
            if (savedTimer.current) window.clearTimeout(savedTimer.current);
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
    }, []);

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Sign in to edit your CV
                </h2>
                <button
                    onClick={() => navigate('/login')}
                    className="min-h-[44px] px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium"
                >
                    Sign in
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-24">
            <header className="sticky top-0 z-20 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 px-4 h-14">
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="Back"
                        className="p-2 -ml-2 rounded-xl active:scale-[98%] transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-semibold text-base">Edit CV Content</h1>
                    <div className="ml-auto">
                        <HeaderSaveIndicator ctx={saveCtx} />
                    </div>
                </div>
            </header>

            <main className="px-4 md:px-6 pt-4 md:pt-8 max-w-2xl mx-auto space-y-5">
                <Intro />

                {/* SUMMARY */}
                <Block
                    title="Professional Summary"
                    description="The opening paragraph of your CV. Write it in your own words — a short paragraph introducing who you are, what you do, and what you bring."
                    blockId="summary"
                    saveCtx={saveCtx}
                >
                    <DraftTextarea
                        value={extras.summary ?? ''}
                        onCommit={(v) => update({ summary: v.trim() || null }, 'summary')}
                        placeholder="Registered Nurse, actively licensed by the Nursing Council of Kenya (NCK), holding a Diploma in Kenya Registered Community Health Nursing (KRCHN) from..."
                        rows={6}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        Leave empty to use our generated summary.
                    </p>
                </Block>

                {/* STRENGTHS */}
                <Block
                    title="Professional Strengths"
                    description="Values and qualities you bring to a role. Short phrases only — Integrity, Calm under pressure, Continuous learning."
                    blockId="strengths"
                    saveCtx={saveCtx}
                >
                    <StringListEditor
                        items={extras.strengths ?? []}
                        onChange={(items) => update({ strengths: items.length ? items : null }, 'strengths')}
                        placeholder="Add a strength"
                        max={12}
                    />
                </Block>

                {/* INTERESTS */}
                <Block
                    title="Interests"
                    description="Professional interests and areas of focus. Short phrases only."
                    blockId="interests"
                    saveCtx={saveCtx}
                >
                    <StringListEditor
                        items={extras.interests ?? []}
                        onChange={(items) => update({ interests: items.length ? items : null }, 'interests')}
                        placeholder="Add an interest"
                        max={12}
                    />
                </Block>

                {/* AVAILABILITY */}
                <Block
                    title="Availability"
                    description="One line stating your current availability. This sits at the bottom of the CV as the call to action."
                    blockId="availability"
                    saveCtx={saveCtx}
                >
                    <DraftTextarea
                        value={extras.availability ?? ''}
                        onCommit={(v) => update({ availability: v.trim() || null }, 'availability')}
                        placeholder="Available for immediate employment and flexible to work rotational shifts, including weekends and public holidays."
                        rows={3}
                    />
                </Block>

                {/* AWARDS */}
                <Block
                    title="Awards & Honors"
                    description="Recognitions from schools, employers, or professional bodies."
                    blockId="awards"
                    saveCtx={saveCtx}
                >
                    <EntryList<CVAward>
                        items={extras.awards ?? []}
                        onChange={(items) => update({ awards: items.length ? items : null }, 'awards')}
                        newItem={() => ({
                            id: crypto.randomUUID(),
                            title: '',
                            issuer: null,
                            date: null,
                            description: null,
                        })}
                        renderItem={(item, patch) => (
                            <div className="space-y-2">
                                <Field label="Title">
                                    <input
                                        value={item.title}
                                        onChange={(e) => patch({ title: e.target.value })}
                                        placeholder="Leadership Certificate"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Issuer">
                                        <input
                                            value={item.issuer ?? ''}
                                            onChange={(e) => patch({ issuer: e.target.value || null })}
                                            placeholder="Fidenza School of Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Year">
                                        <input
                                            type="number"
                                            value={item.date ? item.date.slice(0, 4) : ''}
                                            onChange={(e) => {
                                                const y = e.target.value;
                                                patch({ date: y ? `${y}-01-01` : null });
                                            }}
                                            placeholder="2025"
                                            min={1960}
                                            max={2100}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <Field label="Description (optional)">
                                    <textarea
                                        value={item.description ?? ''}
                                        onChange={(e) => patch({ description: e.target.value || null })}
                                        placeholder="Awarded in recognition of..."
                                        rows={2}
                                        className={`${inputClass} resize-y`}
                                    />
                                </Field>
                            </div>
                        )}
                        itemTitle={(item) => item.title || 'Untitled award'}
                    />
                </Block>

                {/* LEADERSHIP */}
                <Block
                    title="Leadership & Professional Development"
                    description="Roles you've held that aren't paid employment — founder of a study platform, committee member, mentorship lead."
                    blockId="leadership"
                    saveCtx={saveCtx}
                >
                    <EntryList<CVLeadership>
                        items={extras.leadership ?? []}
                        onChange={(items) => update({ leadership: items.length ? items : null }, 'leadership')}
                        newItem={() => ({
                            id: crypto.randomUUID(),
                            role: '',
                            organization: '',
                            start_date: null,
                            end_date: null,
                            description: null,
                        })}
                        renderItem={(item, patch) => (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Role">
                                        <input
                                            value={item.role}
                                            onChange={(e) => patch({ role: e.target.value })}
                                            placeholder="Founder"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Organization">
                                        <input
                                            value={item.organization}
                                            onChange={(e) => patch({ organization: e.target.value })}
                                            placeholder="Medrae Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Start year">
                                        <input
                                            type="number"
                                            value={item.start_date ? item.start_date.slice(0, 4) : ''}
                                            onChange={(e) => {
                                                const y = e.target.value;
                                                patch({ start_date: y ? `${y}-01-01` : null });
                                            }}
                                            placeholder="2025"
                                            min={1960}
                                            max={2100}
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="End year (blank = current)">
                                        <input
                                            type="number"
                                            value={item.end_date ? item.end_date.slice(0, 4) : ''}
                                            onChange={(e) => {
                                                const y = e.target.value;
                                                patch({ end_date: y ? `${y}-01-01` : null });
                                            }}
                                            placeholder=""
                                            min={1960}
                                            max={2100}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <Field label="Description (optional)">
                                    <textarea
                                        value={item.description ?? ''}
                                        onChange={(e) => patch({ description: e.target.value || null })}
                                        placeholder="Founded Medrae Nursing, an educational platform..."
                                        rows={3}
                                        className={`${inputClass} resize-y`}
                                    />
                                </Field>
                            </div>
                        )}
                        itemTitle={(item) => item.role || 'Untitled role'}
                    />
                </Block>

                {/* REFEREES */}
                <Block
                    title="Referees"
                    description="Up to three. Phone number is what HR actually calls — email is optional."
                    blockId="referees"
                    saveCtx={saveCtx}
                >
                    <EntryList<CVReferee>
                        items={extras.referees ?? []}
                        onChange={(items) =>
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
                            <div className="space-y-2">
                                <Field label="Name">
                                    <input
                                        value={item.name}
                                        onChange={(e) => patch({ name: e.target.value })}
                                        placeholder="Sr. Jessie Brian"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Title">
                                        <input
                                            value={item.title ?? ''}
                                            onChange={(e) => patch({ title: e.target.value || null })}
                                            placeholder="Head of Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Organization">
                                        <input
                                            value={item.organization ?? ''}
                                            onChange={(e) => patch({ organization: e.target.value || null })}
                                            placeholder="Fidenza School of Nursing"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Phone">
                                        <input
                                            value={item.phone ?? ''}
                                            onChange={(e) => patch({ phone: e.target.value || null })}
                                            placeholder="+254 790 822 695"
                                            inputMode="tel"
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Email (optional)">
                                        <input
                                            value={item.email ?? ''}
                                            onChange={(e) => patch({ email: e.target.value || null })}
                                            placeholder=""
                                            inputMode="email"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                            </div>
                        )}
                        itemTitle={(item) => item.name || 'Untitled referee'}
                        maxItems={3}
                    />
                </Block>
            </main>

            {/* BOTTOM TOAST — visible from anywhere on the page */}
            <Toast toast={toast} />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Draft textarea — the fix for the stale-closure bug
// ---------------------------------------------------------------------------

/**
 * A textarea that holds a local draft.
 *
 * WHY not bind directly to the parent's value:
 * Text fields that write on blur need the CURRENT draft, not the value
 * captured in a closure from a previous render. Local state guarantees the
 * draft is always current at the moment blur fires. The parent only sees
 * the committed value.
 *
 * Extra nicety: if the parent's value changes externally (e.g. server
 * returns a normalized version), we don't clobber the user's typing. The
 * draft wins until they commit.
 */
function DraftTextarea({
    value,
    onCommit,
    placeholder,
    rows,
}: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    const [draft, setDraft] = useState(value);

    // If the parent value changes from outside (rare — e.g. reset), sync.
    // We compare against the last committed value so mid-typing doesn't
    // clobber the draft.
    const lastCommittedRef = useRef(value);
    useEffect(() => {
        if (value !== lastCommittedRef.current) {
            lastCommittedRef.current = value;
            setDraft(value);
        }
    }, [value]);

    const commit = () => {
        if (draft !== lastCommittedRef.current) {
            lastCommittedRef.current = draft;
            onCommit(draft);
        }
    };

    return (
        <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            placeholder={placeholder}
            rows={rows}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 resize-y"
        />
    );
}

// ---------------------------------------------------------------------------
// Save indicators
// ---------------------------------------------------------------------------

function HeaderSaveIndicator({ ctx }: { ctx: SaveContext }) {
    // The header shows a small overall status; the per-block indicator shows
    // precise feedback. Header stays quiet unless something is wrong.
    if (ctx.state === 'error') {
        return (
            <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                Not saved
            </span>
        );
    }
    if (ctx.state === 'saving') {
        return (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving
            </span>
        );
    }
    return null;
}

function BlockSavePill({ ctx, blockId }: { ctx: SaveContext; blockId: string }) {
    const active = ctx.block === blockId;
    if (!active) return null;
    if (ctx.state === 'saving') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving
            </span>
        );
    }
    if (ctx.state === 'saved') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <Check className="w-3 h-3" />
                Saved
            </span>
        );
    }
    if (ctx.state === 'error') {
        return (
            <span
                title={ctx.error ?? undefined}
                className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400"
            >
                <AlertCircle className="w-3 h-3" />
                Not saved
            </span>
        );
    }
    return null;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ toast }: { toast: { kind: 'ok' | 'err'; text: string } | null }) {
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed left-1/2 -translate-x-1/2 z-50 px-4"
                    style={{ bottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
                >
                    <div
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium ${toast.kind === 'ok'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                            }`}
                    >
                        {toast.kind === 'ok' ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <AlertCircle className="w-4 h-4" />
                        )}
                        {toast.text}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

const inputClass =
    'w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10';

function Intro() {
    return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Everything you write here is only used to build your CV. It never
                leaves your account, and no one sees it until you decide to share
                the CV itself.
            </p>
        </div>
    );
}

function Block({
    title,
    description,
    children,
    blockId,
    saveCtx,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    blockId: string;
    saveCtx: SaveContext;
}) {
    return (
        <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="text-sm font-semibold">{title}</h2>
                <BlockSavePill ctx={saveCtx} blockId={blockId} />
            </div>
            {description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
                    {description}
                </p>
            )}
            {children}
        </section>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</span>
            {children}
        </label>
    );
}

// ---------------------------------------------------------------------------
// String list editor
// ---------------------------------------------------------------------------

function StringListEditor({
    items, onChange, placeholder, max,
}: {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder: string;
    max: number;
}) {
    const [draft, setDraft] = useState('');

    const add = () => {
        const v = draft.trim();
        if (!v) return;
        if (items.length >= max) return;
        onChange([...items, v]);
        setDraft('');
    };

    const remove = (i: number) => {
        onChange(items.filter((_, idx) => idx !== i));
    };

    return (
        <div className="space-y-2">
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence initial={false}>
                        {items.map((item, i) => (
                            <motion.span
                                key={`${item}-${i}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 pl-3 pr-1.5 py-1 text-sm"
                            >
                                {item}
                                <button
                                    onClick={() => remove(i)}
                                    aria-label={`Remove ${item}`}
                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition"
                                >
                                    <Trash2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                                </button>
                            </motion.span>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            {items.length < max && (
                <div className="flex gap-2">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                add();
                            }
                        }}
                        placeholder={placeholder}
                        className={inputClass}
                    />
                    <button
                        onClick={add}
                        disabled={!draft.trim()}
                        className="shrink-0 min-h-[44px] px-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium active:scale-[98%] disabled:opacity-40 transition flex items-center"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {items.length} of {max}
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Entry list
// ---------------------------------------------------------------------------

function EntryList<T extends { id: string }>({
    items, onChange, newItem, renderItem, itemTitle, maxItems,
}: {
    items: T[];
    onChange: (items: T[]) => void;
    newItem: () => T;
    renderItem: (item: T, patch: (p: Partial<T>) => void) => React.ReactNode;
    itemTitle: (item: T) => string;
    maxItems?: number;
}) {
    const atMax = maxItems !== undefined && items.length >= maxItems;

    const add = () => {
        if (atMax) return;
        onChange([...items, newItem()]);
    };

    const remove = (i: number) => {
        onChange(items.filter((_, idx) => idx !== i));
    };

    const patchAt = (i: number, p: Partial<T>) => {
        onChange(items.map((item, idx) => (idx === i ? { ...item, ...p } : item)));
    };

    return (
        <div className="space-y-3">
            <AnimatePresence initial={false}>
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-950"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate pr-2">
                                {itemTitle(item)}
                            </span>
                            <button
                                onClick={() => remove(i)}
                                aria-label="Remove"
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 active:scale-95 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        {renderItem(item, (p) => patchAt(i, p))}
                    </motion.div>
                ))}
            </AnimatePresence>

            {!atMax && (
                <button
                    onClick={add}
                    className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 active:scale-[98%] transition flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add entry
                </button>
            )}

            {maxItems !== undefined && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {items.length} of {maxItems}
                </p>
            )}
        </div>
    );
}