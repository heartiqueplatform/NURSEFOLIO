/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { locumService, LocumUrgency } from '../services/locumService';
import {
    ArrowLeft, Briefcase, Calendar, Clock, MapPin, MessageSquare,
    Send, AlertCircle, Building, Phone
} from 'lucide-react';

// ==========================================
// CONSTANTS
// ==========================================
const URGENCY_META: Record<LocumUrgency, { label: string; classes: string; dot: string; hint: string }> = {
    urgent: {
        label: 'Urgent',
        classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
        dot: 'bg-rose-500 animate-pulse',
        hint: 'Within 24 hours'
    },
    soon: {
        label: 'Soon',
        classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
        dot: 'bg-amber-500',
        hint: 'Within 1–3 days'
    },
    planned: {
        label: 'Planned',
        classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
        dot: 'bg-emerald-500',
        hint: 'Scheduled ahead'
    }
};

const SPECIALTIES = [
    'ICU', 'Emergency', 'Pediatrics', 'Oncology', 'Cardiology',
    'Neurology', 'Maternity', 'Surgical', 'Psychiatric', 'Community Health',
    'Theatre', 'Renal', 'Orthopedics', 'Geriatrics', 'General Ward'
];

// ==========================================
// FIELD WRAPPER
// ==========================================
const Field = React.memo<{
    label: string;
    required?: boolean;
    optional?: boolean;
    hint?: string;
    icon?: any;
    children: React.ReactNode;
}>(({ label, required, optional, hint, icon: Icon, children }) => (
    <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
            {optional && <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>}
        </label>
        {children}
        {hint && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>
        )}
    </div>
));
Field.displayName = 'Field';

// Shared input classes
const inputClass =
    'w-full text-sm px-4 py-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition';

