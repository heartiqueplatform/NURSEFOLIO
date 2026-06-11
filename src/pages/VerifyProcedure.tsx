import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClinicalProcedure } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
    Check,
    X,
    FileSignature,
    UserCheck,
    Calendar,
    Hospital,
    Award,
    Clock,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Send,
    ShieldAlert,
    LogIn,
    Search,
    User,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Filter
} from 'lucide-react';

export default function VerifyProcedure() {
    const { procedureId } = useParams<{ procedureId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [procedure, setProcedure] = useState<ClinicalProcedure | null>(null);
    const [allPendingProcedures, setAllPendingProcedures] = useState<ClinicalProcedure[]>([]);
    const [filteredProcedures, setFilteredProcedures] = useState<ClinicalProcedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingList, setLoadingList] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Verification form state
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [comment, setComment] = useState('');
    const [signature, setSignature] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Check user role
    useEffect(() => {
        const checkUserRole = async () => {
            if (!user) {
                setUserRole(null);
                setCheckingAuth(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setUserRole(data?.role || null);
            } catch (err) {
                console.error('Error fetching user role:', err);
                setUserRole(null);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkUserRole();
    }, [user]);

    // Fetch pending procedures list
    const fetchPendingList = async () => {
        if (userRole !== 'nurse') return;

        setLoadingList(true);
        try {
            const { data, error } = await supabase
                .from('clinical_procedures')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        first_name,
                        last_name,
                        username,
                        avatar_url
                    )
                `)
                .eq('verification_status', 'pending')
                .order('date_performed', { ascending: false })
                .limit(100);

            if (error) throw error;
            setAllPendingProcedures(data || []);
            setFilteredProcedures(data || []);

            // Redirect logic
            if (procedureId === 'pending' && data && data.length > 0) {
                const currentIndex = data.findIndex(p => p.id === procedureId);
                if (currentIndex === -1 && data[0]) {
                    navigate(`/verify/${data[0].id}`, { replace: true });
                }
            }
        } catch (err) {
            console.error('Error fetching pending list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    // Filter procedures by search
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProcedures(allPendingProcedures);
        } else {
            const filtered = allPendingProcedures.filter(proc => {
                const studentName = `${proc.profiles?.first_name || ''} ${proc.profiles?.last_name || ''}`.toLowerCase();
                const username = (proc.profiles?.username || '').toLowerCase();
                const procedureName = (proc.procedure_name || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                return studentName.includes(query) || username.includes(query) || procedureName.includes(query);
            });
            setFilteredProcedures(filtered);
        }
    }, [searchQuery, allPendingProcedures]);

    // Update selected index when procedure changes
    useEffect(() => {
        if (procedure && filteredProcedures.length > 0) {
            const index = filteredProcedures.findIndex(p => p.id === procedure.id);
            setSelectedIndex(index >= 0 ? index : 0);
        }
    }, [procedure, filteredProcedures]);

    // Fetch procedure details
    useEffect(() => {
        const fetchProcedure = async () => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isValidUUID = uuidRegex.test(procedureId || '');

            if (!procedureId || !isValidUUID) {
                if (userRole === 'nurse') {
                    setLoading(false);
                    return;
                }
                setError('Invalid verification link');
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('clinical_procedures')
                    .select('*')
                    .eq('id', procedureId)
                    .maybeSingle();

                if (error) throw error;

                if (!data) {
                    setError('Procedure not found');
                    setLoading(false);
                    return;
                }

                if (data.verification_status === 'verified') {
                    setError('This procedure has already been verified');
                } else if (data.verification_status === 'rejected') {
                    setError('This procedure has already been reviewed and rejected');
                }

                setProcedure(data);
            } catch (err) {
                console.error('Error:', err);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (userRole === 'nurse') {
            fetchProcedure();
        } else {
            setLoading(false);
        }
    }, [procedureId, userRole]);

    // Fetch pending list when role is confirmed
    useEffect(() => {
        if (userRole === 'nurse') {
            fetchPendingList();
        }
    }, [userRole]);

    const navigateToProcedure = (id: string) => {
        navigate(`/verify/${id}`);
        setAction(null);
        setComment('');
        setSignature('');
    };

    const handleNext = () => {
        if (selectedIndex < filteredProcedures.length - 1) {
            navigateToProcedure(filteredProcedures[selectedIndex + 1].id);
        }
    };

    const handlePrev = () => {
        if (selectedIndex > 0) {
            navigateToProcedure(filteredProcedures[selectedIndex - 1].id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!action || !procedure) return;

        if (!signature.trim()) {
            alert('Please enter your signature (full name)');
            return;
        }

        if (action === 'reject' && !comment.trim()) {
            alert('Please provide feedback when rejecting a procedure');
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('clinical_procedures')
                .update({
                    verification_status: action === 'approve' ? 'verified' : 'rejected',
                    supervisor_comment: comment,
                    supervisor_signature: signature,
                    verified_at: new Date().toISOString()
                })
                .eq('id', procedure.id);

            if (error) throw error;

            setSuccess(true);
            await fetchPendingList();

            // Find next pending
            const currentIndex = filteredProcedures.findIndex(p => p.id === procedure.id);
            const nextProcedures = filteredProcedures.filter(p => p.id !== procedure.id);

            if (nextProcedures.length > 0) {
                setTimeout(() => {
                    navigateToProcedure(nextProcedures[0].id);
                }, 1500);
            } else {
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error submitting verification');
            setSubmitting(false);
        }
    };

    // Auth screens...
    if (checkingAuth || (loading && userRole === 'nurse')) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Login Required</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">You need to be logged in as a registered nurse to verify procedures.</p>
                    <button onClick={() => navigate('/login')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Login</button>
                </div>
            </div>
        );
    }

    if (userRole !== 'nurse') {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unauthorized</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Only registered nurses can verify procedures.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Error</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Success!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (filteredProcedures.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">All Caught Up!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">No pending procedures waiting for verification.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    const currentProcedure = procedure || filteredProcedures[0];
    const currentStudent = currentProcedure?.profiles;

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900">
            {/* Header */}
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 px-4 py-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button & Header Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {/* BACK BUTTON */}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-slate-600 dark:text-slate-400"
                                title="Back to Dashboard"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2">
                                <FileSignature className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Verify Procedures</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                Nurse
                            </span>
                            <button
                                onClick={fetchPendingList}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                            >
                                <RefreshCw className={`w-4 h-4 text-slate-500 ${loadingList ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by student name or username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border-0 text-slate-800 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Horizontal Scroll - Stories Style */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Pending Requests ({filteredProcedures.length})
                            </h2>
                        </div>
                        {searchQuery && (
                            <span className="text-xs text-slate-500">
                                Showing {filteredProcedures.length} results
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        {selectedIndex > 0 && (
                            <button
                                onClick={handlePrev}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-slate-200 dark:border-zinc-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-600" />
                            </button>
                        )}

                        <div className="overflow-x-auto scrollbar-hide px-6">
                            <div className="flex gap-3 pb-2 min-w-max">
                                {filteredProcedures.map((proc, idx) => {
                                    const student = proc.profiles;
                                    const isActive = procedure?.id === proc.id;
                                    return (
                                        <button
                                            key={proc.id}
                                            onClick={() => navigateToProcedure(proc.id)}
                                            className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}
                                        >
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${isActive
                                                ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900 bg-gradient-to-br from-indigo-500 to-purple-600'
                                                : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                                }`}>
                                                {student?.first_name?.[0]}{student?.last_name?.[0]}
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 max-w-[60px] truncate">
                                                {student?.first_name} {student?.last_name}
                                            </span>
                                            <span className="text-[8px] text-slate-400 dark:text-slate-500">
                                                {new Date(proc.date_performed).toLocaleDateString()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedIndex < filteredProcedures.length - 1 && (
                            <button
                                onClick={handleNext}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-slate-200 dark:border-zinc-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-zinc-700 transition"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Current Procedure Card */}
                {currentProcedure && (
                    <div className="space-y-5">
                        {/* Student Info Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                                        {currentStudent?.first_name?.[0]}{currentStudent?.last_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base">
                                            {currentStudent?.first_name} {currentStudent?.last_name}
                                        </h3>
                                        <p className="text-indigo-100 text-xs">@{currentStudent?.username}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Procedure</span>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{currentProcedure.procedure_name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] font-semibold text-slate-400">Date</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(currentProcedure.date_performed).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-slate-400">Competency</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                                            <Award className="w-3.5 h-3.5" />
                                            {currentProcedure.competency_level}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] font-semibold text-slate-400">Facility</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                                            <Hospital className="w-3.5 h-3.5" />
                                            {currentProcedure.facility_name || 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-semibold text-slate-400">Dept/Ward</span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{currentProcedure.department || 'Not specified'}</p>
                                    </div>
                                </div>

                                {(currentProcedure.student_notes || currentProcedure.challenges_faced || currentProcedure.improvement_plan) && (
                                    <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Student Reflection</h4>
                                        {currentProcedure.student_notes && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-medium">What they learned:</span> {currentProcedure.student_notes}</p>
                                        )}
                                        {currentProcedure.challenges_faced && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-medium">Challenges:</span> {currentProcedure.challenges_faced}</p>
                                        )}
                                        {currentProcedure.improvement_plan && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-medium">Improvement plan:</span> {currentProcedure.improvement_plan}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Verification Form */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <div className="border-b border-slate-100 dark:border-zinc-800 p-4 bg-slate-50 dark:bg-zinc-800/30">
                                <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-indigo-600" />
                                    Professional Verification
                                </h2>
                            </div>
                            <div className="p-5">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Verification Decision *</label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setAction('approve')}
                                                className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${action === 'approve'
                                                    ? 'bg-emerald-600 text-white shadow-lg'
                                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                    }`}
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAction('reject')}
                                                className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${action === 'reject'
                                                    ? 'bg-rose-600 text-white shadow-lg'
                                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                                    }`}
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Comments / Feedback</label>
                                        <textarea
                                            rows={3}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder={action === 'approve' ? "Optional: Add positive feedback" : "Required: Explain why this needs revision"}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border-0 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {action === 'reject' && !comment && <p className="text-[10px] text-rose-600 mt-1">Comment required when rejecting</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Signature (Full Name) *</label>
                                        <input
                                            type="text"
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            placeholder="Type your full name as signature"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 border-0 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!action || submitting || (action === 'reject' && !comment)}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</>
                                        ) : (
                                            <><Send className="w-4 h-4" /> Submit Verification</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Navigation Info */}
                        <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">
                            {selectedIndex + 1} of {filteredProcedures.length} pending
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}