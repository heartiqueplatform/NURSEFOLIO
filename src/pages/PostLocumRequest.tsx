/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
        classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500 animate-pulse',
        hint: 'Needed within 24 hours'
    },
    soon: {
        label: 'Soon',
        classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
        hint: 'Needed within 1–3 days'
    },
    planned: {
        label: 'Planned',
        classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        hint: 'Scheduled in advance'
    }
};

const SPECIALTIES = [
    'ICU', 'Emergency', 'Pediatrics', 'Oncology', 'Cardiology',
    'Neurology', 'Maternity', 'Surgical', 'Psychiatric', 'Community Health',
    'Theatre', 'Renal', 'Orthopedics', 'Geriatrics', 'General Ward'
];

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

    // Prefill phone from profile
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
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

            if (profile?.phone_number) setContactPhone(profile.phone_number);
            if (profile?.location && !facilityLocation) setFacilityLocation(profile.location);

            setLoadingUser(false);
        };
        getUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentUserId) { setError('You must be signed in'); return; }
        if (!facilityLocation.trim()) { setError('Please enter the facility location'); return; }
        if (!shiftDate) { setError('Please pick a shift date'); return; }

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
                contact_phone: contactPhone.trim() || null
            });
            // Navigate back to /locum with a success indicator
            navigate('/locum?posted=1');
        } catch (err: any) {
            console.error('Post request failed:', err);
            setError(err?.message || 'Failed to post request. Please try again.');
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (submitting) return;
        navigate('/locum');
    };

    if (loadingUser) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
            <div className="max-w-2xl mx-auto px-3 md:px-6 py-4 md:py-8">

                {/* Back header */}
                <div className="flex items-center gap-3 mb-5 md:mb-8">
                    <button
                        onClick={handleCancel}
                        disabled={submitting}
                        className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-95 disabled:opacity-50"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Post a Shift Cover Request
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Reach nurses near you instantly
                        </p>
                    </div>
                </div>

                {/* Motivation banner */}
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 mb-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                Fill every field for the best match
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                Nurses see your request based on <strong>location</strong> and <strong>specialty</strong>. Urgent shifts reach more people faster.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-sm font-semibold flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* URGENCY */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5">
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                            How urgent is this shift?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {(['urgent', 'soon', 'planned'] as LocumUrgency[]).map(u => {
                                const meta = URGENCY_META[u];
                                const isActive = urgency === u;
                                return (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => setUrgency(u)}
                                        className={`p-3.5 rounded-xl text-left border-2 transition active:scale-[98%] ${isActive
                                            ? meta.classes + ' border-current'
                                            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                                            <span className="text-sm font-bold">{meta.label}</span>
                                        </div>
                                        <p className="text-xs opacity-80">{meta.hint}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FACILITY */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Building className="w-4 h-4 text-amber-500" />
                            Facility Details
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                Facility name <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={facilityName}
                                onChange={(e) => setFacilityName(e.target.value)}
                                placeholder="e.g., Kenyatta National Hospital"
                                className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                Location <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={facilityLocation}
                                onChange={(e) => setFacilityLocation(e.target.value)}
                                placeholder="e.g., Nairobi, Westlands"
                                className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                Used to match you with nurses nearby
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                Specialty needed <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <select
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 transition"
                            >
                                <option value="">Any specialty</option>
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* WHEN */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            When is the shift?
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-3 md:col-span-1">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                    Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={shiftDate}
                                    onChange={(e) => setShiftDate(e.target.value)}
                                    className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Start time
                                </label>
                                <input
                                    type="time"
                                    value={shiftStart}
                                    onChange={(e) => setShiftStart(e.target.value)}
                                    className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    End time
                                </label>
                                <input
                                    type="time"
                                    value={shiftEnd}
                                    onChange={(e) => setShiftEnd(e.target.value)}
                                    className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-4 md:p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-500" />
                            Details & Contact
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                Notes <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ward details, patient load, requirements, dress code..."
                                rows={4}
                                className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                Contact phone
                            </label>
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                placeholder="+254 7XX XXX XXX"
                                className="w-full text-sm px-3.5 py-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                Shared only with the nurse you accept
                            </p>
                        </div>
                    </div>

                    {/* STICKY ACTION BAR */}
                    <div className="sticky bottom-16 md:bottom-0 -mx-3 md:mx-0 px-3 md:px-0 pt-3 pb-2 md:pb-4 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none">
                        <div className="bg-white dark:bg-zinc-950 md:bg-transparent md:dark:bg-transparent rounded-2xl md:rounded-none border border-slate-200/60 dark:border-zinc-800 md:border-0 p-3 md:p-0 shadow-lg md:shadow-none">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={submitting}
                                    className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 text-sm font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition active:scale-[98%] min-h-[48px] disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !facilityLocation.trim() || !shiftDate}
                                    className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold transition shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[98%] min-h-[48px]"
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

                </form>
            </div>
        </div>
    );
}