// ==========================================
// MAIN PAGE
// ==========================================
export default function PostLocumRequest() {
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Form
    const [facilityName, setFacilityName] = useState('');
    const [facilityLocation, setFacilityLocation] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [shiftDate, setShiftDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [shiftStart, setShiftStart] = useState('08:00');
    const [shiftEnd, setShiftEnd] = useState('20:00');
    const [urgency, setUrgency] = useState<LocumUrgency>('soon');
    const [notes, setNotes] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ----------------------------------------------------------
    // Prefill from profile
    // ----------------------------------------------------------
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (cancelled) return;
            if (!user) {
                navigate('/login');
                return;
            }
            setCurrentUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('phone_number, location')
                .eq('id', user.id)
                .single();

            if (cancelled) return;
            if (profile?.phone_number) setContactPhone(profile.phone_number);
            if (profile?.location) setFacilityLocation(profile.location);
            setLoadingUser(false);
        })();

        return () => { cancelled = true; };
    }, [navigate]);

    // ----------------------------------------------------------
    // Submit
    // ----------------------------------------------------------
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentUserId) { setError('You must be signed in'); return; }
        if (!facilityLocation.trim()) { setError('Please enter the facility location'); return; }
        if (!shiftDate) { setError('Please pick a shift date'); return; }

        // Sanity check: end time after start time
        if (shiftStart && shiftEnd && shiftEnd <= shiftStart) {
            setError('End time must be after start time');
            return;
        }

        setSubmitting(true);
        try {
            await locumService.createRequest({
                requester_id: currentUserId,
                facility_name: facilityName.trim() || null,
                facility_location: facilityLocation.trim(),
                specialty: specialty || null,
                shift_date: shiftDate,
                shift_start: shiftStart || null,
                shift_end: shiftEnd || null,
                urgency,
                notes: notes.trim() || null,
                contact_phone: contactPhone.trim() || null,
            });
            navigate('/locum?posted=1');
        } catch (err: any) {
            console.error('Post request failed:', err);
            setError(err?.message || 'Failed to post request. Please try again.');
            setSubmitting(false);
        }
    }, [
        currentUserId, facilityName, facilityLocation, specialty, shiftDate,
        shiftStart, shiftEnd, urgency, notes, contactPhone, navigate
    ]);

    const handleCancel = useCallback(() => {
        if (submitting) return;
        navigate('/locum');
    }, [submitting, navigate]);

    // ----------------------------------------------------------
    // Derived — controls the disabled state of the submit button
    // ----------------------------------------------------------
    const canSubmit = useMemo(() => {
        return (
            facilityLocation.trim().length > 0 &&
            shiftDate.length > 0 &&
            !submitting
        );
    }, [facilityLocation, shiftDate, submitting]);

    // ----------------------------------------------------------
    // Loading
    // ----------------------------------------------------------
    if (loadingUser) {
        return (
            <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950">
                <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                        <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-48 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-slate-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950 pb-32">
            <div className="max-w-2xl mx-auto md:px-6 md:py-8">

                {/* Header */}
                <div className="flex items-center gap-3 px-4 md:px-0 py-4 md:py-0 md:mb-8 border-b border-slate-100 dark:border-zinc-900 md:border-0">
                    <button
                        onClick={handleCancel}
                        disabled={submitting}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-zinc-900 transition disabled:opacity-50"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Post a Shift Cover Request
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Reach nurses near you instantly
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-4 md:px-0 pt-4 md:pt-0 space-y-6">

                    {/* Error banner */}
                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 p-3.5 rounded-2xl text-sm font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ============================================
                        URGENCY — the first question, biggest decision
                        ============================================ */}
                    <section>
                        <div className="mb-3">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                How urgent is this shift?
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Urgent requests reach more nurses faster
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['urgent', 'soon', 'planned'] as LocumUrgency[]).map(u => {
                                const meta = URGENCY_META[u];
                                const isActive = urgency === u;
                                return (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => setUrgency(u)}
                                        className={`p-3 rounded-2xl text-left transition active:opacity-70 ${isActive
                                            ? meta.classes + ' ring-2 ring-current/30'
                                            : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400'
                                            }`}
                                        aria-pressed={isActive}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                            <span className="text-sm font-bold">{meta.label}</span>
                                        </div>
                                        <p className="text-[10px] opacity-80 leading-tight">{meta.hint}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ============================================
                        FACILITY
                        ============================================ */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                Facility details
                            </h2>
                        </div>

                        <Field label="Facility name" optional icon={Building}>
                            <input
                                type="text"
                                value={facilityName}
                                onChange={(e) => setFacilityName(e.target.value)}
                                placeholder="e.g., Kenyatta National Hospital"
                                autoComplete="organization"
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            label="Location"
                            required
                            icon={MapPin}
                            hint="Used to match you with nurses nearby"
                        >
                            <input
                                type="text"
                                required
                                value={facilityLocation}
                                onChange={(e) => setFacilityLocation(e.target.value)}
                                placeholder="e.g., Nairobi, Westlands"
                                autoComplete="address-level2"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Specialty needed" optional>
                            <select
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Any specialty</option>
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                    </section>

                    {/* ============================================
                        WHEN
                        ============================================ */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                When is the shift?
                            </h2>
                        </div>

                        <Field label="Date" required icon={Calendar}>
                            <input
                                type="date"
                                required
                                value={shiftDate}
                                onChange={(e) => setShiftDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={inputClass}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Start time" icon={Clock}>
                                <input
                                    type="time"
                                    value={shiftStart}
                                    onChange={(e) => setShiftStart(e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="End time" icon={Clock}>
                                <input
                                    type="time"
                                    value={shiftEnd}
                                    onChange={(e) => setShiftEnd(e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </section>

                    {/* ============================================
                        DETAILS & CONTACT
                        ============================================ */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-500" />
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                Details & contact
                            </h2>
                        </div>

                        <Field label="Notes" optional>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ward details, patient load, requirements, dress code..."
                                rows={4}
                                className={`${inputClass} resize-none`}
                            />
                        </Field>

                        <Field
                            label="Contact phone"
                            optional
                            icon={Phone}
                            hint="Shared only with the nurse you accept"
                        >
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="+254 7XX XXX XXX"
                                autoComplete="tel"
                                inputMode="tel"
                                className={inputClass}
                            />
                        </Field>
                    </section>

                </form>
            </div>

            {/* ============================================
                STICKY ACTION BAR
                ============================================ */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-100 dark:border-zinc-900 md:border-0 md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none">
                <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={submitting}
                            className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-sm font-bold active:opacity-70 transition min-h-[48px] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form=""
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex-[2] py-3.5 rounded-2xl bg-amber-500 active:bg-amber-600 text-white text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Post Request
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}